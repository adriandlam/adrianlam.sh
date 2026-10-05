"use client";

import { useEffect, useRef, useState } from "react";
import {
	type CnnInferenceResult,
	type CnnWeights,
	cnnForward,
	loadCnnWeights,
} from "./cnn-inference";
import {
	forward,
	type InferenceResult,
	loadWeights,
	type ModelWeights,
} from "./inference";
import { PredictionBars } from "./prediction-bars";

interface ModelComparisonProps {
	pixels: Float32Array | null;
	onCnnResult?: (result: CnnInferenceResult | null) => void;
	onMlpResult?: (result: InferenceResult | null) => void;
}

export function ModelComparison({
	pixels,
	onCnnResult,
	onMlpResult,
}: ModelComparisonProps) {
	const [mlpResult, setMlpResult] = useState<InferenceResult | null>(null);
	const [cnnResult, setCnnResult] = useState<CnnInferenceResult | null>(null);
	const [loading, setLoading] = useState(true);

	const mlpWeightsRef = useRef<ModelWeights | null>(null);
	const cnnWeightsRef = useRef<CnnWeights | null>(null);

	// Load weights eagerly on mount (background fetch, doesn't block render)
	useEffect(() => {
		let cancelled = false;

		Promise.all([loadWeights(), loadCnnWeights()])
			.then(([mlpW, cnnW]) => {
				if (cancelled) return;
				mlpWeightsRef.current = mlpW;
				cnnWeightsRef.current = cnnW;
				setLoading(false);
			})
			.catch((err) => {
				console.error("Failed to load model weights:", err);
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, []);

	// Run inference whenever pixels change (only after weights are loaded)
	useEffect(() => {
		if (loading) return;

		if (!pixels?.some((v) => v > 0)) {
			setMlpResult(null);
			setCnnResult(null);
			onCnnResult?.(null);
			onMlpResult?.(null);
			return;
		}

		const mlpW = mlpWeightsRef.current;
		const cnnW = cnnWeightsRef.current;
		if (!mlpW || !cnnW) return;

		const mlp = forward(pixels, mlpW);
		const cnn = cnnForward(pixels, cnnW);
		setMlpResult(mlp);
		setCnnResult(cnn);
		onMlpResult?.(mlp);
		onCnnResult?.(cnn);
	}, [pixels, loading, onCnnResult, onMlpResult]);

	// Determine if models disagree on top prediction
	const mlpTop = mlpResult
		? Array.from(mlpResult.probabilities).indexOf(
				Math.max(...mlpResult.probabilities),
			)
		: -1;
	const cnnTop = cnnResult
		? Array.from(cnnResult.probabilities).indexOf(
				Math.max(...cnnResult.probabilities),
			)
		: -1;

	const hasPredictions = mlpResult !== null && cnnResult !== null;
	const disagree = hasPredictions && mlpTop !== cnnTop;

	return (
		<div className="not-prose">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
				{/* MLP column */}
				<div className="flex flex-col gap-2">
					<div className="flex items-baseline gap-2">
						<span className="font-mono text-sm text-accent-foreground">
							MLP
						</span>
						<span className="text-xs text-muted-foreground">
							(98.32% accuracy)
						</span>
					</div>
					{loading ? (
						<p className="text-xs text-muted-foreground">Loading weights…</p>
					) : (
						<PredictionBars probabilities={mlpResult?.probabilities ?? null} />
					)}
				</div>

				{/* CNN column */}
				<div className="flex flex-col gap-2">
					<div className="flex items-baseline gap-2">
						<span className="font-mono text-sm text-accent-foreground">
							CNN
						</span>
						<span className="text-xs text-muted-foreground">
							(99.31% accuracy)
						</span>
					</div>
					{loading ? (
						<p className="text-xs text-muted-foreground">Loading weights…</p>
					) : (
						<PredictionBars probabilities={cnnResult?.probabilities ?? null} />
					)}
				</div>
			</div>

			{disagree && (
				<p className="mt-3 text-xs font-mono text-vesper-red">
					Models disagree: MLP predicts{" "}
					<span className="font-semibold">{mlpTop}</span>, CNN predicts{" "}
					<span className="font-semibold">{cnnTop}</span>
				</p>
			)}
		</div>
	);
}
