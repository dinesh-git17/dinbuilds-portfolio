/**
 * Window Module
 *
 * Contains all window management components.
 * Import via '@/os/window'.
 */

export {
	APP_REGISTRY,
	type AppComponentProps,
	type AppManifest,
	getAppManifest,
} from "./app-registry";
export {
	GHOST_DRAG_EASINGS,
	type GhostDragPhase,
	type UseGhostDragOptions,
	type UseGhostDragReturn,
	useGhostDrag,
} from "./useGhostDrag";
export { useReducedMotion } from "./useReducedMotion";
export { WindowControls, type WindowControlsProps } from "./WindowControls";
export { WindowFrame, type WindowFrameProps } from "./WindowFrame";
export { WindowManager, type WindowManagerProps } from "./WindowManager";
