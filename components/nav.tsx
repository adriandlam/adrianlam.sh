"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransitionRouter } from "next-view-transitions";
import { useCallback, useEffect, useMemo } from "react";
import { slideTransition } from "@/lib/transitions";
import { cn } from "@/lib/utils";
import { ExternalLinkIcon } from "./external-link-icon";
import { Kbd } from "./ui/kbd";
import { Separator } from "./ui/separator";

interface NavItem {
	name: string;
	slug: string;
}

interface NavTab {
	name: string;
	href: string;
	children?: { name: string; href: string }[];
}

interface NavProps {
	blogPosts: { slug: string; title: string }[];
	projects: NavItem[];
}

const getTabs = (
	blogPosts: { slug: string; title: string }[],
	projects: NavItem[],
): NavTab[] => [
	{ name: "home", href: "/" },
	{
		name: "blog",
		href: "/blog",
		children: blogPosts.map((post) => ({
			name: post.title,
			href: `/blog/${post.slug}`,
		})),
	},
	{
		name: "projects",
		href: "/projects",
		children: projects.map((project) => ({
			name: project.name,
			href: `/projects/${project.slug}`,
		})),
	},
	{ name: "photos", href: "/photos" },
];

// Prefetch adjacent pages for instant j/k/h navigation
function usePrefetchSiblings(
	activeParentTab: NavTab | null,
	pathname: string,
	tabs: NavTab[],
) {
	const router = useTransitionRouter();

	useEffect(() => {
		if (!activeParentTab) {
			// On parent tabs: prefetch all 4 main routes (cheap, only 4)
			for (const tab of tabs) {
				router.prefetch(tab.href);
			}
			// Also prefetch the first child of the current tab (target of 'l' key)
			const currentTab = tabs.find((t) => pathname === t.href);
			if (currentTab?.children?.[0]) {
				router.prefetch(currentTab.children[0].href);
			}
		} else {
			// On child pages: prefetch only prev/next siblings + parent (for h key)
			const children = activeParentTab.children || [];
			const currentIndex = children.findIndex(
				(child) => pathname === child.href,
			);
			if (currentIndex > 0) {
				router.prefetch(children[currentIndex - 1].href);
			}
			if (currentIndex < children.length - 1) {
				router.prefetch(children[currentIndex + 1].href);
			}
			router.prefetch(activeParentTab.href);
		}
	}, [router, activeParentTab, pathname, tabs]);
}

