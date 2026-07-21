import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ViewTransitions } from "next-view-transitions";
import Footer from "@/components/footer";
import Nav from "@/components/nav";
import { TickNav } from "@/components/tick-nav";
import { getBlogPostsForNav } from "@/lib/blog";
import { SITE_URL } from "@/lib/constants";
import { getProjectsForNav } from "@/lib/projects";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: "Adrian Lam",
		template: "%s | Adrian Lam",
	},
	description:
		"Software engineer, math student at UBC, and incoming intern at Cloudflare. Building things on the web.",
	alternates: {
		types: {
			"application/rss+xml": "/feed",
		},
	},
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const [blogPosts, projects] = await Promise.all([
		getBlogPostsForNav(),
		getProjectsForNav(),
	]);

	return (
		<ViewTransitions>
			<html
				lang="en"
				data-scroll-behavior="smooth"
				className={`${geistSans.variable} ${geistMono.variable} dark`}
			>
				<body className="antialiased">
					<a
						href="#main-content"
						className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
					>
						Skip to main content
					</a>
					<div className="mt-12 max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto">
						<TickNav />
						{/*<Nav blogPosts={blogPosts} projects={projects} />*/}
						<div
							id="main-content"
							tabIndex={-1}
							style={{ viewTransitionName: "page-content" }}
						>
							{children}
						</div>
						<Footer />
					</div>
					<Analytics />
					<SpeedInsights />
				</body>
			</html>
		</ViewTransitions>
	);
}
