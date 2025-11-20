import { PrismaClient as TelephonyAccountClient } from "@/generated/prisma/telephony_account";
import { PrismaClient as TelephonyMasterClient } from "@/generated/prisma/telephony_master";

type DatabaseConfig = {
	envVar: string;
	description: string;
	category: "telephony" | "master" | "analytics";
};

type DatabaseName = "telephony_account" | "telephony_master";

const databaseConfig: Record<DatabaseName, DatabaseConfig> = {
	telephony_account: {
		envVar: "DATABASE_URL_TELEPHONY_ACCOUNT",
		description: "Main telephony account database",
		category: "telephony",
	},
	telephony_master: {
		envVar: "DATABASE_URL_TELEPHONY_MASTER",
		description: "Telephony master database",
		category: "telephony",
	},
};

// Cache env values immediately at module load
const connectionUrls = new Map<DatabaseName, string>();

for (const dbName in databaseConfig) {
	const cfg = databaseConfig[dbName as DatabaseName];
	const url = process.env[cfg.envVar];
	if (url) connectionUrls.set(dbName as DatabaseName, url);
}

// Cached Prisma clients
const instances = new Map<
	DatabaseName,
	TelephonyAccountClient | TelephonyMasterClient
>();

class DatabaseManager {
	static getClient(
		dbName: DatabaseName,
	): TelephonyAccountClient | TelephonyMasterClient {
		const existing = instances.get(dbName);
		if (existing) return existing;

		const url = connectionUrls.get(dbName);
		if (!url) throw new Error(`Missing database URL for ${dbName}`);

		const client =
			dbName === "telephony_account"
				? new TelephonyAccountClient({ datasources: { db: { url } } })
				: new TelephonyMasterClient({ datasources: { db: { url } } });

		instances.set(dbName, client);
		return client;
	}

	static getTelephonyAccountClient() {
		return this.getClient("telephony_account") as TelephonyAccountClient;
	}

	static getTelephonyMasterClient() {
		return this.getClient("telephony_master") as TelephonyMasterClient;
	}

	static async disconnectAll() {
		await Promise.all([...instances.values()].map((c) => c.$disconnect()));
		instances.clear();
	}
}

export { DatabaseManager };
