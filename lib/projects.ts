import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { unstable_cache } from "next/cache";
import { cache } from "react";

export type Project = {
	slug: string;
	name: string;
	description: string;
	shortDescription?: string;
	url?: string;
	inProgress?: boolean;
	year: number;
	previewImage?: string;
};

export type ProjectWithContent = {
	metadata: {
		name: string;
		description: string;
		shortDescription?: string;
		url?: string;
		inProgress?: boolean;
		year: number;
		draft?: boolean;
	};
	content: string;
};

type ProjectMeta = {
	order?: string[];
	featured: string[];
};

const PROJECTS_DIR = path.join(process.cwd(), "content/projects");

// Convention: public/projects/<slug>/preview.png
function getPreviewImage(slug: string): string | undefined {
	const previewPath = path.join(
		process.cwd(),
		"public/projects",
		slug,
		"preview.png",
	);
	return fs.existsSync(previewPath)
		? `/projects/${slug}/preview.png`
		: undefined;
}

function getProjectMeta(): ProjectMeta {
	const metaPath = path.join(PROJECTS_DIR, "meta.json");
	const raw = fs.readFileSync(metaPath, "utf8");
	return JSON.parse(raw) as ProjectMeta;
}

function applyOrdering<T extends { slug: string; year: number }>(
	projects: T[],
	order: string[],
): T[] {
	const wildcardIndex = order.indexOf("*");
	const before = wildcardIndex === -1 ? order : order.slice(0, wildcardIndex);
	const after = wildcardIndex === -1 ? [] : order.slice(wildcardIndex + 1);

	const pinned = new Set([...before, ...after]);
	const remaining = projects
		.filter((p) => !pinned.has(p.slug))
		.sort((a, b) => b.year - a.year);

	const bySlug = new Map(projects.map((p) => [p.slug, p]));
	const resolve = (slugs: string[]) =>
		slugs.map((s) => bySlug.get(s)).filter(Boolean) as T[];

	return [...resolve(before), ...remaining, ...resolve(after)];
}

// Get all projects (listing page + homepage)
const getProjectsUncached = async (): Promise<Project[]> => {
	const filenames = fs.readdirSync(PROJECTS_DIR);
	const meta = getProjectMeta();

	const projects = filenames
		.filter((filename) => filename.endsWith(".mdx"))
		.map((filename) => {
			const filePath = path.join(PROJECTS_DIR, filename);
			const fileContent = fs.readFileSync(filePath, "utf8");
			const { data } = matter(fileContent);
			if (data.draft) return undefined;
			const slug = filename.replace(/\.mdx$/, "");
			return {
				slug,
				name: data.name,
				description: data.description,
				shortDescription: data.shortDescription,
				url: data.url,
				inProgress: data.inProgress,
				year: data.year,
				previewImage: getPreviewImage(slug),
			};
		})
		.filter(Boolean) as Project[];

	const effectiveOrder = meta.order ?? [...meta.featured, "*"];
	return applyOrdering(projects, effectiveOrder);
};

export const getProjects = unstable_cache(getProjectsUncached, ["projects"], {
	revalidate: false,
	tags: ["projects"],
});

// Lightweight function for navbar
export type NavProject = {
	slug: string;
	name: string;
	year: number;
};

const getProjectsForNavUncached = async (): Promise<NavProject[]> => {
	const filenames = fs.readdirSync(PROJECTS_DIR);
	const meta = getProjectMeta();

	const projects = filenames
		.filter((filename) => filename.endsWith(".mdx"))
		.map((filename) => {
			const filePath = path.join(PROJECTS_DIR, filename);
			const fileContent = fs.readFileSync(filePath, "utf8");
			const { data } = matter(fileContent);
			if (data.draft) return undefined;
			return {
				slug: filename.replace(/\.mdx$/, ""),
				name: data.name as string,
				year: data.year as number,
			};
		})
		.filter(Boolean) as NavProject[];

	const effectiveOrder = meta.order ?? [...meta.featured, "*"];
	return applyOrdering(projects, effectiveOrder);
};

export const getProjectsForNav = unstable_cache(
	getProjectsForNavUncached,
	["projects-for-nav"],
	{
		revalidate: false,
		tags: ["projects"],
	},
);

// Get featured projects in the order specified by meta.json
const getFeaturedProjectsUncached = async (): Promise<Project[]> => {
	const allProjects = await getProjectsUncached();
	const meta = getProjectMeta();
	const bySlug = new Map(allProjects.map((p) => [p.slug, p]));

	return meta.featured
		.map((slug) => bySlug.get(slug))
		.filter(Boolean) as Project[];
};

export const getFeaturedProjects = unstable_cache(
	getFeaturedProjectsUncached,
	["featured-projects"],
	{
		revalidate: false,
		tags: ["projects"],
	},
);

// Get a single project with metadata and MDX content
const getProjectCached = unstable_cache(
	async (slug: string): Promise<ProjectWithContent | null> => {
		const filePath = path.join(PROJECTS_DIR, `${slug}.mdx`);

		try {
			const fileContent = fs.readFileSync(filePath, "utf8");
			const { data: metadata, content } = matter(fileContent);
			if (metadata.draft) return null;
			return {
				metadata,
				content,
			} as ProjectWithContent;
		} catch {
			return null;
		}
	},
	["project"],
	{
		revalidate: false,
		tags: ["projects"],
	},
);

export const getProject = cache((slug: string) => getProjectCached(slug));
