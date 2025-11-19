import { PrismaClient } from "@/generated/prisma/telephony_account";
import { DatabaseManager } from "./database-manager";

// Legacy Prisma client for backward compatibility (uses telephony_account)
const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const prisma =
	globalForPrisma.prisma ?? DatabaseManager.getTelephonyAccountClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Export DatabaseManager for new multi-database functionality
export { DatabaseManager };
