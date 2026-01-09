/**
 * Weather Widget Type Definitions
 *
 * Defines the type system for the weather data layer.
 * Uses Open-Meteo API response structure as the source of truth.
 */

import type { ComponentType, SVGProps } from "react";

/**
 * Raw weather data from Open-Meteo API.
 * Subset of the full API response.
 */
export interface WeatherData {
	/** Current temperature in Celsius */
	temp: number;
	/** WMO Weather interpretation code (0-99) */
	code: number;
	/** Day/night indicator from API */
	isDay: boolean;
}

/**
 * Weather hook return type.
 * Provides loading/error states alongside data.
 */
export interface UseWeatherReturn {
	/** Weather data when available */
	data: WeatherData | null;
	/** Loading state during initial fetch */
	isLoading: boolean;
	/** Error message if fetch failed */
	error: string | null;
}

/**
 * Weather theme identifiers.
 * Maps to distinct visual treatments.
 */
export type WeatherTheme = "clear-day" | "clear-night" | "cloudy" | "precipitation";

/**
 * Visual configuration for a weather theme.
 * Drives the widget's gradient and icon.
 */
export interface WeatherThemeConfig {
	/** Theme identifier */
	id: WeatherTheme;
	/** Tailwind gradient classes (from-* to-*) */
	gradient: string;
	/** Lucide icon component */
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	/** Accessible description of weather condition */
	label: string;
}

/**
 * Open-Meteo API location configuration.
 * Hardcoded to Toronto for privacy.
 */
export const WEATHER_LOCATION = {
	latitude: 43.65,
	longitude: -79.38,
	timezone: "America/Toronto",
	city: "Toronto",
} as const;

/**
 * API configuration constants.
 */
export const WEATHER_CONFIG = {
	/** Revalidation interval in milliseconds (15 minutes) */
	REVALIDATE_INTERVAL: 15 * 60 * 1000,
	/** API endpoint base URL */
	API_BASE: "https://api.open-meteo.com/v1/forecast",
} as const;
