import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { KatexStyles } from "@/components/katex-styles";
import { TocTickNav } from "@/components/toc-tick-nav";
import { SITE_URL } from "@/lib/constants";
import { mdxComponents, mdxOptions } from "@/lib/mdx";
import { getProject, getProjects } from "@/lib/projects";
import { extractHeadings } from "@/lib/toc";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const project = await getProject(slug);

	if (!project) {
		return { title: "Project Not Found" };
	}

	const { metadata } = project;

	return {
		title: `${metadata.name} | Adrian Lam`,
		description: metadata.description,
		openGraph: {
			title: metadata.name,
			description: metadata.description,
			type: "article",
			url: `${SITE_URL}/projects/${slug}`,
		},
		twitter: {
			card: "summary_large_image",
			title: metadata.name,
			description: metadata.description,
		},
		alternates: {
			canonical: `${SITE_URL}/projects/${slug}`,
		},
	};
}

export default async function ProjectPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const project = await getProject(slug);

	if (!project) {
		notFound();
	}

	const { metadata, content } = project;
	const headings = extractHeadings(content);
	const usesMath = content.includes("$") || content.includes("\\(");

	return (
		<main className="mt-10">
			{usesMath && <KatexStyles />}
			<div className="relative space-y-12">
				<TocTickNav
					items={headings}
					backHref="/projects"
					backLabel="Back to projects"
				/>

				{/* Project header */}
				<div className="text-center">
					<h1 className="text-5xl!">{metadata.name}</h1>
					<p className=" text-muted-foreground mt-2">{metadata.description}</p>
					{/*<div className="flex flex-wrap gap-3">
            {metadata.url && (
              <Link
                href={metadata.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link inline-flex gap-0.5"
              >
                View
                <ExternalLinkIcon />
              </Link>
            )}
          </div>*/}
				</div>

				{/* MDX content */}
				<article className="max-w-3xl mx-auto">
					<MDXRemote
						source={content}
						components={mdxComponents}
						options={{
							// biome-ignore lint/suspicious/noExplicitAny: remark/rehype plugin types don't match next-mdx-remote's expected types
							mdxOptions: mdxOptions as any,
						}}
					/>
				</article>
			</div>
		</main>
	);
}

export async function generateStaticParams() {
	const projects = await getProjects();
	return projects.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;
