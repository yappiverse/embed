import { DatabaseManager } from "./database-manager";

const globalForPrisma = globalThis as unknown as {
	prisma:
		| ReturnType<typeof DatabaseManager.getTelephonyAccountClient>
		| undefined;
};

export const prisma =
	globalForPrisma.prisma ?? DatabaseManager.getTelephonyAccountClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { DatabaseManager };
