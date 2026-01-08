import { z } from "zod";

export const contactFormSchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name must be under 100 characters"),
	email: z.string().email("Invalid email protocol"),
	message: z
		.string()
		.min(10, "Message must be at least 10 characters")
		.max(5000, "Message must be under 5000 characters"),
	honeypot: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

export interface ContactFormResult {
	success: boolean;
	error?: string;
}
