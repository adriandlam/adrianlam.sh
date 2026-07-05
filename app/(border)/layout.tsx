export default function HomeLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <div className="border">{children}</div>;
}
