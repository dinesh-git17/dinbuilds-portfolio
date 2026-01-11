import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
	generateProfilePageSchema,
	generateWebSiteSchema,
	renderJsonLd,
	SiteIndex,
} from "@/lib/seo";
import "./globals.css";

/**
 * Viewport configuration for mobile OS experience.
 * - Prevents iOS zoom on input focus (requires user-scalable=no + max-scale=1)
 * - Uses interactive-widget=resizes-content for proper virtual keyboard handling
 */
export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	interactiveWidget: "resizes-content",
};

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
	display: "swap",
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = {
	metadataBase: new URL("https://dineshd.dev"),
	title: {
		default: "Dinesh Dawonauth | Data Engineer",
		template: "%s | DinBuilds OS",
	},
	other: {
		"color-scheme": "dark",
	},
	description:
		"Data Engineer specializing in building scalable data pipelines, ETL workflows, and analytics infrastructure. Turning raw data into actionable insights.",
	icons: {
		icon: [
			{ url: "/assets/web_assets/favicon.ico", sizes: "any" },
			{ url: "/assets/web_assets/favicon.svg", type: "image/svg+xml" },
			{ url: "/assets/web_assets/favicon-96x96.png", sizes: "96x96", type: "image/png" },
		],
		apple: "/assets/web_assets/apple-touch-icon.png",
	},
	manifest: "/manifest.json",
	openGraph: {
		type: "website",
		locale: "en_US",
		siteName: "Dinesh Dawonauth | DinBuilds OS",
		title: "Dinesh Dawonauth | Data Engineer",
		description:
			"Data Engineer specializing in building scalable data pipelines, ETL workflows, and analytics infrastructure. Turning raw data into actionable insights.",
		images: [
			{
				url: "/assets/web_assets/og.png",
				width: 1200,
				height: 630,
				alt: "Dinesh Dawonauth - DinBuilds OS Portfolio",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Dinesh Dawonauth | Data Engineer",
		description:
			"Data Engineer specializing in building scalable data pipelines, ETL workflows, and analytics infrastructure. Turning raw data into actionable insights.",
		images: ["/assets/web_assets/og.png"],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const profileSchema = generateProfilePageSchema();
	const webSiteSchema = generateWebSiteSchema();

	return (
		<html lang="en">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				{/* Hidden site index for crawler discovery (SEO Story 4) */}
				<SiteIndex baseUrl="https://dineshd.dev" />
				{children}
				<Analytics />
				{/* Schema.org JSON-LD for Person & ProfilePage */}
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: renderJsonLd(profileSchema) }}
				/>
				{/* Schema.org JSON-LD for WebSite (Story 5) */}
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: renderJsonLd(webSiteSchema) }}
				/>
			</body>
		</html>
	);
}
