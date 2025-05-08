# Mise - Setup Guide

This guide will walk you through setting up the Mise application for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) (v9 or later)
- Git

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd mise
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Set Up Convex

Convex is the backend service used for the application. Follow these steps to set it up:

1. Install the Convex CLI if you haven't already:

```bash
npm install -g convex
```

2. Initialize Convex in your project:

```bash
npx convex dev
```

This will:
- Prompt you to log in to Convex (a browser window will open)
- Create a new Convex project (or select an existing one)
- Create a `.env.local` file with your `CONVEX_DEPLOYMENT` variable
- Create a `convex/` directory if it doesn't exist already

3. Add the schema files:

The current schema is defined in `convex/schema.ts`. Make sure this file contains the latest schema definition.

4. Initialize the default options:

Run the following command to initialize the predefined options in the database:

```bash
npx convex run utils:initializePredefinedOptions
```

## Step 4: Set Up Clerk Authentication

Clerk is used for authentication. Follow these steps to set it up:

1. Create a Clerk account at [clerk.dev](https://clerk.dev/)
2. Create a new application in the Clerk dashboard
3. Configure the application:
   - Set up the sign-in methods (Email, Google, etc.)
   - Configure the user profile requirements
4. Get your API keys from the Clerk dashboard
5. Add your Clerk API keys to your `.env.local` file:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Step 5: Configure Environment Variables

Create a `.env.local` file in the root directory with the following variables (if not already created by Convex):

```
CONVEX_DEPLOYMENT=<your-convex-deployment-id>
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
CLERK_SECRET_KEY=<your-clerk-secret-key>
```

## Step 6: Start the Development Server

```bash
npm run dev
```

This will start both the Convex backend watcher and the frontend development server.

- Frontend: [http://localhost:5173](http://localhost:5173)
- Convex Dashboard: Access via `npx convex dashboard`

## Additional Convex Commands

Here are some useful Convex commands for development:

- `npx convex dev`: Start the Convex development server
- `npx convex dashboard`: Open the Convex dashboard
- `npx convex deploy`: Deploy to production
- `npx convex run <function-name>`: Run a specific Convex function
- `npx convex import --table <table-name> <file-path>`: Import data into a table
- `npx convex export --path <directory-path>`: Export data
- `npx convex codegen`: Update generated code without pushing

## Database Management

To inspect and manage your data during development:

1. Open the Convex dashboard:
```bash
npx convex dashboard
```

2. Navigate to the "Data" tab to see your tables and documents
3. Use the "Console" tab to run ad-hoc queries and mutations

## Troubleshooting

### Convex Connection Issues

If you're having trouble connecting to Convex:

1. Check that your `.env.local` file has the correct `CONVEX_DEPLOYMENT` value
2. Try running `npx convex dev --configure` to reconfigure your project
3. Check the Convex status page for any service disruptions

### Authentication Issues

If you're having issues with Clerk authentication:

1. Verify your API keys in the `.env.local` file
2. Check the Clerk dashboard for any configuration issues
3. Clear browser cookies and local storage

### Schema Validation Errors

If you're getting schema validation errors:

1. Make sure your schema.ts file is properly formatted
2. Check that your data matches the schema definition
3. Run `npx convex dev` to sync your schema changes

## Next Steps

After setting up the project, you can:

1. Create a talent profile by registering through the application
2. Create a team and job postings
3. Explore the matching algorithm by applying to jobs
4. Review the Convex functions in the `convex/` directory
