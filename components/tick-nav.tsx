"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransitionRouter } from "next-view-transitions";
import { useCallback, useEffect, useState } from "react";
import { slideTransition } from "@/lib/transitions";
import { cn } from "@/lib/utils";

const items = [
	{ name: "Home", href: "/", description: "Back to start" },
	{ name: "Blog", href: "/blog", description: "Writing and notes" },
	{ name: "Projects", href: "/projects", description: "Things I've built" },
	{ name: "Photos", href: "/photos", description: "Photo journal" },
];

// Tick width by distance from the hovered item; equal widths at rest
const TICK_WIDTHS = [32, 24, 16, 8];
const REST_WIDTH = 16;

export function TickNav() {
	const pathname = usePathname();
	const router = useTransitionRouter();
	const shouldReduceMotion = useReducedMotion();
	const [hovered, setHovered] = useState<number | null>(null);

	// Blog posts and project pages render their own heading ticks (TocTickNav)
	const isDetailPage = /^\/(blog|projects)\/./.test(pathname);

	const activeIndex = items.findIndex((item) =>
		item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
	);
	const focusIndex = hovered ?? (activeIndex === -1 ? null : activeIndex);

	const navigate = useCallback(
		(to: number) => {
			if (to === activeIndex || to < 0 || to >= items.length) return;
			router.push(items[to].href, {
				onTransitionReady: slideTransition(to > activeIndex ? "down" : "up"),
			});
		},
		[activeIndex, router],
	);

	useEffect(() => {
		if (isDetailPage) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "j" && event.key !== "k") return;
			if (event.metaKey || event.ctrlKey || event.altKey || event.repeat)
				return;
			const target = event.target as HTMLElement | null;
			if (
				target &&
				(target.isContentEditable ||
					["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
			)
				return;
			navigate(event.key === "j" ? activeIndex + 1 : activeIndex - 1);
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [activeIndex, navigate, isDetailPage]);

	if (isDetailPage) return null;

	return (
		<nav
			aria-label="Primary"
			className="fixed left-8 top-8 z-50 flex flex-col"
			onMouseLeave={() => setHovered(null)}
		>
			{items.map((item, i) => {
				const isFocused = i === focusIndex;
				const isActive = i === activeIndex;
				const width =
					hovered === null
						? REST_WIDTH
						: TICK_WIDTHS[
								Math.min(Math.abs(i - hovered), TICK_WIDTHS.length - 1)
							];

				return (
					<Link
						key={item.href}
						href={item.href}
						aria-current={isActive ? "page" : undefined}
						className="group relative flex items-center py-1.5 pr-4 cursor-default"
						onMouseEnter={() => setHovered(i)}
						onClick={(event) => {
							if (
								event.metaKey ||
								event.ctrlKey ||
								event.shiftKey ||
								event.altKey
							)
								return;
							event.preventDefault();
							navigate(i);
						}}
					>
						<div
							className={cn(
								"h-0.5 transition-[width,background-color] duration-200 ease-out",
								isFocused
									? "bg-primary"
									: isActive
										? "bg-primary/40"
										: "bg-muted",
							)}
							style={{ width }}
						/>
						<AnimatePresence>
							{hovered === i && (
								<motion.div
									className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 whitespace-nowrap bg-card px-1.5 py-1 border rounded-md text-sm"
									initial={{
										opacity: 0,
										transform: shouldReduceMotion
											? "translateX(0px)"
											: "translateX(-4px)",
									}}
									animate={{ opacity: 1, transform: "translateX(0px)" }}
									exit={{
										opacity: 0,
										transform: shouldReduceMotion
											? "translateX(0px)"
											: "translateX(-2px)",
										transition: { duration: 0.1, ease: "easeOut" },
									}}
									transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
								>
									<p className="font-medium">{item.name}</p>
									<p className="text-muted-foreground">{item.description}</p>
								</motion.div>
							)}
						</AnimatePresence>
					</Link>
				);
			})}
		</nav>
	);
}
