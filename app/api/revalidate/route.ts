import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { env } from "@/lib/env";

// Hashing first gives equal-length buffers for timingSafeEqual
const digest = (s: string) => createHash("sha256").update(s).digest();

// Called by the optimize-photos workflow after new photos are uploaded
export async function POST(request: Request) {
	const secret = env.REVALIDATE_SECRET;
	const auth = request.headers.get("authorization") ?? "";
	if (!secret || !timingSafeEqual(digest(auth), digest(`Bearer ${secret}`))) {
		return new Response("Unauthorized", { status: 401 });
	}

	// expire: 0 drops the cached manifest and the /photos page immediately
	revalidateTag("photos", { expire: 0 });
	return Response.json({ revalidated: true });
}
