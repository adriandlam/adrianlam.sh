/**
 * Photo Optimization Pipeline
 *
 * Downloads original photos from the "photos" R2 bucket,
 * optimizes them (resize + WebP conversion), generates blur
 * placeholders, and uploads to the "photos-optimized" bucket
 * with hashed filenames for clean public URLs.
 *
 * Idempotent: reads _manifest.json to determine which photos
 * have already been processed. Safe to run multiple times.
 *
 * Usage:
 *   node scripts/optimize-photos.ts           # process new photos only
 *   node scripts/optimize-photos.ts --force    # re-process all photos
 *   node scripts/optimize-photos.ts --clean    # wipe target bucket + re-process all
 */

import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import {
	DeleteObjectCommand,
	GetObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MAX_WIDTH = 1600;
const WEBP_QUALITY = 90;
const BLUR_SIZE = 16;
const BLUR_QUALITY = 20;
const HASH_LENGTH = 8;

const SOURCE_BUCKET = "photos";
const TARGET_BUCKET = "photos-optimized";

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp)$/i;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ManifestEntry {
	original: string;
	lastModified: string | null;
}

type Manifest = Record<string, ManifestEntry>;

// ---------------------------------------------------------------------------
// S3 Client
// ---------------------------------------------------------------------------

function getEnvOrThrow(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value;
}

const accountId = getEnvOrThrow("CLOUDFLARE_ACCOUNT_ID");
const accessKeyId = getEnvOrThrow("CLOUDFLARE_R2_ACCESS_KEY_ID");
const secretAccessKey = getEnvOrThrow("CLOUDFLARE_R2_SECRET_ACCESS_KEY");

const s3 = new S3Client({
	region: "auto",
	endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
	credentials: { accessKeyId, secretAccessKey },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a short hash from a filename */
function hashFilename(filename: string): string {
	return createHash("sha256")
		.update(filename)
		.digest("hex")
		.slice(0, HASH_LENGTH);
}

/** List all object keys in a bucket, handling pagination */
async function listBucketKeys(bucket: string): Promise<string[]> {
	const keys: string[] = [];
	let continuationToken: string | undefined;

	do {
		const response = await s3.send(
			new ListObjectsV2Command({
				Bucket: bucket,
				ContinuationToken: continuationToken,
			}),
		);

		if (response.Contents) {
			for (const obj of response.Contents) {
				if (obj.Key) keys.push(obj.Key);
			}
		}

		continuationToken = response.IsTruncated
			? response.NextContinuationToken
			: undefined;
	} while (continuationToken);

	return keys;
}

/** Download an object from R2 as a Buffer */
async function downloadObject(
	bucket: string,
	key: string,
): Promise<Buffer | null> {
	try {
		const response = await s3.send(
			new GetObjectCommand({ Bucket: bucket, Key: key }),
		);
		if (!response.Body) return null;
		const bytes = await response.Body.transformToByteArray();
		return Buffer.from(bytes);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`  Failed to download ${key}: ${message}`);
		return null;
	}
}

/** Upload a buffer to R2 */
async function uploadObject(
	bucket: string,
	key: string,
	body: Buffer,
	contentType: string,
): Promise<void> {
	await s3.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: body,
			ContentType: contentType,
		}),
	);
}

