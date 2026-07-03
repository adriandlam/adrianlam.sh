import Link from "next/link";
import { ExternalLinkIcon } from "./external-link-icon";

export default function Footer() {
	return (
		<footer className="my-10">
			<div className="flex justify-between items-center">
				<p>
					<span className="opacity-75">Adrian Lam (</span>
					<Link
						href="https://x.com/adriandlam_"
						className="link inline-flex gap-0.5"
					>
						@adriandlam_
						<ExternalLinkIcon className="mt-0.5 size-3" />
					</Link>
					<span className="opacity-75">)</span>
				</p>
				<div className="flex items-center gap-2">
					<Link href="/feed" className="link font-mono">
						RSS
					</Link>
					<Link
						href="https://github.com/adriandlam/adriandlamcom"
						className="link inline-flex gap-0.5"
					>
						Source
						<ExternalLinkIcon className="mt-0.5 size-3" />
					</Link>
				</div>
			</div>
		</footer>
	);
}
