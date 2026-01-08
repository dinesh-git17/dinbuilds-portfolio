import { type NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/apps/contact";

export async function POST(request: NextRequest) {
	const body = await request.json();
	const result = await sendEmail(body);
	return NextResponse.json(result);
}
