"use client";

import {
	motion,
	useMotionValue,
	useReducedMotion,
	useSpring,
} from "motion/react";
import Image, { type ImageProps } from "next/image";
import { type Ref, useCallback, useEffect, useRef, useState } from "react";

const SPRING_CONFIG = { stiffness: 100, damping: 20 };
const MAX_OFFSET = 25;
const LIGHT_OPACITY = 0.06;

type HoverParallaxImageProps = Omit<ImageProps, "fill"> & {
	containerClassName?: string;
	containerStyle?: React.CSSProperties;
	disableEntrance?: boolean;
	onClick?: () => void;
	containerRef?: Ref<HTMLDivElement>;
	isActive?: boolean;
};

export function HoverParallaxImage({
	containerClassName,
	containerStyle,
	className,
	width: _width,
	height: _height,
	style: _style,
	disableEntrance,
	onClick,
	containerRef: externalRef,
	isActive,
	...imageProps
}: HoverParallaxImageProps) {
	const internalRef = useRef<HTMLDivElement>(null);
	const prefersReducedMotion = useReducedMotion();
	const [isHovered, setIsHovered] = useState(false);
	const [lightPos, setLightPos] = useState({ x: 50, y: 50 });

	const x = useMotionValue(0);
	const y = useMotionValue(0);

	const springX = useSpring(x, SPRING_CONFIG);
	const springY = useSpring(y, SPRING_CONFIG);

	// Reset parallax position when active (lightbox is open for this image)
	useEffect(() => {
		if (isActive) {
			x.set(0);
			y.set(0);
		}
	}, [isActive, x, y]);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (isActive) return;

			const container = internalRef.current;
			if (!container) return;

			const rect = container.getBoundingClientRect();
			const percentX = ((e.clientX - rect.left) / rect.width) * 100;
			const percentY = ((e.clientY - rect.top) / rect.height) * 100;

			setLightPos({ x: percentX, y: percentY });

			if (prefersReducedMotion) return;

			const relativeX = (percentX / 100 - 0.5) * 2;
			const relativeY = (percentY / 100 - 0.5) * 2;

			x.set(-relativeX * MAX_OFFSET);
			y.set(-relativeY * MAX_OFFSET);
		},
		[prefersReducedMotion, x, y, isActive],
	);

	const handleMouseLeave = useCallback(() => {
		setIsHovered(false);
		x.set(0);
		y.set(0);
	}, [x, y]);

	// Merge internal ref with external ref
	const setRefs = useCallback(
		(node: HTMLDivElement | null) => {
			(internalRef as React.MutableRefObject<HTMLDivElement | null>).current =
				node;
			if (typeof externalRef === "function") {
				externalRef(node);
			} else if (externalRef) {
				(externalRef as React.MutableRefObject<HTMLDivElement | null>).current =
					node;
			}
		},
		[externalRef],
	);

	return (
		<motion.div
			ref={setRefs}
			onMouseMove={handleMouseMove}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={handleMouseLeave}
			onClick={onClick}
			className={`relative overflow-hidden ${onClick ? "cursor-pointer" : ""} ${containerClassName ?? ""}`}
			style={containerStyle}
			{...(disableEntrance
				? {}
				: {
						initial: { opacity: 0, y: 20 },
						whileInView: { opacity: 1, y: 0 },
						viewport: { once: true, amount: 0.15 },
						transition: { duration: 0.4, ease: "easeOut" },
					})}
		>
			<motion.div
				className={`absolute will-change-transform transition-[inset] ${isActive ? "duration-200 ease-out inset-0" : "duration-500 delay-300 ease-in-out inset-[-4%]"}`}
				style={{
					x: springX,
					y: springY,
				}}
			>
				<Image
					fill
					className={`object-cover ${className ?? ""}`}
					{...imageProps}
				/>
			</motion.div>

			{/* Spotlight overlay */}
			<div
				className="pointer-events-none absolute inset-0 transition-opacity duration-300"
				style={{
					opacity: isHovered ? 1 : 0,
					background: `radial-gradient(circle 100px at ${lightPos.x}% ${lightPos.y}%, rgba(255,255,255,${LIGHT_OPACITY}), transparent)`,
				}}
			/>
		</motion.div>
	);
}
