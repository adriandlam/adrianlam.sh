"use client";

import { motion } from "motion/react";
import { memo, useMemo } from "react";
import type { InferenceResult } from "./inference";
import { getThemeColors, lerpColor, type ThemeColors } from "./theme";

interface NetworkVisualizerProps {
	result: InferenceResult | null;
}

const SVG_WIDTH = 600;
const SVG_HEIGHT = 300;

const LAYER_X = {
	input: 60,
	hidden1: 170,
	hidden2: 280,
	hidden3: 390,
	output: 510,
} as const;

const HIDDEN_NODE_COUNT = 12;
const HIDDEN_RADIUS = 7;
const OUTPUT_RADIUS = 10;

const GRID_SIZE = 28;
const PIXEL_SIZE = 3;
const GRID_TOTAL = GRID_SIZE * PIXEL_SIZE;

const NODE_MARGIN_TOP = 20;
const NODE_AREA_HEIGHT = SVG_HEIGHT - 40;

const LAYER_LABELS = ["784", "256", "256", "256", "10"] as const;
const LAYER_LABEL_X = [
	LAYER_X.input,
	LAYER_X.hidden1,
	LAYER_X.hidden2,
	LAYER_X.hidden3,
	LAYER_X.output,
] as const;

function getHiddenNodeY(index: number, count: number): number {
	return (
		NODE_MARGIN_TOP +
		(index * NODE_AREA_HEIGHT) / (count + 1) +
		NODE_AREA_HEIGHT / (count + 1)
	);
}

function getOutputNodeY(index: number): number {
	return NODE_MARGIN_TOP + ((index + 1) * NODE_AREA_HEIGHT) / 11;
}

function sampleActivations(full: Float32Array, count: number): number[] {
	const step = full.length / count;
	const sampled: number[] = [];
	for (let i = 0; i < count; i++) {
		sampled.push(full[Math.floor(i * step)]);
	}
	const max = Math.max(...sampled, 0.001);
	return sampled.map((v) => Math.min(Math.max(v / max, 0), 1));
}

function hiddenColor(activation: number, theme: ThemeColors): string {
	return lerpColor(theme.surface, theme.accentForegroundRgb, activation * 0.6);
}

function outputColor(probability: number, theme: ThemeColors): string {
	return lerpColor(theme.surface, theme.accentRgb, probability);
}

