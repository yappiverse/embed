#!/usr/bin/env bun
/**
 * Multi-Schema Manager for Prisma
 *
 * This script provides utilities for managing multiple Prisma schema files
 * and working with multiple databases from environment variables.
 */

import { execSync } from "child_process";

// Database configuration matching the DatabaseManager
const DATABASE_CONFIG = {
	telephony_account: {
		envVar: "DATABASE_URL_TELEPHONY_ACCOUNT",
		description:
			"Main telephony account database - stores user accounts, billing information, and call records",
		schemaFile: "prisma/schema.telephony_account.prisma",
		clientOutput: "src/generated/prisma/telephony_account",
	},
	telephony_master: {
		envVar: "DATABASE_URL_TELEPHONY_MASTER",
		description:
			"Telephony master database - manages system configuration, routing rules, and global settings",
		schemaFile: "prisma/schema.telephony_master.prisma",
		clientOutput: "src/generated/prisma/telephony_master",
	},
} as const;

type DatabaseName = keyof typeof DATABASE_CONFIG;

/**
 * Execute a Prisma command for a specific schema
 */
function executePrismaCommand(
	dbName: DatabaseName,
	command: string,
	additionalArgs: string[] = [],
) {
	const config = DATABASE_CONFIG[dbName];

	if (!process.env[config.envVar]) {
		console.error(`❌ Environment variable ${config.envVar} is not set`);
		process.exit(1);
	}

	const schemaArg = `--schema ${config.schemaFile}`;
	const fullCommand = `bunx prisma ${command} ${schemaArg} ${additionalArgs.join(
		" ",
	)}`;

	console.log(`🚀 Executing for ${dbName}: ${fullCommand}`);
	console.log(`📝 Database: ${config.description}`);

	try {
		execSync(fullCommand, { stdio: "inherit" });
		console.log(`✅ Successfully executed for ${dbName}`);
	} catch (error) {
		console.error(`❌ Failed to execute for ${dbName}:`, error);
		process.exit(1);
	}
}

/**
 * Pull schema from all databases
 */
function pullAllSchemas() {
	console.log("🔄 Pulling schemas from all databases...\n");

	Object.keys(DATABASE_CONFIG).forEach((dbName) => {
		console.log(`--- Pulling ${dbName} ---`);
		executePrismaCommand(dbName as DatabaseName, "db pull");
		console.log();
	});

	console.log("✅ All schemas pulled successfully");
}

/**
 * Generate clients for all schemas
 */
function generateAllClients() {
	console.log("🔧 Generating Prisma clients for all databases...\n");

	Object.keys(DATABASE_CONFIG).forEach((dbName) => {
		console.log(`--- Generating ${dbName} client ---`);
		executePrismaCommand(dbName as DatabaseName, "generate");
		console.log();
	});

	console.log("✅ All clients generated successfully");
}

/**
 * Validate all schemas
 */
function validateAllSchemas() {
	console.log("🔍 Validating all schemas...\n");

	Object.keys(DATABASE_CONFIG).forEach((dbName) => {
		console.log(`--- Validating ${dbName} schema ---`);
		executePrismaCommand(dbName as DatabaseName, "validate");
		console.log();
	});

	console.log("✅ All schemas validated successfully");
}

/**
 * Show database information
 */
function showDatabaseInfo() {
	console.log("📊 Database Information:\n");

	Object.entries(DATABASE_CONFIG).forEach(([dbName, config]) => {
		const isConfigured = !!process.env[config.envVar];
		console.log(`📁 ${dbName}:`);
		console.log(`   Description: ${config.description}`);
		console.log(`   Schema File: ${config.schemaFile}`);
		console.log(`   Client Output: ${config.clientOutput}`);
		console.log(`   Environment Variable: ${config.envVar}`);
		console.log(
			`   Status: ${isConfigured ? "✅ Configured" : "❌ Not Configured"}`,
		);
		if (isConfigured) {
			const url = process.env[config.envVar]!;
			const maskedUrl = url.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
			console.log(`   Connection: ${maskedUrl}`);
		}
		console.log();
	});
}

/**
 * Create migration for a specific database
 */
function createMigration(dbName: DatabaseName, migrationName: string) {
	console.log(`📝 Creating migration for ${dbName}: ${migrationName}`);
	executePrismaCommand(dbName, "migrate dev", ["--name", migrationName]);
}

/**
 * Deploy migrations for a specific database
 */
function deployMigrations(dbName: DatabaseName) {
	console.log(`🚀 Deploying migrations for ${dbName}`);
	executePrismaCommand(dbName, "migrate deploy");
}

// CLI argument parsing
const args = process.argv.slice(2);
const command = args[0];
const dbName = args[1] as DatabaseName | undefined;
const migrationName = args[2];

if (!command) {
	console.log(`
Multi-Schema Manager for Prisma

Usage:
  bun run scripts/multi-schema-manager.ts <command> [database] [migration-name]

Commands:
  info                    - Show database information
  pull-all                - Pull schemas from all databases
  generate-all            - Generate clients for all databases
  validate-all            - Validate all schemas
  pull <database>         - Pull schema from specific database
  generate <database>     - Generate client for specific database
  validate <database>     - Validate specific schema
  migrate-dev <database> <name> - Create migration for specific database
  migrate-deploy <database>     - Deploy migrations for specific database

Available databases:
  ${Object.keys(DATABASE_CONFIG).join(", ")}

Examples:
  bun run scripts/multi-schema-manager.ts info
  bun run scripts/multi-schema-manager.ts pull-all
  bun run scripts/multi-schema-manager.ts pull telephony_account
  bun run scripts/multi-schema-manager.ts migrate-dev telephony_master "add_new_table"
  `);
	process.exit(0);
}

// Execute commands
switch (command) {
	case "info":
		showDatabaseInfo();
		break;

	case "pull-all":
		pullAllSchemas();
		break;

	case "generate-all":
		generateAllClients();
		break;

	case "validate-all":
		validateAllSchemas();
		break;

	case "pull":
		if (!dbName || !DATABASE_CONFIG[dbName]) {
			console.error("❌ Please specify a valid database name");
			process.exit(1);
		}
		executePrismaCommand(dbName, "db pull");
		break;

	case "generate":
		if (!dbName || !DATABASE_CONFIG[dbName]) {
			console.error("❌ Please specify a valid database name");
			process.exit(1);
		}
		executePrismaCommand(dbName, "generate");
		break;

	case "validate":
		if (!dbName || !DATABASE_CONFIG[dbName]) {
			console.error("❌ Please specify a valid database name");
			process.exit(1);
		}
		executePrismaCommand(dbName, "validate");
		break;

	case "migrate-dev":
		if (!dbName || !DATABASE_CONFIG[dbName] || !migrationName) {
			console.error(
				"❌ Please specify a valid database name and migration name",
			);
			process.exit(1);
		}
		createMigration(dbName, migrationName);
		break;

	case "migrate-deploy":
		if (!dbName || !DATABASE_CONFIG[dbName]) {
			console.error("❌ Please specify a valid database name");
			process.exit(1);
		}
		deployMigrations(dbName);
		break;

	default:
		console.error(`❌ Unknown command: ${command}`);
		process.exit(1);
}
