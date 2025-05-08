# Mise Database Schema Documentation

This document provides detailed information about the Convex database schema used in the Mise application.

## Overview

The Mise database uses a document-relational model through Convex, which stores JSON-like nested objects (documents) within tables. Relationships between documents in different tables are created by storing the ID of one document within another document.

## Table Definitions

### talent

This table stores detailed profiles for hospitality industry workers.

```typescript
talent: defineTable({
  // Basic user info (populated from Clerk)
  firstName: v.string(),
  lastName: v.string(),
  email: v.string(),
  phone: v.string(),
  tokenIdentifier: v.string(), // From Clerk auth
  profilePictureUrl: v.optional(v.string()),
  lastFourSSN: v.string(), // "This will become your MISE user ID"
  
  // Legal requirements
  legallyWorkInUS: v.boolean(),
  inHospitalityIndustry: v.boolean(),
  over21: v.boolean(),
  
  // Location information
  livingArea: v.string(), // Where they live
  interestedWorkingArea: v.string(), // Where they want to work
  commuteMethod: v.array(v.string()), // How they commute
  
  // Job preferences
  serviceStylePreferences: v.array(v.string()), // What service styles they're interested in
  positionPreferences: v.array(v.string()), // Up to 3 positions they're looking for
  experienceLevel: v.string(), // Experience in top position
  
  // Availability (stored as a structured object)
  availability: v.object({
    monday: v.array(v.string()),
    tuesday: v.array(v.string()),
    wednesday: v.array(v.string()),
    thursday: v.array(v.string()),
    friday: v.array(v.string()),
    saturday: v.array(v.string()),
    sunday: v.array(v.string()),
  }),
  
  // Previous job
  lastJobName: v.optional(v.string()),
  lastJobPosition: v.optional(v.string()),
  lastJobDuration: v.optional(v.string()),
  lastJobLeaveReason: v.optional(v.string()),
  lastJobContactable: v.optional(v.boolean()),
  
  // Compensation requirements
  desiredHourlyWage: v.optional(v.number()), // For hourly positions
  desiredYearlySalary: v.optional(v.number()), // For salaried positions
  
  // Start date preference
  startDatePreference: v.string(),
  
  // Status and metadata
  profileComplete: v.boolean(),
  currentTeamId: v.optional(v.id("teams")), // Currently active team
  createdAt: v.number(), // Timestamp
  updatedAt: v.number(), // Timestamp
  
  // Additional notes
  additionalNotes: v.optional(v.string()),
})
.index("by_token", ["tokenIdentifier"]) // For looking up talent by Clerk token
.index("by_email", ["email"]) // For looking up talent by email
.index("by_last_four_ssn", ["lastFourSSN"]) // For looking up talent by SSN (MISE user ID)
.index("by_positions", ["positionPreferences"]) // For finding talent with specific positions
.index("by_area", ["interestedWorkingArea"]) // For finding talent in specific areas
```

#### Indexes
- **by_token**: Efficiently lookup talent by their authentication token
- **by_email**: Find talent by email address
- **by_last_four_ssn**: Find talent by their MISE user ID
- **by_positions**: Find talent that have specific position preferences
- **by_area**: Find talent that want to work in specific areas

### teams

This table represents restaurants and hospitality businesses.

```typescript
teams: defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  industry: v.string(), // Type of establishment (fine dining, casual, etc.)
  size: v.optional(v.string()), // Size of the establishment
  location: v.string(), // Area location
  address: v.optional(v.string()),
  serviceStyle: v.string(), // Service style (fine dining, casual, etc)
  
  // Contact information
  contactEmail: v.string(),
  contactPhone: v.optional(v.string()),
  
  // References
  ownerId: v.id("talent"), // Team owner/admin
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_owner", ["ownerId"]) // For looking up teams by owner
.index("by_location", ["location"]) // For looking up teams by location
.index("by_service_style", ["serviceStyle"]) // For looking up teams by service style
```

#### Indexes
- **by_owner**: Find teams owned by a specific talent
- **by_location**: Find teams in a specific area
- **by_service_style**: Find teams with a specific service style

### teamMembers

This table manages the many-to-many relationship between talent and teams.