export const NetworkVisualizer = memo(function NetworkVisualizer({
	result,
}: NetworkVisualizerProps) {
	const theme = getThemeColors();
	const hasResult = result !== null;

	const hiddenActivations = useMemo(() => {
		if (!result) {
			return {
				h1: Array(HIDDEN_NODE_COUNT).fill(0) as number[],
				h2: Array(HIDDEN_NODE_COUNT).fill(0) as number[],
				h3: Array(HIDDEN_NODE_COUNT).fill(0) as number[],
			};
		}
		return {
			h1: sampleActivations(result.activations.hidden1, HIDDEN_NODE_COUNT),
			h2: sampleActivations(result.activations.hidden2, HIDDEN_NODE_COUNT),
			h3: sampleActivations(result.activations.hidden3, HIDDEN_NODE_COUNT),
		};
	}, [result]);

	const outputProbs = useMemo(() => {
		if (!result) return Array(10).fill(0) as number[];
		return Array.from(result.probabilities);
	}, [result]);

	const topIndex = useMemo(() => {
		const max = Math.max(...outputProbs);
		return max > 0 ? outputProbs.indexOf(max) : -1;
	}, [outputProbs]);

	const hiddenYPositions = useMemo(() => {
		const positions: number[] = [];
		for (let i = 0; i < HIDDEN_NODE_COUNT; i++) {
			positions.push(getHiddenNodeY(i, HIDDEN_NODE_COUNT));
		}
		return positions;
	}, []);

	const outputYPositions = useMemo(() => {
		const positions: number[] = [];
		for (let i = 0; i < 10; i++) {
			positions.push(getOutputNodeY(i));
		}
		return positions;
	}, []);

	const gridOriginX = LAYER_X.input - GRID_TOTAL / 2;
	const gridOriginY = (SVG_HEIGHT - GRID_TOTAL) / 2;
	const gridCenterX = LAYER_X.input;
	const gridCenterY = SVG_HEIGHT / 2;

	const inputPixels = useMemo(() => {
		if (!result) return null;
		return result.activations.input;
	}, [result]);

	const borderColor = theme.border;
	const activeLineColor = "#ffffff";

	return (
		<svg
			viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
			className="w-full h-[300px] border p-4 rounded"
			role="img"
			aria-label="Neural network visualization showing activations across layers"
		>
			{/* === Connections (plain <line>, no motion overhead) === */}

			{/* Input → Hidden1 */}
			{hiddenYPositions.map((hy, hi) => {
				const a = hiddenActivations.h1[hi];
				const opacity = hasResult ? 0.12 + a * 0.5 : 0.08;
				return (
					<line
						key={`conn-in-h1-${hi}`}
						x1={gridCenterX}
						y1={gridCenterY}
						x2={LAYER_X.hidden1}
						y2={hy}
						stroke={hasResult && a > 0.3 ? activeLineColor : borderColor}
						strokeWidth={0.5}
						opacity={opacity}
					/>
				);
			})}

			{/* Hidden1 → Hidden2 — skip lines below 0.1 opacity */}
			{hiddenYPositions.map((h1y, h1i) =>
				hiddenYPositions.map((h2y, h2i) => {
					const s = hiddenActivations.h1[h1i] * hiddenActivations.h2[h2i];
					const opacity = hasResult ? 0.06 + s * 0.6 : 0.06;
					if (hasResult && opacity < 0.1) return null;
					return (
						<line
							key={`conn-h1-h2-${h1i}-${h2i}`}
							x1={LAYER_X.hidden1}
							y1={h1y}
							x2={LAYER_X.hidden2}
							y2={h2y}
							stroke={hasResult && s > 0.2 ? activeLineColor : borderColor}
							strokeWidth={0.4 + s * 0.6}
							opacity={opacity}
						/>
					);
				}),
			)}

			{/* Hidden2 → Hidden3 — skip lines below 0.1 opacity */}
			{hiddenYPositions.map((h2y, h2i) =>
				hiddenYPositions.map((h3y, h3i) => {
					const s = hiddenActivations.h2[h2i] * hiddenActivations.h3[h3i];
					const opacity = hasResult ? 0.06 + s * 0.6 : 0.06;
					if (hasResult && opacity < 0.1) return null;
					return (
						<line
							key={`conn-h2-h3-${h2i}-${h3i}`}
							x1={LAYER_X.hidden2}
							y1={h2y}
							x2={LAYER_X.hidden3}
							y2={h3y}
							stroke={hasResult && s > 0.2 ? activeLineColor : borderColor}
							strokeWidth={0.4 + s * 0.6}
							opacity={opacity}
						/>
					);
				}),
			)}

			{/* Hidden3 → Output — skip lines below 0.1 opacity */}
			{hiddenYPositions.map((h3y, h3i) =>
				outputYPositions.map((oy, oi) => {
					const s = hiddenActivations.h3[h3i] * outputProbs[oi];
					const opacity = hasResult ? 0.06 + s * 0.6 : 0.06;
					if (hasResult && opacity < 0.1) return null;
					return (
						<line
							key={`conn-h3-out-${h3i}-${oi}`}
							x1={LAYER_X.hidden3}
							y1={h3y}
							x2={LAYER_X.output}
							y2={oy}
							stroke={hasResult && s > 0.2 ? activeLineColor : borderColor}
							strokeWidth={0.4 + s * 0.6}
							opacity={opacity}
						/>
					);
				}),
			)}

			{/* === Input pixel grid === */}
			{Array.from({ length: GRID_SIZE }, (_, row) =>
				Array.from({ length: GRID_SIZE }, (_, col) => {
					const idx = row * GRID_SIZE + col;
					const intensity = inputPixels ? inputPixels[idx] : 0;
					const gray = Math.round(intensity * 255);
					return (
						<rect
							key={`px-${idx}`}
							x={gridOriginX + col * PIXEL_SIZE}
							y={gridOriginY + row * PIXEL_SIZE}
							width={PIXEL_SIZE}
							height={PIXEL_SIZE}
							fill={`rgb(${gray},${gray},${gray})`}
						/>
					);
				}),
			)}

			{/* === Hidden layer 1 nodes === */}
			{hiddenYPositions.map((y, i) => (
				<motion.circle
					key={`h1-${i}`}
					cx={LAYER_X.hidden1}
					cy={y}
					r={HIDDEN_RADIUS}
					animate={{
						fill: hiddenColor(hiddenActivations.h1[i], theme),
					}}
					transition={{ duration: 0.3 }}
				/>
			))}

			{/* === Hidden layer 2 nodes === */}
			{hiddenYPositions.map((y, i) => (
				<motion.circle
					key={`h2-${i}`}
					cx={LAYER_X.hidden2}
					cy={y}
					r={HIDDEN_RADIUS}
					animate={{
						fill: hiddenColor(hiddenActivations.h2[i], theme),
					}}
					transition={{ duration: 0.3 }}
				/>
			))}

			{/* === Hidden layer 3 nodes === */}
			{hiddenYPositions.map((y, i) => (
				<motion.circle
					key={`h3-${i}`}
					cx={LAYER_X.hidden3}
					cy={y}
					r={HIDDEN_RADIUS}
					animate={{
						fill: hiddenColor(hiddenActivations.h3[i], theme),
					}}
					transition={{ duration: 0.3 }}
				/>
			))}

			{/* === Output layer nodes === */}
			{outputYPositions.map((y, i) => (
				<g key={`out-${i}`}>
					<motion.circle
						cx={LAYER_X.output}
						cy={y}
						r={OUTPUT_RADIUS}
						stroke={theme.accent}
						strokeWidth={0}
						animate={{
							fill: outputColor(outputProbs[i], theme),
							strokeWidth: i === topIndex && hasResult ? 1.5 : 0,
						}}
						transition={{ duration: 0.3 }}
					/>
					<text
						x={LAYER_X.output}
						y={y}
						textAnchor="middle"
						dominantBaseline="central"
						className="text-[7px] font-mono fill-foreground pointer-events-none"
						style={{ userSelect: "none" }}
					>
						{i}
					</text>
				</g>
			))}

			{/* === Layer labels === */}
			{LAYER_LABELS.map((label, i) => (
				<text
					key={`label-${label}-${i}`}
					x={LAYER_LABEL_X[i]}
					y={SVG_HEIGHT - 6}
					textAnchor="middle"
					className="text-[8px] font-mono fill-muted-foreground"
				>
					{label}
				</text>
			))}
		</svg>
	);
});
