/**
 * Elastic Drag Motion Configuration
 *
 * Shared physics constants for desktop "fidget" interactions.
 * Elements can be dragged and snap back to their origin with spring physics.
 */

export const ELASTIC_DRAG_CONFIG = {
	/** Spring physics for icon snap-back */
	icon: {
		stiffness: 500,
		damping: 30,
	},
	/** Spring physics for widget snap-back (heavier feel) */
	widget: {
		stiffness: 400,
		damping: 35,
	},
	/** Movement threshold to distinguish click from drag (pixels) */
	dragThreshold: 5,
	/** Scale factor when item is "lifted" */
	liftScale: 1.05,
	/** Shadow when lifted */
	liftShadow: "0px 10px 20px rgba(0, 0, 0, 0.3)",
} as const;
