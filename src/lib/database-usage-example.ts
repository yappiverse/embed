import { DatabaseManager, type DatabaseName } from "./database-manager";

/**
 * Example usage of DatabaseManager for different scenarios
 */
export class DatabaseUsageExample {
	/**
	 * Example 1: Basic usage for telephony_account database
	 */
	static async example1_basicAccountUsage() {
		console.log("Example 1: Basic telephony_account usage");

		const accountDb = DatabaseManager.getTelephonyAccountClient();

		try {
			// Query users from telephony_account
			const users = await accountDb.mst_users.findMany({
				take: 5,
				select: { id_user: true, full_name: true, email: true },
			});

			console.log("Sample users from telephony_account:", users);
			return users;
		} catch (error) {
			console.error("Error querying telephony_account:", error);
			throw error;
		}
	}

	/**
	 * Example 2: Basic usage for telephony_master database
	 */
	static async example2_basicMasterUsage() {
		console.log("Example 2: Basic telephony_master usage");

		const masterDb = DatabaseManager.getTelephonyMasterClient();

		try {
			// Query tenants from telephony_master (assuming similar structure)
			const tenants = await masterDb.mst_tenant.findMany({
				take: 5,
				select: { id_tenant: true, tenant_name: true },
			});

			console.log("Sample tenants from telephony_master:", tenants);
			return tenants;
		} catch (error) {
			console.error("Error querying telephony_master:", error);
			throw error;
		}
	}

	/**
	 * Example 3: Using both databases in the same operation
	 */
	static async example3_combinedUsage() {
		console.log("Example 3: Using both databases together");

		const accountDb = DatabaseManager.getTelephonyAccountClient();
		const masterDb = DatabaseManager.getTelephonyMasterClient();

		try {
			// Execute queries on both databases concurrently
			const [accountUsers, masterTenants] = await Promise.all([
				accountDb.mst_users.findMany({ take: 3 }),
				masterDb.mst_tenant.findMany({ take: 3 }),
			]);

			console.log("Account users:", accountUsers.length);
			console.log("Master tenants:", masterTenants.length);

			return { accountUsers, masterTenants };
		} catch (error) {
			console.error("Error in combined operation:", error);
			throw error;
		}
	}

	/**
	 * Example 4: Dynamic database selection
	 */
	static async example4_dynamicSelection(databaseName: DatabaseName) {
		console.log(`Example 4: Dynamic selection for ${databaseName} database`);

		const db = DatabaseManager.getClient(databaseName);

		try {
			// Generic query that works on both databases
			const result =
				await db.$queryRaw`SELECT current_database() as db_name, current_schema() as schema_name`;
			console.log(`Connected to:`, result);
			return result;
		} catch (error) {
			console.error(`Error querying ${databaseName} database:`, error);
			throw error;
		}
	}

	/**
	 * Example 5: Read-only transaction example
	 */
	static async example5_readOnlyTransaction() {
		console.log("Example 5: Read-only transaction example");

		const accountDb = DatabaseManager.getTelephonyAccountClient();

		try {
			// Example read-only transaction on account database
			const result = await accountDb.$transaction(async (tx) => {
				// Multiple read operations in a transaction
				const activeUsers = await tx.mst_users.findMany({
					where: { is_active: true },
					take: 5,
					select: { id_user: true, full_name: true, email: true },
				});

				// Count total users
				const totalUsers = await tx.mst_users.count();

				return {
					activeUsers,
					totalUsers,
				};
			});

			console.log(
				"Read-only transaction completed:",
				`Found ${result.activeUsers.length} active users out of ${result.totalUsers} total users`,
			);
			return result;
		} catch (error) {
			console.error("Read-only transaction failed:", error);
			throw error;
		}
	}
}

// Export individual examples for easy testing
export const databaseExamples = {
	basicAccount: DatabaseUsageExample.example1_basicAccountUsage,
	basicMaster: DatabaseUsageExample.example2_basicMasterUsage,
	combined: DatabaseUsageExample.example3_combinedUsage,
	dynamic: DatabaseUsageExample.example4_dynamicSelection,
	readOnlyTransaction: DatabaseUsageExample.example5_readOnlyTransaction,
};

// Run examples if this file is executed directly
if (require.main === module) {
	async function runExamples() {
		console.log("Running DatabaseManager usage examples...\n");

		try {
			await DatabaseUsageExample.example1_basicAccountUsage();
			console.log("---");

			await DatabaseUsageExample.example2_basicMasterUsage();
			console.log("---");

			await DatabaseUsageExample.example3_combinedUsage();
			console.log("---");

			await DatabaseUsageExample.example4_dynamicSelection("telephony_account");
			console.log("---");

			await DatabaseUsageExample.example4_dynamicSelection("telephony_master");
			console.log("---");

			await DatabaseUsageExample.example5_readOnlyTransaction();

			console.log("\n✅ All examples completed successfully!");
		} catch (error) {
			console.error("❌ Examples failed:", error);
		} finally {
			await DatabaseManager.disconnectAll();
		}
	}

	runExamples();
}
