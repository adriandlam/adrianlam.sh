"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Full-quality image layer that fades in once loaded */
function LightboxImage({
	src,
	alt,
	sizes,
}: {
	src: string;
	alt: string;
	sizes: string;
}) {
	const [loaded, setLoaded] = useState(false);
	const prefersReducedMotion = useReducedMotion();

	return (
		<Image
			src={src}
			alt={alt}
			fill
			className={`object-contain transition-opacity ${prefersReducedMotion ? "duration-0" : "duration-300"} ${loaded ? "opacity-100" : "opacity-0"}`}
			sizes={sizes}
			priority
			onLoad={() => setLoaded(true)}
		/>
	);
}

interface Photo {
	url: string;
	name: string;
	blurDataURL?: string;
}

interface OriginRect {
	top: number;
	left: number;
	width: number;
	height: number;
}

interface PhotoLightboxProps {
	photos: Photo[];
	initialIndex: number;
	originRect: OriginRect;
	onClose: () => void;
}

const SWIPE_THRESHOLD = 50;
const SLIDE_DISTANCE = 30;

// Must match the sizes prop used in the grid so browser cache hits
const GRID_SIZES = "(max-width: 640px) 100vw, 50vw";
const LIGHTBOX_SIZES = "(max-width: 1024px) 100vw, 1024px";

const SPRING_TRANSITION = {
	type: "spring" as const,
	stiffness: 300,
	damping: 30,
};

const slideVariants = {
	enter: (dir: "left" | "right") => ({
		x: dir === "left" ? SLIDE_DISTANCE : -SLIDE_DISTANCE,
		opacity: 0,
	}),
	center: {
		x: 0,
		opacity: 1,
		filter: "blur(0px)",
	},
	exit: (dir: "left" | "right") => ({
		x: dir === "left" ? -SLIDE_DISTANCE : SLIDE_DISTANCE,
		opacity: 0,
		filter: "blur(2px)",
	}),
};

const SLIDE_TRANSITION = {
	duration: 0.18,
	ease: [0, 0, 0.2, 1] as const,
};

function getViewport() {
	if (typeof window === "undefined") return { vw: 0, vh: 0, pad: 64 };
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	const pad = vw >= 768 ? 64 : vw >= 640 ? 32 : 16;
	return { vw, vh, pad };
}