```typescript
teamMembers: defineTable({
  talentId: v.id("talent"),
  teamId: v.id("teams"),
  position: v.string(), // Position in the team (chef, server, etc.)
  role: v.string(), // "owner", "admin", "member", etc.
  joinedAt: v.number(),
})
.index("by_talent", ["talentId"]) // Find all teams a talent belongs to
.index("by_team", ["teamId"]) // Find all members of a team
.index("by_team_and_talent", ["teamId", "talentId"]) // Check if a talent is in a team
```

#### Indexes
- **by_talent**: Find all teams a specific talent belongs to
- **by_team**: Find all members of a specific team
- **by_team_and_talent**: Efficiently check if a specific talent is a member of a specific team

### skills

This table catalogs skills that talent can possess.

```typescript
skills: defineTable({
  name: v.string(),
  category: v.string(), // "BOH", "FOH", "General"
  createdAt: v.number(),
})
.index("by_category", ["category"]) // For finding skills by category
```

#### Indexes
- **by_category**: Find skills by category (BOH, FOH, General)

### talentSkills

This table manages the many-to-many relationship between talent and skills.

```typescript
talentSkills: defineTable({
  talentId: v.id("talent"),
  skillId: v.id("skills"),
  addedAt: v.number(),
})
.index("by_talent", ["talentId"]) // Find all skills a talent has
.index("by_skill", ["skillId"]) // Find all talent with a specific skill
```

#### Indexes
- **by_talent**: Find all skills a specific talent has
- **by_skill**: Find all talent that have a specific skill

### talentLanguages

This table tracks languages spoken by talent.

```typescript
talentLanguages: defineTable({
  talentId: v.id("talent"),
  language: v.string(),
  addedAt: v.number(),
})
.index("by_talent", ["talentId"]) // Find all languages a talent speaks
.index("by_language", ["language"]) // Find all talent who speak a specific language
```

#### Indexes
- **by_talent**: Find all languages a specific talent speaks
- **by_language**: Find all talent who speak a specific language

### jobPostings

This table contains job listings created by teams.

```typescript
jobPostings: defineTable({
  teamId: v.id("teams"),
  title: v.string(), // Position title
  description: v.string(),
  serviceStyle: v.string(),
  positionType: v.string(), // BOH or FOH
  specificPosition: v.string(), // Specific position like chef, server, etc.
  
  // Requirements
  experienceRequired: v.string(),
  requiredSkills: v.array(v.id("skills")), // Required skills
  
  // Schedule and compensation
  shifts: v.object({
    monday: v.array(v.string()),
    tuesday: v.array(v.string()),
    wednesday: v.array(v.string()),
    thursday: v.array(v.string()),
    friday: v.array(v.string()),
    saturday: v.array(v.string()),
    sunday: v.array(v.string()),
  }),
  compensationType: v.string(), // "hourly" or "salary"
  compensationRange: v.object({
    min: v.number(),
    max: v.number(),
  }),
  
  // Status
  isActive: v.boolean(),
  startDate: v.optional(v.string()),
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_team", ["teamId"]) // Find all job postings for a team
.index("by_position", ["specificPosition"]) // Find jobs by position
.index("by_service_style", ["serviceStyle"]) // Find jobs by service style
.index("by_team_and_active", ["teamId", "isActive"]) // Find active job postings for a team
```

#### Indexes
- **by_team**: Find all job postings for a specific team
- **by_position**: Find job postings for a specific position
- **by_service_style**: Find job postings with a specific service style
- **by_team_and_active**: Find active job postings for a specific team

### applications

This table tracks talent applications to job postings.

```typescript
applications: defineTable({
  talentId: v.id("talent"),
  jobPostingId: v.id("jobPostings"),
  status: v.string(), // "pending", "matched", "rejected", etc.
  notes: v.optional(v.string()),
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_talent", ["talentId"]) // Find all applications by a talent
.index("by_job_posting", ["jobPostingId"]) // Find all applications for a job posting
.index("by_talent_and_job_posting", ["talentId", "jobPostingId"]) // Check if a talent has applied to a job posting
```

