import { NextRequest, NextResponse } from "next/server";

const supersetUrl = process.env.SUPERSET_URL!;
const supersetApiUrl = `${supersetUrl}/api/v1/security`;

const refreshTokenStore = new Map<string, string>();

function mergeCookies(...cookieHeaders: (string | null)[]) {
	return cookieHeaders
		.filter(Boolean)
		.map((c) => c!.split(","))
		.flat()
		.map((v) => v.split(";")[0])
		.join("; ");
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
	try {
		const refreshRes = await fetch(`${supersetApiUrl}/refresh`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Referer: `${supersetUrl}/`,
			},
			body: JSON.stringify({
				refresh_token: refreshToken,
			}),
		});

		if (!refreshRes.ok) {
			throw new Error(`Token refresh failed: ${refreshRes.status}`);
		}

		const refreshData = await refreshRes.json();
		return refreshData.access_token;
	} catch (error) {
		console.error("Token refresh error:", error);
		throw error;
	}
}

async function getValidAccessToken(): Promise<{ accessToken: string; refreshToken: string }> {
	const storedRefreshToken = refreshTokenStore.get("superset_admin");

	if (storedRefreshToken) {
		try {
			const newAccessToken = await refreshAccessToken(storedRefreshToken);
			return { accessToken: newAccessToken, refreshToken: storedRefreshToken };
		} catch (error) {
			console.log("Refresh token expired or invalid, performing fresh login", error);
		}
	}

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

	if (!loginRes.ok) {
		throw new Error(`Superset login failed: ${loginRes.status}`);
	}

	const loginData = await loginRes.json();
	const accessToken = loginData.access_token;
	const refreshToken = loginData.refresh_token;

	if (!accessToken) {
		throw new Error("No access token received from Superset");
	}

	if (refreshToken) {
		refreshTokenStore.set("superset_admin", refreshToken);
	}

	return { accessToken, refreshToken: refreshToken || "" };
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { username, level } = body;

		if (!username || level === undefined || level === null) {
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

		const dashboardId = dashboards[String(level)] ?? dashboards["0"];


		const { accessToken } = await getValidAccessToken();

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

