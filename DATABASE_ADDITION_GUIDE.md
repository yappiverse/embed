# Comprehensive Guide: Adding New Databases to Multi-Database Prisma Setup

## Overview

This guide provides step-by-step instructions for adding new databases to the existing modular DatabaseManager system while maintaining full type safety, IntelliSense, and developer experience.

**Current Setup:**

- Modular DatabaseManager in [`src/lib/database-manager.ts`](src/lib/database-manager.ts)
- Type-safe configuration with full IntelliSense
- Two existing databases: `telephony_account` and `telephony_master`
- Environment variables in [`.env`](.env)

---

## Step 1: Environment Setup

### 1.1 Add Environment Variable

Add the new database connection URL to your `.env` file:

```env
# Existing databases
DATABASE_URL_TELEPHONY_ACCOUNT="postgresql://user_view_telephony:XGjNHlunhKvDjrWADGXqiIjsEUwopE@172.17.4.26:5432/telephony_account?schema=stg"
DATABASE_URL_TELEPHONY_MASTER="postgresql://user_view_telephony:XGjNHlunhKvDjrWADGXqiIjsEUwopE@172.17.4.26:5432/telephony_master?schema=stg"

# NEW DATABASE - Add this line
DATABASE_URL_TELEPHONY_ANALYTICS="postgresql://user_view_telephony:XGjNHlunhKvDjrWADGXqiIjsEUwopE@172.17.4.26:5432/telephony_analytics?schema=stg"
```

**Naming Convention:** `DATABASE_URL_{DATABASE_NAME}` where `{DATABASE_NAME}` is in uppercase with underscores.

---

## Step 2: Configuration Update

### 2.1 Update Database Configuration

In [`src/lib/database-manager.ts`](src/lib/database-manager.ts), add the new database to the `databaseConfig` object:

```typescript
const databaseConfig = {
	telephony_account: {
		envVar: "DATABASE_URL_TELEPHONY_ACCOUNT",
		description:
			"Main telephony account database - stores user accounts, billing information, and call records",
		category: "telephony" as const,
	},
	telephony_master: {
		envVar: "DATABASE_URL_TELEPHONY_MASTER",
		description:
			"Telephony master database - manages system configuration, routing rules, and global settings",
		category: "telephony" as const,
	},
	// NEW DATABASE - Add this configuration
	telephony_analytics: {
		envVar: "DATABASE_URL_TELEPHONY_ANALYTICS",
		description:
			"Telephony analytics database - stores call analytics, performance metrics, and reporting data",
		category: "analytics" as const,
	},
} as const satisfies Record<string, DatabaseConfig>;
```

**Key Points:**

- Use consistent naming (lowercase with underscores)
- Provide clear, descriptive documentation
- Choose appropriate category (`telephony`, `master`, `analytics`)

---

## Step 3: Type Definitions

### 3.1 Update DatabaseName Type

The `DatabaseName` type is automatically inferred from the `databaseConfig` keys, so no manual update is needed:

```typescript
// This type is automatically updated when you add to databaseConfig
type DatabaseName = keyof typeof databaseConfig;
// Now includes: 'telephony_account' | 'telephony_master' | 'telephony_analytics'
```

### 3.2 Update DATABASE_NAMES Constants

Add the new database to the `DATABASE_NAMES` constants for enhanced type safety:

```typescript
const DATABASE_NAMES = {
	TELEPHONY_ACCOUNT: "telephony_account" as const,
	TELEPHONY_MASTER: "telephony_master" as const,
	// NEW DATABASE - Add this constant
	TELEPHONY_ANALYTICS: "telephony_analytics" as const,
} as const;
```

### 3.3 Update ALL_DATABASE_NAMES Array

This array is automatically populated from `databaseConfig` keys:

```typescript
// This is automatically updated
const ALL_DATABASE_NAMES = Object.keys(databaseConfig) as DatabaseName[];
```

---

## Step 4: Convenience Methods

### 4.1 Add Convenience Getter Method

Add a dedicated convenience method for the new database in the `DatabaseManager` class:

```typescript
class DatabaseManager {
	// ... existing methods ...

	/**
	 * Get the Prisma client for telephony_analytics database
	 * @returns PrismaClient instance for telephony_analytics
	 */
	static getTelephonyAnalyticsClient(): PrismaClient {
		return this.getClient("telephony_analytics");
	}

	// ... rest of the class ...
}
```

**Benefits:**

- Provides autocomplete and type safety
- Self-documenting method name
- Consistent with existing pattern

---

## Step 5: Testing and Validation

### 5.1 Update Test File

Update [`src/lib/database-test.ts`](src/lib/database-test.ts) to include the new database:

