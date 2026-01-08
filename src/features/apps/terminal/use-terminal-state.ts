/**
 * Terminal State Hook
 *
 * TERM-02: CLI Engine implementation.
 * Manages input, history, command navigation, and command execution.
 */

import { useCallback, useState } from "react";

import type { CommandDefinition, HistoryEntry, TerminalState } from "./types";

/**
 * Generate unique ID for history entries.
 */
function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * HTML-escape user input to prevent XSS.
 */
function escapeHtml(text: string): string {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

/**
 * TERM-03: Command Registry v1
 * Basic commands for the terminal emulator.
 */
const COMMAND_REGISTRY: Record<string, CommandDefinition> = {
	help: {
		name: "help",
		description: "List available commands",
		handler: () => {
			const commands = Object.values(COMMAND_REGISTRY).filter((cmd) => !cmd.hidden);
			const lines = [
				"Available commands:",
				"",
				...commands.map((cmd) => `  ${cmd.name.padEnd(12)} ${cmd.description}`),
				"",
				"Type a command and press Enter to execute.",
			];
			return lines;
		},
	},
	clear: {
		name: "clear",
		description: "Clear terminal history",
		handler: () => null,
	},
	whoami: {
		name: "whoami",
		description: "Display current user",
		handler: () => "guest@dineshd.dev",
	},
	pwd: {
		name: "pwd",
		description: "Print working directory",
		handler: () => "/home/guest/portfolio",
	},
	ls: {
		name: "ls",
		description: "List directory contents",
		handler: () => [
			"drwxr-xr-x  projects/",
			"drwxr-xr-x  experience/",
			"-rw-r--r--  README.md",
			"-rw-r--r--  resume.pdf",
		],
	},
	echo: {
		name: "echo",
		description: "Display a line of text",
		handler: (args) => (args.length > 0 ? args.join(" ") : ""),
	},
	date: {
		name: "date",
		description: "Display current date and time",
		handler: () => new Date().toString(),
	},
	uname: {
		name: "uname",
		description: "Print system information",
		handler: () => "DinBuilds OS 1.0.0 (Portfolio Edition)",
	},
	status: {
		name: "status",
		description: "Check system status",
		handler: () => [
			"",
			"System Status:",
			"• Caffeine: Optimal",
			"• Bugs: Contained",
			"• Shipping Mode: Enabled",
			"",
		],
	},
	stack: {
		name: "stack",
		description: "Display tech stack",
		handler: () => [
			"┌─────────────────────────────────────────────┐",
			"│  TECH STACK                                 │",
			"└─────────────────────────────────────────────┘",
			"",
			"  Frontend",
			"  ─────────",
			"  React, Next.js, TypeScript, Tailwind CSS",
			"  Framer Motion, Zustand, React Query",
			"",
			"  Backend",
			"  ─────────",
			"  Node.js, Python, FastAPI, PostgreSQL",
			"  Redis, GraphQL, REST APIs",
			"",
			"  Data",
			"  ─────────",
			"  Apache Spark, Airflow, dbt, Snowflake",
			"  Pandas, SQL, ETL Pipelines",
			"",
			"  Infrastructure",
			"  ─────────",
			"  AWS, Docker, Kubernetes, Terraform",
			"  GitHub Actions, Vercel, Linux",
		],
	},
	git: {
		name: "git",
		description: "Git commands",
		hidden: true,
		handler: (args) => {
			if (args[0] === "status") {
				return ["main is green, vibes are stable"];
			}
			return `git: '${args[0] ?? ""}' is not a git command`;
		},
	},
	coffee: {
		name: "coffee",
		description: "Brew coffee",
		hidden: true,
		handler: () => "Brewing… productivity increased by 20%.",
	},
	sudo: {
		name: "sudo",
		description: "Superuser do",
		hidden: true,
		handler: () => "Permission denied. Nice try.",
	},
	rm: {
		name: "rm",
		description: "Remove files",
		hidden: true,
		handler: (args) => {
			if (args.some((arg) => arg.includes("-rf") || arg.includes("-r"))) {
				return "Operation blocked. Portfolio remains intact.";
			}
			return "rm: missing operand";
		},
	},
	exit: {
		name: "exit",
		description: "Close terminal",
		handler: () => null,
	},
	matrix: {
		name: "matrix",
		description: "Enter the Matrix",
		hidden: true,
		handler: () => null,
	},
	about: {
		name: "about",
		description: "Learn about Dinesh",
		handler: () => [
			"Hi. I'm Dinesh.",
			"",
			"I build clean, usable software out of complex systems and occasionally turn side projects into full blown products by accident.",
			"",
			"By day, I'm a data engineer working with large datasets, legacy systems, and security sensitive platforms. By night, I ship projects that mix performance, design, and curiosity usually with too many browser tabs open.",
			"",
			"I care about the details. Latency. Edge cases. Naming things correctly. Making interfaces that feel obvious instead of overwhelming.",
			"",
			"This terminal is not a gimmick. It's how I think, build, and explore. If you're reading this, it's working as intended.",
			"",
			"Type `help` to keep exploring.",
		],
	},
};

/**
 * Initial state for the terminal.
 */
const INITIAL_STATE: TerminalState = {
	currentInput: "",
	history: [],
	historyIndex: -1,
	savedInput: "",
};

/**
 * Create a history entry from output lines.
 */
function createOutputEntries(output: string | string[]): HistoryEntry[] {
	const outputLines = Array.isArray(output) ? output : [output];
	return outputLines.map((line) => ({
		id: generateId(),
		type: "output" as const,
		content: line,
		timestamp: Date.now(),
	}));
}

/**
 * Create an error entry for unknown commands.
 */
function createErrorEntry(escapedInput: string): HistoryEntry {
	return {
		id: generateId(),
		type: "error" as const,
		content: `command not found: ${escapedInput}`,
		timestamp: Date.now(),
	};
}

/**
 * Process a command and return resulting history entries.
 */
function processCommand(commandName: string, args: string[], escapedInput: string): HistoryEntry[] {
	const command = COMMAND_REGISTRY[commandName.toLowerCase()];

	if (!command) {
		return [createErrorEntry(escapedInput)];
	}

	const output = command.handler(args);
	if (output === null) {
		return [];
	}

	return createOutputEntries(output);
}

export interface UseTerminalStateOptions {
	/** Callback when exit command is executed */
	onExit?: () => void;
	/** Callback when matrix command is executed */
	onMatrix?: () => void;
}

/**
 * Terminal state management hook.
 *
 * Provides:
 * - Controlled input state
 * - Command history with up/down navigation
 * - Command execution with registry lookup
 * - Output/error handling
 */
export function useTerminalState(options: UseTerminalStateOptions = {}) {
	const { onExit, onMatrix } = options;
	const [state, setState] = useState<TerminalState>(INITIAL_STATE);

	/**
	 * Update current input text.
	 */
	const setInput = useCallback((value: string) => {
		setState((prev) => ({
			...prev,
			currentInput: value,
			historyIndex: -1,
		}));
	}, []);

	/**
	 * Add output entry to history.
	 */
	const addOutput = useCallback((content: string, isError = false) => {
		const entry: HistoryEntry = {
			id: generateId(),
			type: isError ? "error" : "output",
			content,
			timestamp: Date.now(),
		};
		setState((prev) => ({
			...prev,
			history: [...prev.history, entry],
		}));
	}, []);

	/**
	 * Clear all history entries.
	 */
	const clearHistory = useCallback(() => {
		setState((prev) => ({
			...prev,
			history: [],
			historyIndex: -1,
		}));
	}, []);

	/**
	 * Execute the current command.
	 */
	const executeCommand = useCallback(() => {
		const currentInput = state.currentInput.trim();
		if (!currentInput) {
			return;
		}

		const parts = currentInput.split(/\s+/);
		const commandName = (parts[0] ?? "").toLowerCase();

		// Handle exit command - close window
		if (commandName === "exit") {
			onExit?.();
			return;
		}

		// Handle matrix command - trigger animation
		if (commandName === "matrix") {
			onMatrix?.();
			return;
		}

		setState((prev) => {
			const trimmedInput = prev.currentInput.trim();
			if (!trimmedInput) {
				return prev;
			}

			const escapedInput = escapeHtml(trimmedInput);
			const inputParts = trimmedInput.split(/\s+/);
			const cmdName = inputParts[0] ?? "";
			const args = inputParts.slice(1);

			// Handle clear command specially (clears history)
			if (cmdName.toLowerCase() === "clear") {
				return { ...INITIAL_STATE };
			}

			const commandEntry: HistoryEntry = {
				id: generateId(),
				type: "command",
				content: escapedInput,
				timestamp: Date.now(),
			};

			const outputEntries = processCommand(cmdName, args, escapedInput);
			const newHistory = [...prev.history, commandEntry, ...outputEntries];

			return {
				...prev,
				currentInput: "",
				history: newHistory,
				historyIndex: -1,
				savedInput: "",
			};
		});
	}, [state.currentInput, onExit, onMatrix]);

	/**
	 * Navigate to previous command in history (Up arrow).
	 */
	const navigateHistoryUp = useCallback(() => {
		setState((prev) => {
			const commandHistory = prev.history.filter((e) => e.type === "command");
			if (commandHistory.length === 0) {
				return prev;
			}

			const newIndex =
				prev.historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, prev.historyIndex - 1);

			const savedInput = prev.historyIndex === -1 ? prev.currentInput : prev.savedInput;

			const targetEntry = commandHistory[newIndex];
			if (!targetEntry) {
				return prev;
			}

			return {
				...prev,
				currentInput: targetEntry.content,
				historyIndex: newIndex,
				savedInput,
			};
		});
	}, []);

	/**
	 * Navigate to next command in history (Down arrow).
	 */
	const navigateHistoryDown = useCallback(() => {
		setState((prev) => {
			if (prev.historyIndex === -1) {
				return prev;
			}

			const commandHistory = prev.history.filter((e) => e.type === "command");
			const newIndex = prev.historyIndex + 1;

			if (newIndex >= commandHistory.length) {
				return {
					...prev,
					currentInput: prev.savedInput,
					historyIndex: -1,
				};
			}

			const targetEntry = commandHistory[newIndex];
			if (!targetEntry) {
				return prev;
			}

			return {
				...prev,
				currentInput: targetEntry.content,
				historyIndex: newIndex,
			};
		});
	}, []);

	return {
		...state,
		setInput,
		executeCommand,
		navigateHistoryUp,
		navigateHistoryDown,
		clearHistory,
		addOutput,
	};
}
