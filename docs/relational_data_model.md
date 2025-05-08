# Relational Data Model in Convex

This document explains how Mise implements a relational data model using Convex's document-based database.

## Introduction to Convex's Data Model

Convex uses a document-based database where data is stored in JSON-like objects (documents) within tables. Unlike traditional SQL databases with rigid schemas, Convex provides more flexibility while still maintaining type safety through TypeScript.

Despite being document-based, Convex can effectively implement relational data patterns using document references and indexes. This document explains how we implement various relationship types in the Mise application.

## Relationship Types in Mise

### One-to-One Relationships

A one-to-one relationship exists when one record in a table is associated with exactly one record in another table.

**Example: Application to Match**

An application can lead to at most one match, and a match is associated with exactly one application.

**Implementation:**
```typescript
// applications table
applications: defineTable({
  talentId: v.id("talent"),
  jobPostingId: v.id("jobPostings"),
  status: v.string(),
  // ... other fields
})

// matches table
matches: defineTable({
  applicationId: v.id("applications"), // Reference to the application
  talentId: v.id("talent"),           // Denormalized for query efficiency
  teamId: v.id("teams"),              // Denormalized for query efficiency
  jobPostingId: v.id("jobPostings"),  // Denormalized for query efficiency
  // ... other fields
})
```

**Accessing related data:**
```typescript
// Get a match from an application
const application = await ctx.db.get(applicationId);
const match = await ctx.db
  .query("matches")
  .withIndex("by_application", (q) => q.eq("applicationId", application._id))
  .unique();

// Get an application from a match
const match = await ctx.db.get(matchId);
const application = await ctx.db.get(match.applicationId);
```

### One-to-Many Relationships

A one-to-many relationship exists when one record in a table can be associated with multiple records in another table.

**Example: Team to Job Postings**

A team can have multiple job postings, but each job posting belongs to exactly one team.

**Implementation:**
```typescript
// teams table
teams: defineTable({
  name: v.string(),
  // ... other fields
})

// jobPostings table
jobPostings: defineTable({
  teamId: v.id("teams"), // Reference to the team
  title: v.string(),
  // ... other fields
})
.index("by_team", ["teamId"]) // Index for efficient queries
```

**Accessing related data:**
```typescript
// Get all job postings for a team
const jobPostings = await ctx.db
  .query("jobPostings")
  .withIndex("by_team", (q) => q.eq("teamId", teamId))
  .collect();

// Get the team for a job posting
const jobPosting = await ctx.db.get(jobPostingId);
const team = await ctx.db.get(jobPosting.teamId);
```

### Many-to-Many Relationships

A many-to-many relationship exists when multiple records in a table can be associated with multiple records in another table.

**Example: Talent to Skills**

A talent can have multiple skills, and a skill can be possessed by multiple talent.

**Implementation:**

In this case, we use a junction table (`talentSkills`) to represent the relationship:

```typescript
// talent table
talent: defineTable({
  firstName: v.string(),
  // ... other fields
})

// skills table
skills: defineTable({
  name: v.string(),
  category: v.string(),
  // ... other fields
})

// talentSkills junction table
talentSkills: defineTable({
  talentId: v.id("talent"),
  skillId: v.id("skills"),
  addedAt: v.number(),
})
.index("by_talent", ["talentId"]) // Index for finding skills for a talent
.index("by_skill", ["skillId"])   // Index for finding talent with a skill
```

**Accessing related data:**
```typescript
// Get all skills for a talent
const talentSkillRecords = await ctx.db
  .query("talentSkills")
  .withIndex("by_talent", (q) => q.eq("talentId", talentId))
  .collect();

const skillIds = talentSkillRecords.map(record => record.skillId);
const skills = await Promise.all(
  skillIds.map(id => ctx.db.get(id))
);

// Get all talent with a specific skill
const talentSkillRecords = await ctx.db
  .query("talentSkills")
  .withIndex("by_skill", (q) => q.eq("skillId", skillId))
  .collect();

const talentIds = talentSkillRecords.map(record => record.talentId);
const talentProfiles = await Promise.all(
  talentIds.map(id => ctx.db.get(id))
);
```

**Example: Talent to Teams**

A talent can be a member of multiple teams, and a team can have multiple talent members.

```typescript
// teamMembers junction table
teamMembers: defineTable({
  talentId: v.id("talent"),
  teamId: v.id("teams"),
  position: v.string(),
  role: v.string(),
  joinedAt: v.number(),
})
.index("by_talent", ["talentId"])
.index("by_team", ["teamId"])
.index("by_team_and_talent", ["teamId", "talentId"])
```

## Data Denormalization

In some cases, we denormalize data (store redundant copies) to improve query performance. While this introduces some data duplication, it can significantly speed up common queries.

**Example: Match Table**

The `matches` table contains references to the original application, but also includes denormalized references to the talent, team, and job posting:

