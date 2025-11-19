import { PrismaClient as TelephonyAccountClient } from "@/generated/prisma/telephony_account";
import { PrismaClient as TelephonyMasterClient } from "@/generated/prisma/telephony_master";

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
} as const;

/**
 * All available database names as a readonly array
 */
const ALL_DATABASE_NAMES = Object.keys(databaseConfig) as DatabaseName[];

class DatabaseManager {
	private static instances: Map<
		DatabaseName,
		TelephonyAccountClient | TelephonyMasterClient
	> = new Map();
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
	 * @param dbName - The database name (autocomplete shows: 'telephony_account', 'telephony_master')
	 * @returns PrismaClient instance for the specified database
	 * @throws {Error} When database name is invalid or connection URL is not found
	 */
	static getClient(
		dbName: DatabaseName,
	): TelephonyAccountClient | TelephonyMasterClient {
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

		let prisma: TelephonyAccountClient | TelephonyMasterClient;

		if (dbName === "telephony_account") {
			prisma = new TelephonyAccountClient({
				datasources: {
					db: {
						url: connectionUrl,
					},
				},
			});
		} else if (dbName === "telephony_master") {
			prisma = new TelephonyMasterClient({
				datasources: {
					db: {
						url: connectionUrl,
					},
				},
			});
		} else {
			throw new Error(`Unsupported database: ${dbName}`);
		}

		// Cache the instance
		this.instances.set(dbName, prisma);

		return prisma;
	}

	/**
	 * Get the Prisma client for telephony_account database
	 * @returns PrismaClient instance for telephony_account
	 */
	static getTelephonyAccountClient(): TelephonyAccountClient {
		return this.getClient("telephony_account") as TelephonyAccountClient;
	}

	/**
	 * Get the Prisma client for telephony_master database
	 * @returns PrismaClient instance for telephony_master
	 */
	static getTelephonyMasterClient(): TelephonyMasterClient {
		return this.getClient("telephony_master") as TelephonyMasterClient;
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
	 * @param dbName - The database name (autocomplete shows: 'telephony_account', 'telephony_master')
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
	 * @param name - The database name (autocomplete shows: 'telephony_account', 'telephony_master')
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
