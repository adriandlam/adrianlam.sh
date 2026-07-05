import {
	transformerNotationDiff,
	transformerNotationFocus,
	transformerNotationHighlight,
} from "@shikijs/transformers";
import Image from "next/image";
import Link from "next/link";
import { rehypeAccessibleEmojis } from "rehype-accessible-emojis";
import rehypeExternalLinks from "rehype-external-links";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeUnwrapImages from "rehype-unwrap-images";
import remarkDirective from "remark-directive";
import remarkGemoji from "remark-gemoji";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRemoveComments from "remark-remove-comments";
import remarkSmartyPants from "remark-smartypants";
import * as CalloutComponents from "@/components/callout";
import { ExternalLinkIcon } from "@/components/external-link-icon";
import { ConfusionMatrix } from "@/components/mnist-demo/confusion-matrix";
import { MnistDemo } from "@/components/mnist-demo/mnist-demo";
import { SampleGrid } from "@/components/mnist-demo/sample-grid";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { rehypeImageSize } from "@/lib/rehype-image-size";

function createHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
	// biome-ignore lint/suspicious/noExplicitAny: MDX component props are untyped
	const Heading = ({ children, id, ...props }: any) => {
		// biome-ignore lint/suspicious/noExplicitAny: dynamic heading tag
		const Tag = `h${level}` as any;
		return (
			<Tag id={id} className="group/heading" {...props}>
				{id ? (
					<a href={`#${id}`} className="heading-anchor">
						{children}
						<span className="heading-hash" aria-hidden="true">
							#
						</span>
					</a>
				) : (
					children
				)}
			</Tag>
		);
	};
	Heading.displayName = `Heading${level}`;
	return Heading;
}

export const mdxComponents = {
	MnistDemo,
	SampleGrid,
	ConfusionMatrix,
	...CalloutComponents,
	h2: createHeading(2),
	h3: createHeading(3),
	h4: createHeading(4),
	h5: createHeading(5),
	h6: createHeading(6),
	// biome-ignore lint/suspicious/noExplicitAny: MDX component props are untyped
	img: ({ src, alt, ...props }: any) => {
		const imageSrc = src?.startsWith("/") ? src : `/${src}`;

		return (
			<div className="my-6">
				<Image
					src={imageSrc}
					alt={alt || ""}
					width={800}
					height={500}
					className="rounded-lg mx-auto"
					sizes="(max-width: 768px) 100vw, 800px"
					quality={85}
					{...props}
				/>
				{alt && (
					<p className="text-sm text-center text-muted-foreground mt-2">
						{alt}
					</p>
				)}
			</div>
		);
	},
	hr: () => <hr className="my-8 border-border" />,
	a: ({ children, href }: { children: React.ReactNode; href: string }) => (
		<Link href={href} className="link inline-flex gap-0.5">
			{children}
			{!(href.startsWith("/") || href.startsWith("#")) && <ExternalLinkIcon />}
		</Link>
	),
	ul: ({ children }: { children: React.ReactNode }) => (
		<ul className="list">{children}</ul>
	),
	ol: ({ children }: { children: React.ReactNode }) => (
		<ol className="list">{children}</ol>
	),
	p: ({ children }: { children: React.ReactNode }) => (
		<p className="text-foreground leading-relaxed mb-4">{children}</p>
	),
	blockquote: ({ children }: { children: React.ReactNode }) => (
		<blockquote className="border-l-2 border-accent-foreground pl-4.5 pr-4 py-4 my-4 [&>p]:mb-0 [&>p]:text-muted-foreground [&>p]:text-[15px]">
			{children}
		</blockquote>
	),
	table: ({ children }: { children: React.ReactNode }) => (
		<Table className="my-6">{children}</Table>
	),
	thead: ({ children }: { children: React.ReactNode }) => (
		<TableHeader>{children}</TableHeader>
	),
	tbody: ({ children }: { children: React.ReactNode }) => (
		<TableBody>{children}</TableBody>
	),
	tr: ({ children }: { children: React.ReactNode }) => (
		<TableRow>{children}</TableRow>
	),
	th: ({ children }: { children: React.ReactNode }) => (
		<TableHead>{children}</TableHead>
	),
	td: ({ children }: { children: React.ReactNode }) => (
		<TableCell>{children}</TableCell>
	),
};

export const mdxOptions = {
	remarkPlugins: [
		remarkMath,
		remarkGfm,
		remarkSmartyPants,
		remarkDirective,
		remarkGemoji,
		remarkRemoveComments,
	],
	rehypePlugins: [
		rehypeKatex,
		rehypeSlug,
		[
			rehypePrettyCode,
			{
				theme: "vesper",
				keepBackground: false,
				transformers: [
					transformerNotationDiff({ matchAlgorithm: "v3" }),
					transformerNotationHighlight({ matchAlgorithm: "v3" }),
					transformerNotationFocus({ matchAlgorithm: "v3" }),
				],
			},
		],
		[
			rehypeExternalLinks,
			{
				target: "_blank",
				rel: ["noopener", "noreferrer"],
			},
		],
		rehypeImageSize,
		rehypeUnwrapImages,
		rehypeAccessibleEmojis,
	],
};
