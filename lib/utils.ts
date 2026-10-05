import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// True only when focus arrived by keyboard, so pointer clicks don't leave
// hover-style affordances (tooltips, highlights) stuck on after the click.
export function isKeyboardFocus(target: EventTarget & Element): boolean {
	try {
		return target.matches(":focus-visible");
	} catch {
		return false;
	}
}

export function formatDateShort(dateString: string): string {
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
	});
}

export function formatDateLong(dateString: string): string {
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}
