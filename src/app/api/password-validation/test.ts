import { NextRequest, NextResponse } from "next/server";
import { DatabaseManager } from "@/lib/database-manager";
import bcrypt from "bcryptjs";

/**
 * Enhanced password validation with full IntelliSense support
 * Demonstrates using generated Prisma schemas with type safety
 */

export async function POST(req: NextRequest) {
	// TYPE SAFETY DEMONSTRATION: Full IntelliSense Examples
	// Uncomment the following section to see IntelliSense in action

	/*
    // Example 1: Get typed database clients with full IntelliSense
    const accountDb = DatabaseManager.getTelephonyAccountClient();
    const masterDb = DatabaseManager.getTelephonyMasterClient();

    // Example 2: Telephony Account Database - Full model autocomplete
    // Hover over any method to see full type information
    const accountExamples = {
        // mst_users model - autocomplete shows all fields and relations
        users: await accountDb.mst_users.findMany({
            where: { status: "active" },
            select: {
                id: true,
                nip: true,
                email: true,
                name: true,
                phone: true,
                status: true,
                // Autocomplete shows: created_at, updated_at, etc.
            },
            orderBy: { created_at: "desc" },
            take: 10,
        }),

        // mst_api model - autocomplete shows all available fields
        apis: await accountDb.mst_api.findMany({
            where: { is_active: true },
            // Autocomplete shows: id, api_name, api_key, created_at, etc.
        }),

        // mst_billing model - full type safety
        billing: await accountDb.mst_billing.findFirst({
            where: { user_id: 1 },
            // Autocomplete shows: id, user_id, amount, status, created_at, etc.
        }),
    };

    // Example 3: Telephony Master Database - Full model autocomplete
    const masterExamples = {
        // mst_config model - autocomplete shows all fields
        config: await masterDb.mst_config.findMany({
            where: { config_key: { contains: "password" } },
            // Autocomplete shows: id, config_key, config_value, description, etc.
        }),

        // mst_api model (different from account database) - autocomplete works
        apis: await masterDb.mst_api.findFirst({
            where: { api_name: "system" },
            // Autocomplete shows: id, api_name, api_key, is_active, etc.
        }),

        // mst_wl_status model - specific to master database
        whitelist: await masterDb.mst_wl_status.findMany({
            where: { status: "active" },
            // Autocomplete shows: id, ip_address, status, created_at, etc.
        }),
    };

    console.log("IntelliSense demonstration:", { accountExamples, masterExamples });

    // Example 4: Type Safety Validation - These would cause TypeScript errors
    // Uncomment to see type errors in action:
    
    // ❌ Type Error: Property 'invalid_field' does not exist on type
    // await accountDb.mst_users.findFirst({
    // 	where: { invalid_field: "value" } // TypeScript error
    // });
    
    // ❌ Type Error: Invalid value for status field
    // await accountDb.mst_users.findFirst({
    // 	where: { status: "invalid_status" } // TypeScript error
    // });
    
    // ❌ Type Error: Wrong database model access
    // await accountDb.mst_wl_status.findMany(); // TypeScript error - mst_wl_status doesn't exist in account DB
    */
	try {
		const body = await req.json();
		const { password, nip, email } = body;

		if (!nip && !email) {
			return NextResponse.json(
				{ status: "F", message: "NIP atau Email wajib diisi" },
				{ status: 400 },
			);
		}

		if (!password) {
			return NextResponse.json(
				{ status: "F", message: "Password wajib diisi" },
				{ status: 400 },
			);
		}

		let user = null;

		// Get typed database clients with full IntelliSense support
		const accountDb = DatabaseManager.getTelephonyAccountClient();
		const masterDb = DatabaseManager.getTelephonyMasterClient();

		// Example 1: Using telephony_account database with full type safety
		// Autocomplete works for all models: mst_users, mst_api, mst_billing, etc.
		if (nip) {
			user = await accountDb.mst_users.findFirst({
				where: { nip: nip },
				select: {
					nip: true,
					email: true,
					password: true,
					// Autocomplete shows all available fields: name, phone, status, etc.
				},
			});
		} else if (email) {
			user = await accountDb.mst_users.findFirst({
				where: { email: email },
				select: {
					nip: true,
					email: true,
					password: true,
					// Autocomplete shows all available fields: name, phone, status, etc.
				},
			});
		}

		// Example 2: Using telephony_master database with full type safety
		// This demonstrates accessing multiple databases in the same route
		// Uncomment to see IntelliSense for master database models
		/*
        const systemConfig = await masterDb.mst_config.findFirst({
            where: { config_key: "password_policy" },
            // Autocomplete shows all available fields: config_key, config_value, description, etc.
        });
        console.log("System password policy:", systemConfig);
        */

		if (!user) {
			return NextResponse.json(
				{ status: "F", message: "User tidak ditemukan" },
				{ status: 404 },
			);
		}

		const isMatch = await bcrypt.compare(password, user.password ?? "");

		if (isMatch) {
			return NextResponse.json(
				{ status: "T", message: "Berhasil" },
				{ status: 200 },
			);
		} else {
			return NextResponse.json(
				{ status: "F", message: "Password salah!" },
				{ status: 417 },
			);
		}
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ status: "F", message: "Internal server error" },
			{ status: 500 },
		);
	}
}