export default function Nav({ blogPosts, projects }: NavProps) {
	const router = useTransitionRouter();
	const pathname = usePathname();

	const tabs = useMemo(
		() => getTabs(blogPosts, projects),
		[blogPosts, projects],
	);

	// Calculate activeParentTab immediately during render to avoid flash
	const activeParentTab = useMemo(() => {
		for (const tab of tabs) {
			if (tab.children) {
				const isOnChildPage = tab.children.some(
					(child) => pathname === child.href,
				);
				if (isOnChildPage) {
					return tab;
				}
			}
		}
		return null;
	}, [pathname, tabs]);

	// Prefetch adjacent pages for instant keyboard navigation
	usePrefetchSiblings(activeParentTab, pathname, tabs);

	// Optimized keyboard navigation using native keydown with useCallback
	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			// Ignore if user is typing in an input or textarea
			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement ||
				event.target instanceof HTMLSelectElement
			) {
				return;
			}

			const key = event.key;

			// j/k navigation through tabs
			if (key === "j" || key === "k") {
				if (event.repeat) return;
				event.preventDefault();
				const isNext = key === "j";
				// j = down the list (older), k = up the list (newer)
				const direction = isNext ? "down" : "up";

				if (activeParentTab) {
					// Navigate through child tabs
					const children = activeParentTab.children || [];
					const currentIndex = children.findIndex(
						(child) => pathname === child.href,
					);
					const newIndex = isNext ? currentIndex + 1 : currentIndex - 1;

					if (newIndex >= 0 && newIndex < children.length) {
						router.push(children[newIndex].href, {
							onTransitionReady: slideTransition(direction),
						});
					}
				} else {
					// Navigate through parent tabs
					const currentIndex = tabs.findIndex(
						(tab) =>
							pathname === tab.href || pathname.startsWith(`${tab.href}/`),
					);
					const newIndex = isNext ? currentIndex + 1 : currentIndex - 1;

					if (newIndex >= 0 && newIndex < tabs.length) {
						router.push(tabs[newIndex].href, {
							onTransitionReady: slideTransition(direction),
						});
					}
				}
				return;
			}

			// h to go back to parent tab when on a child tab
			if (key === "h" && activeParentTab) {
				event.preventDefault();
				router.push(activeParentTab.href, {
					onTransitionReady: slideTransition("right"),
				});
				return;
			}

			// l to navigate into children tabs from parent tab
			if (key === "l" && !activeParentTab) {
				const currentTab = tabs.find((tab) => pathname === tab.href);
				if (currentTab?.children && currentTab.children.length > 0) {
					event.preventDefault();
					router.push(currentTab.children[0].href, {
						onTransitionReady: slideTransition("left"),
					});
				}
				return;
			}

			// g to open GitHub
			if (key === "g" && !activeParentTab) {
				event.preventDefault();
				window.open(
					"https://github.com/adriandlam",
					"_blank",
					"noopener,noreferrer",
				);
				return;
			}
		},
		[activeParentTab, pathname, router, tabs],
	);

	// Use native keydown event for minimal latency
	// Use capture phase (third arg = true) to ensure handler runs before any element can stop propagation
	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown, true);
		return () => document.removeEventListener("keydown", handleKeyDown, true);
	}, [handleKeyDown]);

	const tabClassname =
		"line-clamp-1 font-mono text-[15px] transition-all duration-200 ease-out hover:text-primary hover:bg-secondary/50";

	return (
		<nav>
			<div className="block lg:hidden pt-4">
				<ul className="flex items-center gap-1">
					{tabs.map((tab) => {
						const isActive =
							pathname === tab.href || pathname.startsWith(`${tab.href}/`);
						return (
							<li
								key={tab.name}
								className={cn(
									tabClassname,
									isActive ? "text-primary " : "text-muted-foreground",
								)}
							>
								<Link href={tab.href} className="block py-1 px-4">
									{tab.name}
								</Link>
							</li>
						);
					})}
				</ul>
			</div>
			<div
				className={cn(
					" m-8 w-32 hidden lg:inline lg:w-48 overflow-hidden transition-all duration-200 ease-out",
					activeParentTab ? "lg:w-54" : "",
				)}
			>
				<AnimatePresence mode="wait" initial={false}>
					{activeParentTab ? (
						<motion.ul
							key="children-tabs"
							className="space-y-0.5"
							initial={{ opacity: 0, translateX: 20 }}
							animate={{ opacity: 1, translateX: 0 }}
							exit={{ opacity: 0, translateX: -20 }}
							transition={{ duration: 0.1, ease: "easeOut" }}
						>
							<li className={cn(tabClassname, "text-muted-foreground")}>
								<a
									href={activeParentTab.href}
									onClick={(e) => {
										e.preventDefault();
										router.push(activeParentTab.href, {
											onTransitionReady: slideTransition("right"),
										});
									}}
									className="flex items-center justify-between w-full py-1 px-2 gap-2"
								>
									<span className="inline-flex items-center gap-1 line-clamp-1">
										<ChevronLeft className="size-4 shrink-0" />
										<span className="line-clamp-1">
											back to {activeParentTab.name}
										</span>
									</span>
									<Kbd>h</Kbd>
								</a>
							</li>
							<Separator className="mx-0.5 my-1.5" />
							{(() => {
								const children = activeParentTab.children || [];
								const activeChildIndex = children.findIndex(
									(c) => pathname === c.href,
								);
								return children.map((child, index) => {
									// Show 'k' on item above active, 'j' on item below active
									let shortcut: string | undefined;
									if (activeChildIndex >= 0) {
										if (index === activeChildIndex - 1) shortcut = "k";
										else if (index === activeChildIndex + 1) shortcut = "j";
									}

									return (
										<li
											key={child.name}
											className={cn(
												tabClassname,
												pathname === child.href
													? "text-primary bg-secondary"
													: "text-muted-foreground",
											)}
										>
											<Link
												href={child.href}
												className="flex items-center justify-between w-full py-1 px-2 gap-2"
											>
												<span className="line-clamp-1">{child.name}</span>
												{shortcut && <Kbd>{shortcut}</Kbd>}
											</Link>
										</li>
									);
								});
							})()}
						</motion.ul>
					) : (
						<motion.ul
							key="parent-tabs"
							className="space-y-0.5"
							initial={{ opacity: 0, translateX: -20 }}
							animate={{ opacity: 1, translateX: 0 }}
							exit={{ opacity: 0, translateX: 20 }}
							transition={{ duration: 0.1, ease: "easeOut" }}
						>
							{(() => {
								const activeTabIndex = tabs.findIndex(
									(t) =>
										pathname === t.href || pathname.startsWith(`${t.href}/`),
								);
								return tabs.map((tab, index) => {
									const isActive =
										pathname === tab.href ||
										pathname.startsWith(`${tab.href}/`);

									// Show 'k' on item above active, 'j' on item below active, 'l' on active with children
									let shortcut: string | undefined;
									if (activeTabIndex >= 0) {
										if (
											index === activeTabIndex &&
											isActive &&
											pathname === tab.href &&
											tab.children &&
											tab.children.length > 0
										) {
											shortcut = "l";
										} else if (index === activeTabIndex - 1) {
											shortcut = "k";
										} else if (index === activeTabIndex + 1) {
											shortcut = "j";
										}
									}

									return (
										<li
											key={tab.name}
											className={cn(
												tabClassname,
												isActive
													? "text-primary bg-accent"
													: "text-muted-foreground",
											)}
										>
											<Link
												href={tab.href}
												className="flex items-center justify-between w-full py-1 px-2 gap-2"
											>
												<span className="line-clamp-1">{tab.name}</span>
												<span className="flex items-center">
													{shortcut === "l" && (
														<ChevronRight className="size-3.5" />
													)}
													{shortcut && <Kbd>{shortcut}</Kbd>}
												</span>
											</Link>
										</li>
									);
								});
							})()}
							<Separator className="mx-0.5 my-1.5" />
							<li className={cn(tabClassname, "text-muted-foreground w-full")}>
								<Link
									href="https://github.com/adriandlam"
									target="_blank"
									className="flex items-center justify-between w-full py-1 px-2 gap-2"
								>
									<span className="flex gap-0.5">
										github
										<ExternalLinkIcon />
									</span>
									<Kbd>g</Kbd>
								</Link>
							</li>
						</motion.ul>
					)}
				</AnimatePresence>
			</div>
		</nav>
	);
}
