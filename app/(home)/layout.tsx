import Image from "next/image";
import me from "@/public/me.jpeg";

export default function HomeLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			<div className="mb-10 flex items-center gap-6">
				<Image src={me} alt="Adrian Lam" className="size-16" priority />
				<h1>Adrian Lam</h1>
			</div>
			<div className="border">{children}</div>
		</>
	);
}
