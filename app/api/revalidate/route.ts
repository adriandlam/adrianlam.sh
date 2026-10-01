import { revalidateTag } from "next/cache";
import { env } from "@/lib/env";

// Called by the optimize-photos workflow after new photos are uploaded
export async function POST(request: Request) {
	const secret = env.REVALIDATE_SECRET;
	if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
		return new Response("Unauthorized", { status: 401 });
	}

	// expire: 0 drops the cached manifest and the /photos page immediately
	revalidateTag("photos", { expire: 0 });
	return Response.json({ revalidated: true });
}
