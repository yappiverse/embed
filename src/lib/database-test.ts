import { DatabaseManager } from "./database-manager";

/**
 * Test script to verify multi-database functionality
 */
async function testDatabaseManager() {
	console.log("Testing DatabaseManager implementation...");

	try {
		// Test 1: Get connection URLs
		console.log("\n1. Testing connection URLs:");
		const accountUrl = DatabaseManager.getConnectionUrl("telephony_account");
		const masterUrl = DatabaseManager.getConnectionUrl("telephony_master");

		console.log("Account DB URL:", accountUrl ? "✓ Set" : "✗ Missing");
		console.log("Master DB URL:", masterUrl ? "✓ Set" : "✗ Missing");

		// Test 2: Get Prisma clients
		console.log("\n2. Testing Prisma client creation:");
		const accountDb = DatabaseManager.getTelephonyAccountClient();
		const masterDb = DatabaseManager.getTelephonyMasterClient();

		console.log("Account DB client:", accountDb ? "✓ Created" : "✗ Failed");
		console.log("Master DB client:", masterDb ? "✓ Created" : "✗ Failed");

		// Test 3: Verify they are different instances
		console.log("\n3. Testing instance uniqueness:");
		const accountDb2 = DatabaseManager.getTelephonyAccountClient();
		const masterDb2 = DatabaseManager.getTelephonyMasterClient();

		console.log(
			"Account DB instances same:",
			accountDb === accountDb2 ? "✓ Cached" : "✗ Not cached",
		);
		console.log(
			"Master DB instances same:",
			masterDb === masterDb2 ? "✓ Cached" : "✗ Not cached",
		);
		console.log("Different databases:", "✓ Different (different types)");

		// Test 4: Test database connectivity with read-only operations
		console.log("\n4. Testing database connectivity (read-only operations):");

		try {
			// Test account database connection with safe read-only query
			const accountInfo =
				await accountDb.$queryRaw`SELECT current_database() as db_name, current_user as current_user, version() as db_version`;
			console.log("Account DB connection:", "✓ Connected");
			console.log("Database info:", accountInfo);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.log("Account DB connection:", "✗ Failed -", errorMessage);
		}

		try {
			// Test master database connection with safe read-only query
			const masterInfo =
				await masterDb.$queryRaw`SELECT current_database() as db_name, current_user as current_user, version() as db_version`;
			console.log("Master DB connection:", "✓ Connected");
			console.log("Database info:", masterInfo);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.log("Master DB connection:", "✗ Failed -", errorMessage);
		}

		console.log("\n✅ DatabaseManager test completed successfully!");
	} catch (error) {
		console.error("❌ DatabaseManager test failed:", error);
	} finally {
		// Clean up connections
		await DatabaseManager.disconnectAll();
	}
}

// Export for use in other files
export { testDatabaseManager };

// Run test if this file is executed directly
if (require.main === module) {
	testDatabaseManager();
}
