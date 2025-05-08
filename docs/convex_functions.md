# Mise - Convex Functions Documentation

## Overview

Mise uses Convex as its backend, which provides a serverless environment with real-time data synchronization. The backend functionality is organized into several modules of query and mutation functions that handle different aspects of the application.

## Function Modules

### 1. Talent Management

Functions for managing talent profiles and related data.

#### Queries

- **`getTalentProfile`**
  - **Description**: Retrieves the complete profile for the authenticated user, including skills and languages
  - **Args**: None (uses authentication context)
  - **Returns**: Complete talent profile with skills and languages, or null if not found
  - **Authentication**: Required

#### Mutations

- **`createOrUpdateTalentProfile`**
  - **Description**: Creates or updates a talent profile with all profile information
  - **Args**:
    - All talent profile fields (personal info, preferences, availability, etc.)
    - `skills`: Array of skill names
    - `languages`: Array of language names
  - **Returns**: ID of the created/updated talent profile
  - **Authentication**: Required
  - **Side Effects**: 
    - Creates/updates talent record
    - Manages related skills and languages records
    - Updates relevant join tables (talentSkills, talentLanguages)

### 2. Team Management

Functions for managing teams (establishments) and team membership.

#### Queries

- **`getMyTeams`**
  - **Description**: Gets all teams the authenticated talent is a member of
  - **Args**: None (uses authentication context)
  - **Returns**: Array of teams with membership details and current team status
  - **Authentication**: Required

#### Mutations

- **`createTeam`**
  - **Description**: Creates a new team with the authenticated talent as owner
  - **Args**:
    - `name`: String - Team name
    - `description`: Optional String - Team description
    - `industry`: String - Industry type
    - `size`: Optional String - Establishment size
    - `location`: String - Area location
    - `address`: Optional String - Physical address
    - `serviceStyle`: String - Service style
    - `contactEmail`: String - Contact email
    - `contactPhone`: Optional String - Contact phone
  - **Returns**: ID of the created team
  - **Authentication**: Required
  - **Side Effects**:
    - Creates team record
    - Adds creator as team member with "owner" role
    - Updates talent's current team if they don't have one yet

### 3. Job Posting Management

Functions for managing job postings and related operations.

#### Queries

- **`searchJobPostings`**
  - **Description**: Searches for job postings based on criteria, with match scoring
  - **Args**:
    - `location`: Optional String - Location filter
    - `positionType`: Optional String - "BOH" or "FOH" filter
    - `specificPosition`: Optional String - Specific position filter
    - `serviceStyle`: Optional String - Service style filter
  - **Returns**: Array of job postings with team info and match scores
  - **Authentication**: Required

#### Mutations

- **`createJobPosting`**
  - **Description**: Creates a new job posting for a team
  - **Args**:
    - `teamId`: ID - Team ID
    - `title`: String - Job title
    - `description`: String - Job description
    - Job requirements and details (service style, position, skills, etc.)
    - Compensation and schedule information
  - **Returns**: ID of the created job posting
  - **Authentication**: Required
  - **Side Effects**:
    - Creates job posting record
    - Validates that the user has permission for the team

### 4. Application Management

Functions for managing applications to job postings.

#### Queries

- **`getMyApplications`**
  - **Description**: Retrieves all applications submitted by the authenticated talent
  - **Args**: None (uses authentication context)
  - **Returns**: Array of applications with job posting and team details
  - **Authentication**: Required
  
- **`getTeamApplications`**
  - **Description**: Retrieves applications for a specific team's job postings
  - **Args**:
    - `teamId`: ID - Team ID
    - `status`: Optional String - Filter by application status
  - **Returns**: Array of applications with applicant and job posting details
  - **Authentication**: Required (with team permission check)

#### Mutations

- **`applyToJob`**
  - **Description**: Submit an application to a job posting
  - **Args**:
    - `jobPostingId`: ID - Job posting ID
    - `notes`: Optional String - Application notes
  - **Returns**: Application ID and job details
  - **Authentication**: Required
  - **Side Effects**:
    - Creates application record
    - Checks for duplicate applications

### 5. Matching System

Functions for managing the matching process and confirmed matches.

#### Queries

- **`getMyMatches`**
  - **Description**: Gets all matches for the authenticated talent
  - **Args**: None (uses authentication context)
  - **Returns**: Array of matches with team and job details
  - **Authentication**: Required
  
- **`getTeamMatches`**
  - **Description**: Gets all matches for a specific team
  - **Args**:
    - `teamId`: ID - Team ID
  - **Returns**: Array of matches with talent and job details
  - **Authentication**: Required (with team permission check)

#### Mutations

- **`updateApplicationStatus`**
  - **Description**: Updates an application status, potentially creating a match
  - **Args**:
    - `applicationId`: ID - Application ID
    - `status`: String - New status ("pending", "matched", "rejected")
    - `notes`: Optional String - Status update notes
  - **Returns**: Application ID
  - **Authentication**: Required (with team permission check)
  - **Side Effects**:
    - Updates application status
    - If matched, creates match record
    - If matched, adds talent to team if not already a member

### 6. Search Functions

Functions for searching through talent and job postings.

#### Queries

- **`searchTalent`**
  - **Description**: Searches for talent based on various criteria
  - **Args**:
    - `position`: Optional String - Position filter
    - `skillNames`: Optional Array of Strings - Skills filter
    - `location`: Optional String - Location filter
    - `experienceLevel`: Optional String - Experience level filter
    - `availability`: Optional Object - Availability filter
    - `serviceStyle`: Optional String - Service style filter
  - **Returns**: Array of matching talent profiles with skills and languages
  - **Authentication**: Required (with team owner/admin check)

### 7. Utility Functions

Functions for managing predefined options and system utilities.

#### Queries

- **`getPredefinedOptions`**
  - **Description**: Gets predefined options for dropdown menus
  - **Args**:
    - `category`: String - Option category
    - `activeOnly`: Optional Boolean - Filter for active options only
  - **Returns**: Array of predefined options
  - **Authentication**: Not required

#### Mutations

- **`addPredefinedOption`**
  - **Description**: Adds a new predefined option
  - **Args**:
    - `category`: String - Option category
    - `value`: String - Option value
    - `displayName`: String - Display name
    - `isActive`: Boolean - Whether the option is active
    - `order`: Optional Number - Display order
  - **Returns**: ID of the created option
  - **Authentication**: Required (admin only)

- **`initializePredefinedOptions`**
  - **Description**: Initializes the system with default predefined options
  - **Args**: None
  - **Returns**: Status message
  - **Authentication**: Required (admin only)
  - **Side Effects**: Creates default options for service styles, positions, skills, etc.

## Implementation Notes

- All query and mutation functions are defined using Convex's TypeScript API
- Authentication is integrated with Clerk through the `ctx.auth` interface
- Most functions use indexes for efficient data retrieval
- Mutations handle complex relationships by updating multiple tables when needed
- Match score calculation is based on multiple factors (position, service style, location, availability, compensation)
