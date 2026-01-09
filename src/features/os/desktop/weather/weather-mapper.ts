/**
 * WMO Weather Code Mapper
 *
 * Translates Open-Meteo WMO weather interpretation codes into
 * visual themes (gradients, icons, labels) for the widget.
 *
 * @see https://open-meteo.com/en/docs#weathervariables
 */

import { Cloud, CloudRain, Moon, Sun } from "lucide-react";

import type { WeatherTheme, WeatherThemeConfig } from "./types";

/**
 * WMO Weather Codes Reference:
 *
 * Clear:
 *   0 - Clear sky
 *   1 - Mainly clear
 *
 * Cloudy:
 *   2 - Partly cloudy
 *   3 - Overcast
 *   45, 48 - Fog
 *
 * Precipitation (Rain/Snow/Storm):
 *   51-57 - Drizzle (including freezing)
 *   61-67 - Rain (including freezing)
 *   71-77 - Snow
 *   80-86 - Showers
 *   95-99 - Thunderstorm
 */

/**
 * WMO codes considered "clear" conditions.
 * These use day/night variants.
 */
const CLEAR_CODES = new Set([0, 1]);

/**
 * WMO codes considered "cloudy" conditions.
 * Includes fog and overcast.
 */
const CLOUDY_CODES = new Set([2, 3, 45, 48]);

/**
 * Theme configurations with visual properties.
 * Gradients use low opacity for glassmorphism effect.
 */
const THEME_CONFIGS: Record<WeatherTheme, WeatherThemeConfig> = {
	"clear-day": {
		id: "clear-day",
		gradient: "from-blue-400/20 to-cyan-300/20",
		icon: Sun,
		label: "Clear skies",
	},
	"clear-night": {
		id: "clear-night",
		gradient: "from-indigo-900/40 to-purple-900/40",
		icon: Moon,
		label: "Clear night",
	},
	cloudy: {
		id: "cloudy",
		gradient: "from-gray-500/20 to-slate-400/20",
		icon: Cloud,
		label: "Cloudy",
	},
	precipitation: {
		id: "precipitation",
		gradient: "from-slate-800/40 to-gray-900/40",
		icon: CloudRain,
		label: "Precipitation",
	},
};

/**
 * Determine the weather theme from WMO code and day/night status.
 *
 * @param code - WMO weather interpretation code (0-99)
 * @param isDay - Whether it's currently daytime
 * @returns The appropriate theme identifier
 */
export function getWeatherTheme(code: number, isDay: boolean): WeatherTheme {
	if (CLEAR_CODES.has(code)) {
		return isDay ? "clear-day" : "clear-night";
	}

	if (CLOUDY_CODES.has(code)) {
		return "cloudy";
	}

	// All other codes (51+) are precipitation
	return "precipitation";
}

/**
 * Get the complete theme configuration for display.
 *
 * @param code - WMO weather interpretation code
 * @param isDay - Whether it's currently daytime
 * @returns Theme config with gradient, icon, and label
 */
export function getWeatherThemeConfig(code: number, isDay: boolean): WeatherThemeConfig {
	const theme = getWeatherTheme(code, isDay);
	return THEME_CONFIGS[theme];
}

/**
 * Direct WMO code to description mapping.
 * Used for exact matches.
 */
const WMO_DESCRIPTIONS: Record<number, string> = {
	0: "Clear sky",
	1: "Mainly clear",
	2: "Partly cloudy",
	3: "Overcast",
	45: "Foggy",
	48: "Foggy",
};

/**
 * Range-based description lookup.
 * Each entry: [minCode, maxCode, description]
 */
const WMO_RANGES: [number, number, string][] = [
	[51, 57, "Drizzle"],
	[61, 67, "Rain"],
	[71, 77, "Snow"],
	[80, 82, "Rain showers"],
	[85, 86, "Snow showers"],
	[95, 99, "Thunderstorm"],
];

/**
 * Get a human-readable description for a WMO code.
 * Used for accessibility and tooltips.
 *
 * @param code - WMO weather interpretation code
 * @returns Description string
 */
export function getWeatherDescription(code: number): string {
	// Check direct mapping first
	const direct = WMO_DESCRIPTIONS[code];
	if (direct) return direct;

	// Check range-based mappings
	const range = WMO_RANGES.find(([min, max]) => code >= min && code <= max);
	if (range) return range[2];

	return "Unknown conditions";
}
