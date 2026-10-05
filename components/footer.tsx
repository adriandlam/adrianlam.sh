import Link from "next/link";

export default function Footer() {
	return (
		<footer className="my-16 flex justify-center gap-4 text-sm text-muted-foreground">
			<Link href="/feed" className="transition-colors hover:text-foreground">
				RSS
			</Link>
			<Link
				href="https://github.com/adriandlam/adriandlamcom"
				target="_blank"
				rel="noopener noreferrer"
				className="transition-colors hover:text-foreground"
			>
				Source
			</Link>
		</footer>
	);
}
