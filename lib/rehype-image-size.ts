import { readFileSync } from "node:fs";
import { join } from "node:path";
import { imageSize } from "image-size";

type HastNode = {
	type: string;
	tagName?: string;
	properties?: Record<string, unknown>;
	children?: HastNode[];
};

/**
 * Stamps local images (served from /public) with their intrinsic
 * width/height so next/image gets a correct aspect-ratio hint instead
 * of the hardcoded 800x500 fallback in mdxComponents.img.
 */
export function rehypeImageSize() {
	return (tree: HastNode) => visit(tree);
}

function visit(node: HastNode) {
	if (node.tagName === "img") {
		const src = node.properties?.src;
		if (
			typeof src === "string" &&
			src.startsWith("/") &&
			node.properties?.width === undefined
		) {
			try {
				const buffer = readFileSync(join(process.cwd(), "public", src));
				const { width, height } = imageSize(buffer);
				if (width && height) {
					node.properties = { ...node.properties, width, height };
				}
			} catch {
				// File not found or unreadable: leave the node untouched so the
				// img component's default dimensions apply.
			}
		}
	}
	for (const child of node.children ?? []) {
		visit(child);
	}
}
