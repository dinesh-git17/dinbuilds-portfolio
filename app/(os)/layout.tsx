/**
 * OS Route Group Layout — SEO-02 Story 2
 *
 * Layout for the OS route group. All routes under (os) share this layout.
 * Each route handles its own server-side state hydration.
 */

export default function OSLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return children;
}
