import Image from "next/image";
import Link from "next/link";
import { ExternalLinkIcon } from "@/components/external-link-icon";
import { getFeaturedProjects } from "@/lib/projects";

export default async function Home() {
	const featuredProjects = await getFeaturedProjects();

	return (
		<main className="grid grid-cols-3 divide-y">
			{/* Intro Section */}
			{/*<div className="flex items-center gap-6">
        <Image
          src="/me.jpeg"
          alt="Avatar"
          width={64}
          height={64}
          sizes="64px"
          className="size-16"
          priority
        />
        <h1>Adrian Lam</h1>
      </div>*/}

			{/* About Me Section */}
			<div className="p-16 grid col-span-3">
				<div className="space-y-4">
					<p>
						Currently I'm interning at{" "}
						<Link
							href="https://cloudflare.com"
							target="_blank"
							className="link inline-flex gap-0.5"
						>
							Cloudflare
							<ExternalLinkIcon />
						</Link>{" "}
						as a software engineer in Austin, TX.
					</p>
					<p>
						Previously, I worked at Vercel as one of the core maintainers of the{" "}
						<Link
							href="https://useworkflow.dev"
							target="_blank"
							className="link inline-flex gap-0.5"
						>
							Workflow DevKit
							<ExternalLinkIcon />
						</Link>
						.
					</p>
					<p>
						Currently studying Math at the University of British Columbia. Big
						fan of venturing outdoors into the unknown. I also dabble in{" "}
						<Link href="/photos" className="link">
							photography
						</Link>
						.
					</p>
				</div>
			</div>

			{/* Projects Section */}
			<div className="p-16">
				<p>Some cool projects I've worked on:</p>
				<ul className="list">
					{featuredProjects.map((project) => (
						<li key={project.slug}>
							<Link href={`/projects/${project.slug}`} className="link">
								{project.name}
							</Link>{" "}
							- {project.shortDescription || project.description}
						</li>
					))}
				</ul>
				<p>
					You can view all my projects{" "}
					<Link href="/projects" className="link">
						here
					</Link>
					.
				</p>
			</div>
		</main>
	);
}
