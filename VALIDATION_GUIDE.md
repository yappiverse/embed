# Database Validation Script

This document provides validation scripts to test new database implementations.

## Quick Validation Script

```typescript
// validation-script.ts
import { DatabaseManager } from "@/lib/database-manager";

async function validateNewDatabase() {
	console.log("🔍 Validating telephony_analytics database...");

	try {
		// Test 1: Connection URL
		const url = DatabaseManager.getConnectionUrl("telephony_analytics");
		console.log("✅ Connection URL:", url ? "Available" : "Missing");

		// Test 2: Client creation
		const analyticsDb = DatabaseManager.getTelephonyAnalyticsClient();
		console.log("✅ Client created:", analyticsDb ? "Success" : "Failed");

		// Test 3: Database connectivity
		const result =
			await analyticsDb.$queryRaw`SELECT current_database() as db_name`;
		console.log("✅ Database connection:", result);

		// Test 4: Type safety
		const dbName: DatabaseName = "telephony_analytics";
		console.log("✅ Type safety:", "Valid database name");

		// Test 5: Convenience method
		const sameDb = DatabaseManager.getTelephonyAnalyticsClient();
		console.log(
			"✅ Convenience method:",
			sameDb === analyticsDb ? "Cached" : "Different",
		);

		console.log("🎉 All validation tests passed!");
		return true;
	} catch (error) {
		console.error("❌ Validation failed:", error);
		return false;
	}
}

validateNewDatabase();
```

## Comprehensive Test Suite

```typescript
// comprehensive-test.ts
import { DatabaseManager, DATABASE_NAMES } from "@/lib/database-manager";

class DatabaseValidationSuite {
	static async runAllTests() {
		console.log("🧪 Running Database Validation Suite\n");

		await this.testEnvironmentVariables();
		await this.testTypeSafety();
		await this.testConnectivity();
		await this.testConvenienceMethods();
		await this.testDatabaseDiscovery();
		await this.testErrorHandling();

		console.log("\n🎉 All validation tests completed!");
	}

	static async testEnvironmentVariables() {
		console.log("1. Testing Environment Variables:");

		const configs = DatabaseManager.getAllDatabaseConfigs();
		for (const [dbName, config] of Object.entries(configs)) {
			const url = process.env[config.envVar];
			console.log(`   ${dbName}:`, url ? "✅ Set" : "❌ Missing");
		}
	}

	static async testTypeSafety() {
		console.log("2. Testing Type Safety:");

		// Valid database names should not cause TypeScript errors
		const validNames: DatabaseName[] = [
			"telephony_account",
			"telephony_master",
			"telephony_analytics",
		];

		console.log(
			"   Valid names:",
			validNames.length === 3 ? "✅ All valid" : "❌ Missing",
		);

		// Test type guard
		const isValid = DatabaseManager.isValidDatabaseName("telephony_analytics");
		console.log("   Type guard:", isValid ? "✅ Works" : "❌ Failed");

		// Test constants
		const usingConstants = DatabaseManager.getClient(
			DATABASE_NAMES.TELEPHONY_ANALYTICS,
		);
		console.log("   Constants:", usingConstants ? "✅ Work" : "❌ Failed");
	}

	static async testConnectivity() {
		console.log("3. Testing Database Connectivity:");

		const databases = DatabaseManager.getAvailableDatabases();

		for (const dbName of databases) {
			try {
				const db = DatabaseManager.getClient(dbName);
				const result = await db.$queryRaw`SELECT current_database() as name`;
				console.log(`   ${dbName}:`, "✅ Connected");
			} catch (error) {
				console.log(`   ${dbName}:`, "❌ Connection failed");
			}
		}
	}

	static async testConvenienceMethods() {
		console.log("4. Testing Convenience Methods:");

		const methods = [
			{ name: "getTelephonyAccountClient", db: "telephony_account" },
			{ name: "getTelephonyMasterClient", db: "telephony_master" },
			{ name: "getTelephonyAnalyticsClient", db: "telephony_analytics" },
		];

		for (const method of methods) {
			try {
				const db = DatabaseManager[method.name]();
				const genericDb = DatabaseManager.getClient(method.db as DatabaseName);
				console.log(
					`   ${method.name}:`,
					db === genericDb ? "✅ Matches" : "❌ Different",
				);
			} catch (error) {
				console.log(`   ${method.name}:`, "❌ Failed");
			}
		}
	}

	static async testDatabaseDiscovery() {
		console.log("5. Testing Database Discovery:");

		const allDbs = DatabaseManager.getAvailableDatabases();
		console.log(
			"   All databases:",
			allDbs.length === 3
				? "✅ 3 found"
				: `❌ Expected 3, got ${allDbs.length}`,
		);

		const analyticsDbs = DatabaseManager.getDatabasesByCategory("analytics");
		console.log(
			"   Analytics databases:",
			analyticsDbs.includes("telephony_analytics") ? "✅ Found" : "❌ Missing",
		);

		const telephonyDbs = DatabaseManager.getDatabasesByPrefix("telephony_");
		console.log(
			"   Telephony databases:",
			telephonyDbs.length >= 3 ? "✅ Found" : "❌ Missing",
		);
	}

	static async testErrorHandling() {
		console.log("6. Testing Error Handling:");

		// Test invalid database name
		try {
			DatabaseManager.getClient("invalid_database" as DatabaseName);
			console.log("   Invalid name:", "❌ Should have thrown error");
		} catch (error) {
			console.log("   Invalid name:", "✅ Correctly rejected");
		}

		// Test missing connection URL
		try {
			DatabaseManager.getConnectionUrl("non_existent" as DatabaseName);
			console.log("   Missing URL:", "❌ Should have thrown error");
		} catch (error) {
			console.log("   Missing URL:", "✅ Correctly rejected");
		}
	}
}

// Run the test suite
DatabaseValidationSuite.runAllTests().catch(console.error);
```

