import { memo } from "react";

export interface VignetteProps {
	/** Intensity of the edge darkening (0-1) */
	intensity?: number;
}

/**
 * Cinematic vignette overlay.
 * Darkens edges using a radial gradient to naturally
 * draw focus toward the center of the viewport.
 *
 * Uses CSS only for optimal performance.
 */
export const Vignette = memo(function Vignette({ intensity = 0.6 }: VignetteProps) {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-0"
			style={{
				background: `radial-gradient(
					ellipse 80% 60% at 50% 50%,
					transparent 0%,
					transparent 40%,
					rgba(0, 0, 0, ${intensity * 0.3}) 70%,
					rgba(0, 0, 0, ${intensity}) 100%
				)`,
			}}
		/>
	);
});
