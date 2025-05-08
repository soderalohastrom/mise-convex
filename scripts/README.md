# Mise Scripts

This directory contains utility scripts for the Mise application. These scripts help with development, testing, and deployment tasks.

## Available Scripts

### Database Management

#### `init_data.js`
Initializes the database with sample data for development and testing.

```bash
npx convex run scripts/init_data.js
```

#### `reset_database.js`
Clears all tables in the database, effectively resetting it to an empty state.

```bash
npx convex run scripts/reset_database.js
```

#### `export_data.js`
Exports all data from the database to JSON files in the `data_export` directory.

```bash
npx convex run scripts/export_data.js
```

### Development Helpers

#### `generate_test_data.js`
Generates more varied test data than the basic `init_data.js` script. You can specify the number of records to create.

```bash
# Default counts
npx convex run scripts/generate_test_data.js

# Custom counts
npx convex run scripts/generate_test_data.js --args='{"talentCount": 20, "teamsCount": 10, "jobPostingsPerTeam": 3, "applicationsCount": 30}'
```

#### `validate_schema.js`
Validates the database schema and checks for inconsistencies, orphaned records, and other issues.

```bash
npx convex run scripts/validate_schema.js
```

### Deployment

#### `deploy.js`
Automates the deployment process, including running tests, validating the schema, building the application, and deploying to Convex.

```bash
# Deploy to production
node scripts/deploy.js

# Deploy to staging
node scripts/deploy.js --env=staging

# Skip tests
node scripts/deploy.js --skip-tests

# Skip schema validation
node scripts/deploy.js --skip-validation
```

## Usage in Development Workflow

Here's a typical development workflow using these scripts:

1. **Initial Setup**:
   ```bash
   # Clone the repository and install dependencies
   git clone <repository-url>
   cd mise
   npm install
   
   # Start Convex development server
   npx convex dev
   
   # In another terminal, initialize with sample data
   npx convex run scripts/init_data.js
   ```

2. **Development with Test Data**:
   ```bash
   # Generate more varied test data
   npx convex run scripts/generate_test_data.js
   
   # Start the frontend development server
   npm run dev
   ```

3. **Validation and Testing**:
   ```bash
   # Validate the database schema
   npx convex run scripts/validate_schema.js
   
   # Run tests
   npm test
   ```

4. **Deployment**:
   ```bash
   # Deploy to staging
   node scripts/deploy.js --env=staging
   
   # Deploy to production
   node scripts/deploy.js
   ```

5. **Database Management**:
   ```bash
   # Export data for backup
   npx convex run scripts/export_data.js
   
   # Reset database (use with caution!)
   npx convex run scripts/reset_database.js
   ```

## Adding New Scripts

When adding new scripts to this directory:

1. Follow the existing pattern of using Convex's `mutation` or `query` functions
2. Add proper documentation at the top of the script
3. Update this README with information about the new script
4. Make sure the script is executable and properly handles errors

## Best Practices

- Always back up data before running destructive scripts like `reset_database.js`
- Use the `--preview` flag with Convex deployments to test changes in a safe environment
- Run `validate_schema.js` before deploying to catch potential issues
- Use descriptive commit messages when making changes to scripts
