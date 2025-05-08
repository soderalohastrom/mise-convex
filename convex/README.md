# Mise - Hospitality Industry Talent Platform

## Backend Overview

This directory contains the Convex backend code for the Mise platform. Mise is a platform designed to match service industry talent with restaurants and hospitality businesses.

## Project Structure

- `schema.ts`: Defines the database schema with tables and indexes
- `index.ts`: Main entry point that re-exports functions for client access
- `talent.ts`: Functions for managing talent profiles
- `teams.ts`: Functions for managing teams and job postings
- `applications.ts`: Functions for handling job applications
- `matching.ts`: Functions for matching talent with jobs
- `search.ts`: Advanced search functions for finding talent and jobs
- `utils.ts`: Utility functions and predefined options management

## Database Schema

The application uses the following tables:

- `talent`: User profiles for hospitality workers
- `teams`: Profiles for restaurants and hospitality businesses
- `teamMembers`: Many-to-many relationship between talent and teams
- `skills`: Available skills for talent profiles
- `talentSkills`: Many-to-many relationship between talent and skills
- `talentLanguages`: Languages spoken by talent
- `jobPostings`: Job listings created by teams
- `applications`: Job applications submitted by talent
- `matches`: Confirmed employment relationships
- `predefinedOptions`: Lookup values for various fields

## Key Features

1. **Talent Management**:
   - Profile creation and management
   - Skill and language tracking
   - Availability schedule

2. **Team Management**:
   - Business profile management
   - Team member management
   - Job posting creation

3. **Job Application Process**:
   - Job search with matching scores
   - Application submission and tracking
   - Matching and hiring workflow

4. **Search Functionality**:
   - Advanced filtering for talent and jobs
   - Matching based on skills, location, availability

## Authentication

The system uses Clerk for authentication. Each talent profile is associated with a Clerk user via the `tokenIdentifier` field.

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Start the Convex development server:
   ```
   npx convex dev
   ```

3. Initialize predefined options (first-time setup):
   ```javascript
   // In your client code
   import { api } from "./_generated/api";
   import { useMutation } from "convex/react";

   const initOptions = useMutation(api.utils.initializePredefinedOptions);
   // Call this once when setting up the application
   initOptions();
   ```

## Client Integration

On the client side, use the Convex React hooks to interact with the backend:

```javascript
import { api } from "./_generated/api";
import { useQuery, useMutation } from "convex/react";

// Reading data
const talentProfile = useQuery(api.index.getTalentProfile);

// Writing data
const updateProfile = useMutation(api.index.createOrUpdateTalentProfile);
updateProfile({
  firstName: "John",
  lastName: "Doe",
  // ...other required fields
});
```

## Development Notes

- All timestamp fields (`createdAt`, `updatedAt`) use `Date.now()` for consistency
- Most functions require authentication via Clerk
- Use the predefined options system for dropdown values to maintain consistency
- Relations between tables use Convex IDs and appropriate indexes

## Next Steps

1. Implement notification system for new applications and matches
2. Add rating and review system for completed matches
3. Enhance search with more sophisticated matching algorithms
4. Add file upload capabilities for talent portfolios
5. Implement messaging between talent and teams
