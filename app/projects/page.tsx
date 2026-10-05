import type { Metadata } from "next";
import Link from "next/link";
import { TransitionLink } from "@/components/transition-link";
import { getProjects } from "@/lib/projects";

export const metadata: Metadata = {
	title: "Projects",
	description:
		"Things I've built — side projects, open source, and experiments.",
};

export default async function ProjectsPage() {
	const projects = await getProjects();

	return (
		<main className="grid md:grid-cols-3">
			<div className="py-6 md:p-16">
				<div className="md:sticky md:top-16">
					<h1>Projects</h1>
					<p className="mt-2 text-muted-foreground">
						A collection of projects I've built throughout my journey as a
						developer and hobbyist.
					</p>
				</div>
			</div>
			<div className="py-6 md:col-span-2 md:p-16">
				{/* -mt-6 cancels the first card's padding so its title lines up with the h1 */}
				<div className="-mt-6 space-y-1">
					{projects.map((project) => (
						<TransitionLink
							key={project.slug}
							href={`/projects/${project.slug}`}
							direction="left"
							className="-mx-6 block p-6 transition duration-200 ease-out hover:bg-accent/50"
						>
							<span className="line-clamp-1 text-2xl">{project.name}</span>
							<span className="mt-1 line-clamp-1 text-muted-foreground text-sm">
								{project.shortDescription || project.description}
							</span>
							<span className="block text-muted-foreground text-xs font-mono mt-2">
								{project.year}
								{project.inProgress ? " · in progress" : ""}
							</span>
						</TransitionLink>
					))}
				</div>
				<p className="mt-8">
					You can view my smaller projects and experiments{" "}
					<Link
						href="https://github.com/adriandlam"
						target="_blank"
						rel="noopener noreferrer"
						className="link"
					>
						here
					</Link>
					.
				</p>
			</div>
		</main>
	);
}
