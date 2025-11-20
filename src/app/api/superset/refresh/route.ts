import { NextRequest, NextResponse } from "next/server";

const supersetUrl = process.env.SUPERSET_URL!;
const supersetApiUrl = `${supersetUrl}/api/v1/security`;

/**
 * POST /api/v1/security/refresh
 * Refresh Superset access token using refresh token
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { refresh_token } = body;

        // Validate refresh token presence
        if (!refresh_token) {
            return NextResponse.json(
                { error: "refresh_token is required" },
                { status: 400 }
            );
        }

        // Call Superset refresh endpoint
        const refreshRes = await fetch(`${supersetApiUrl}/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Referer: `${supersetUrl}/`,
            },
            body: JSON.stringify({
                refresh_token,
            }),
        });

        if (!refreshRes.ok) {
            // Handle different error cases
            if (refreshRes.status === 401) {
                return NextResponse.json(
                    { error: "Invalid or expired refresh token" },
                    { status: 401 }
                );
            }

            const errorData = await refreshRes.json();
            return NextResponse.json(
                { error: errorData.message || "Failed to refresh token" },
                { status: refreshRes.status }
            );
        }

        const refreshData = await refreshRes.json();

        // Extract the new access token from response
        const accessToken = refreshData.access_token;

        if (!accessToken) {
            return NextResponse.json(
                { error: "No access token received from Superset" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            access_token: accessToken,
        });

    } catch (err) {
        console.error("Refresh token error:", err);
        return NextResponse.json(
            { error: "Internal server error during token refresh" },
            { status: 500 }
        );
    }
}