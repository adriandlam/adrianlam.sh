# adrianlam.sh

My personal site. Blog, projects, photos.

## Stack

- [Next.js](https://nextjs.org) (App Router)
- [MDX](https://mdxjs.com) for blog and project write-ups
- [Tailwind CSS](https://tailwindcss.com) v4 with Vesper theme
- [Vercel](https://vercel.com) for hosting
- [Cloudflare R2](https://developers.cloudflare.com/r2/) for photos
 ## Running locally

```bash
pnpm install
pnpm dev
```

## Content

- Blog posts → `content/blog/*.mdx`
- Projects → `content/projects/*.mdx`

## Environment variables

Required for the photos page:

```
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
```

Optional (defaults to `https://adriandlam.com`):

```
NEXT_PUBLIC_URL=
```

## License

[LICENSE](LICENSE)