#### Indexes
- **by_talent**: Find all applications by a specific talent
- **by_job_posting**: Find all applications for a specific job posting
- **by_talent_and_job_posting**: Efficiently check if a talent has applied to a specific job posting

### matches

This table stores confirmed employment relationships.

```typescript
matches: defineTable({
  applicationId: v.id("applications"),
  talentId: v.id("talent"),
  teamId: v.id("teams"),
  jobPostingId: v.id("jobPostings"),
  startDate: v.string(),
  position: v.string(),
  compensationType: v.string(),
  compensationAmount: v.number(),
  status: v.string(), // "active", "completed", "terminated"
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_talent", ["talentId"]) // Find all matches for a talent
.index("by_team", ["teamId"]) // Find all matches for a team
.index("by_application", ["applicationId"]) // Find match by application
```

#### Indexes
- **by_talent**: Find all matches for a specific talent
- **by_team**: Find all matches for a specific team
- **by_application**: Find match by application ID

### predefinedOptions

This utility table stores standardized options for various fields.

```typescript
predefinedOptions: defineTable({
  category: v.string(), // E.g., "serviceStyle", "position", "shift", "area"
  value: v.string(),
  displayName: v.string(),
  isActive: v.boolean(),
  order: v.number(), // For ordering in dropdowns
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_category", ["category"]) // For looking up options by category
.index("by_category_and_active", ["category", "isActive"]) // For looking up active options by category
```

#### Indexes
- **by_category**: Find predefined options by category
- **by_category_and_active**: Find active predefined options by category

## Relationships

### talent to teams
- One-to-many relationship where a talent can be a member of multiple teams
- Implemented through the `teamMembers` table
- A talent can have a `currentTeamId` referencing their primary team

### talent to skills
- Many-to-many relationship where a talent can have multiple skills
- Implemented through the `talentSkills` table

### talent to languages
- One-to-many relationship where a talent can speak multiple languages
- Implemented through the `talentLanguages` table

### teams to jobPostings
- One-to-many relationship where a team can have multiple job postings
- Implemented by storing `teamId` in each job posting

### talent to applications
- One-to-many relationship where a talent can submit multiple applications
- Implemented by storing `talentId` in each application

### jobPostings to applications
- One-to-many relationship where a job posting can receive multiple applications
- Implemented by storing `jobPostingId` in each application

### applications to matches
- One-to-one relationship where an application can lead to a match
- Implemented by storing `applicationId` in the match

## Query Patterns

### Finding a talent by authentication token
```typescript
const talent = await ctx.db
  .query("talent")
  .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
  .unique();
```

### Finding all teams a talent belongs to
```typescript
const memberships = await ctx.db
  .query("teamMembers")
  .withIndex("by_talent", (q) => q.eq("talentId", talentId))
  .collect();

const teams = await Promise.all(
  memberships.map(async (membership) => {
    return await ctx.db.get(membership.teamId);
  })
);
```

### Finding active job postings for a team
```typescript
const jobPostings = await ctx.db
  .query("jobPostings")
  .withIndex("by_team_and_active", (q) => 
    q.eq("teamId", teamId).eq("isActive", true)
  )
  .collect();
```

### Finding talent with specific skills
```typescript
// First find the skill
const skill = await ctx.db
  .query("skills")
  .filter((q) => q.eq(q.field("name"), skillName))
  .first();

// Then find talent with this skill
const talentSkills = await ctx.db
  .query("talentSkills")
  .withIndex("by_skill", (q) => q.eq("skillId", skill._id))
  .collect();

const talentIds = talentSkills.map(record => record.talentId);
```

## Best Practices

1. **Use indexes for efficient queries**: Always use indexes when filtering or searching data.

2. **Keep documents relatively small**: Split related data into different tables when appropriate.

3. **Use transactions for multi-document operations**: Ensure consistency when updating multiple documents.

4. **Cache query results when appropriate**: For values that don't change frequently.

5. **Use pagination for large result sets**: Use `paginate()` instead of `collect()` for queries that might return a large number of results.

6. **Include timestamps**: Make sure to include `createdAt` and `updatedAt` fields in all documents.

7. **Validate input data**: Use Convex validators to ensure data integrity.

8. **Use descriptive naming**: Use clear and consistent naming for tables, fields, and indexes.
