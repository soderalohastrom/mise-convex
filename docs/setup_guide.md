# Mise Developer Setup Guide

This guide will help you set up the Mise application for local development.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v16 or newer)
- **npm** (v7 or newer) or **yarn**
- **Git**
- A **Convex** account (for backend services)
- A **Clerk** account (for authentication)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/mise.git
cd mise
```

### 2. Install Dependencies

```bash
npm install
```

Or if you're using Yarn:

```bash
yarn
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
# Convex
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

Replace `your_convex_deployment_url`, `your_clerk_publishable_key`, and `your_clerk_secret_key` with your actual credentials.

## Convex Setup

### 1. Initialize Convex

If you haven't already, install the Convex CLI globally:

```bash
npm install -g convex
```

Then initialize Convex in your project:

```bash
npx convex dev
```

This command will:
- Prompt you to log in to your Convex account if you're not already logged in
- Guide you through creating a new Convex project if needed
- Start the development server that syncs your local Convex functions with your cloud deployment

### 2. Initialize the Database Schema

The database schema is defined in `convex/schema.ts`. The development server will automatically apply schema changes when you run `npx convex dev`.

### 3. Load Sample Data (Optional)

To load sample data for development purposes, run:

```bash
npx convex run scripts/init_data.js
```

This will populate your database with sample data for skills, predefined options, talent, teams, job postings, and applications.

## Frontend Setup

### 1. Run the Development Server

```bash
npm run dev
```

Or if you're using Yarn:

```bash
yarn dev
```

This will start the Vite development server and your application should be available at http://localhost:5173.

### 2. Authentication Configuration

Make sure you've configured Clerk properly:

1. In your Clerk dashboard, set up your application
2. Configure the sign-in and sign-up flows
3. Add the appropriate redirect URLs
4. Update the `.env` file with your credentials

## Working with Convex

### Understanding the Convex Workflow

Convex uses a document-relational database model. Here are some key concepts:

- **Tables**: Collections of documents with similar structure
- **Documents**: JSON-like objects with unique IDs
- **Indexes**: Predefined indexes for efficient querying
- **Queries**: Functions for reading data (read-only)
- **Mutations**: Functions for modifying data (can read and write)
- **Actions**: Functions that can interact with external services

### Running Convex CLI Commands

Here are some useful Convex CLI commands:

```bash
# Start development server
npx convex dev

# Run a specific function
npx convex run path/to/function

# View function logs
npx convex logs

# Deploy schema changes
npx convex deploy

# Import data into your database
npx convex import --folder ./data

# Export data from your database
npx convex export --folder ./data
```

### Common Convex Functions

#### Querying Data

```typescript
// Example: Get a document by ID
const getDocumentById = query({
  args: { id: v.id("tableName") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Example: Query with an index
const queryWithIndex = query({
  args: { value: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tableName")
      .withIndex("indexName", (q) => q.eq("fieldName", args.value))
      .collect();
  },
});
```

#### Modifying Data

```typescript
// Example: Insert a document
const insertDocument = mutation({
  args: { data: v.object({ field: v.string() }) },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tableName", args.data);
  },
});

// Example: Update a document
const updateDocument = mutation({
  args: { id: v.id("tableName"), data: v.object({ field: v.string() }) },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, args.data);
  },
});

// Example: Delete a document
const deleteDocument = mutation({
  args: { id: v.id("tableName") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});
```

## Project Structure

The Mise project follows this structure:

```
mise/
├── convex/                  # Convex backend
│   ├── schema.ts            # Database schema definition
│   ├── talent.ts            # Talent-related functions
│   ├── teams.ts             # Team-related functions
│   ├── jobPostings.ts       # Job posting functions
│   ├── applications.ts      # Application functions
│   ├── matching.ts          # Matching algorithm and functions
│   └── utils.ts             # Utility functions
├── src/                     # Frontend code
│   ├── components/          # Reusable UI components
│   ├── pages/               # Application pages
│   ├── routes/              # TanStack routing
│   └── utils/               # Frontend utilities
├── docs/                    # Documentation
└── scripts/                 # Helper scripts
    └── init_data.js         # Script to initialize database with sample data
```

## Authentication Flow

Mise uses Clerk for authentication:

1. User signs up or signs in using Clerk
2. Clerk provides a token that is stored in the browser
3. Convex uses the token to authenticate the user
4. Convex functions can access the user's identity via `ctx.auth.getUserIdentity()`
5. The `talent` table stores additional user profile information linked to the Clerk token

## Database Relationships

The key relationships in the database are:

