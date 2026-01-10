/**
 * Boot Module
 *
 * System initialization and boot sequence components.
 * Import via '@/os/boot'.
 */

export { BootManager, type BootManagerProps } from "./BootManager";
export { BootScreen } from "./BootScreen";
export {
	BOOT_TIMING,
	hasBootedThisSession,
	markBootComplete,
	UI_REVEAL,
	WELCOME_SPRING,
} from "./constants";
export { WelcomeOverlay } from "./WelcomeOverlay";
