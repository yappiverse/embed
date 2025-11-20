import { NextRequest, NextResponse } from "next/server";

const supersetUrl = process.env.SUPERSET_URL!;
const supersetApiUrl = `${supersetUrl}/api/v1/security`;

function mergeCookies(...cookieHeaders: (string | null)[]) {
	return cookieHeaders
		.filter(Boolean)
		.map((c) => c!.split(","))
		.flat()
		.map((v) => v.split(";")[0])
		.join("; ");
}

export async function GET(req: NextRequest) {
	try {
		const username = req.nextUrl.searchParams.get("username");
		const level = req.nextUrl.searchParams.get("level");
		if (!username || !level) {
			return NextResponse.json(
				{ error: "username and level are required" },
				{ status: 400 },
			);
		}

		const dashboards: Record<string, string> = {
			"0": process.env.SUPERSET_DASHBOARD_ID_ADMIN!,
			"1": process.env.SUPERSET_DASHBOARD_ID_ADMIN!,
			"2": process.env.SUPERSET_DASHBOARD_ID_KOOR!,
			"3": process.env.SUPERSET_DASHBOARD_ID_TL!,
			"4": process.env.SUPERSET_DASHBOARD_ID_AGENT!,
			"5": process.env.SUPERSET_DASHBOARD_ID_TENANT!,
		};

		const dashboardId = dashboards[level] ?? dashboards["0"];

		console.log("SELECTED DASHBOARD:", dashboardId);

		const loginRes = await fetch(`${supersetApiUrl}/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Referer: `${supersetUrl}/`,
			},
			body: JSON.stringify({
				username: process.env.SUPERSET_USERNAME!,
				password: process.env.SUPERSET_PASSWORD!,
				provider: "db",
				refresh: true,
			}),
		});

		const loginCookies = loginRes.headers.get("set-cookie");
		const loginData = await loginRes.json();
		const accessToken = loginData.access_token;

		if (!accessToken) {
			return NextResponse.json(
				{ error: "Superset login failed" },
				{ status: 500 },
			);
		}

		const csrfRes = await fetch(`${supersetApiUrl}/csrf_token/`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Cookie: mergeCookies(loginCookies),
				Referer: `${supersetUrl}/`,
			},
		});

		const csrfCookies = csrfRes.headers.get("set-cookie");
		const csrfData = await csrfRes.json();
		const csrfToken = csrfData.result;

		if (!csrfToken) {
			return NextResponse.json(
				{ error: "Failed to get CSRF token" },
				{ status: 500 },
			);
		}

		const allCookies = mergeCookies(loginCookies, csrfCookies);

		const guestRes = await fetch(`${supersetApiUrl}/guest_token/`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
				"X-CSRFToken": csrfToken,
				Cookie: allCookies,
				Referer: `${supersetUrl}/`,
			},
			body: JSON.stringify({
				resources: [{ type: "dashboard", id: dashboardId }],
				rls: [],
				user: {
					username,
					first_name: username,
					last_name: username,
				},
			}),
		});

		const guestData = await guestRes.json();
		return NextResponse.json({
			token: guestData.token,
			dashboardId: dashboardId,
		});
	} catch (err) {
		console.error("Superset error:", err);
		return NextResponse.json(
			{ error: "Failed to generate guest token" },
			{ status: 500 },
		);
	}
}
