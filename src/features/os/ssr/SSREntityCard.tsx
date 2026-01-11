/**
 * SSREntityCard — Server-Rendered Identity Signals
 *
 * Renders the entity's identity data in a crawlable but visually hidden section.
 * This bridges the gap between JSON-LD schema claims and visible DOM content,
 * which is critical for entity verification by search engines.
 *
 * The component renders:
 * - An h1 with the entity name (required for homepage)
 * - Job title and professional description
 * - Social profile links as standard <a> tags (validates sameAs schema)
 * - Location and contact information
 *
 * This content is:
 * - Present in the initial HTML response (no JS required)
 * - Visually hidden from users (uses sr-only pattern)
 * - Accessible to screen readers and search engine crawlers
 */

import { ENTITY } from "@/lib/seo";

export interface SSREntityCardProps {
	/**
	 * Whether to render the h1 element.
	 * Should be true for the homepage, false for other pages
	 * (which have their own h1 elements).
	 */
	includeH1?: boolean;
}

/**
 * Renders the entity identity card for search engine crawlers.
 *
 * Uses the screen-reader-only pattern (sr-only) which is:
 * - Accessible to crawlers via the DOM
 * - Accessible to screen readers
 * - Invisible to sighted users
 *
 * @see https://webaim.org/techniques/css/invisiblecontent/
 */
export function SSREntityCard({ includeH1 = true }: SSREntityCardProps) {
	return (
		<section
			className="sr-only"
			aria-label="About the author"
			data-ssr-entity="true"
			itemScope
			itemType="https://schema.org/Person"
		>
			{/* Primary heading — aligns with <title> for entity verification */}
			{includeH1 && (
				<h1 itemProp="name">
					{ENTITY.name} — {ENTITY.jobTitle}
				</h1>
			)}

			{/* Identity metadata */}
			<div>
				<span itemProp="givenName">{ENTITY.givenName}</span>{" "}
				<span itemProp="familyName">{ENTITY.familyName}</span>
			</div>
			<p itemProp="jobTitle">{ENTITY.jobTitle}</p>
			<p itemProp="description">{ENTITY.description}</p>

			{/* Location */}
			<address itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
				<span itemProp="addressLocality">{ENTITY.location}</span>
			</address>

			{/* Contact email */}
			<a href={`mailto:${ENTITY.email}`} itemProp="email">
				{ENTITY.email}
			</a>

			{/* Social profile links — validates sameAs schema claims */}
			<nav aria-label="Social profiles">
				<ul>
					{ENTITY.socialProfiles.map((profile) => (
						<li key={profile.platform}>
							<a
								href={profile.url}
								rel="me noopener"
								aria-label={profile.ariaLabel}
								itemProp="sameAs"
							>
								{profile.platform}: {profile.url}
							</a>
						</li>
					))}
				</ul>
			</nav>

			{/* Current employment */}
			<div itemProp="worksFor" itemScope itemType="https://schema.org/Organization">
				<span>Works at: </span>
				<a href={ENTITY.currentEmployer.organizationUrl} itemProp="url">
					<span itemProp="name">{ENTITY.currentEmployer.organization}</span>
				</a>
				<span> as {ENTITY.currentEmployer.role}</span>
			</div>

			{/* Education */}
			{ENTITY.education.map((edu) => (
				<div
					key={edu.institution}
					itemProp="alumniOf"
					itemScope
					itemType="https://schema.org/EducationalOrganization"
				>
					<span>Alumnus of: </span>
					<a href={edu.institutionUrl} itemProp="url">
						<span itemProp="name">{edu.institution}</span>
					</a>
				</div>
			))}

			{/* Skills/expertise */}
			<div>
				<span>Expertise: </span>
				{ENTITY.knowsAbout.map((skill, index) => (
					<span key={skill}>
						<span itemProp="knowsAbout">{skill}</span>
						{index < ENTITY.knowsAbout.length - 1 ? ", " : ""}
					</span>
				))}
			</div>

			{/* Canonical URL */}
			<a href={ENTITY.url} itemProp="url">
				{ENTITY.url}
			</a>
		</section>
	);
}
