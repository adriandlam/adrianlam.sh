import type { Metadata } from "next";
import { TransitionLink } from "@/components/transition-link";
import { type BlogPost, getBlogPosts } from "@/lib/blog";
import { formatDateShort } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
	title: "Blog",
	description:
		"Writing on software, machine learning, and whatever's on my mind.",
};

export default async function BlogPage() {
	const posts = await getBlogPosts();

	return (
		<main className="grid grid-cols-3 divide-x">
			<div className="p-16 sticky top-0 self-start">
				<h1>Blog</h1>
				<p className="mt-2 text-muted-foreground">
					A collection of articles and thoughts on software development and who
					I am as a person.
				</p>
			</div>
			<div className="p-16 col-span-2 space-y-16">
				{posts.map((post: BlogPost) => (
					<div
						key={post.slug}
						className="relative h-80 overflow-hidden hover:brightness-150 transition duration-200 ease-out"
					>
						<Skeleton className="h-full w-full" />
						<div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-linear-to-t from-background to-transparent" />
						<TransitionLink
							href={`/blog/${post.slug}`}
							direction="left"
							className="absolute inset-0 z-10"
							aria-label={`Read blog post: ${post.title}`}
						/>
						<div className="absolute inset-x-0 bottom-0 space-y-1 p-6">
							<span className="block line-clamp-1 text-2xl">{post.title}</span>
							<span className="block line-clamp-2 text-muted-foreground text-sm">
								{post.summary}
							</span>
							<span className="block text-muted-foreground text-sm font-mono">
								{formatDateShort(post.publishedAt)}
							</span>
						</div>
					</div>
					// <tr
					//   key={post.slug}
					//   className="hover:bg-muted/50 transition-colors relative group"
					// >
					//   <td className="py-2.5 px-0 text-sm text-muted-foreground whitespace-nowrap font-mono w-24">
					//     {formatDateShort(post.publishedAt)}
					//   </td>
					//   <td className="py-2.5 px-6">
					//     <TransitionLink
					//       href={`/blog/${post.slug}`}
					//       direction="left"
					//       className="absolute inset-0 z-10"
					//       aria-label={`Read blog post: ${post.title}`}
					//     />
					//     <span className="line-clamp-1">{post.title}</span>
					//   </td>
					//   <td className="py-2.5 px-4 text-sm text-muted-foreground hidden md:table-cell w-72">
					//     <span className="line-clamp-1">{post.summary}</span>
					//   </td>
					// </tr>
				))}
			</div>
			{/*<table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th
              scope="col"
              className="text-left py-2 px-0 text-xs text-muted-foreground font-normal font-mono tracking-wide w-24"
            >
              date
            </th>
            <th
              scope="col"
              className="text-left py-2 px-6 text-xs text-muted-foreground font-normal font-mono tracking-wide"
            >
              title
            </th>
            <th
              scope="col"
              className="text-left py-2 px-4 text-xs text-muted-foreground font-normal hidden md:table-cell font-mono tracking-wide w-72"
            >
              summary
            </th>
            {/* TODO: add views */}
			{/* <th className="text-left py-2 px-4 text-sm text-muted-foreground/65 font-normal">
              views
            </th> */}
			{/*</tr>
        </thead>
        <tbody className="divide-y divide-border">
          {posts.map((post: BlogPost) => (
            <tr
              key={post.slug}
              className="hover:bg-muted/50 transition-colors relative group"
            >
              <td className="py-2.5 px-0 text-sm text-muted-foreground whitespace-nowrap font-mono w-24">
                {formatDateShort(post.publishedAt)}
              </td>
              <td className="py-2.5 px-6">
                <TransitionLink
                  href={`/blog/${post.slug}`}
                  direction="left"
                  className="absolute inset-0 z-10"
                  aria-label={`Read blog post: ${post.title}`}
                />
                <span className="line-clamp-1">{post.title}</span>
              </td>
              <td className="py-2.5 px-4 text-sm text-muted-foreground hidden md:table-cell w-72">
                <span className="line-clamp-1">{post.summary}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>*/}
		</main>
	);
}
