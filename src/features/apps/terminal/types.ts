/**
 * Terminal App Type Definitions
 *
 * Defines the type system for the CLI emulator.
 * Follows P10k aesthetic with ZSH-style interactions.
 */

/**
 * Types of entries in terminal history.
 * Commands are user input, outputs are system responses.
 */
export type HistoryEntryType = "command" | "output" | "error";

/**
 * Single entry in the terminal history.
 */
export interface HistoryEntry {
	/** Unique identifier for React keys */
	id: string;
	/** Entry classification */
	type: HistoryEntryType;
	/** Display content (command text or output) */
	content: string;
	/** Timestamp for ordering (milliseconds since epoch) */
	timestamp: number;
}

/**
 * Terminal state slice.
 * Represents current input and accumulated history.
 */
export interface TerminalState {
	/** Current user input before submission */
	currentInput: string;
	/** All previous commands and outputs */
	history: HistoryEntry[];
	/** Index into history for up/down navigation (-1 = current input) */
	historyIndex: number;
	/** Cached current input when navigating history */
	savedInput: string;
}

/**
 * Actions for manipulating terminal state.
 */
export interface TerminalActions {
	/** Update current input text */
	setInput: (value: string) => void;
	/** Submit command and process it */
	executeCommand: () => void;
	/** Navigate to previous command in history */
	navigateHistoryUp: () => void;
	/** Navigate to next command in history */
	navigateHistoryDown: () => void;
	/** Clear all history entries */
	clearHistory: () => void;
	/** Add output entry to history */
	addOutput: (content: string, isError?: boolean) => void;
}

/**
 * Complete terminal store type.
 */
export type TerminalStore = TerminalState & TerminalActions;

/**
 * Command handler function signature.
 * Returns output string(s) or null for no output.
 */
export type CommandHandler = (args: string[]) => string | string[] | null;

/**
 * Command definition in the registry.
 */
export interface CommandDefinition {
	/** Display name for help listing */
	name: string;
	/** Brief description of what the command does */
	description: string;
	/** Handler function that processes the command */
	handler: CommandHandler;
	/** If true, command is hidden from help listing (easter eggs) */
	hidden?: boolean;
}
