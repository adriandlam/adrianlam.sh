import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { unstable_cache } from "next/cache";
import { cache } from "react";

export type BlogPost = {
	title: string;
	publishedAt: string;
	summary: string;
	slug: string;
	draft?: boolean;
	showInNav?: boolean;
};

// Cache blog posts for 1 hour in development, forever in production until revalidated
const getBlogPostsUncached = async (): Promise<BlogPost[]> => {
	const blogDirectory = path.join(process.cwd(), "content/blog");
	const filenames = fs.readdirSync(blogDirectory);

	const posts = filenames
		.filter((filename) => filename.endsWith(".mdx"))
		.map((filename) => {
			const filePath = path.join(blogDirectory, filename);
			const fileContent = fs.readFileSync(filePath, "utf8");
			const { data } = matter(fileContent);
			if (data.draft) return undefined;
			if (data.private) return undefined;
			return {
				title: data.title,
				publishedAt: data.publishedAt,
				summary: data.summary,
				slug: filename.replace(/\.mdx$/, ""),
				draft: data.draft,
				showInNav: data.showInNav,
			};
		})
		.filter(Boolean) as BlogPost[];

	return posts.sort(
		(a, b) =>
			new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
	);
};

// Cached version for production - also export the type for convenience
export const getBlogPosts = unstable_cache(
	getBlogPostsUncached,
	["blog-posts"],
	{
		revalidate: false,
		tags: ["blog"],
	},
);

// Get a single blog post with metadata and content
export type BlogPostWithContent = {
	metadata: {
		title: string;
		publishedAt: string;
		summary?: string;
		excerpt?: string;
		tags?: string[];
		author?: string;
		coverImage?: string;
		images?: string[];
		private?: boolean;
		draft?: boolean;
		showInNav?: boolean;
	};
	content: string;
	readingTime: number;
};

/** Estimate reading time in minutes from raw MDX content */
function estimateReadingTime(content: string): number {
	// Strip MDX/JSX components, frontmatter, code blocks, and HTML tags
	const text = content
		.replace(/```[\s\S]*?```/g, "") // code blocks
		.replace(/<[^>]+>/g, "") // HTML/JSX tags
		.replace(/\{[^}]*\}/g, "") // JSX expressions
		.replace(/import\s+.*$/gm, "") // import statements
		.replace(/!\[.*?\]\(.*?\)/g, "") // images
		.replace(/\[([^\]]+)\]\(.*?\)/g, "$1") // links (keep text)
		.replace(/[#*_~`>|-]/g, "") // markdown syntax
		.trim();
	const words = text.split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / 230));
}

const getBlogPostCached = unstable_cache(
	async (slug: string): Promise<BlogPostWithContent | null> => {
		const filePath = path.join(process.cwd(), `content/blog/${slug}.mdx`);

		try {
			const fileContent = fs.readFileSync(filePath, "utf8");
			const { data: metadata, content } = matter(fileContent);
			if (metadata.draft) return null;
			if (metadata.private) return null;
			return {
				metadata,
				content,
				readingTime: estimateReadingTime(content),
			} as BlogPostWithContent;
		} catch {
			return null;
		}
	},
	["blog-post"],
	{
		revalidate: false,
		tags: ["blog"],
	},
);

// Wrap in React cache() for request-level dedup (called in both generateMetadata and Page)
export const getBlogPost = cache((slug: string) => getBlogPostCached(slug));
