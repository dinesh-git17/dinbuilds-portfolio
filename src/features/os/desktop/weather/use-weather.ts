"use client";

/**
 * useWeather — Open-Meteo Weather Data Hook
 *
 * Fetches current weather conditions for Toronto from the Open-Meteo API.
 * Designed for the desktop widget with automatic revalidation.
 *
 * Features:
 * - No API key required (Open-Meteo is free)
 * - Hardcoded to Toronto for privacy
 * - Auto-revalidates every 15 minutes
 * - Graceful error handling (never crashes the desktop)
 */

import { useEffect, useRef, useState } from "react";

import { type UseWeatherReturn, WEATHER_CONFIG, WEATHER_LOCATION, type WeatherData } from "./types";

/**
 * Open-Meteo API response structure (partial).
 * Only includes fields we consume.
 */
interface OpenMeteoResponse {
	current: {
		temperature_2m: number;
		weather_code: number;
		is_day: 0 | 1;
	};
}

/**
 * Build the API URL with query parameters.
 */
function buildApiUrl(): string {
	const params = new URLSearchParams({
		latitude: WEATHER_LOCATION.latitude.toString(),
		longitude: WEATHER_LOCATION.longitude.toString(),
		current: "temperature_2m,weather_code,is_day",
		timezone: WEATHER_LOCATION.timezone,
	});

	return `${WEATHER_CONFIG.API_BASE}?${params.toString()}`;
}

/**
 * Parse the API response into our internal format.
 * Validates structure to prevent runtime errors.
 */
function parseResponse(json: unknown): WeatherData {
	const response = json as OpenMeteoResponse;

	if (
		!response.current ||
		typeof response.current.temperature_2m !== "number" ||
		typeof response.current.weather_code !== "number" ||
		typeof response.current.is_day !== "number"
	) {
		throw new Error("Invalid API response structure");
	}

	return {
		temp: Math.round(response.current.temperature_2m),
		code: response.current.weather_code,
		isDay: response.current.is_day === 1,
	};
}

/**
 * Fetch current weather data from Open-Meteo.
 *
 * @returns Promise resolving to weather data
 * @throws Error if fetch fails or response is invalid
 */
async function fetchWeather(): Promise<WeatherData> {
	const response = await fetch(buildApiUrl(), {
		// Cache for 15 minutes on the edge
		next: { revalidate: WEATHER_CONFIG.REVALIDATE_INTERVAL / 1000 },
	});

	if (!response.ok) {
		throw new Error(`Weather API error: ${response.status}`);
	}

	const json: unknown = await response.json();
	return parseResponse(json);
}

/**
 * Extract error message from unknown error.
 */
function getErrorMessage(err: unknown): string {
	return err instanceof Error ? err.message : "Failed to fetch weather";
}

/**
 * State updater callbacks for the fetch effect.
 */
interface FetchCallbacks {
	onSuccess: (weather: WeatherData) => void;
	onError: (message: string, hasExistingData: boolean) => void;
	onComplete: () => void;
}

/**
 * Create the fetch function with state callbacks.
 * Extracted to reduce cognitive complexity.
 */
function createFetchHandler(callbacks: FetchCallbacks, hasDataRef: React.RefObject<boolean>) {
	return async function executeFetch() {
		try {
			const weather = await fetchWeather();
			callbacks.onSuccess(weather);
		} catch (err) {
			callbacks.onError(getErrorMessage(err), hasDataRef.current ?? false);
		} finally {
			callbacks.onComplete();
		}
	};
}

/**
 * useWeather — Hook for fetching live weather data.
 *
 * Fetches on mount and revalidates at a configurable interval.
 * Returns loading/error states for UI handling.
 *
 * @returns Weather data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useWeather();
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <OfflineIndicator />;
 *
 * return <Temperature value={data.temp} />;
 * ```
 */
export function useWeather(): UseWeatherReturn {
	const [data, setData] = useState<WeatherData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const hasDataRef = useRef(false);

	useEffect(() => {
		let isMounted = true;

		const callbacks: FetchCallbacks = {
			onSuccess: (weather) => {
				if (!isMounted) return;
				setData(weather);
				setError(null);
				hasDataRef.current = true;
			},
			onError: (message, hasExistingData) => {
				if (!isMounted) return;
				// Keep stale data visible on revalidation failure
				if (!hasExistingData) setError(message);
			},
			onComplete: () => {
				if (!isMounted) return;
				setIsLoading(false);
			},
		};

		const fetchData = createFetchHandler(callbacks, hasDataRef);

		fetchData();
		const intervalId = setInterval(fetchData, WEATHER_CONFIG.REVALIDATE_INTERVAL);

		return () => {
			isMounted = false;
			clearInterval(intervalId);
		};
	}, []);

	return { data, isLoading, error };
}
