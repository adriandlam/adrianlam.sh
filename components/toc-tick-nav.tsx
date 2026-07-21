"use client";

import { Undo2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useTransitionRouter } from "next-view-transitions";
import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/toc";
import { slideTransition } from "@/lib/transitions";
import { cn } from "@/lib/utils";

// Tick width by distance from the hovered item; equal widths at rest
const TICK_WIDTHS = [32, 24, 16, 8];
const REST_WIDTH = 16;
const NESTED_REST_WIDTH = 10;
const NESTED_INDENT = 12;

function TickTooltip({
	children,
	shouldReduceMotion,
}: {
	children: React.ReactNode;
	shouldReduceMotion: boolean | null;
}) {
	return (
		<motion.div
			className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 whitespace-nowrap bg-card px-1.5 py-1 border rounded-md text-sm"
			initial={{
				opacity: 0,
				transform: shouldReduceMotion ? "translateX(0px)" : "translateX(-4px)",
			}}
			animate={{ opacity: 1, transform: "translateX(0px)" }}
			exit={{
				opacity: 0,
				transform: shouldReduceMotion ? "translateX(0px)" : "translateX(-2px)",
				transition: { duration: 0.1, ease: "easeOut" },
			}}
			transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
		>
			{children}
		</motion.div>
	);
}

export function TocTickNav({
	items,
	backHref,
	backLabel,
}: {
	items: TocItem[];
	backHref: string;
	backLabel: string;
}) {
	const router = useTransitionRouter();
	const shouldReduceMotion = useReducedMotion();
	const [hovered, setHovered] = useState<number | null>(null);
	const [focused, setFocused] = useState<number | null>(null);
	const [backHovered, setBackHovered] = useState(false);
	const [backFocused, setBackFocused] = useState(false);
	const [activeId, setActiveId] = useState("");

	useEffect(() => {
		const headingElements = items
			.map((item) => document.getElementById(item.id))
			.filter(Boolean) as HTMLElement[];

		if (headingElements.length === 0) return;

		setActiveId(headingElements[0].id);

		const observer = new IntersectionObserver(
			(entries) => {
				const visibleEntries = entries.filter((e) => e.isIntersecting);
				if (visibleEntries.length > 0) {
					const sorted = visibleEntries.sort(
						(a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
					);
					setActiveId(sorted[0].target.id);
				}
			},
			{ rootMargin: "0px 0px -80% 0px" },
		);

		for (const el of headingElements) {
			observer.observe(el);
		}

		return () => observer.disconnect();
	}, [items]);

	const activeIndex = items.findIndex((item) => item.id === activeId);
	const highlightedIndex = hovered ?? focused;
	const focusIndex =
		highlightedIndex ?? (activeIndex === -1 ? null : activeIndex);

	return (
		<nav
			aria-label="On this page"
			className="fixed left-8 top-8 z-50 flex flex-col"
			onMouseLeave={() => {
				setHovered(null);
				setBackHovered(false);
			}}
		>
			<Link
				href={backHref}
				aria-label={backLabel}
				className="group relative flex w-fit items-center py-1.5 pr-4 mb-1 rounded-sm text-muted-foreground transition-colors duration-200 ease-out hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
				onMouseEnter={() => setBackHovered(true)}
				onMouseLeave={() => setBackHovered(false)}
				onFocus={() => setBackFocused(true)}
				onBlur={() => setBackFocused(false)}
				onClick={(event) => {
					if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
						return;
					event.preventDefault();
					router.push(backHref, {
						onTransitionReady: slideTransition("right"),
					});
				}}
			>
				<Undo2 className="size-4" aria-hidden="true" />
				<AnimatePresence>
					{(backHovered || backFocused) && (
						<TickTooltip shouldReduceMotion={shouldReduceMotion}>
							<p className="font-medium">{backLabel}</p>
						</TickTooltip>
					)}
				</AnimatePresence>
			</Link>
			{items.map((item, i) => {
				const isFocused = i === focusIndex;
				const isActive = i === activeIndex;
				const isNested = item.level === 3;
				const width =
					highlightedIndex === null
						? isNested
							? NESTED_REST_WIDTH
							: REST_WIDTH
						: TICK_WIDTHS[
								Math.min(Math.abs(i - highlightedIndex), TICK_WIDTHS.length - 1)
							] - (isNested ? 6 : 0);

				return (
					<a
						key={item.id}
						href={`#${item.id}`}
						aria-label={item.text}
						aria-current={isActive ? "location" : undefined}
						className="group relative flex items-center py-1.5 pr-4 cursor-default rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
						style={{ marginLeft: isNested ? NESTED_INDENT : 0 }}
						onMouseEnter={() => setHovered(i)}
						onFocus={() => setFocused(i)}
						onBlur={() => setFocused(null)}
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
							{highlightedIndex === i && (
								<TickTooltip shouldReduceMotion={shouldReduceMotion}>
									<p className="font-medium">{item.text}</p>
								</TickTooltip>
							)}
						</AnimatePresence>
					</a>
				);
			})}
		</nav>
	);
}
