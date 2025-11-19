# Multi-Schema Database Management Guide

This guide explains how to work with multiple database schemas in the telephony application.

## Overview

The application now supports multiple databases with separate Prisma schema files:

- **telephony_account**: Main telephony account database (user accounts, billing, call records)
- **telephony_master**: Telephony master database (system configuration, routing rules, global settings)

## Schema Files

### Current Schema Structure

```
prisma/
├── schema.prisma                    # Legacy schema (for backward compatibility)
├── schema.telephony_account.prisma  # Telephony account database schema
└── schema.telephony_master.prisma   # Telephony master database schema
```

### Generated Client Outputs

```
src/generated/prisma/
├── telephony_account/               # Generated client for telephony_account
└── telephony_master/                # Generated client for telephony_master
```

## Environment Variables

Make sure these environment variables are set in your `.env` file:

```env
DATABASE_URL_TELEPHONY_ACCOUNT="postgresql://user_view_telephony:XGjNHlunhKvDjrWADGXqiIjsEUwopE@172.17.4.26:5432/telephony_account?schema=stg"
DATABASE_URL_TELEPHONY_MASTER="postgresql://user_view_telephony:XGjNHlunhKvDjrWADGXqiIjsEUwopE@172.17.4.26:5432/telephony_master?schema=stg"
```

## Working with Multiple Schemas

### Using the Multi-Schema Manager

The easiest way to work with multiple schemas is using the provided script:

```bash
# Show database information
bun run schema:info

# Pull schemas from all databases
bun run schema:pull-all

# Generate clients for all databases
bun run schema:generate-all

# Validate all schemas
bun run schema:validate-all
```

### Individual Database Operations

```bash
# Pull schema from specific database
bun run schema:pull telephony_account
bun run schema:pull telephony_master

# Generate client for specific database
bun run schema:generate telephony_account
bun run schema:generate telephony_master

# Validate specific schema
bun run schema:validate telephony_account
```

### Manual Prisma Commands

You can also use Prisma CLI directly with the `--schema` parameter:

```bash
# Pull schema from telephony_account
bunx prisma db pull --schema prisma/schema.telephony_account.prisma

# Pull schema from telephony_master
bunx prisma db pull --schema prisma/schema.telephony_master.prisma

# Generate client for telephony_account
bunx prisma generate --schema prisma/schema.telephony_account.prisma

# Generate client for telephony_master
bunx prisma generate --schema prisma/schema.telephony_master.prisma
```

## Using DatabaseManager

The `DatabaseManager` class provides type-safe access to all databases:

```typescript
import { DatabaseManager, DATABASE_NAMES } from "@/lib/database-manager";

// Get client for specific database
const telephonyAccountClient = DatabaseManager.getClient("telephony_account");
const telephonyMasterClient = DatabaseManager.getClient("telephony_master");

// Or use convenience methods
const accountClient = DatabaseManager.getTelephonyAccountClient();
const masterClient = DatabaseManager.getTelephonyMasterClient();

// Get connection URL
const connectionUrl = DatabaseManager.getConnectionUrl("telephony_account");

// Get database information
const dbInfo = DatabaseManager.getDatabaseInfo("telephony_master");
```

### Available Database Names

```typescript
// Type-safe database names
type DatabaseName = "telephony_account" | "telephony_master";

// Constants for autocomplete
const { TELEPHONY_ACCOUNT, TELEPHONY_MASTER } = DATABASE_NAMES;
```

## Migration Workflow

### Creating Migrations

```bash
# Create migration for telephony_account
bun run schema:migrate-dev telephony_account "add_new_table"

# Create migration for telephony_master
bun run schema:migrate-dev telephony_master "update_config_table"
```

### Deploying Migrations

```bash
# Deploy migrations for telephony_account
bun run schema:migrate-deploy telephony_account

# Deploy migrations for telephony_master
bun run schema:migrate-deploy telephony_master
```

## Development Workflow

### Initial Setup

1. **Set environment variables** in `.env`
2. **Pull existing schemas**:
   ```bash
   bun run schema:pull-all
   ```
3. **Generate clients**:
   ```bash
   bun run schema:generate-all
   ```

### Daily Development

1. **Make schema changes** in the appropriate `.prisma` file
2. **Generate migration**:
   ```bash
   bun run schema:migrate-dev <database> "migration_name"
   ```
3. **Apply migration**:
   ```bash
   bun run schema:migrate-deploy <database>
   ```
4. **Generate client** (if schema changed):
   ```bash
   bun run schema:generate <database>
   ```

## Type Safety

The system provides full TypeScript type safety:

- **Database names** are validated at compile time
- **Connection URLs** are checked at runtime
- **Prisma clients** are properly typed for each database

## Troubleshooting

### Common Issues

1. **Environment variables not set**:

   - Check `.env` file exists and variables are set
   - Run `bun run schema:info` to verify configuration

2. **Schema files not found**:

   - Ensure schema files exist in `prisma/` directory
   - Run `bun run schema:pull-all` to regenerate

3. **Generated clients missing**:

   - Run `bun run schema:generate-all` to generate clients
   - Check TypeScript paths in `tsconfig.json`

4. **Connection errors**:
   - Verify database URLs in environment variables
   - Check network connectivity to database servers

### Debugging Commands

```bash
# Check environment variables
echo $DATABASE_URL_TELEPHONY_ACCOUNT
echo $DATABASE_URL_TELEPHONY_MASTER

# Test database connectivity
bunx prisma db execute --schema prisma/schema.telephony_account.prisma --stdin <<< "SELECT 1;"
bunx prisma db execute --schema prisma/schema.telephony_master.prisma --stdin <<< "SELECT 1;"
```

## Best Practices

1. **Always use DatabaseManager** instead of direct PrismaClient instantiation
2. **Run schema validation** before committing changes
3. **Generate clients** after any schema changes
4. **Use type-safe database names** from `DATABASE_NAMES`
5. **Test both databases** when making changes that affect multiple schemas

## Legacy Support

The original `prisma/schema.prisma` file is maintained for backward compatibility. Existing code using the default Prisma client will continue to work with the telephony_account database.
