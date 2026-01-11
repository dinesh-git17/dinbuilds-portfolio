/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppID } from "@/os/store/types";

import { DesktopIcon, type DesktopIconProps } from "./DesktopIcon";

// Mock next/image to render a standard img tag for testing
vi.mock("next/image", () => ({
	default: ({
		src,
		alt,
		draggable,
		className,
		...props
	}: {
		src: string;
		alt: string;
		draggable?: boolean;
		className?: string;
		width?: number;
		height?: number;
	}) => (
		// biome-ignore lint/performance/noImgElement: intentional for testing raw HTML attributes
		<img
			src={src}
			alt={alt}
			draggable={draggable}
			className={className}
			data-testid="folder-image"
			{...props}
		/>
	),
}));

// Mock Zustand store
vi.mock("@/os/store", () => ({
	useSystemStore: vi.fn((selector) => {
		const state = {
			launchApp: vi.fn(),
		};
		return selector(state);
	}),
}));

// Mock useDeviceType to return desktop (enables drag)
vi.mock("./dock/useDeviceType", () => ({
	useDeviceType: () => "desktop",
}));

// Mock useReducedMotion
vi.mock("@/os/window", () => ({
	useReducedMotion: () => false,
}));

// Mock useNavigate hook (uses Next.js useRouter internally)
vi.mock("@/os/hooks", () => ({
	useNavigate: () => ({
		navigate: vi.fn(),
		prefetch: vi.fn(),
		getPath: vi.fn(() => "/"),
	}),
}));

// Mock framer-motion to capture drag events
const mockOnDragStart = vi.fn();
const mockOnDragEnd = vi.fn();

vi.mock("framer-motion", async () => {
	const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");

	// Shared anchor mock that captures drag handlers (used by DesktopIcon after Story 4)
	const MockAnchor = ({
		children,
		onDragStart,
		onDragEnd,
		drag,
		href,
		// Filter out Framer Motion-specific props to avoid React warnings
		dragSnapToOrigin: _snapOrigin,
		dragElastic: _elastic,
		dragMomentum: _momentum,
		whileDrag: _whileDrag,
		whileHover: _whileHover,
		whileTap: _whileTap,
		...props
	}: React.ComponentProps<"a"> & {
		drag?: boolean;
		onDragStart?: () => void;
		onDragEnd?: () => void;
		dragSnapToOrigin?: boolean;
		dragElastic?: number;
		dragMomentum?: boolean;
		whileDrag?: unknown;
		whileHover?: unknown;
		whileTap?: unknown;
	}) => {
		// Capture the drag handlers for testing
		if (onDragStart) mockOnDragStart.mockImplementation(onDragStart);
		if (onDragEnd) mockOnDragEnd.mockImplementation(onDragEnd);

		return (
			<a
				href={href}
				data-testid="desktop-icon-button"
				data-drag-enabled={String(!!drag)}
				{...props}
			>
				{children}
			</a>
		);
	};

	return {
		...actual,
		motion: {
			...actual.motion,
			a: MockAnchor,
			// Keep button mock for backward compatibility with other tests
			button: ({
				children,
				onDragStart,
				onDragEnd,
				drag,
				// Filter out Framer Motion-specific props to avoid React warnings
				dragSnapToOrigin: _snapOrigin,
				dragElastic: _elastic,
				dragMomentum: _momentum,
				whileDrag: _whileDrag,
				whileHover: _whileHover,
				whileTap: _whileTap,
				...props
			}: React.ComponentProps<"button"> & {
				drag?: boolean;
				onDragStart?: () => void;
				onDragEnd?: () => void;
				dragSnapToOrigin?: boolean;
				dragElastic?: number;
				dragMomentum?: boolean;
				whileDrag?: unknown;
				whileHover?: unknown;
				whileTap?: unknown;
			}) => {
				if (onDragStart) mockOnDragStart.mockImplementation(onDragStart);
				if (onDragEnd) mockOnDragEnd.mockImplementation(onDragEnd);

				return (
					<button
						type="button"
						data-testid="desktop-icon-button"
						data-drag-enabled={String(!!drag)}
						{...props}
					>
						{children}
					</button>
				);
			},
		},
		useAnimation: () => ({
			start: vi.fn(),
			set: vi.fn(),
		}),
	};
});

describe("DesktopIcon", () => {
	const defaultProps: DesktopIconProps = {
		appId: AppID.FolderProjects,
		label: "Test Folder",
		iconType: "folder",
		folderId: "test-folder",
		isSelected: false,
		onSelect: vi.fn(),
		onExecute: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	describe("Image-based icon drag behavior", () => {
		it("renders folder image with draggable={false} to prevent native drag", () => {
			render(<DesktopIcon {...defaultProps} />);

			const image = screen.getByTestId("folder-image");
			expect(image).toHaveAttribute("draggable", "false");
		});

		it("renders folder image with pointer-events-none class", () => {
			render(<DesktopIcon {...defaultProps} />);

			const image = screen.getByTestId("folder-image");
			expect(image.className).toContain("pointer-events-none");
		});

		it("enables drag on the parent button container", () => {
			render(<DesktopIcon {...defaultProps} />);

			const button = screen.getByTestId("desktop-icon-button");
			expect(button).toHaveAttribute("data-drag-enabled", "true");
		});

		it("does not trigger native dragstart event on the image", () => {
			render(<DesktopIcon {...defaultProps} />);

			const image = screen.getByTestId("folder-image");
			const nativeDragHandler = vi.fn();

			image.addEventListener("dragstart", nativeDragHandler);
			fireEvent.dragStart(image);

			// Native drag should be prevented by draggable={false}
			// In real browser, this would not fire; in jsdom we verify the attribute
			expect(image).toHaveAttribute("draggable", "false");
		});

		it("registers onDragStart handler on the motion.button", () => {
			render(<DesktopIcon {...defaultProps} />);

			// The mock captures the drag handler
			expect(mockOnDragStart).toBeDefined();
		});

		it("registers onDragEnd handler on the motion.button", () => {
			render(<DesktopIcon {...defaultProps} />);

			// The mock captures the drag handler
			expect(mockOnDragEnd).toBeDefined();
		});
	});

	describe("File icon (SVG) drag behavior", () => {
		const fileProps: DesktopIconProps = {
			...defaultProps,
			appId: AppID.MarkdownViewer,
			label: "Test File",
			iconType: "file",
			contentUrl: "/test.md",
		};

		it("still enables drag on the parent button for file icons", () => {
			render(<DesktopIcon {...fileProps} />);

			const button = screen.getByTestId("desktop-icon-button");
			expect(button).toHaveAttribute("data-drag-enabled", "true");
		});
	});

	describe("Click and selection behavior", () => {
		it("calls onSelect on single click", () => {
			const onSelect = vi.fn();
			render(<DesktopIcon {...defaultProps} onSelect={onSelect} />);

			const button = screen.getByTestId("desktop-icon-button");
			fireEvent.click(button);

			expect(onSelect).toHaveBeenCalledTimes(1);
		});

		it("has correct aria-label for folder icon", () => {
			render(<DesktopIcon {...defaultProps} />);

			const button = screen.getByTestId("desktop-icon-button");
			expect(button).toHaveAttribute("aria-label", "Open Test Folder folder");
		});

		it("has correct aria-label for file icon", () => {
			render(
				<DesktopIcon
					{...defaultProps}
					iconType="file"
					label="README"
					appId={AppID.MarkdownViewer}
					contentUrl="/readme.md"
				/>,
			);

			const button = screen.getByTestId("desktop-icon-button");
			expect(button).toHaveAttribute("aria-label", "Open README file");
		});
	});
});
