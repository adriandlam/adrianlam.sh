"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	const shouldReduceMotion = useReducedMotion();

	return (
		<div
			data-slot="skeleton"
			className={cn("relative overflow-hidden bg-muted", className)}
			{...props}
		>
			<motion.div
				aria-hidden="true"
				className="absolute inset-0 bg-linear-to-r from-transparent via-primary/20 to-transparent"
				initial={shouldReduceMotion ? false : { x: "-100%" }}
				animate={shouldReduceMotion ? { x: "-100%" } : { x: "100%" }}
				transition={{
					repeat: shouldReduceMotion ? 0 : Infinity,
					duration: 1.5,
					ease: "easeInOut",
				}}
			/>
		</div>
	);
}

export { Skeleton };
