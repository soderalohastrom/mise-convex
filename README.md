# Mise - Hospitality Industry Matching Platform

Mise is a platform designed to connect talent (service industry workers) with teams (restaurants and hospitality businesses). The name "Mise" comes from "mise en place," a French culinary phrase meaning "everything in its place" - which perfectly represents our mission to help the right talent find the right placement.

## Project Overview

This application aims to solve the unique challenges of staffing in the hospitality industry by creating a specialized platform that considers the specific needs of both workers and establishments.

### Key Features

- **Talent Profiles**: Comprehensive profiles for service industry workers with detailed skill sets, availability, and preferences
- **Team Management**: Tools for restaurants and hospitality businesses to manage their staff and hiring needs
- **Job Postings**: Ability to create and manage job postings with specific requirements
- **Intelligent Matching**: Algorithm to match talent with suitable positions based on multiple factors
- **Application Tracking**: Complete system to track applications from submission to hiring

## Tech Stack

- **Frontend**: React with Vite, React Native with Expo (mobile)
- **Backend**: Convex (serverless backend with real-time sync)
- **Auth**: Clerk
- **Routing**: TanStack Router

## Convex Schema

The backbone of Mise is its well-structured database schema in Convex. The main tables include:

### Core Tables

- **talent**: Service industry workers with detailed profiles
- **teams**: Restaurants and hospitality businesses
- **jobPostings**: Available positions that teams are hiring for
- **applications**: Talent applications to job postings
- **matches**: Confirmed employment relationships
- **teamMembers**: Joining talent and teams (many-to-many relationship)

### Supporting Tables

- **skills**: Catalog of skills (categorized as BOH, FOH, General)
- **talentSkills**: Joining talent and skills (many-to-many)
- **talentLanguages**: Languages spoken by talent
- **predefinedOptions**: Standardized options for various fields (service styles, positions, etc.)

## Project Structure

```
mise/
├── convex/                # Convex backend
│   ├── schema.ts          # Database schema definition
│   ├── talent.ts          # Talent-related functions
│   ├── teams.ts           # Team-related functions
│   ├── jobPostings.ts     # Job posting functions
│   ├── applications.ts    # Application functions
│   ├── matching.ts        # Matching algorithm and functions
│   └── utils.ts           # Utility functions
├── src/                   # Frontend code
│   ├── components/        # Reusable UI components
│   ├── pages/             # Application pages
│   ├── routes/            # TanStack routing
│   └── utils/             # Frontend utilities
├── docs/                  # Documentation
└── scripts/               # Helper scripts
    └── init_data.js       # Script to initialize database with sample data
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn
- Convex account
- Clerk account

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/mise.git
   cd mise
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file with the necessary Convex and Clerk credentials.

4. Initialize Convex:
   ```
   npx convex dev
   ```

5. Initialize the database with sample data:
   ```
   npx convex run scripts/init_data.js
   ```

6. Start the development server:
   ```
   npm run dev
   ```

## Database Schema Details

### Talent Table

The `talent` table stores detailed profiles for service industry workers:

- Basic user info (name, contact, authentication)
- Legal requirements (work eligibility, age verification)
- Location information and commute preferences
- Job preferences (service styles, positions)
- Availability schedule
- Previous job experience
- Compensation requirements

### Teams Table

The `teams` table represents restaurants and hospitality businesses:

- Basic info (name, description, location)
- Service style and industry details
- Contact information
- Ownership references

### Job Postings Table

The `jobPostings` table contains available positions:

- Position details (title, description)
- Requirements (skills, experience)
- Schedule and shifts
- Compensation information
- Status and start date

## API Functions

Mise uses Convex's serverless functions for backend operations:

### Talent Functions

- **createOrUpdateTalentProfile**: Create or update a talent profile
- **getTalentProfile**: Get a talent profile with skills and languages
- **searchJobPostings**: Search for job postings that match talent criteria

### Team Functions

- **createTeam**: Create a new team
- **getMyTeams**: Get teams for the current user
- **createJobPosting**: Create a job posting
- **getTeamApplications**: Get job applications for a team

### Application Functions

- **applyToJob**: Apply to a job posting
- **getMyApplications**: Get applications for the current talent
- **updateApplicationStatus**: Update application status

### Matching Functions

- **getMyMatches**: Get all matches for a talent
- **getTeamMatches**: Get all matches for a team

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please contact [project-email@example.com](mailto:project-email@example.com).
