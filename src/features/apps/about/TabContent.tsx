"use client";

import { AnimatePresence, motion } from "framer-motion";
import { memo } from "react";

import type { AboutTabId } from "./TabNavigation";

export interface TabContentProps {
	activeTab: AboutTabId;
}

/**
 * Fade transition variants for tab content.
 */
const contentVariants = {
	initial: { opacity: 0, y: 8 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -8 },
};

/**
 * Tab content container with animated transitions.
 *
 * Uses AnimatePresence to smoothly fade content in/out
 * when switching between tabs.
 */
export const TabContent = memo(function TabContent({ activeTab }: TabContentProps) {
	return (
		<div className="flex-1 overflow-auto p-5">
			<AnimatePresence mode="wait">
				<motion.div
					key={activeTab}
					variants={contentVariants}
					initial="initial"
					animate="animate"
					exit="exit"
					transition={{ duration: 0.15, ease: "easeOut" }}
				>
					{activeTab === "overview" && <OverviewPanel />}
					{activeTab === "stack" && <StackPanel />}
					{activeTab === "experience" && <ExperiencePanel />}
				</motion.div>
			</AnimatePresence>
		</div>
	);
});

/**
 * Overview tab content - Bio and introduction.
 */
function OverviewPanel() {
	return (
		<div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" className="space-y-4">
			<h2 className="font-mono text-sm font-medium text-white/70">{"// Overview"}</h2>
			<div className="space-y-4 text-sm leading-relaxed text-white/60">
				<p>
					I turn complex systems into clean, usable software and occasionally turn side projects
					into full blown products by accident.
				</p>
				<p>
					I'm a data engineer who enjoys building things that live at the intersection of
					performance, design, and "wait… this is actually kind of cool." From large scale data
					pipelines and security sensitive systems to algorithm visualizers and privacy first tools,
					I like shipping software that's both technically solid and visually intentional.
				</p>
				<p>
					I obsess over the small things: latency, edge cases, naming things correctly, and making
					interfaces that feel obvious instead of overwhelming.
				</p>
				<p>
					This site exists because I wanted a better way to showcase how I think, build, and ship.
					You're currently inside the result.
				</p>
			</div>
		</div>
	);
}

/**
 * System specification entry.
 */
interface SpecEntry {
	label: string;
	values: string[];
}

/**
 * Tech stack organized as system specifications.
 */
const SYSTEM_SPECS: SpecEntry[] = [
	{ label: "Languages", values: ["Python", "TypeScript", "JavaScript", "SQL", "Java", "MATLAB"] },
	{
		label: "Data & DBs",
		values: [
			"PostgreSQL",
			"MySQL",
			"Snowflake",
			"BigQuery",
			"Databricks",
			"Redshift",
			"Kafka",
			"Redis",
		],
	},
	{
		label: "AI/ML",
		values: [
			"PyTorch",
			"TensorFlow",
			"scikit-learn",
			"Pandas",
			"NumPy",
			"OpenAI",
			"Anthropic",
			"LangChain",
			"Hugging Face",
		],
	},
	{
		label: "Web Dev",
		values: [
			"Next.js",
			"React",
			"Tailwind",
			"Framer Motion",
			"Node.js",
			"FastAPI",
			"Django",
			"Supabase",
		],
	},
	{
		label: "Cloud/DevOps",
		values: ["AWS", "Docker", "Kubernetes", "GitHub Actions", "Vercel", "Git"],
	},
];

/**
 * Stack tab content - System Specifications display.
 * Renders tech stack as key-value pairs in a terminal-style grid.
 */
function StackPanel() {
	return (
		<div role="tabpanel" id="panel-stack" aria-labelledby="tab-stack" className="space-y-4">
			<h2 className="font-mono text-sm font-medium text-white/70">{"// System Specs"}</h2>
			<div className="grid gap-3">
				{SYSTEM_SPECS.map((spec) => (
					<SpecRow key={spec.label} spec={spec} />
				))}
			</div>
		</div>
	);
}

/**
 * Single specification row with label and values.
 */
function SpecRow({ spec }: { spec: SpecEntry }) {
	return (
		<div className="flex items-baseline gap-3">
			<span className="w-20 shrink-0 text-xs text-white/40">{spec.label}</span>
			<span className="font-mono text-xs text-white/70">{spec.values.join(", ")}</span>
		</div>
	);
}

/**
 * Experience entry structure.
 */
interface ExperienceEntry {
	company: string;
	role: string;
	period: string;
	highlights: string[];
}

/**
 * Work experience data.
 */
const EXPERIENCE_DATA: ExperienceEntry[] = [
	{
		company: "Meridian Credit Union",
		role: "Data Scientist",
		period: "Apr 2024 - Present",
		highlights: [
			"Architected automated data pipelines and dashboards serving 300K+ members, reducing manual reporting time by 40%.",
			"Collaborated with engineering to translate business requirements into scalable analytical solutions.",
			"Identified operational bottlenecks through trend analysis, implementing optimizations that improved efficiency by 25%.",
		],
	},
	{
		company: "Slice Labs",
		role: "Junior Data Scientist",
		period: "Apr 2021 - Jan 2023",
		highlights: [
			"Developed interactive dashboards using Tableau and SQL to drive executive decision-making.",
			"Implemented robust data validation scripts, improving data accuracy by 35% across the platform.",
			"Utilized SQL for complex query optimization and ad hoc analysis to support operational teams.",
		],
	},
	{
		company: "Carleton University",
		role: "Research & Data Assistant",
		period: "Sep 2019 - Jul 2023",
		highlights: [
			"Analyzed large datasets consisting of 30K+ records using SQL and Python to support institutional reporting.",
		],
	},
];

/**
 * Experience tab content - Changelog style timeline.
 */
function ExperiencePanel() {
	return (
		<div
			role="tabpanel"
			id="panel-experience"
			aria-labelledby="tab-experience"
			className="space-y-5"
		>
			<h2 className="font-mono text-sm font-medium text-white/70">{"// Changelog"}</h2>
			<div className="space-y-6">
				{EXPERIENCE_DATA.map((entry) => (
					<ExperienceCard key={entry.company} entry={entry} />
				))}
			</div>
		</div>
	);
}

/**
 * Single experience entry card.
 */
function ExperienceCard({ entry }: { entry: ExperienceEntry }) {
	return (
		<div className="space-y-2">
			<div className="flex items-baseline justify-between gap-4">
				<div className="flex items-baseline gap-2">
					<span className="text-sm font-medium text-white">{entry.company}</span>
					<span className="text-xs text-white/40">|</span>
					<span className="text-xs text-white/50">{entry.role}</span>
				</div>
				<span className="shrink-0 font-mono text-[10px] text-white/30">{entry.period}</span>
			</div>
			<ul className="space-y-1.5 pl-3">
				{entry.highlights.map((highlight) => (
					<li key={highlight} className="text-xs leading-relaxed text-white/50">
						<span className="mr-2 text-white/20">•</span>
						{highlight}
					</li>
				))}
			</ul>
		</div>
	);
}
