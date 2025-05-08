import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Talent (hospitality workers/users)
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
  .index("by_area", ["interestedWorkingArea"]), // For finding talent in specific areas

  // Teams (restaurants/hospitality businesses)
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
  .index("by_service_style", ["serviceStyle"]), // For looking up teams by service style

  // Team members - joining talent and teams (many-to-many)
  teamMembers: defineTable({
    talentId: v.id("talent"),
    teamId: v.id("teams"),
    position: v.string(), // Position in the team (chef, server, etc.)
    role: v.string(), // "owner", "admin", "member", etc.
    joinedAt: v.number(),
  })
  .index("by_talent", ["talentId"]) // Find all teams a talent belongs to
  .index("by_team", ["teamId"]) // Find all members of a team
  .index("by_team_and_talent", ["teamId", "talentId"]), // Check if a talent is in a team

  // Special skills
  skills: defineTable({
    name: v.string(),
    category: v.string(), // "BOH", "FOH", "General"
    createdAt: v.number(),
  })
  .index("by_category", ["category"]), // For finding skills by category

  // Talent skills - joining talent and skills (many-to-many)
  talentSkills: defineTable({
    talentId: v.id("talent"),
    skillId: v.id("skills"),
    addedAt: v.number(),
  })
  .index("by_talent", ["talentId"]) // Find all skills a talent has
  .index("by_skill", ["skillId"]), // Find all talent with a specific skill

  // Languages spoken by talent
  talentLanguages: defineTable({
    talentId: v.id("talent"),
    language: v.string(),
    addedAt: v.number(),
  })
  .index("by_talent", ["talentId"]) // Find all languages a talent speaks
  .index("by_language", ["language"]), // Find all talent who speak a specific language

  // Job postings/requirements
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
  .index("by_team_and_active", ["teamId", "isActive"]), // Find active job postings for a team

  // Applications (when talent applies to a job posting)
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
  .index("by_talent_and_job_posting", ["talentId", "jobPostingId"]), // Check if a talent has applied to a job posting

  // Matches (confirmed employment relationships)
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
  .index("by_application", ["applicationId"]), // Find match by application

  // Predefined options for various fields
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
  .index("by_category_and_active", ["category", "isActive"]), // For looking up active options by category
});