/** Delete an object from R2 */
async function deleteObject(bucket: string, key: string): Promise<void> {
	await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/** Download the existing manifest from the target bucket */
async function downloadManifest(): Promise<Manifest> {
	try {
		const response = await s3.send(
			new GetObjectCommand({
				Bucket: TARGET_BUCKET,
				Key: "_manifest.json",
			}),
		);
		if (!response.Body) return {};
		const text = await response.Body.transformToString();
		return JSON.parse(text) as Manifest;
	} catch {
		return {};
	}
}

/** Upload the manifest to the target bucket */
async function uploadManifest(manifest: Manifest): Promise<void> {
	const json = JSON.stringify(manifest, null, 2);
	await uploadObject(
		TARGET_BUCKET,
		"_manifest.json",
		Buffer.from(json, "utf-8"),
		"application/json",
	);
}

/** Optimize an image: resize to max width + convert to WebP */
async function optimizeImage(buffer: Buffer): Promise<Buffer> {
	const metadata = await sharp(buffer).metadata();

	const resizeOptions =
		metadata.width && metadata.width > MAX_WIDTH
			? { width: MAX_WIDTH, withoutEnlargement: true as const }
			: {};

	return sharp(buffer)
		.resize(resizeOptions)
		.webp({ quality: WEBP_QUALITY })
		.toBuffer();
}

/** Generate a tiny blur placeholder as a base64 data URL */
async function generateBlurDataURL(buffer: Buffer): Promise<string> {
	const blurred = await sharp(buffer)
		.resize(BLUR_SIZE, BLUR_SIZE, { fit: "inside" })
		.blur()
		.webp({ quality: BLUR_QUALITY })
		.toBuffer();

	return `data:image/webp;base64,${blurred.toString("base64")}`;
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	const cleanMode = process.argv.includes("--clean");
	const forceMode = process.argv.includes("--force") || cleanMode;
	const startTime = Date.now();

	console.log("Photo Optimization Pipeline");
	console.log("===========================\n");

	// 0. Clean target bucket if requested
	if (cleanMode) {
		console.log("Clean mode: wiping target bucket...");
		const targetKeys = await listBucketKeys(TARGET_BUCKET);
		if (targetKeys.length > 0) {
			for (const key of targetKeys) {
				await deleteObject(TARGET_BUCKET, key);
			}
			console.log(`  Deleted ${targetKeys.length} objects\n`);
		} else {
			console.log("  Bucket already empty\n");
		}
	}

	// 1. List source bucket
	console.log(`Listing source bucket: ${SOURCE_BUCKET}`);
	const sourceKeys = await listBucketKeys(SOURCE_BUCKET);
	const imageKeys = sourceKeys.filter((key) => IMAGE_EXTENSIONS.test(key));
	console.log(`  Found ${imageKeys.length} images\n`);

	// 2. Get last-modified dates for source images
	const sourceMeta = new Map<string, string | null>();
	for (const key of imageKeys) {
		try {
			const response = await s3.send(
				new ListObjectsV2Command({
					Bucket: SOURCE_BUCKET,
					Prefix: key,
					MaxKeys: 1,
				}),
			);
			const obj = response.Contents?.[0];
			sourceMeta.set(key, obj?.LastModified?.toISOString() ?? null);
		} catch {
			sourceMeta.set(key, null);
		}
	}

	// 3. Download existing manifest (or start fresh if clean mode)
	const manifest: Manifest = cleanMode ? {} : await downloadManifest();
	const processedOriginals = new Set(
		Object.values(manifest).map((e) => e.original),
	);

	console.log(`Existing manifest: ${Object.keys(manifest).length} entries\n`);

	// 4. Determine which photos to process
	const toProcess = forceMode
		? imageKeys
		: imageKeys.filter((key) => !processedOriginals.has(key));

	if (toProcess.length === 0) {
		console.log("No new photos to process. Everything is up to date.");
		return;
	}

	console.log(
		`${forceMode ? "Force mode: processing" : "Processing"} ${toProcess.length} photo(s):\n`,
	);

	// 5. Check for hash collisions
	const hashMap = new Map<string, string>();
	for (const key of imageKeys) {
		const hash = hashFilename(key);
		const existing = hashMap.get(hash);
		if (existing && existing !== key) {
			console.error(
				`Hash collision detected: ${key} and ${existing} both hash to ${hash}`,
			);
			process.exit(1);
		}
		hashMap.set(hash, key);
	}

	// 6. Process each photo
	let totalOriginalSize = 0;
	let totalOptimizedSize = 0;
	let successCount = 0;
	let failCount = 0;

	for (let i = 0; i < toProcess.length; i++) {
		const key = toProcess[i];
		const hash = hashFilename(key);
		const webpKey = `${hash}.webp`;
		const blurKey = `${hash}.blur.txt`;

		console.log(`[${i + 1}/${toProcess.length}] ${key} → ${hash}`);

		// Download original
		const original = await downloadObject(SOURCE_BUCKET, key);
		if (!original) {
			console.log("  Skipped (download failed)");
			failCount++;
			continue;
		}

		const originalSize = original.length;
		totalOriginalSize += originalSize;

		try {
			// Optimize
			const optimized = await optimizeImage(original);
			totalOptimizedSize += optimized.length;

			// Generate blur placeholder
			const blurDataURL = await generateBlurDataURL(original);

			// Upload optimized image
			await uploadObject(TARGET_BUCKET, webpKey, optimized, "image/webp");

			// Upload blur placeholder
			await uploadObject(
				TARGET_BUCKET,
				blurKey,
				Buffer.from(blurDataURL, "utf-8"),
				"text/plain",
			);

			// Update manifest
			manifest[hash] = {
				original: key,
				lastModified: sourceMeta.get(key) ?? null,
			};

			const savings = (
				((originalSize - optimized.length) / originalSize) *
				100
			).toFixed(1);
			console.log(
				`  ${formatBytes(originalSize)} → ${formatBytes(optimized.length)} (${savings}% smaller)`,
			);
			successCount++;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`  Failed to process: ${message}`);
			failCount++;
		}

		// Allow GC between photos
		if (global.gc) global.gc();
	}

	// 7. Upload updated manifest
	console.log("\nUploading manifest...");
	await uploadManifest(manifest);
	console.log(`  Manifest saved with ${Object.keys(manifest).length} entries`);

	// 8. Summary
	const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
	const totalSavings =
		totalOriginalSize > 0
			? (
					((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) *
					100
				).toFixed(1)
			: "0";

	console.log("\n===========================");
	console.log("Summary");
	console.log("===========================");
	console.log(`Processed:  ${successCount} photos`);
	if (failCount > 0) console.log(`Failed:     ${failCount} photos`);
	console.log(`Original:   ${formatBytes(totalOriginalSize)}`);
	console.log(`Optimized:  ${formatBytes(totalOptimizedSize)}`);
	console.log(`Saved:      ${totalSavings}%`);
	console.log(`Time:       ${elapsed}s`);

	// Write GitHub Actions step summary if available
	const summaryFile = process.env.GITHUB_STEP_SUMMARY;
	if (summaryFile) {
		const summary = [
			"## Photo Optimization Results\n",
			"| Metric | Value |",
			"| --- | --- |",
			`| Photos processed | ${successCount} |`,
			failCount > 0 ? `| Failed | ${failCount} |` : "",
			`| Original size | ${formatBytes(totalOriginalSize)} |`,
			`| Optimized size | ${formatBytes(totalOptimizedSize)} |`,
			`| Size reduction | ${totalSavings}% |`,
			`| Time | ${elapsed}s |`,
		]
			.filter(Boolean)
			.join("\n");

		await writeFile(summaryFile, summary, "utf-8");
	}

	if (failCount > 0) {
		process.exit(1);
	}
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
