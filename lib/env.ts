import { z } from "zod";

const envSchema = z.object({
	// R2 credentials — optional so builds succeed without them (CI, local dev without photos)
	CLOUDFLARE_ACCOUNT_ID: z.string().min(1).optional(),
	CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().min(1).optional(),
	CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),

	// Shared with the optimize-photos workflow to trigger /api/revalidate
	REVALIDATE_SECRET: z.string().min(1).optional(),

	// Automatically set by Vercel — optional for local dev and CI
	VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
	const result = envSchema.safeParse(process.env);

	if (!result.success) {
		const formatted = result.error.issues
			.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
			.join("\n");

		console.error(`\n❌ Invalid environment variables:\n${formatted}\n`);
		process.exit(1);
	}

	return result.data;
}

export const env = validateEnv();
