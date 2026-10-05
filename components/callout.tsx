import {
	AlertTriangleIcon,
	CheckCircleIcon,
	InfoIcon,
	XCircleIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type variants = "info" | "warning" | "error" | "success";

export function Callout({
	children,
	variant = "info",
}: {
	children: ReactNode;
	variant?: variants;
}) {
	const variantMap = {
		info: {
			icon: InfoIcon,
			className:
				"bg-vesper-aqua/15 border-vesper-aqua/25 [&_h5]:text-vesper-aqua [&_p]:text-vesper-aqua",
			iconClassName: "text-vesper-aqua",
		},
		warning: {
			icon: AlertTriangleIcon,
			className:
				"bg-vesper-orange/15 border-vesper-orange/25 [&_h5]:text-vesper-orange [&_p]:text-vesper-orange",
			iconClassName: "text-vesper-orange",
		},
		error: {
			icon: XCircleIcon,
			className:
				"bg-vesper-red/15 border-vesper-red/25 [&_h5]:text-vesper-red [&_p]:text-vesper-red",
			iconClassName: "text-vesper-red",
		},
		success: {
			icon: CheckCircleIcon,
			className:
				"bg-vesper-teal/15 border-vesper-teal/25 [&_h5]:text-vesper-teal [&_p]:text-vesper-teal",
			iconClassName: "text-vesper-teal",
		},
	};
	const { icon: Icon, className, iconClassName } = variantMap[variant];
	return (
		<div
			className={cn("relative w-full border px-4 py-4.5 mt-6 mb-4", className)}
		>
			<div className="flex gap-3">
				<Icon className={cn("h-4 w-4 shrink-0", iconClassName)} />
				<div className="flex-1">{children}</div>
			</div>
		</div>
	);
}
export function CalloutTitle({ children }: { children: ReactNode }) {
	return (
		<h5 className="font-medium! leading-none tracking-tight mt-0!">
			{children}
		</h5>
	);
}
export function CalloutDescription({ children }: { children: ReactNode }) {
	return (
		<div className="text-sm [&_p]:mb-0 [&_p]:leading-relaxed">{children}</div>
	);
}
