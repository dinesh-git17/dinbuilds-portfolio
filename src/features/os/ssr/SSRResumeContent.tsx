/**
 * SSRResumeContent — Server-Side Resume Rendering (Story 5)
 *
 * Renders resume content in semantic HTML for search engine crawlers.
 * Uses proper heading hierarchy, sections, and lists for structured content.
 *
 * The content is:
 * - Present in the DOM for crawlers to index
 * - Visually hidden from users (uses sr-only pattern)
 * - Does not interfere with the Markdown Viewer display
 * - Provides semantic structure for AI Overviews
 */

import type { ParsedResume } from "@/lib/content";

export interface SSRResumeContentProps {
	/** Parsed resume structure */
	resume: ParsedResume;
}

/**
 * Renders resume content as semantic HTML for SEO.
 *
 * Uses the screen-reader-only pattern (position: absolute, clip: rect)
 * which is accessible to crawlers but not visible to users.
 *
 * Structure follows resume best practices:
 * - Clear heading hierarchy (h1 for name, h2 for sections)
 * - Section elements for logical grouping
 * - Unordered lists for skills and achievements
 */
export function SSRResumeContent({ resume }: SSRResumeContentProps) {
	return (
		<article
			className="sr-only"
			aria-label="Professional Resume"
			data-ssr-resume="true"
			itemScope
			itemType="https://schema.org/Person"
		>
			{/* Header with name and title */}
			<header>
				<h1 itemProp="name">{resume.name}</h1>
				<p itemProp="jobTitle">{resume.title}</p>
			</header>

			{/* Summary Section */}
			{resume.summary && (
				<section aria-labelledby="resume-summary" data-section="summary">
					<h2 id="resume-summary">Professional Summary</h2>
					<p itemProp="description">{resume.summary}</p>
				</section>
			)}

			{/* Skills Section */}
			{Object.keys(resume.skills).length > 0 && (
				<section aria-labelledby="resume-skills" data-section="skills">
					<h2 id="resume-skills">Technical Skills</h2>
					<dl>
						{Object.entries(resume.skills).map(([category, skills]) => (
							<div key={category}>
								<dt>
									<strong>{category}</strong>
								</dt>
								<dd itemProp="knowsAbout">{skills}</dd>
							</div>
						))}
					</dl>
				</section>
			)}

			{/* Projects Section */}
			{resume.projects.length > 0 && (
				<section aria-labelledby="resume-projects" data-section="projects">
					<h2 id="resume-projects">Featured Projects</h2>
					{resume.projects.map((project) => (
						<article key={project.title} data-project={project.title}>
							<h3>{project.title}</h3>
							{project.items.length > 0 && (
								<ul>
									{project.items.map((item, idx) => (
										<li key={`${project.title}-${idx}`}>{item}</li>
									))}
								</ul>
							)}
						</article>
					))}
				</section>
			)}

			{/* Experience Section */}
			{resume.experience.length > 0 && (
				<section aria-labelledby="resume-experience" data-section="experience">
					<h2 id="resume-experience">Professional Experience</h2>
					{resume.experience.map((exp) => (
						<article
							key={exp.title}
							data-employer={exp.title}
							itemProp="worksFor"
							itemScope
							itemType="https://schema.org/Organization"
						>
							<h3 itemProp="name">{exp.title}</h3>
							{exp.items.length > 0 && (
								<ul>
									{exp.items.map((item, idx) => (
										<li key={`${exp.title}-${idx}`}>{item}</li>
									))}
								</ul>
							)}
						</article>
					))}
				</section>
			)}
		</article>
	);
}