```typescript
async function testDatabaseManager() {
	console.log("Testing DatabaseManager implementation...");

	try {
		// Test 1: Get connection URLs
		console.log("\n1. Testing connection URLs:");
		const accountUrl = DatabaseManager.getConnectionUrl("telephony_account");
		const masterUrl = DatabaseManager.getConnectionUrl("telephony_master");
		const analyticsUrl = DatabaseManager.getConnectionUrl(
			"telephony_analytics",
		); // NEW

		console.log("Account DB URL:", accountUrl ? "✓ Set" : "✗ Missing");
		console.log("Master DB URL:", masterUrl ? "✓ Set" : "✗ Missing");
		console.log("Analytics DB URL:", analyticsUrl ? "✓ Set" : "✗ Missing"); // NEW

		// Test 2: Get Prisma clients
		console.log("\n2. Testing Prisma client creation:");
		const accountDb = DatabaseManager.getTelephonyAccountClient();
		const masterDb = DatabaseManager.getTelephonyMasterClient();
		const analyticsDb = DatabaseManager.getTelephonyAnalyticsClient(); // NEW

		console.log("Account DB client:", accountDb ? "✓ Created" : "✗ Failed");
		console.log("Master DB client:", masterDb ? "✓ Created" : "✗ Failed");
		console.log("Analytics DB client:", analyticsDb ? "✓ Created" : "✗ Failed"); // NEW

		// ... rest of test logic ...

		// Test connectivity for new database
		try {
			const analyticsInfo =
				await analyticsDb.$queryRaw`SELECT current_database() as db_name, current_user as current_user, version() as db_version`;
			console.log("Analytics DB connection:", "✓ Connected");
			console.log("Database info:", analyticsInfo);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.log("Analytics DB connection:", "✗ Failed -", errorMessage);
		}
	} catch (error) {
		console.error("❌ DatabaseManager test failed:", error);
	}
}
```

### 5.2 Update Type Safety Demo

Update [`src/lib/database-type-safety-demo.ts`](src/lib/database-type-safety-demo.ts) to demonstrate the new database:

```typescript
function demonstrateAutocomplete() {
	// When you type 'DatabaseManager.getClient('telephony_', you'll now see:
	// - telephony_account ✓
	// - telephony_master  ✓
	// - telephony_analytics ✓ NEW

	const accountDb = DatabaseManager.getClient("telephony_account");
	const masterDb = DatabaseManager.getClient("telephony_master");
	const analyticsDb = DatabaseManager.getClient("telephony_analytics"); // NEW

	console.log(
		"✅ Autocomplete demonstration successful - now includes analytics",
	);
}

function demonstrateConstantsUsage() {
	const accountDb = DatabaseManager.getClient(DATABASE_NAMES.TELEPHONY_ACCOUNT);
	const masterDb = DatabaseManager.getClient(DATABASE_NAMES.TELEPHONY_MASTER);
	const analyticsDb = DatabaseManager.getClient(
		DATABASE_NAMES.TELEPHONY_ANALYTICS,
	); // NEW

	console.log(
		"✅ Constants usage demonstration successful - now includes analytics",
	);
}
```

### 5.3 Update Usage Examples

Update [`src/lib/database-usage-example.ts`](src/lib/database-usage-example.ts) to include the new database:

```typescript
export class DatabaseUsageExample {
	/**
	 * Example 6: Basic usage for telephony_analytics database
	 */
	static async example6_basicAnalyticsUsage() {
		console.log("Example 6: Basic telephony_analytics usage");

		const analyticsDb = DatabaseManager.getTelephonyAnalyticsClient();

		try {
			// Query analytics data (assuming similar structure)
			const analyticsData = await analyticsDb.$queryRaw`
                SELECT COUNT(*) as total_records, 
                       MAX(created_at) as latest_record 
                FROM analytics_events
            `;

			console.log("Analytics data summary:", analyticsData);
			return analyticsData;
		} catch (error) {
			console.error("Error querying telephony_analytics:", error);
			throw error;
		}
	}

	/**
	 * Example 7: Using all three databases together
	 */
	static async example7_allDatabasesUsage() {
		console.log("Example 7: Using all three databases together");

		const accountDb = DatabaseManager.getTelephonyAccountClient();
		const masterDb = DatabaseManager.getTelephonyMasterClient();
		const analyticsDb = DatabaseManager.getTelephonyAnalyticsClient();

		try {
			const [accountUsers, masterTenants, analyticsSummary] = await Promise.all(
				[
					accountDb.mst_users.findMany({ take: 2 }),
					masterDb.mst_tenant.findMany({ take: 2 }),
					analyticsDb.$queryRaw`SELECT COUNT(*) as total_events FROM analytics_events`,
				],
			);

			console.log("Account users:", accountUsers.length);
			console.log("Master tenants:", masterTenants.length);
			console.log("Analytics events:", analyticsSummary);

			return { accountUsers, masterTenants, analyticsSummary };
		} catch (error) {
			console.error("Error in all databases operation:", error);
			throw error;
		}
	}
}

// Update exports
export const databaseExamples = {
	basicAccount: DatabaseUsageExample.example1_basicAccountUsage,
	basicMaster: DatabaseUsageExample.example2_basicMasterUsage,
	basicAnalytics: DatabaseUsageExample.example6_basicAnalyticsUsage, // NEW
	combined: DatabaseUsageExample.example3_combinedUsage,
	allDatabases: DatabaseUsageExample.example7_allDatabasesUsage, // NEW
	dynamic: DatabaseUsageExample.example4_dynamicSelection,
	readOnlyTransaction: DatabaseUsageExample.example5_readOnlyTransaction,
};
```

