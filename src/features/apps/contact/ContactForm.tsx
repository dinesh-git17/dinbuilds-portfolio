"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Send } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { sendEmail } from "./actions";
import { type ContactFormData, contactFormSchema } from "./schema";

type FormStatus = "idle" | "sending" | "success" | "error";

interface InputFieldProps {
	label: string;
	prefix: string;
	error?: string;
	disabled?: boolean;
}

function InputField({
	label,
	prefix,
	error,
	disabled,
	...props
}: InputFieldProps & React.InputHTMLAttributes<HTMLInputElement>) {
	return (
		<label className="block space-y-1">
			<span className="block font-mono text-[10px] uppercase tracking-wider text-white/40">
				{label}
			</span>
			<div className="relative">
				<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-emerald-500/70">
					{prefix}
				</span>
				<input
					{...props}
					disabled={disabled}
					className={clsx(
						"w-full rounded border bg-black/40 py-2.5 pl-10 pr-3 font-mono text-sm text-white",
						"placeholder:text-white/20",
						"transition-colors duration-150",
						"focus:outline-none focus:ring-1",
						error
							? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
							: "border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/30",
						disabled && "cursor-not-allowed opacity-50",
					)}
				/>
			</div>
			{error && <p className="font-mono text-xs text-red-400">{error}</p>}
		</label>
	);
}

interface TextAreaFieldProps {
	label: string;
	prefix: string;
	error?: string;
	disabled?: boolean;
}

function TextAreaField({
	label,
	prefix,
	error,
	disabled,
	...props
}: TextAreaFieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
	return (
		<label className="block space-y-1">
			<span className="block font-mono text-[10px] uppercase tracking-wider text-white/40">
				{label}
			</span>
			<div className="relative">
				<span className="pointer-events-none absolute left-3 top-3 font-mono text-sm text-emerald-500/70">
					{prefix}
				</span>
				<textarea
					{...props}
					disabled={disabled}
					className={clsx(
						"w-full resize-none rounded border bg-black/40 py-2.5 pl-10 pr-3 font-mono text-sm text-white",
						"placeholder:text-white/20",
						"transition-colors duration-150",
						"focus:outline-none focus:ring-1",
						error
							? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
							: "border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/30",
						disabled && "cursor-not-allowed opacity-50",
					)}
				/>
			</div>
			{error && <p className="font-mono text-xs text-red-400">{error}</p>}
		</label>
	);
}

export interface ContactFormProps {
	onSuccess?: () => void;
}

export const ContactForm = memo(function ContactForm({ onSuccess }: ContactFormProps) {
	const [status, setStatus] = useState<FormStatus>("idle");
	const [serverError, setServerError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<ContactFormData>({
		resolver: zodResolver(contactFormSchema),
		defaultValues: {
			name: "",
			email: "",
			message: "",
			honeypot: "",
		},
	});

	useEffect(() => {
		if (status === "success") {
			const timer = setTimeout(() => {
				setStatus("idle");
			}, 2000);
			return () => clearTimeout(timer);
		}
	}, [status]);

	const onSubmit = async (data: ContactFormData) => {
		setStatus("sending");
		setServerError(null);

		const result = await sendEmail(data);

		if (result.success) {
			setStatus("success");
			reset();
			onSuccess?.();
		} else {
			setStatus("error");
			setServerError(result.error ?? "Transmission failed");
		}
	};

	const isDisabled = status === "sending" || status === "success";

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
			{/* Honeypot field - hidden from users, visible to bots */}
			<input
				type="text"
				{...register("honeypot")}
				className="absolute -left-[9999px]"
				tabIndex={-1}
				autoComplete="off"
				aria-hidden="true"
			/>

			<InputField
				label="Identifier"
				prefix=">_"
				placeholder="Enter name..."
				error={errors.name?.message}
				disabled={isDisabled}
				{...register("name")}
			/>

			<InputField
				label="Return Address"
				prefix="@:"
				placeholder="Enter email..."
				type="email"
				error={errors.email?.message}
				disabled={isDisabled}
				{...register("email")}
			/>

			<TextAreaField
				label="Payload"
				prefix="$:"
				placeholder="Enter message..."
				rows={5}
				error={errors.message?.message}
				disabled={isDisabled}
				{...register("message")}
			/>

			{/* Server Error */}
			{serverError && status === "error" && (
				<div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2">
					<p className="font-mono text-xs text-red-400">[ERROR] {serverError}</p>
				</div>
			)}

			{/* Submit Button / Success Confirmation */}
			<div className="relative h-11">
				<AnimatePresence mode="wait">
					{status === "success" ? (
						<motion.div
							key="success"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							className="absolute inset-0 flex items-center justify-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/10"
						>
							<Check className="h-4 w-4 text-emerald-400" />
							<span className="font-mono text-sm text-emerald-400">Transmission received</span>
						</motion.div>
					) : (
						<motion.button
							key="button"
							type="submit"
							disabled={isDisabled}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							className={clsx(
								"absolute inset-0 flex items-center justify-center gap-2 rounded",
								"font-mono text-sm font-medium",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
								status === "sending"
									? "cursor-not-allowed bg-white/5 text-white/30"
									: "bg-emerald-600 text-white hover:bg-emerald-500 active:scale-[0.98]",
							)}
						>
							{status === "sending" ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									<span>Transmitting...</span>
								</>
							) : (
								<>
									<Send className="h-4 w-4" />
									<span>Send Transmission</span>
								</>
							)}
						</motion.button>
					)}
				</AnimatePresence>
			</div>
		</form>
	);
});
