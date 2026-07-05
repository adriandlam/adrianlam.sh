import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TransitionLink } from "@/components/transition-link";
import { Skeleton } from "@/components/ui/skeleton";
import { getProjects } from "@/lib/projects";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
	title: "Projects",
	description:
		"Things I've built — side projects, open source, and experiments.",
};

export default async function ProjectsPage() {
	const projects = await getProjects();

	return (
		<main className="grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
			<div className="p-6 md:p-16">
				<div className="md:sticky md:top-16">
					<h1>Projects</h1>
					<p className="mt-2 text-muted-foreground">
						A collection of projects I've built throughout my journey as a
						developer and hobbyist.
					</p>
				</div>
			</div>
			<div className="p-6 md:col-span-2 md:space-y-1 md:p-16">
				{projects.map((project) => (
					<div
						key={project.slug}
						className="relative h-32 overflow-hidden transition duration-200 ease-out hover:bg-accent/50"
					>
						<TransitionLink
							href={`/projects/${project.slug}`}
							direction="left"
							className="absolute inset-0 z-10"
							aria-label={`View project: ${project.name}`}
						/>
						<div className="absolute inset-x-0 bottom-0 p-6">
							<div className="space-y-1">
								<span className="line-clamp-1 text-2xl">{project.name}</span>
								<span className="line-clamp-1 text-muted-foreground text-sm">
									{project.shortDescription || project.description}
								</span>
							</div>
							<span className="block text-muted-foreground text-xs font-mono mt-2">
								{project.year}
								{project.inProgress ? " · in progress" : ""}
							</span>
						</div>
					</div>
				))}
				<p className="mt-8">
					You can view my smaller projects and experiments{" "}
					<Link href="https://github.com/adriandlam" className="link">
						here
					</Link>
					.
				</p>
			</div>
		</main>
	);
}
