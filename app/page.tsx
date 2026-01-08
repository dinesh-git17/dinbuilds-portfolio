export default function Home() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-8">
			<h1 className="text-4xl font-bold text-foreground">Spatial OS</h1>
			<p className="text-foreground-muted">dinbuilds-portfolio infrastructure ready</p>

			{/* Theme Token Verification */}
			<div className="flex flex-col gap-4 rounded-lg border border-border bg-background-surface p-6">
				<h2 className="text-lg font-semibold text-foreground">Theme Tokens</h2>
				<div className="flex gap-2">
					<div className="h-8 w-8 rounded-md bg-background" title="background" />
					<div className="h-8 w-8 rounded-md bg-background-elevated" title="elevated" />
					<div className="h-8 w-8 rounded-md bg-background-surface" title="surface" />
					<div className="h-8 w-8 rounded-md bg-background-overlay" title="overlay" />
				</div>
				<div className="flex gap-2">
					<div className="h-8 w-8 rounded-md bg-accent" title="accent" />
					<div className="h-8 w-8 rounded-md bg-accent-hover" title="accent-hover" />
					<div className="h-8 w-8 rounded-md bg-accent-muted" title="accent-muted" />
				</div>
			</div>

			<p className="text-sm text-foreground-subtle">Next.js 16 + React 19 + Tailwind v4 + Biome</p>
		</div>
	);
}
