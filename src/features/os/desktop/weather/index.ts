/**
 * Weather Widget Module
 *
 * Provides live weather data and theme mapping for the desktop widget.
 * Uses Open-Meteo API (no key required) hardcoded to Toronto.
 *
 * Import via '@/os/desktop/weather'.
 */

export {
	type UseWeatherReturn,
	WEATHER_CONFIG,
	WEATHER_LOCATION,
	type WeatherData,
	type WeatherTheme,
	type WeatherThemeConfig,
} from "./types";
export { useWeather } from "./use-weather";
export { WeatherWidget, type WeatherWidgetProps } from "./WeatherWidget";
export {
	getWeatherDescription,
	getWeatherTheme,
	getWeatherThemeConfig,
} from "./weather-mapper";
