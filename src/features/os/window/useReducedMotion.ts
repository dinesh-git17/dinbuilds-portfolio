"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect user's reduced motion preference.
 * Returns true if the user prefers reduced motion.
 *
 * Per WCAG AA guidelines, we must respect this preference
 * by disabling fly-in animations and morph effects.
 */
export function useReducedMotion(): boolean {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

		// Set initial value
		setPrefersReducedMotion(mediaQuery.matches);

		// Listen for changes
		const handleChange = (event: MediaQueryListEvent) => {
			setPrefersReducedMotion(event.matches);
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	return prefersReducedMotion;
}
