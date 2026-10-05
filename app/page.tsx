import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getFeaturedProjects } from "@/lib/projects";

export default async function Home() {
	const featuredProjects = await getFeaturedProjects();

	return (
		<main className="grid md:grid-cols-3">
			<div className="py-6 md:p-16">
				<div className="md:sticky md:top-16">
					<h1>Adrian Lam</h1>
					<p className="mt-2 text-muted-foreground">
						Software engineer and math student at UBC.
					</p>
					<div className="mt-6 flex items-center gap-4 text-muted-foreground">
						<Link
							href="https://x.com/adriandlam_"
							target="_blank"
							rel="noopener noreferrer"
							aria-label="X"
							className="transition-colors hover:text-foreground"
						>
							<svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
								<title>X</title>
								<path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.63 7.58H.49l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.5h2.04L6.48 3.24H4.3l13.31 17.41Z" />
							</svg>
						</Link>
						<Link
							href="https://github.com/adriandlam"
							target="_blank"
							rel="noopener noreferrer"
							aria-label="GitHub"
							className="transition-colors hover:text-foreground"
						>
							<svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
								<title>GitHub</title>
								<path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.6.2 2.9.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
							</svg>
						</Link>
					</div>
				</div>
			</div>
			<div className="min-w-0 space-y-16 py-6 md:col-span-2 md:p-16">
				<section className="space-y-4">
					<p>
						I study Math at the University of British Columbia. When I'm not
						coding, I'm outdoors or taking{" "}
						<Link href="/photos" className="link">
							photos
						</Link>
						.
					</p>
					<p>
						Most recently, I was a software engineer on the AI Gateway team at{" "}
						<Link
							href="https://cloudflare.com"
							target="_blank"
							rel="noopener noreferrer"
							className="link whitespace-nowrap"
						>
							<svg
								viewBox="0 6.573 24 10.854"
								className="mr-[0.3em] inline h-[0.71em] w-[1.57em]"
								aria-hidden="true"
							>
								<path
									fill="#F38020"
									d="M16.5088 16.8447c.1475-.5068.0908-.9707-.1553-1.3154-.2246-.3164-.6045-.499-1.0615-.5205l-8.6592-.1123a.1559.1559 0 0 1-.1333-.0713c-.0283-.042-.0351-.0986-.021-.1553.0278-.084.1123-.1484.2036-.1562l8.7359-.1123c1.0351-.0489 2.1601-.8868 2.5537-1.9136l.499-1.3013c.0215-.0561.0293-.1128.0147-.168-.5625-2.5463-2.835-4.4453-5.5499-4.4453-2.5039 0-4.6284 1.6177-5.3876 3.8614-.4927-.3658-1.1187-.5625-1.794-.499-1.2026.119-2.1665 1.083-2.2861 2.2856-.0283.31-.0069.6128.0635.894C1.5683 13.171 0 14.7754 0 16.752c0 .1748.0142.3515.0352.5273.0141.083.0844.1475.1689.1475h15.9814c.0909 0 .1758-.0645.2032-.1553l.12-.4268z"
								/>
								<path
									fill="#FAAE40"
									d="M19.2656 11.2813c-.0771 0-.1611 0-.2383.0112-.0566 0-.1054.0415-.127.0976l-.3378 1.1744c-.1475.5068-.0918.9707.1543 1.3164.2256.3164.6055.498 1.0625.5195l1.8437.1133c.0557 0 .1055.0263.1329.0703.0283.043.0351.1074.0214.1562-.0283.084-.1132.1485-.204.1553l-1.921.1123c-1.041.0488-2.1582.8867-2.5527 1.914l-.1406.3585c-.0283.0713.0215.1416.0986.1416h6.5977c.0771 0 .1474-.0489.169-.126.1122-.4082.1757-.837.1757-1.2803 0-2.6025-2.125-4.727-4.7344-4.727"
								/>
							</svg>
							Cloudflare
						</Link>{" "}
						in Austin, TX.
					</p>
					<p>
						Previously, I was a core maintainer of the{" "}
						<Link
							href="https://useworkflow.dev"
							target="_blank"
							rel="noopener noreferrer"
							className="link"
						>
							Workflow SDK
						</Link>{" "}
						at{" "}
						<Link
							href="https://vercel.com"
							target="_blank"
							rel="noopener noreferrer"
							className="link whitespace-nowrap"
						>
							<svg
								viewBox="0 1.608 24 20.784"
								className="mr-[0.3em] inline h-[0.71em] w-[0.82em]"
								fill="currentColor"
								aria-hidden="true"
							>
								<path d="m12 1.608 12 20.784H0Z" />
							</svg>
							Vercel
						</Link>
						, where I made all the framework integrations used today.
					</p>
				</section>

				<section>
					<p className="mb-4 text-sm text-muted-foreground">Projects</p>
					<ul>
						{featuredProjects.map((project) => (
							<li key={project.slug}>
								<Link
									href={`/projects/${project.slug}`}
									className="flex items-baseline gap-4 py-2 transition-opacity hover:opacity-70"
								>
									<span className="truncate sm:shrink-0">{project.name}</span>
									<span className="hidden min-w-0 truncate text-muted-foreground sm:block">
										{project.shortDescription || project.description}
									</span>
									<span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">
										{project.year}
									</span>
								</Link>
							</li>
						))}
					</ul>
					<Link
						href="/projects"
						className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						All projects
						<ArrowRight className="size-3.5" />
					</Link>
				</section>
			</div>
		</main>
	);
}
