#!/usr/bin/env node

/**
 * Mise Deployment Script
 * 
 * This script automates the deployment process for the Mise application.
 * It handles:
 * 1. Running tests
 * 2. Validating the schema
 * 3. Building the application
 * 4. Deploying to Convex
 * 
 * Usage: node scripts/deploy.js [--skip-tests] [--skip-validation] [--env=production|staging]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const skipTests = args.includes('--skip-tests');
const skipValidation = args.includes('--skip-validation');
const envArg = args.find(arg => arg.startsWith('--env='));
const env = envArg ? envArg.split('=')[1] : 'production';

// Validate environment
if (!['production', 'staging', 'development'].includes(env)) {
  console.error(`Invalid environment: ${env}. Must be one of: production, staging, development`);
  process.exit(1);
}

console.log(`
==============================================
🚀 Mise Deployment Script - ${env.toUpperCase()} 🚀
==============================================
`);

// Helper function to run a command and return its output
function runCommand(command, options = {}) {
  console.log(`\n> ${command}`);
  try {
    return execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf-8',
      ...options
    });
  } catch (error) {
    if (options.ignoreError) {
      console.warn(`Command failed, but continuing: ${error.message}`);
      return '';
    }
    console.error(`Command failed with exit code ${error.status}: ${error.message}`);
    process.exit(1);
  }
}

// Check if we're in the right directory
if (!fs.existsSync('convex/schema.ts')) {
  console.error('Error: This script must be run from the project root directory');
  process.exit(1);
}

// Step 1: Check for uncommitted changes
console.log('\n📋 Checking for uncommitted changes...');
const gitStatus = runCommand('git status --porcelain', { silent: true });
if (gitStatus.trim()) {
  console.warn('⚠️  Warning: You have uncommitted changes:');
  console.log(gitStatus);
  
  // Ask for confirmation
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Do you want to continue with deployment? (y/N): ', (answer) => {
    readline.close();
    if (answer.toLowerCase() !== 'y') {
      console.log('Deployment cancelled');
      process.exit(0);
    }
    continueDeployment();
  });
} else {
  console.log('✅ No uncommitted changes');
  continueDeployment();
}

function continueDeployment() {
  // Step 2: Run tests if not skipped
  if (!skipTests) {
    console.log('\n🧪 Running tests...');
    runCommand('npm test');
    console.log('✅ Tests passed');
  } else {
    console.log('\n⏩ Skipping tests');
  }
  
  // Step 3: Validate schema if not skipped
  if (!skipValidation) {
    console.log('\n🔍 Validating database schema...');
    const validationResult = runCommand('npx convex run scripts/validate_schema.js', { silent: true });
    
    if (validationResult.includes('"success":false')) {
      console.error('❌ Schema validation failed:');
      console.log(validationResult);
      
      // Ask for confirmation to continue
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('Schema validation failed. Do you want to continue anyway? (y/N): ', (answer) => {
        readline.close();
        if (answer.toLowerCase() !== 'y') {
          console.log('Deployment cancelled');
          process.exit(1);
        }
        continueBuildAndDeploy();
      });
    } else {
      console.log('✅ Schema validation passed');
      continueBuildAndDeploy();
    }
  } else {
    console.log('\n⏩ Skipping schema validation');
    continueBuildAndDeploy();
  }
}

function continueBuildAndDeploy() {
  // Step 4: Build the application
  console.log('\n🔨 Building the application...');
  runCommand('npm run build');
  console.log('✅ Build completed');
  
  // Step 5: Deploy to Convex
  console.log(`\n🚀 Deploying to Convex (${env})...`);
  
  // Set the deployment environment
  if (env === 'production') {
    runCommand('npx convex deploy');
  } else if (env === 'staging') {
    // Create a staging deployment
    runCommand('npx convex deploy --preview staging');
  } else {
    // Development deployment
    runCommand('npx convex deploy --preview development');
  }
  
  console.log(`\n✅ Deployment to ${env} completed successfully!`);
  
  // Step 6: Run post-deployment tasks if needed
  if (env === 'staging') {
    console.log('\n🔄 Running post-deployment tasks for staging...');
    // For example, initialize with test data
    runCommand('npx convex run scripts/init_data.js --preview staging', { ignoreError: true });
  }
  
  // Print deployment information
  console.log('\n📊 Deployment Information:');
  console.log(`Environment: ${env}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  try {
    const gitCommit = runCommand('git rev-parse HEAD', { silent: true }).trim();
    const gitBranch = runCommand('git rev-parse --abbrev-ref HEAD', { silent: true }).trim();
    console.log(`Git Branch: ${gitBranch}`);
    console.log(`Git Commit: ${gitCommit}`);
  } catch (error) {
    console.log('Git information not available');
  }
  
  console.log(`
==============================================
🎉 Deployment Complete! 🎉
==============================================
  `);
}
