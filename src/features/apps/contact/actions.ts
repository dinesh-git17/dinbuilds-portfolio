"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { checkRateLimit } from "./rate-limiter";
import { type ContactFormData, type ContactFormResult, contactFormSchema } from "./schema";

const RECIPIENT_EMAIL = "info@dineshd.dev";
const FROM_EMAIL = "DinBuilds OS <contact@dineshd.dev>";

function getResendClient(): Resend {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		throw new Error("RESEND_API_KEY environment variable is not configured");
	}
	return new Resend(apiKey);
}

function getClientIP(headersList: Headers): string {
	const forwarded = headersList.get("x-forwarded-for");
	if (forwarded) {
		const firstIP = forwarded.split(",")[0];
		return firstIP?.trim() ?? "unknown";
	}

	return headersList.get("x-real-ip") ?? headersList.get("cf-connecting-ip") ?? "unknown";
}

export async function sendEmail(data: ContactFormData): Promise<ContactFormResult> {
	const headersList = await headers();
	const clientIP = getClientIP(headersList);

	const rateLimitResult = await checkRateLimit(clientIP);
	if (!rateLimitResult.allowed) {
		const resetMinutes = Math.ceil((rateLimitResult.resetAt - Date.now()) / 60000);
		return {
			success: false,
			error: `Rate limit exceeded. Try again in ${resetMinutes} minutes.`,
		};
	}

	const validationResult = contactFormSchema.safeParse(data);
	if (!validationResult.success) {
		const firstIssue = validationResult.error.issues[0];
		return {
			success: false,
			error: firstIssue?.message ?? "Validation failed",
		};
	}

	const { name, email, message, honeypot } = validationResult.data;

	if (honeypot && honeypot.length > 0) {
		return { success: true };
	}

	try {
		const resend = getResendClient();
		const { error } = await resend.emails.send({
			from: FROM_EMAIL,
			to: RECIPIENT_EMAIL,
			replyTo: email,
			subject: `[DinBuilds OS] Message from ${name}`,
			text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
			html: `
				<div style="font-family: monospace; max-width: 600px;">
					<h2 style="color: #666; border-bottom: 1px solid #eee; padding-bottom: 10px;">
						New Contact Form Submission
					</h2>
					<p><strong>Name:</strong> ${escapeHtml(name)}</p>
					<p><strong>Email:</strong> ${escapeHtml(email)}</p>
					<div style="margin-top: 20px;">
						<strong>Message:</strong>
						<div style="background: #f5f5f5; padding: 15px; margin-top: 10px; white-space: pre-wrap;">
							${escapeHtml(message)}
						</div>
					</div>
				</div>
			`,
		});

		if (error) {
			return {
				success: false,
				error: "Failed to send message. Please try again later.",
			};
		}

		return { success: true };
	} catch {
		return {
			success: false,
			error: "An unexpected error occurred. Please try again later.",
		};
	}
}

function escapeHtml(text: string): string {
	const htmlEntities: Record<string, string> = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
	};

	return text.replace(/[&<>"']/g, (char) => htmlEntities[char] ?? char);
}