```typescript
matches: defineTable({
  applicationId: v.id("applications"),
  talentId: v.id("talent"),           // Denormalized
  teamId: v.id("teams"),              // Denormalized
  jobPostingId: v.id("jobPostings"),  // Denormalized
  // ... other fields
})
.index("by_talent", ["talentId"])
.index("by_team", ["teamId"])
.index("by_application", ["applicationId"])
```

This denormalization allows us to:
1. Find all matches for a talent without needing to first query the applications
2. Find all matches for a team directly
3. Still maintain the relationship to the original application

## Handling Nested Data

Convex allows for nested data structures within documents. We use this for storing structured information that doesn't need to be queried independently.

**Example: Availability Schedule**

Instead of creating a separate table for availability slots, we store them as a nested object within the talent and job posting documents:

```typescript
availability: v.object({
  monday: v.array(v.string()),
  tuesday: v.array(v.string()),
  wednesday: v.array(v.string()),
  thursday: v.array(v.string()),
  friday: v.array(v.string()),
  saturday: v.array(v.string()),
  sunday: v.array(v.string()),
})
```

This allows us to efficiently store and retrieve the entire availability schedule in a single operation.

## Working with References

When working with references between documents, it's important to maintain referential integrity. While Convex doesn't enforce this at the database level, our application logic needs to handle it.

### Creating References

When creating a document that references another document:

```typescript
// Create an application referencing talent and job posting
await ctx.db.insert("applications", {
  talentId: talentId,        // Reference to talent
  jobPostingId: jobPostingId, // Reference to job posting
  status: "pending",
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
```

### Updating References

When updating references:

```typescript
// Update a talent's current team
await ctx.db.patch(talentId, {
  currentTeamId: newTeamId,
});
```

### Deleting with References

When deleting a document, we need to handle any references to it:

```typescript
// Function to delete a talent profile and all related data
export const deleteTalentProfile = mutation({
  args: { talentId: v.id("talent") },
  handler: async (ctx, args) => {
    // Delete related team memberships
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_talent", (q) => q.eq("talentId", args.talentId))
      .collect();
    
    for (const membership of memberships) {
      await ctx.db.delete(membership._id);
    }
    
    // Delete related skills
    const talentSkills = await ctx.db
      .query("talentSkills")
      .withIndex("by_talent", (q) => q.eq("talentId", args.talentId))
      .collect();
    
    for (const skillRecord of talentSkills) {
      await ctx.db.delete(skillRecord._id);
    }
    
    // Delete related languages
    const talentLanguages = await ctx.db
      .query("talentLanguages")
      .withIndex("by_talent", (q) => q.eq("talentId", args.talentId))
      .collect();
    
    for (const langRecord of talentLanguages) {
      await ctx.db.delete(langRecord._id);
    }
    
    // Delete related applications
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_talent", (q) => q.eq("talentId", args.talentId))
      .collect();
    
    for (const application of applications) {
      // Delete related matches
      const matches = await ctx.db
        .query("matches")
        .withIndex("by_application", (q) => q.eq("applicationId", application._id))
        .collect();
      
      for (const match of matches) {
        await ctx.db.delete(match._id);
      }
      
      await ctx.db.delete(application._id);
    }
    
    // Finally, delete the talent profile
    await ctx.db.delete(args.talentId);
    
    return { success: true };
  },
});
```

## Transaction Safety

Convex automatically makes each mutation function run in a transaction, so all database operations within a single function either all succeed or all fail. This helps maintain data consistency.

## Complete Data Model Visualization

Here's a visualization of the complete data model showing all relationships:

```
talent
 │
 ├─── 1:N ───► talentLanguages
 │
 ├─── M:N ───► talentSkills ◄─── M:N ───┐
 │                                      │
 │                                    skills
 │
 ├─── M:N ───► teamMembers ◄─── M:N ───┐
 │                                     │
 │                                   teams
 │                                     │
 │                                     │
 │                                   1:N
 │                                     │
 │                                     ▼
 ├─── 1:N ───► applications ◄─── N:1 ── jobPostings
 │                │
 │                │
 │               1:1
 │                │
 │                ▼
 └─── 1:N ───► matches
```

## Best Practices

1. **Use indexes for efficient queries**
   Always define and use indexes when you'll be filtering or sorting by a field.

2. **Denormalize strategically**
   Denormalize data that is frequently accessed together but be mindful of the update complexity.

3. **Keep documents small**
   Break up large documents into smaller, related documents.

4. **Use transactions for multi-document operations**
   Take advantage of Convex's automatic transactions to keep your data consistent.

5. **Include timestamps**
   Always include `createdAt` and `updatedAt` fields for auditing and debugging.

6. **Reference validation**
   Before using an ID as a reference, validate that the referenced document exists.

7. **Handle deletion carefully**
   When deleting a document, make sure to clean up all related references.

## Conclusion

By leveraging Convex's document model along with indexes and strategic denormalization, we've implemented a comprehensive relational data model for Mise. This approach provides the flexibility of document databases while maintaining the capability to express and query complex relationships between entities.