- **talent to teams**: Many-to-many via `teamMembers` table
- **talent to skills**: Many-to-many via `talentSkills` table
- **talent to languages**: One-to-many via `talentLanguages` table
- **teams to jobPostings**: One-to-many (direct reference)
- **talent to applications**: One-to-many (direct reference)
- **applications to matches**: One-to-one (direct reference)

## Testing

### Running Tests

```bash
npm test
```

### Writing Tests

When writing tests for Convex functions, use the `convex-test` package:

```typescript
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

test("creating a talent profile", async () => {
  const t = convexTest(schema);

  // Simulate an authenticated user
  const asTalent = t.withIdentity({ name: "Test User", tokenIdentifier: "clerk:test-user" });
  
  // Run the mutation
  const talentId = await asTalent.mutation(api.talent.createOrUpdateTalentProfile, {
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    // ... other required fields
  });
  
  // Query the created profile
  const profile = await asTalent.query(api.talent.getTalentProfile);
  
  // Make assertions
  expect(profile).not.toBeNull();
  expect(profile.firstName).toBe("Test");
  expect(profile.lastName).toBe("User");
});
```

## Common Development Tasks

### Adding a New Table to the Schema

1. Edit `convex/schema.ts` to add the new table definition:

```typescript
myNewTable: defineTable({
  field1: v.string(),
  field2: v.number(),
  // ... other fields
})
.index("by_field1", ["field1"]) // Add indexes as needed
```

2. Run `npx convex dev` to apply the schema changes.

### Creating a New Query Function

1. Create a new file or edit an existing one in the `convex` directory:

```typescript
// convex/myModule.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const myNewQuery = query({
  args: {
    param1: v.string(),
    param2: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Implementation goes here
    const results = await ctx.db
      .query("myTable")
      .filter((q) => q.eq(q.field("field1"), args.param1))
      .collect();
    
    return results;
  },
});
```

2. The function will be automatically available through the generated API.

### Creating a New Mutation Function

1. Create a new file or edit an existing one in the `convex` directory:

```typescript
// convex/myModule.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const myNewMutation = mutation({
  args: {
    data: v.object({
      field1: v.string(),
      field2: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    // Perform authentication check if needed
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // Implementation goes here
    const id = await ctx.db.insert("myTable", {
      ...args.data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return id;
  },
});
```

### Using Authentication

In your Convex functions, you can access the current user's identity:

```typescript
const identity = await ctx.auth.getUserIdentity();
if (!identity) {
  throw new Error("Not authenticated");
}

// Get the token identifier
const tokenIdentifier = identity.tokenIdentifier;

// Look up the talent profile
const talent = await ctx.db
  .query("talent")
  .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
  .unique();

if (!talent) {
  throw new Error("Talent profile not found");
}

// Now you can use talent._id to reference this user
```

## Troubleshooting

### Common Issues

#### Schema Validation Errors

If you encounter schema validation errors, check the following:

- Make sure all required fields are defined in your documents
- Verify that the field types match the schema definition
- Ensure that all referenced IDs (e.g., `v.id("tableName")`) are valid

#### Authentication Issues

If you encounter authentication issues:

- Check that Clerk is properly configured
- Verify that the environment variables are correctly set
- Ensure that the `tokenIdentifier` is being correctly passed to Convex

#### Database Query Performance

If your queries are slow:

- Make sure you're using appropriate indexes
- Use `.withIndex()` whenever filtering by a field
- Consider pagination for large result sets using `.paginate()`
- Use `.first()` instead of `.unique()` when you only need one result

## Deployment

### Deploying to Production

To deploy your Convex functions to production:

```bash
npx convex deploy
```

### Environment Configuration

Make sure to set up the proper environment variables for your production deployment.

## Advanced Topics

### Pagination

For queries that may return a large number of results, use pagination:

```typescript
const paginatedQuery = query({
  args: {
    cursor: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const { results, continueCursor } = await ctx.db
      .query("tableName")
      .paginate({ cursor: args.cursor, numItems: args.limit });
    
    return {
      items: results,
      nextCursor: continueCursor,
    };
  },
});
```

### Real-Time Updates

Convex automatically provides real-time updates to your frontend when using the Convex React hooks. No additional configuration is needed.

### File Storage

To store files:

```typescript
// In a mutation function
const storageId = await ctx.storage.store(fileData);

// To retrieve a file URL
const url = await ctx.storage.getUrl(storageId);
```

## Additional Resources

- [Convex Documentation](https://docs.convex.dev/)
- [Clerk Documentation](https://clerk.dev/docs)
- [Vite Documentation](https://vitejs.dev/guide/)
- [TanStack Router Documentation](https://tanstack.com/router/latest)

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for information on how to contribute to the Mise project.
