import type { Metadata } from "next";
import { Suspense } from "react";
import { PhotoGrid } from "@/components/photo-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { getPhotos } from "@/lib/photos";

export const revalidate = 3600;

export const metadata: Metadata = {
	title: "Photos",
	description: "Shot on a Lumix G85 with a 25mm F1.7 and 12-60mm.",
};

function PhotoGridSkeleton() {
	return (
		<div className="p-6 md:col-span-2 md:p-16 grid grid-cols-2 md:grid-cols-3 grid-flow-dense gap-4">
			{Array.from({ length: 6 }).map((_, i) => (
				<Skeleton
					// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton items
					key={i}
					className="rounded-none"
					style={
						i === 1
							? {
									gridColumn: "span 2",
									gridRow: "span 2",
									aspectRatio: "3 / 4",
								}
							: { aspectRatio: "3 / 4" }
					}
				/>
			))}
		</div>
	);
}

async function PhotoGridServer() {
	const photos = await getPhotos();
	return <PhotoGrid photos={photos} />;
}

export default function PhotosPage() {
	return (
		<main className="grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
			<div className="p-6 md:p-16">
				<div className="md:sticky md:top-16">
					<h1>Photos</h1>
					<p className="text-muted-foreground mt-2">
						A collection of photos I've taken over the years. I'm not a
						professional photographer, but I enjoy capturing moments.
					</p>
					<p className="mt-4">
						My photos are taken with a Panasonic Lumix G85 with a Panasonic
						Lumix G 25mm F1.7. lens but I've also recently upgraded to a
						Panasonic Lumix G Vario 12-60mm f/3.5-5.6.
					</p>
				</div>
			</div>
			<Suspense fallback={<PhotoGridSkeleton />}>
				<PhotoGridServer />
			</Suspense>
		</main>
	);
}