## Usage Instructions

### Running Quick Validation

```bash
# Run the quick validation script
bun run validation-script.ts
```

### Running Comprehensive Tests

```bash
# Run the comprehensive test suite
bun run comprehensive-test.ts
```

### Expected Output

**Successful validation:**

```
🔍 Validating telephony_analytics database...
✅ Connection URL: Available
✅ Client created: Success
✅ Database connection: [{ db_name: 'telephony_analytics' }]
✅ Type safety: Valid database name
✅ Convenience method: Cached
🎉 All validation tests passed!
```

**Failed validation:**

```
🔍 Validating telephony_analytics database...
✅ Connection URL: Available
✅ Client created: Success
❌ Database connection: Error: Connection refused
❌ Type safety: Valid database name
✅ Convenience method: Cached
❌ Validation failed: Connection refused
```

## Troubleshooting Common Issues

### Issue 1: Environment Variable Not Set

**Symptoms:** "Connection URL not found" error
**Solution:** Add `DATABASE_URL_TELEPHONY_ANALYTICS` to your `.env` file

### Issue 2: Database Not Accessible

**Symptoms:** Connection timeout or authentication error
**Solution:** Verify database credentials and network connectivity

### Issue 3: TypeScript Errors

**Symptoms:** "Property 'telephony_analytics' does not exist" error
**Solution:** Ensure all configuration updates are made in `database-manager.ts`

### Issue 4: Method Not Found

**Symptoms:** "getTelephonyAnalyticsClient is not a function" error
**Solution:** Verify the convenience method was added to DatabaseManager class

## Validation Checklist

- [ ] Environment variable set in `.env`
- [ ] Database configuration added to `databaseConfig`
- [ ] DATABASE_NAMES constant updated
- [ ] Convenience method created
- [ ] TypeScript compilation passes
- [ ] Connection test successful
- [ ] Type safety validation passes
- [ ] Database discovery works
- [ ] Error handling functions correctly

This validation suite ensures that new databases are properly integrated and functional within the multi-database system.
