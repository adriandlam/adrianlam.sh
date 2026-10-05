import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ViewTransitions } from "next-view-transitions";
import Footer from "@/components/footer";
import { TickNav } from "@/components/tick-nav";
import { SITE_URL } from "@/lib/constants";

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
		"Software engineer and math student at UBC. Previously at Cloudflare and Vercel.",
	alternates: {
		types: {
			"application/rss+xml": "/feed",
		},
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
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
					<div className="mt-24 px-6 lg:mt-12 max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
						<TickNav />
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
