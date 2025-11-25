import { NextResponse } from "next/server";

export async function POST() {
	return NextResponse.json(
		{
			error:
				"Refresh token functionality has been disabled. Please use fresh login instead.",
			code: "REFRESH_DISABLED",
		},
		{ status: 410 },
	);
}
