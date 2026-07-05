/**
 * Returns an onTransitionReady callback that animates the
 * page-content view transition pseudo-elements as a directional slide.
 *
 * Vertical:
 *   "up"   → old content slides down, new content enters from top
 *   "down" → old content slides up, new content enters from bottom
 *
 * Horizontal:
 *   "left"  → old content slides left, new content enters from right (drill in)
 *   "right" → old content slides right, new content enters from left (drill out)
 */
export function slideTransition(
	direction: "up" | "down" | "left" | "right",
): () => void {
	const slideDistance = 45;

	const isHorizontal = direction === "left" || direction === "right";
	const axis = isHorizontal ? "X" : "Y";

	// old content slides away in the given direction
	// new content enters from the opposite side
	const oldSlide =
		direction === "up" || direction === "right"
			? slideDistance
			: -slideDistance;
	const newSlide = -oldSlide;

	return () => {
		// The CSS reduced-motion rule only covers CSS animations; WAAPI
		// animations on the pseudo-elements must be skipped here too.
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			return;
		}

		// Old content: exit fast, accelerating away with a slight blur
		document.documentElement.animate(
			[
				{ opacity: 1, transform: `translate${axis}(0)`, filter: "blur(0px)" },
				{
					opacity: 0,
					transform: `translate${axis}(${oldSlide}px)`,
					filter: "blur(2px)",
				},
			],
			{
				duration: 160,
				easing: "cubic-bezier(0.4, 0, 1, 1)",
				fill: "forwards",
				pseudoElement: "::view-transition-old(page-content)",
			},
		);
		// New content: enter once the old has mostly cleared, settling
		// with a strong ease-out so the motion reads as one continuous pan
		document.documentElement.animate(
			[
				{
					opacity: 0,
					transform: `translate${axis}(${newSlide}px)`,
					filter: "blur(2px)",
				},
				{ opacity: 1, transform: `translate${axis}(0)`, filter: "blur(0px)" },
			],
			{
				duration: 240,
				delay: 60,
				easing: "cubic-bezier(0.23, 1, 0.32, 1)",
				fill: "both",
				pseudoElement: "::view-transition-new(page-content)",
			},
		);
	};
}