export function PhotoLightbox({
	photos,
	initialIndex,
	originRect,
	onClose,
}: PhotoLightboxProps) {
	const [currentIndex, setCurrentIndex] = useState(initialIndex);
	const [hasNavigated, setHasNavigated] = useState(false);
	const [isClosing, setIsClosing] = useState(false);
	const [direction, setDirection] = useState<"left" | "right">("left");
	const prefersReducedMotion = useReducedMotion();
	const dialogRef = useRef<HTMLDialogElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const previouslyFocusedRef = useRef<HTMLElement | null>(null);
	const touchStartX = useRef(0);
	const touchDeltaX = useRef(0);

	const photo = photos[currentIndex];

	const goToPrev = useCallback(() => {
		setDirection("right");
		setHasNavigated(true);
		setCurrentIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
	}, [photos.length]);

	const goToNext = useCallback(() => {
		setDirection("left");
		setHasNavigated(true);
		setCurrentIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
	}, [photos.length]);

	const handleClose = useCallback(() => {
		if (isClosing) return;
		if (prefersReducedMotion) {
			onClose();
			return;
		}
		setIsClosing(true);
		setTimeout(onClose, 350);
	}, [isClosing, onClose, prefersReducedMotion]);

	// Native modal dialogs contain focus and make the background inert.
	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;

		previouslyFocusedRef.current =
			document.activeElement instanceof HTMLElement
				? document.activeElement
				: null;
		if (!dialog.open) dialog.showModal();
		closeButtonRef.current?.focus();

		return () => {
			if (dialog.open) dialog.close();
			previouslyFocusedRef.current?.focus();
		};
	}, []);

	// Keyboard navigation
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "ArrowLeft") goToPrev();
			if (e.key === "ArrowRight") goToNext();
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [goToPrev, goToNext]);

	// Body scroll lock
	useEffect(() => {
		const original = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = original;
		};
	}, []);

	function handleTouchStart(e: React.TouchEvent) {
		touchStartX.current = e.touches[0].clientX;
		touchDeltaX.current = 0;
	}

	function handleTouchMove(e: React.TouchEvent) {
		touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
	}

	function handleTouchEnd() {
		if (touchDeltaX.current > SWIPE_THRESHOLD) goToPrev();
		if (touchDeltaX.current < -SWIPE_THRESHOLD) goToNext();
	}

	// Calculate scale + translate to position lightbox container at the origin rect.
	// The container keeps its full lightbox dimensions (no aspect ratio distortion).
	// We only scale + translate it visually to overlap the grid cell.
	const originTransform = useMemo(() => {
		const { vw, vh, pad } = getViewport();
		const containerW = vw - pad * 2;
		const containerH = vh - pad * 2;
		const containerCenterX = pad + containerW / 2;
		const containerCenterY = pad + containerH / 2;

		const originCenterX = originRect.left + originRect.width / 2;
		const originCenterY = originRect.top + originRect.height / 2;

		// Scale to match the origin rect's size (use the larger axis to fully cover)
		const scaleX = originRect.width / containerW;
		const scaleY = originRect.height / containerH;
		const scale = Math.max(scaleX, scaleY);

		const x = originCenterX - containerCenterX;
		const y = originCenterY - containerCenterY;

		return { scale, x, y };
	}, [originRect]);

	const atOrigin = {
		scale: originTransform.scale,
		x: originTransform.x,
		y: originTransform.y,
	};
	const atCenter = { scale: 1, x: 0, y: 0 };

	// Determine animation state
	let animateTarget = atCenter;
	if (isClosing) {
		if (hasNavigated) {
			animateTarget = { scale: 0.95, x: 0, y: 0 };
		} else {
			animateTarget = atOrigin;
		}
	}

	const closingOpacity = isClosing && hasNavigated ? 0 : 1;

	return (
		<dialog
			ref={dialogRef}
			aria-modal="true"
			aria-label={`Photo viewer: ${photo.name}`}
			className="fixed inset-0 z-50 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden overscroll-contain border-0 bg-transparent p-0 text-foreground backdrop:bg-transparent"
			onCancel={(event) => {
				event.preventDefault();
				handleClose();
			}}
		>
			{/* Backdrop */}
			<motion.div
				className="fixed inset-0 z-50 bg-background/95 backdrop-blur"
				initial={prefersReducedMotion ? false : { opacity: 0 }}
				animate={{ opacity: isClosing ? 0 : 1 }}
				transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
				onClick={handleClose}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			/>

			{/* UI controls */}
			<motion.div
				className="fixed inset-0 z-50 pointer-events-none"
				initial={prefersReducedMotion ? false : { opacity: 0 }}
				animate={{ opacity: isClosing ? 0 : 1 }}
				transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
			>
				{/* Close button */}
				<button
					ref={closeButtonRef}
					type="button"
					onClick={handleClose}
					className="pointer-events-auto absolute top-4 right-4 z-10 text-white/70 hover:text-white transition-colors p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
					aria-label="Close lightbox"
				>
					<svg
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M18 6 6 18" />
						<path d="m6 6 12 12" />
					</svg>
				</button>

				{/* Prev button */}
				{photos.length > 1 && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							goToPrev();
						}}
						className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white/70 hover:text-white transition-colors p-2 hidden sm:block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
						aria-label="Previous photo"
					>
						<svg
							aria-hidden="true"
							xmlns="http://www.w3.org/2000/svg"
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="m15 18-6-6 6-6" />
						</svg>
					</button>
				)}

				{/* Next button */}
				{photos.length > 1 && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							goToNext();
						}}
						className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white/70 hover:text-white transition-colors p-2 hidden sm:block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
						aria-label="Next photo"
					>
						<svg
							aria-hidden="true"
							xmlns="http://www.w3.org/2000/svg"
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="m9 18 6-6-6-6" />
						</svg>
					</button>
				)}

				{/* Counter */}
				{photos.length > 1 && (
					<div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm tabular-nums">
						{currentIndex + 1} / {photos.length}
					</div>
				)}
			</motion.div>

			{/* Image container — fixed at lightbox dimensions, animated via scale+translate */}
			<motion.div
				className="fixed z-50 inset-4 sm:inset-8 md:inset-16 pointer-events-none"
				initial={prefersReducedMotion ? { opacity: 0 } : atOrigin}
				animate={
					prefersReducedMotion
						? { opacity: closingOpacity }
						: { ...animateTarget, opacity: closingOpacity }
				}
				transition={prefersReducedMotion ? { duration: 0 } : SPRING_TRANSITION}
			>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: close button and native dialog Escape handling provide keyboard access */}
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: close button and native dialog Escape handling provide keyboard access */}
				<div
					className="relative w-full h-full pointer-events-auto flex items-center justify-center"
					onClick={(e) => {
						e.stopPropagation();
						handleClose();
					}}
				>
					<AnimatePresence mode="wait" custom={direction}>
						<motion.div
							key={photo.url}
							custom={direction}
							variants={slideVariants}
							className="absolute inset-0"
							initial={hasNavigated && !prefersReducedMotion ? "enter" : false}
							animate="center"
							exit={prefersReducedMotion ? undefined : "exit"}
							transition={
								prefersReducedMotion ? { duration: 0 } : SLIDE_TRANSITION
							}
						>
							{/* Grid-quality image — cached, shows instantly */}
							<Image
								src={photo.url}
								alt={photo.name}
								fill
								className="object-contain"
								sizes={GRID_SIZES}
							/>
							{/* Full-quality image — loads on top, fades in when ready */}
							<LightboxImage
								key={photo.url}
								src={photo.url}
								alt={photo.name}
								sizes={LIGHTBOX_SIZES}
							/>
						</motion.div>
					</AnimatePresence>
				</div>
			</motion.div>
		</dialog>
	);
}
