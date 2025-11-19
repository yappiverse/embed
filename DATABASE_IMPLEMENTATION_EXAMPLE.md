# Practical Implementation: Adding `telephony_analytics` Database

This document shows the exact code changes needed to add a new `telephony_analytics` database to the existing multi-database Prisma setup.

## Before You Start

**Current Setup:**

- 2 databases: `telephony_account` and `telephony_master`
- Type-safe DatabaseManager in [`src/lib/database-manager.ts`](src/lib/database-manager.ts)
- Environment variables in [`.env`](.env)

## Step-by-Step Implementation

### Step 1: Environment Variable

**File:** [`.env`](.env)

**Add this line:**

```env
DATABASE_URL_TELEPHONY_ANALYTICS="postgresql://user_view_telephony:XGjNHlunhKvDjrWADGXqiIjsEUwopE@172.17.4.26:5432/telephony_analytics?schema=stg"
```

**Complete .env file after addition:**

```env
# Environment variables declared in this file are NOT automatically loaded by Prisma.
# Please add `import "dotenv/config";` to your `prisma.config.ts` file, or use the Prisma CLI with Bun
# to load environment variables from .env files: https://pris.ly/prisma-config-env-vars.

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

# The following `prisma+postgres` URL is similar to the URL produced by running a local Prisma Postgres
# server with the `prisma dev` CLI command, when not choosing any non-default ports or settings. The API key, unlike the
# one found in a remote Prisma Postgres URL, does not contain any sensitive information.
DATABASE_URL_TELEPHONY_ACCOUNT="postgresql://user_view_telephony:XGjNHlunhKvDjrWADGXqiIjsEUwopE@172.17.4.26:5432/telephony_account?schema=stg"
DATABASE_URL_TELEPHONY_MASTER="postgresql://user_view_telephony:XGjNHlunhKvDjrWADGXqiIjsEUwopE@172.17.4.26:5432/telephony_master?schema=stg"
DATABASE_URL_TELEPHONY_ANALYTICS="postgresql://user_view_telephony:XGjNHlunhKvDjrWADGXqiIjsEUwopE@172.17.4.26:5432/telephony_analytics?schema=stg"
```

---

### Step 2: Update Database Configuration

**File:** [`src/lib/database-manager.ts`](src/lib/database-manager.ts)

**Find the `databaseConfig` object (lines 6-19) and add the new database:**

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

---

### Step 3: Update DATABASE_NAMES Constants

**In the same file, find `DATABASE_NAMES` (lines 38-41) and add the new constant:**

```typescript
const DATABASE_NAMES = {
	TELEPHONY_ACCOUNT: "telephony_account" as const,
	TELEPHONY_MASTER: "telephony_master" as const,
	// NEW DATABASE - Add this constant
	TELEPHONY_ANALYTICS: "telephony_analytics" as const,
} as const;
```

---

### Step 4: Add Convenience Method

**In the same file, find the `DatabaseManager` class and add the new convenience method:**

**Add this method after the existing convenience methods (around line 121):**

```typescript
class DatabaseManager {
	// ... existing methods ...

	/**
	 * Get the Prisma client for telephony_account database
	 * @returns PrismaClient instance for telephony_account
	 */
	static getTelephonyAccountClient(): PrismaClient {
		return this.getClient("telephony_account");
	}

	/**
	 * Get the Prisma client for telephony_master database
	 * @returns PrismaClient instance for telephony_master
	 */
	static getTelephonyMasterClient(): PrismaClient {
		return this.getClient("telephony_master");
	}

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

---

### Step 5: Update Database Category Type (Optional)

**If you're adding a new category, update the `DatabaseConfig` type (line 27):**

```typescript
type DatabaseConfig = {
	envVar: string;
	description: string;
	category: "telephony" | "master" | "analytics"; // Added "analytics"
};
```

---

## Complete Updated Database Manager

Here's what the complete updated [`src/lib/database-manager.ts`](src/lib/database-manager.ts) file looks like with all changes:

```typescript
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Database configuration with enhanced metadata for better IntelliSense
 */
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

/**
 * Database configuration type
 */
type DatabaseConfig = {
	envVar: string;
	description: string;
	category: "telephony" | "master" | "analytics";
};

/**
 * Explicit union type for database names with full IntelliSense support
 */
type DatabaseName = keyof typeof databaseConfig;

/**
 * Type-safe database name values for autocomplete
 */
const DATABASE_NAMES = {
	TELEPHONY_ACCOUNT: "telephony_account" as const,
	TELEPHONY_MASTER: "telephony_master" as const,
	// NEW DATABASE - Add this constant
	TELEPHONY_ANALYTICS: "telephony_analytics" as const,
} as const;

/**
 * All available database names as a readonly array
 */
const ALL_DATABASE_NAMES = Object.keys(databaseConfig) as DatabaseName[];

class DatabaseManager {
	private static instances: Map<DatabaseName, PrismaClient> = new Map();
	private static connectionUrls: Map<DatabaseName, string> = new Map();

	/**
	 * Initialize the DatabaseManager with connection URLs
	 * Automatically called on module load
	 */
	static initialize(): void {
		// Set connection URLs from environment variables using config
		for (const [dbName, config] of Object.entries(databaseConfig)) {
			const connectionUrl = process.env[config.envVar];
			if (!connectionUrl) {
				console.warn(
					`${config.envVar} environment variable is not set - database connections may fail`,
				);
				continue;
			}
			this.connectionUrls.set(dbName as DatabaseName, connectionUrl);
		}
	}

