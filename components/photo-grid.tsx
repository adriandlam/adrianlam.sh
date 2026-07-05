"use client";

import { type CSSProperties, useCallback, useRef, useState } from "react";
import { HoverParallaxImage } from "@/components/hover-parallax-image";
import { PhotoLightbox } from "@/components/photo-lightbox";

interface Photo {
	name: string;
	url: string;
	blurDataURL?: string;
	width?: number;
	height?: number;
}

// Mosaic: 3:4 portrait cells; every FEATURE_CADENCE-th photo spans 2x2,
// which is also ~3:4 (two cells plus the gap), so features stay uncropped.
// Landscape photos span two columns instead of being cropped to portrait.
const FEATURE_CADENCE = 7;
const FEATURE_OFFSET = 1;
const LANDSCAPE_THRESHOLD = 1.15;

interface PhotoGridProps {
	photos: Photo[];
}

interface LightboxState {
	index: number;
	originRect: { top: number; left: number; width: number; height: number };
}

export function PhotoGrid({ photos }: PhotoGridProps) {
	const [lightbox, setLightbox] = useState<LightboxState | null>(null);
	const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

	const setItemRef = useCallback(
		(index: number) => (node: HTMLDivElement | null) => {
			if (node) {
				itemRefs.current.set(index, node);
			} else {
				itemRefs.current.delete(index);
			}
		},
		[],
	);

	const handlePhotoClick = useCallback((index: number) => {
		const el = itemRefs.current.get(index);
		if (!el) return;

		const rect = el.getBoundingClientRect();
		setLightbox({
			index,
			originRect: {
				top: rect.top,
				left: rect.left,
				width: rect.width,
				height: rect.height,
			},
		});
	}, []);

	return (
		<>
			<div className="p-16 col-span-2 grid grid-cols-2 md:grid-cols-3 grid-flow-dense gap-4">
				{photos.map((photo, i) => {
					const ratio =
						photo.width && photo.height ? photo.width / photo.height : 3 / 4;
					const isLandscape = ratio > LANDSCAPE_THRESHOLD;
					const isFeatured =
						!isLandscape && i % FEATURE_CADENCE === FEATURE_OFFSET;

					// Spanning cells carry their own aspect-ratio (matching their cell
					// shape) so a span alone in a row can't collapse; when they share a
					// row with singles, stretch + object-cover absorb the ~1% mismatch.
					const containerStyle: CSSProperties = isFeatured
						? { gridColumn: "span 2", gridRow: "span 2", aspectRatio: "3 / 4" }
						: isLandscape
							? { gridColumn: "span 2", aspectRatio: "3 / 2" }
							: { aspectRatio: "3 / 4" };

					return (
						<HoverParallaxImage
							key={photo.url}
							src={photo.url}
							alt={photo.name}
							containerRef={setItemRef(i)}
							containerStyle={containerStyle}
							disableEntrance={i < 2}
							isActive={lightbox?.index === i}
							onClick={() => handlePhotoClick(i)}
							preload={i < 2}
							sizes={
								isFeatured || isLandscape
									? "(max-width: 768px) 100vw, 45vw"
									: "(max-width: 768px) 50vw, 22vw"
							}
							placeholder={photo.blurDataURL ? "blur" : "empty"}
							blurDataURL={photo.blurDataURL}
						/>
					);
				})}
			</div>

			{lightbox !== null && (
				<PhotoLightbox
					photos={photos}
					initialIndex={lightbox.index}
					originRect={lightbox.originRect}
					onClose={() => setLightbox(null)}
				/>
			)}
		</>
	);
}
