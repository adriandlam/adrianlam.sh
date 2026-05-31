"use client";

import polyline from "@mapbox/polyline";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import MapGL, { Layer, type MapRef, Source } from "react-map-gl/mapbox";
import type { Hike } from "@/lib/strava";
import type { Landmark } from "@/lib/exploring";
import "mapbox-gl/dist/mapbox-gl.css";

interface ExploringMapProps {
	hikes: Hike[];
	landmarks: Landmark[];
}

type SelectedFeature =
	| { type: "hike"; hike: Hike; lng: number; lat: number }
	| { type: "landmark"; landmark: Landmark };

function hikesToGeoJSON(hikes: Hike[], selectedId: string | null) {
	return {
		type: "FeatureCollection" as const,
		features: hikes.map((hike) => ({
			type: "Feature" as const,
			properties: {
				id: hike.id,
				selected: hike.id === selectedId,
			},
			geometry: {
				type: "LineString" as const,
				coordinates: polyline
					.decode(hike.polyline)
					.map(([lat, lng]) => [lng, lat]),
			},
		})),
	};
}

function hikeStartsToGeoJSON(hikes: Hike[]) {
	return {
		type: "FeatureCollection" as const,
		features: hikes
			.filter((h) => h.startLatLng !== null)
			.map((hike) => ({
				type: "Feature" as const,
				properties: { id: hike.id },
				geometry: {
					type: "Point" as const,
					coordinates: [hike.startLatLng![1], hike.startLatLng![0]],
				},
			})),
	};
}

function landmarksToGeoJSON(landmarks: Landmark[]) {
	return {
		type: "FeatureCollection" as const,
		features: landmarks.map((lm) => ({
			type: "Feature" as const,
			properties: {
				label: lm.label,
				type: lm.type,
			},
			geometry: {
				type: "Point" as const,
				coordinates: [lm.lng, lm.lat],
			},
		})),
	};
}

function getDensestRegion(hikes: Hike[]): [number, number] | null {
	const starts = hikes
		.map((h) => h.startLatLng)
		.filter((s): s is [number, number] => s !== null);
	if (starts.length === 0) return null;
	if (starts.length === 1) return starts[0];

	const grid = new Map<string, { lat: number; lng: number; count: number }>();
	for (const [lat, lng] of starts) {
		const key = `${Math.round(lat / 10)},${Math.round(lng / 10)}`;
		const cell = grid.get(key);
		if (cell) {
			cell.lat += lat;
			cell.lng += lng;
			cell.count++;
		} else {
			grid.set(key, { lat, lng, count: 1 });
		}
	}

	let best = grid.values().next().value!;
	for (const cell of grid.values()) {
		if (cell.count > best.count) best = cell;
	}

	return [best.lat / best.count, best.lng / best.count];
}

function formatDate(dateString: string): string {
	return new Date(dateString)
		.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		})
		.toLowerCase();
}