	/**
	 * Get a Prisma client for the specified database name
	 * @param dbName - The database name (autocomplete shows: 'telephony_account', 'telephony_master', 'telephony_analytics')
	 * @returns PrismaClient instance for the specified database
	 * @throws {Error} When database name is invalid or connection URL is not found
	 */
	static getClient(dbName: DatabaseName): PrismaClient {
		// Initialize if not already done
		if (this.connectionUrls.size === 0) {
			this.initialize();
		}

		// Return cached instance if available
		if (this.instances.has(dbName)) {
			return this.instances.get(dbName)!;
		}

		// Create new Prisma client with the appropriate connection URL
		const connectionUrl = this.connectionUrls.get(dbName);
		if (!connectionUrl) {
			throw new Error(`Connection URL not found for database: ${dbName}`);
		}

		const prisma = new PrismaClient({
			datasources: {
				db: {
					url: connectionUrl,
				},
			},
		});

		// Cache the instance
		this.instances.set(dbName, prisma);

		return prisma;
	}

	/**
	 * Get the Prisma client for telephony_account database
	 * @returns PrismaClient instance for telephony_account
	 */
	static getTelephonyAccountClient(): PrismaClient {
		return this.getClient("telephony_account");
	}

	/**
	 * Get the Prisma client for telephony_master database
	 * @returns PrismaClient instance for telephony_master
	 */
	static getTelephonyMasterClient(): PrismaClient {
		return this.getClient("telephony_master");
	}

	/**
	 * Get the Prisma client for telephony_analytics database
	 * @returns PrismaClient instance for telephony_analytics
	 */
	static getTelephonyAnalyticsClient(): PrismaClient {
		return this.getClient("telephony_analytics");
	}

	/**
	 * Disconnect all Prisma clients
	 */
	static async disconnectAll(): Promise<void> {
		const disconnectPromises = Array.from(this.instances.values()).map(
			async (client) => {
				await client.$disconnect();
			},
		);

		await Promise.all(disconnectPromises);
		this.instances.clear();
	}

	/**
	 * Get connection URL for a specific database
	 * @param dbName - The database name (autocomplete shows: 'telephony_account', 'telephony_master', 'telephony_analytics')
	 * @returns Connection URL string
	 * @throws {Error} When database name is invalid or connection URL is not found
	 */
	static getConnectionUrl(dbName: DatabaseName): string {
		const url = this.connectionUrls.get(dbName);
		if (!url) {
			throw new Error(`Connection URL not found for database: ${dbName}`);
		}
		return url;
	}

	/**
	 * Get all available database names as a readonly array
	 * @returns Readonly array of available database names
	 */
	static getAvailableDatabases(): readonly DatabaseName[] {
		return ALL_DATABASE_NAMES;
	}

	/**
	 * Check if a string is a valid database name
	 * @param name - The string to validate
	 * @returns Type guard indicating if the string is a valid DatabaseName
	 */
	static isValidDatabaseName(name: string): name is DatabaseName {
		return ALL_DATABASE_NAMES.includes(name as DatabaseName);
	}

	/**
	 * Get database configuration information
	 * @param name - The database name (autocomplete shows: 'telephony_account', 'telephony_master', 'telephony_analytics')
	 * @returns Database configuration object with metadata
	 */
	static getDatabaseInfo(name: DatabaseName): DatabaseConfig {
		return databaseConfig[name];
	}

	/**
	 * Get all database configurations
	 * @returns Readonly record of all database configurations
	 */
	static getAllDatabaseConfigs(): Readonly<
		Record<DatabaseName, DatabaseConfig>
	> {
		return databaseConfig;
	}

	/**
	 * Get databases by category
	 * @param category - The category to filter by
	 * @returns Array of database names in the specified category
	 */
	static getDatabasesByCategory(
		category: DatabaseConfig["category"],
	): DatabaseName[] {
		return ALL_DATABASE_NAMES.filter(
			(name) => databaseConfig[name].category === category,
		);
	}

	/**
	 * Get database names that start with a specific prefix (useful for autocomplete)
	 * @param prefix - The prefix to search for
	 * @returns Array of database names matching the prefix
	 */
	static getDatabasesByPrefix(prefix: string): DatabaseName[] {
		return ALL_DATABASE_NAMES.filter((name) => name.startsWith(prefix));
	}
}

// Initialize on module load
DatabaseManager.initialize();

export {
	DatabaseManager,
	type DatabaseName,
	type DatabaseConfig,
	DATABASE_NAMES,
	ALL_DATABASE_NAMES,
};
```

---

## Usage Examples

### Basic Usage

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

### Advanced Usage

```typescript
// Multi-database operation
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

// Database discovery
function discoverAnalyticsDatabases() {
	const analyticsDbs = DatabaseManager.getDatabasesByCategory("analytics");
	console.log("Analytics databases:", analyticsDbs);
	// Output: ['telephony_analytics']
}
```

---

## Testing the Implementation

### Quick Validation Script

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

		console.log("🎉 All validation tests passed!");
		return true;
	} catch (error) {
		console.error("❌ Validation failed:", error);
		return false;
	}
}

validateNewDatabase();
```

---

## Summary of Changes

| File                          | Changes                                  | Lines Modified |
| ----------------------------- | ---------------------------------------- | -------------- |
| `.env`                        | Added `DATABASE_URL_TELEPHONY_ANALYTICS` | +1             |
| `src/lib/database-manager.ts` | Added config, constant, and method       | +15            |
| **Total**                     | **All changes**                          | **+16 lines**  |

The implementation maintains:

- ✅ Full TypeScript type safety
- ✅ IntelliSense autocomplete
- ✅ Runtime validation
- ✅ Consistent developer experience
- ✅ Easy database discovery and management

This approach ensures that adding new databases is straightforward while preserving all the benefits of the existing multi-database system.
