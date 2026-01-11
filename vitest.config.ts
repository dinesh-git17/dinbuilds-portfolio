import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "node",
		globals: true,
		include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
	},
	resolve: {
		alias: {
			"@/os": resolve(__dirname, "./src/features/os"),
			"@/apps": resolve(__dirname, "./src/features/apps"),
			"@/lib": resolve(__dirname, "./src/lib"),
			"@": resolve(__dirname, "."),
		},
	},
});
