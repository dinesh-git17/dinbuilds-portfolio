import { memo } from "react";

export interface GridPatternProps {
	/** Grid cell size in pixels */
	size?: number;
	/** Pattern opacity (0-1), kept subtle per design spec */
	opacity?: number;
}

/**
 * Technical crosshair grid pattern overlay.
 * Creates a subtle engineering-style grid that reinforces
 * the "workspace" metaphor without visual noise.
 *
 * Uses SVG pattern for GPU-accelerated rendering.
 */
export const GridPattern = memo(function GridPattern({
	size = 32,
	opacity = 0.08,
}: GridPatternProps) {
	const patternId = "grid-pattern";

	return (
		<svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
			<defs>
				<pattern id={patternId} width={size} height={size} patternUnits="userSpaceOnUse">
					{/* Crosshair center dot */}
					<circle cx={size / 2} cy={size / 2} r={0.75} fill="currentColor" />

					{/* Horizontal tick */}
					<line
						x1={size / 2 - 2}
						y1={size / 2}
						x2={size / 2 + 2}
						y2={size / 2}
						stroke="currentColor"
						strokeWidth={0.5}
					/>

					{/* Vertical tick */}
					<line
						x1={size / 2}
						y1={size / 2 - 2}
						x2={size / 2}
						y2={size / 2 + 2}
						stroke="currentColor"
						strokeWidth={0.5}
					/>
				</pattern>
			</defs>

			<rect
				width="100%"
				height="100%"
				fill={`url(#${patternId})`}
				style={{ opacity }}
				className="text-white"
			/>
		</svg>
	);
});