---

## Step 6: Usage Examples

### 6.1 Basic Usage

```typescript
import { DatabaseManager } from "@/lib/database-manager";

// Method 1: Using convenience method (recommended)
const analyticsDb = DatabaseManager.getTelephonyAnalyticsClient();
const analyticsData = await analyticsDb.analytics_events.findMany({
	where: { event_type: "call_completed" },
	take: 10,
});

// Method 2: Using dynamic selection
const db = DatabaseManager.getClient("telephony_analytics");
const summary =
	await db.$queryRaw`SELECT COUNT(*) as total_calls FROM call_metrics`;

// Method 3: Using constants for type safety
import { DATABASE_NAMES } from "@/lib/database-manager";
const analyticsDb = DatabaseManager.getClient(
	DATABASE_NAMES.TELEPHONY_ANALYTICS,
);
```

### 6.2 Advanced Usage Patterns

```typescript
// Pattern 1: Multi-database transactions (if needed across databases)
async function createAnalyticsRecord(userId: string, callData: any) {
	const accountDb = DatabaseManager.getTelephonyAccountClient();
	const analyticsDb = DatabaseManager.getTelephonyAnalyticsClient();

	// Get user from account DB
	const user = await accountDb.mst_users.findUnique({
		where: { id_user: userId },
	});

	// Create analytics record
	const analyticsRecord = await analyticsDb.analytics_events.create({
		data: {
			user_id: userId,
			user_name: user?.full_name,
			event_data: callData,
			created_at: new Date(),
		},
	});

	return analyticsRecord;
}

// Pattern 2: Database discovery at runtime
function getDatabasesByCategory() {
	const analyticsDbs = DatabaseManager.getDatabasesByCategory("analytics");
	console.log("Analytics databases:", analyticsDbs);
	// Output: ['telephony_analytics']
}

// Pattern 3: Type-safe dynamic database selection
function processDatabaseData(dbName: DatabaseName) {
	if (DatabaseManager.isValidDatabaseName(dbName)) {
		const db = DatabaseManager.getClient(dbName);
		const info = DatabaseManager.getDatabaseInfo(dbName);
		console.log(`Processing ${info.description}`);

		// Database-specific logic based on category
		if (info.category === "analytics") {
			return processAnalyticsData(db);
		}
	}
}
```

---

## Step 7: Validation Checklist

### 7.1 Pre-Deployment Validation

- [ ] Environment variable added to `.env`
- [ ] Database configuration updated in `databaseConfig`
- [ ] DATABASE_NAMES constant added
- [ ] Convenience method created
- [ ] TypeScript compilation passes
- [ ] Tests updated and passing
- [ ] Usage examples updated
- [ ] Documentation updated

### 7.2 Runtime Validation

```typescript
// Validation script
async function validateNewDatabase() {
	try {
		// Test connection
		const analyticsDb = DatabaseManager.getTelephonyAnalyticsClient();
		await analyticsDb.$connect();

		// Test basic query
		const result = await analyticsDb.$queryRaw`SELECT 1 as test`;
		console.log("✅ Database connection successful");

		// Test type safety
		const dbName: DatabaseName = "telephony_analytics"; // Should not show TypeScript error
		console.log("✅ Type safety validated");

		await analyticsDb.$disconnect();
		return true;
	} catch (error) {
		console.error("❌ Database validation failed:", error);
		return false;
	}
}
```

---

## Step 8: Common Patterns and Best Practices

### 8.1 Naming Conventions

- **Database names**: `telephony_analytics` (lowercase, underscores)
- **Environment variables**: `DATABASE_URL_TELEPHONY_ANALYTICS` (uppercase, underscores)
- **Constants**: `TELEPHONY_ANALYTICS` (uppercase, underscores)
- **Methods**: `getTelephonyAnalyticsClient()` (camelCase)

### 8.2 Category Strategy

Use meaningful categories to group databases:

- `telephony`: Core telephony operations
- `master`: Configuration and system data
- `analytics`: Reporting and metrics
- `archive`: Historical data
- `cache`: Temporary data

### 8.3 Error Handling

```typescript
async function safeDatabaseOperation() {
	try {
		const analyticsDb = DatabaseManager.getTelephonyAnalyticsClient();
		const data = await analyticsDb.some_table.findMany();
		return data;
	} catch (error) {
		if (error instanceof Error) {
			console.error(`Analytics database error: ${error.message}`);
		}
		throw new Error("Failed to query analytics database");
	}
}
```

---

## Summary

Adding a new database to the multi-database Prisma setup involves:

1. **Environment**: Add connection URL to `.env`
2. **Configuration**: Update `databaseConfig` with metadata
3. **Types**: Constants and types are automatically inferred
4. **Methods**: Add convenience getter method
5. **Testing**: Update test files and validation scripts
6. **Documentation**: Update usage examples and guides

The system automatically provides:

- Full TypeScript type safety
- IntelliSense autocomplete
- Runtime validation
- Consistent developer experience
- Easy database discovery and management

This modular approach ensures that adding new databases is straightforward while maintaining all the type safety and developer experience benefits of the existing system.
