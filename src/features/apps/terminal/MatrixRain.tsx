"use client";

/**
 * Matrix Rain Effect
 *
 * Canvas-based digital rain animation inspired by The Matrix.
 */

import { memo, useEffect, useRef } from "react";

export interface MatrixRainProps {
	/** Duration in milliseconds before auto-stopping */
	duration: number;
	/** Callback when animation completes */
	onComplete: () => void;
}

/** Characters used in the rain effect */
const MATRIX_CHARS =
	"アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789";

/** Font size for characters */
const FONT_SIZE = 14;

export const MatrixRain = memo(function MatrixRain({ duration, onComplete }: MatrixRainProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Set canvas size to container
		const resizeCanvas = () => {
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
		};
		resizeCanvas();

		const columns = Math.floor(canvas.width / FONT_SIZE);
		const drops: number[] = Array.from({ length: columns }, () => Math.random() * -100);

		const draw = () => {
			// Semi-transparent black to create trail effect
			ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.fillStyle = "#0f0";
			ctx.font = `${FONT_SIZE}px monospace`;

			for (let i = 0; i < drops.length; i++) {
				const charIndex = Math.floor(Math.random() * MATRIX_CHARS.length);
				const char = MATRIX_CHARS[charIndex] ?? "0";
				const x = i * FONT_SIZE;
				const dropY = drops[i] ?? 0;
				const y = dropY * FONT_SIZE;

				ctx.fillText(char, x, y);

				// Reset drop to top with random delay
				if (y > canvas.height && Math.random() > 0.975) {
					drops[i] = 0;
				}

				drops[i] = dropY + 1;
			}
		};

		const intervalId = setInterval(draw, 33); // ~30fps

		// Stop after duration
		const timeoutId = setTimeout(() => {
			clearInterval(intervalId);
			onComplete();
		}, duration);

		return () => {
			clearInterval(intervalId);
			clearTimeout(timeoutId);
		};
	}, [duration, onComplete]);

	return (
		<canvas
			ref={canvasRef}
			className="absolute inset-0 h-full w-full bg-black"
			tabIndex={-1}
			aria-hidden="true"
		/>
	);
});