export function ExploringMap({ hikes, landmarks }: ExploringMapProps) {
	const mapRef = useRef<MapRef>(null);
	const rotationRef = useRef<number | null>(null);
	const hasInteractedRef = useRef(false);

	const densest = getDensestRegion(hikes);
	const drawAnimRef = useRef<number | null>(null);
	const [drawingCoords, setDrawingCoords] = useState<[number, number][] | null>(
		null,
	);
	const [selected, setSelected] = useState<SelectedFeature | null>(null);

	const selectedHikeId = selected?.type === "hike" ? selected.hike.id : null;

	// Enable hillshade, contour lines, trails on map load
	const handleLoad = useCallback(() => {
		const map = mapRef.current?.getMap();
		if (!map) return;

		map.addSource("mapbox-dem", {
			type: "raster-dem",
			url: "mapbox://mapbox.mapbox-terrain-dem-v1",
			tileSize: 512,
			maxzoom: 14,
		});
		map.addSource("mapbox-dem-hillshade", {
			type: "raster-dem",
			url: "mapbox://mapbox.mapbox-terrain-dem-v1",
			tileSize: 512,
			maxzoom: 14,
		});

		map.addLayer(
			{
				id: "hillshade",
				type: "hillshade",
				source: "mapbox-dem-hillshade",
				paint: {
					"hillshade-illumination-direction": 315,
					"hillshade-exaggeration": 0.5,
					"hillshade-shadow-color": "#000000",
					"hillshade-highlight-color": "#1a1a1a",
					"hillshade-accent-color": "#111111",
				},
			},
			"land-structure-polygon",
		);

		map.addSource("contours", {
			type: "vector",
			url: "mapbox://mapbox.mapbox-terrain-v2",
		});
		map.addLayer(
			{
				id: "contour-lines",
				type: "line",
				source: "contours",
				"source-layer": "contour",
				paint: {
					"line-color": "#cccccc",
					"line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.3, 16, 0.8],
					"line-opacity": ["match", ["get", "index"], 5, 0.12, 10, 0.16, 0.05],
				},
				layout: {
					"line-cap": "round",
					"line-join": "round",
				},
				minzoom: 11,
			},
			"hikes-line",
		);

		map.addLayer(
			{
				id: "trails",
				type: "line",
				source: "composite",
				"source-layer": "road",
				filter: ["in", ["get", "class"], ["literal", ["path", "track"]]],
				paint: {
					"line-color": "#99ffe4",
					"line-width": [
						"interpolate",
						["linear"],
						["zoom"],
						10,
						0.5,
						14,
						1,
						18,
						1.5,
					],
					"line-opacity": [
						"interpolate",
						["linear"],
						["zoom"],
						10,
						0.1,
						14,
						0.2,
					],
					"line-dasharray": [1, 4],
				},
				layout: {
					"line-cap": "round",
					"line-join": "round",
				},
				minzoom: 10,
			},
			"hikes-line",
		);

		// Pointer cursor on interactive layers
		const interactiveLayers = [
			"hikes-line",
			"hike-starts-dot",
			"landmarks-circle",
			"landmarks-glow",
		];
		for (const layer of interactiveLayers) {
			map.on("mouseenter", layer, () => {
				map.getCanvas().style.cursor = "pointer";
			});
			map.on("mouseleave", layer, () => {
				map.getCanvas().style.cursor = "";
			});
		}
	}, []);

	// Fly to selected feature and draw trail
	useEffect(() => {
		if (!selected || !mapRef.current) return;
		hasInteractedRef.current = true;

		if (selected.type === "hike") {
			const { hike } = selected;
			if (!hike.startLatLng) return;

			const fullCoords = polyline
				.decode(hike.polyline)
				.map(([lat, lng]) => [lng, lat] as [number, number]);

			const map = mapRef.current.getMap();
			mapRef.current.flyTo({
				center: [hike.startLatLng[1], hike.startLatLng[0]],
				zoom: 13,
				pitch: 0,
				duration: 1500,
			});

			if (drawAnimRef.current) cancelAnimationFrame(drawAnimRef.current);
			const startDraw = () => {
				const totalPoints = fullCoords.length;
				const duration = 1200;
				const startTime = performance.now();

				const animate = (now: number) => {
					const elapsed = now - startTime;
					const progress = Math.min(elapsed / duration, 1);
					const eased = 1 - (1 - progress) ** 3;
					const pointCount = Math.max(2, Math.round(totalPoints * eased));
					setDrawingCoords(fullCoords.slice(0, pointCount));

					if (progress < 1) {
						drawAnimRef.current = requestAnimationFrame(animate);
					} else {
						drawAnimRef.current = null;
					}
				};
				drawAnimRef.current = requestAnimationFrame(animate);
			};
			map.once("moveend", startDraw);

			return () => {
				map.off("moveend", startDraw);
				if (drawAnimRef.current) cancelAnimationFrame(drawAnimRef.current);
			};
		}

		if (selected.type === "landmark") {
			const { landmark } = selected;
			mapRef.current.flyTo({
				center: [landmark.lng, landmark.lat],
				zoom: 10,
				duration: 1500,
			});
		}
	}, [selected]);

	// Clear drawing when deselected
	useEffect(() => {
		if (!selected || selected.type !== "hike") {
			setDrawingCoords(null);
			if (drawAnimRef.current) {
				cancelAnimationFrame(drawAnimRef.current);
				drawAnimRef.current = null;
			}
		}
	}, [selected]);

	// Gentle rotation on idle
	useEffect(() => {
		if (hasInteractedRef.current) return;

		function stopRotation() {
			if (rotationRef.current !== null) {
				cancelAnimationFrame(rotationRef.current);
				rotationRef.current = null;
			}
		}

		let bearing = 0;
		const rotate = () => {
			if (mapRef.current && !hasInteractedRef.current) {
				bearing += 0.02;
				mapRef.current.getMap().jumpTo({ bearing });
				rotationRef.current = requestAnimationFrame(rotate);
			}
		};
		rotationRef.current = requestAnimationFrame(rotate);

		return stopRotation;
	}, []);

	// Handle clicks on trails, start dots, and landmarks
	const handleClick = useCallback(
		(
			event: mapboxgl.MapMouseEvent & {
				features?: mapboxgl.GeoJSONFeature[];
			},
		) => {
			const feature = event.features?.[0];

			if (!feature) {
				setSelected(null);
				return;
			}

			const layerId = feature.layer?.id;

			// Landmark click
			if (layerId === "landmarks-circle" || layerId === "landmarks-glow") {
				const label = feature.properties?.label as string;
				const lm = landmarks.find((l) => l.label === label);
				if (lm) setSelected({ type: "landmark", landmark: lm });
				return;
			}

			// Hike trail or start dot click
			if (layerId === "hikes-line" || layerId === "hike-starts-dot") {
				const id = feature.properties?.id as string;
				const hike = hikes.find((h) => h.id === id);
				if (hike) {
					setSelected({
						type: "hike",
						hike,
						lng: event.lngLat.lng,
						lat: event.lngLat.lat,
					});
				}
				return;
			}

			setSelected(null);
		},
		[hikes, landmarks],
	);

	const hikesGeoJSON = hikesToGeoJSON(hikes, selectedHikeId);
	const hikeStartsGeoJSON = hikeStartsToGeoJSON(hikes);
	const landmarksGeoJSON = landmarksToGeoJSON(landmarks);

	const drawingGeoJSON = drawingCoords
		? {
				type: "Feature" as const,
				properties: {},
				geometry: {
					type: "LineString" as const,
					coordinates: drawingCoords,
				},
			}
		: null;

	// Track screen position of selected feature, offset opposite to trail direction
	const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(
		null,
	);
	// translateX/Y to anchor the card edge toward the trail
	const [popupTransform, setPopupTransform] = useState({
		tx: "-50%",
		ty: "-100%",
	});

	useEffect(() => {
		if (!selected || !mapRef.current) {
			setPopupPos(null);
			return;
		}

		const map = mapRef.current.getMap();

		let anchorCoords: [number, number];
		// tx/ty control which edge of the card is closest to the anchor point
		let tx = "-50%";
		let ty = "-100%";
		let gapX = 0;
		let gapY = -12;

		if (selected.type === "hike" && selected.hike.startLatLng) {
			anchorCoords = [
				selected.hike.startLatLng[1],
				selected.hike.startLatLng[0],
			];

			const decoded = polyline
				.decode(selected.hike.polyline)
				.map(([lat, lng]) => [lng, lat] as [number, number]);
			if (decoded.length >= 2) {
				const sampleEnd =
					decoded[
						Math.min(Math.floor(decoded.length * 0.2), decoded.length - 1)
					];
				const start = decoded[0];
				const dx = sampleEnd[0] - start[0];
				const dy = sampleEnd[1] - start[1];

				// Trail goes right → card anchors from right edge, placed left
				if (Math.abs(dx) > Math.abs(dy)) {
					// Primarily horizontal trail
					if (dx > 0) {
						tx = "-100%";
						gapX = -16;
						ty = "-50%";
						gapY = 0;
					} else {
						tx = "0%";
						gapX = 16;
						ty = "-50%";
						gapY = 0;
					}
				} else {
					// Primarily vertical trail
					if (dy > 0) {
						// Trail goes up (north) → card below
						tx = "-50%";
						ty = "0%";
						gapY = 16;
						gapX = 0;
					} else {
						// Trail goes down (south) → card above
						tx = "-50%";
						ty = "-100%";
						gapY = -16;
						gapX = 0;
					}
				}
			}
		} else if (selected.type === "landmark") {
			anchorCoords = [selected.landmark.lng, selected.landmark.lat];
			tx = "0%";
			gapX = 16;
			ty = "-50%";
			gapY = 0;
		} else {
			setPopupPos(null);
			return;
		}

		setPopupTransform({ tx, ty });

		const updatePos = () => {
			const point = map.project(anchorCoords);
			setPopupPos({ x: point.x + gapX, y: point.y + gapY });
		};

		updatePos();
		map.on("move", updatePos);
		return () => {
			map.off("move", updatePos);
		};
	}, [selected]);

	return (
		<>
			<MapGL
				ref={mapRef}
				mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
				initialViewState={{
					longitude: densest ? densest[1] : 0,
					latitude: densest ? densest[0] : 20,
					zoom: densest ? 4 : 1.5,
					pitch: 15,
				}}
				projection={{ name: "globe" }}
				style={{ width: "100%", height: "100%" }}
				mapStyle="mapbox://styles/mapbox/dark-v11"
				fog={{
					color: "#0a0a0a",
					"high-color": "#0a0a0a",
					"space-color": "#000000",
					"horizon-blend": 0.02,
					"star-intensity": 0.2,
				}}
				interactiveLayerIds={[
					"hikes-line",
					"hike-starts-dot",
					"landmarks-circle",
					"landmarks-glow",
				]}
				onClick={handleClick}
				onLoad={handleLoad}
				onDragStart={() => {
					hasInteractedRef.current = true;
				}}
				onZoomStart={() => {
					hasInteractedRef.current = true;
				}}
				attributionControl={false}
				logoPosition="top-left"
			>
				{/* Hike trail lines — dashed, visible when zoomed in */}
				<Source id="hikes" type="geojson" data={hikesGeoJSON}>
					<Layer
						id="hikes-line"
						type="line"
						minzoom={8}
						paint={{
							"line-color": "#99ffe4",
							"line-width": [
								"interpolate",
								["linear"],
								["zoom"],
								8,
								1,
								12,
								2,
								16,
								3,
							],
							"line-opacity": ["case", ["get", "selected"], 0.3, 0.6],
							"line-dasharray": [2, 2],
						}}
						layout={{
							"line-cap": "round",
							"line-join": "round",
						}}
					/>
				</Source>

				{/* × markers — visible when zoomed out */}
				<Source id="hike-starts" type="geojson" data={hikeStartsGeoJSON}>
					<Layer
						id="hike-starts-dot"
						type="symbol"
						maxzoom={10}
						layout={{
							"text-field": "×",
							"text-size": [
								"interpolate",
								["linear"],
								["zoom"],
								1,
								10,
								5,
								14,
								10,
								18,
							],
							"text-allow-overlap": true,
							"text-ignore-placement": true,
						}}
						paint={{
							"text-color": "#99ffe4",
							"text-opacity": 0.8,
						}}
					/>
				</Source>

				{/* Animated trail drawing */}
				{drawingGeoJSON && (
					<Source id="drawing" type="geojson" data={drawingGeoJSON}>
						<Layer
							id="drawing-line"
							type="line"
							paint={{
								"line-color": "#99ffe4",
								"line-width": 3,
								"line-opacity": 1,
							}}
							layout={{
								"line-cap": "round",
								"line-join": "round",
							}}
						/>
					</Source>
				)}

				{/* Landmark dots */}
				<Source id="landmarks" type="geojson" data={landmarksGeoJSON}>
					<Layer
						id="landmarks-glow"
						type="circle"
						paint={{
							"circle-radius": 6,
							"circle-color": "#ff8080",
							"circle-opacity": 0.12,
							"circle-blur": 1,
						}}
					/>
					<Layer
						id="landmarks-circle"
						type="circle"
						paint={{
							"circle-radius": 2.5,
							"circle-color": "#ff8080",
							"circle-opacity": 0.9,
						}}
					/>
				</Source>
			</MapGL>

			{/* Animated info card — bottom-center on mobile, trail-relative on desktop */}
			<AnimatePresence>
				{selected && (
					<motion.div
						key={
							selected.type === "hike"
								? selected.hike.id
								: selected.landmark.label
						}
						initial={{ opacity: 0, y: 6, scale: 0.97 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 4, scale: 0.97 }}
						transition={{ duration: 0.12, ease: "easeOut" }}
						className="absolute z-20 bg-background/50 backdrop-blur border border-border rounded-lg shadow-xl pointer-events-auto px-4 py-3 md:px-5 md:py-4"
						style={
							popupPos &&
							typeof window !== "undefined" &&
							window.innerWidth >= 768
								? {
										left: popupPos.x,
										top: popupPos.y,
										transform: `translate(${popupTransform.tx}, ${popupTransform.ty})`,
									}
								: {
										bottom: 32,
										left: "50%",
										transform: "translateX(-50%)",
									}
						}
					>
						{selected.type === "hike" ? (
							<div>
								<div className="text-sm font-medium text-foreground leading-tight mb-2">
									{selected.hike.name}
								</div>
								<div className="flex gap-4 whitespace-nowrap max-md:flex-wrap max-md:gap-3">
									<div>
										<div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
											Distance
										</div>
										<div className="font-mono text-xs text-foreground">
											{selected.hike.distance} km
										</div>
									</div>
									<div>
										<div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
											Elevation
										</div>
										<div className="font-mono text-xs text-foreground">
											{selected.hike.elevationGain}m
										</div>
									</div>
									<div>
										<div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
											Time
										</div>
										<div className="font-mono text-xs text-foreground">
											{selected.hike.movingTime}
										</div>
									</div>
									<div>
										<div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
											Date
										</div>
										<div className="font-mono text-xs text-foreground">
											{formatDate(selected.hike.date)}
										</div>
									</div>
								</div>
							</div>
						) : (
							<div>
								<div className="flex items-center gap-2">
									<span className="size-1.5 rounded-full bg-vesper-red shrink-0" />
									<span className="text-sm font-medium text-foreground">
										{selected.landmark.label}
									</span>
								</div>
								<div className="font-mono text-xs text-muted-foreground mt-1">
									{selected.landmark.type}
								</div>
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
