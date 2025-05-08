import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new team (restaurant/establishment)
export const createTeam = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    industry: v.string(),
    size: v.optional(v.string()),
    location: v.string(),
    address: v.optional(v.string()),
    serviceStyle: v.string(),
    contactEmail: v.string(),
    contactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const talent = await ctx.db
      .query("talent")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!talent) {
      throw new Error("Talent profile not found");
    }
    
    // Create the team
    const teamId = await ctx.db.insert("teams", {
      ...args,
      ownerId: talent._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Add the creator as a team member with "owner" role
    await ctx.db.insert("teamMembers", {
      talentId: talent._id,
      teamId,
      position: "Manager", // Default position for owner
      role: "owner",
      joinedAt: Date.now(),
    });
    
    // Update talent's current team if they don't have one yet
    if (!talent.currentTeamId) {
      await ctx.db.patch(talent._id, { currentTeamId: teamId });
    }
    
    return teamId;
  },
});

// Get teams for the current user
export const getMyTeams = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    
    const talent = await ctx.db
      .query("talent")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!talent) {
      return [];
    }
    
    // Get team memberships
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_talent", (q) => q.eq("talentId", talent._id))
      .collect();
    
    // Get team details
    const teams = await Promise.all(
      memberships.map(async (membership) => {
        const team = await ctx.db.get(membership.teamId);
        if (!team) return null;
        
        return {
          ...team,
          membership: {
            position: membership.position,
            role: membership.role,
            joinedAt: membership.joinedAt,
          },
          isCurrentTeam: team._id === talent.currentTeamId,
        };
      })
    );
    
    return teams.filter(Boolean);
  },
});

// Create a job posting
export const createJobPosting = mutation({
  args: {
    teamId: v.id("teams"),
    title: v.string(),
    description: v.string(),
    serviceStyle: v.string(),
    positionType: v.string(), // BOH or FOH
    specificPosition: v.string(),
    experienceRequired: v.string(),
    requiredSkills: v.array(v.id("skills")),
    shifts: v.object({
      monday: v.array(v.string()),
      tuesday: v.array(v.string()),
      wednesday: v.array(v.string()),
      thursday: v.array(v.string()),
      friday: v.array(v.string()),
      saturday: v.array(v.string()),
      sunday: v.array(v.string()),
    }),
    compensationType: v.string(),
    compensationRange: v.object({
      min: v.number(),
      max: v.number(),
    }),
    startDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const talent = await ctx.db
      .query("talent")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!talent) {
      throw new Error("Talent profile not found");
    }
    
    // Check if user has permission for this team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_talent", (q) => 
        q.eq("teamId", args.teamId).eq("talentId", talent._id)
      )
      .unique();
    
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new Error("You don't have permission to create job postings for this team");
    }
    
    // Create the job posting
    return await ctx.db.insert("jobPostings", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get job applications for a team
export const getTeamApplications = query({
  args: {
    teamId: v.id("teams"),
    status: v.optional(v.string()), // Filter by status if provided
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const talent = await ctx.db
      .query("talent")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!talent) {
      throw new Error("Talent profile not found");
    }
    
    // Check if user has permission for this team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_talent", (q) => 
        q.eq("teamId", args.teamId).eq("talentId", talent._id)
      )
      .unique();
    
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new Error("You don't have permission to view applications for this team");
    }
    
    // Get job postings for this team
    const jobPostings = await ctx.db
      .query("jobPostings")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    
    const jobPostingIds = jobPostings.map(job => job._id);
    
    // Get applications for these job postings
    let applicationsQuery = ctx.db
      .query("applications")
      .filter((q) => q.inArray(jobPostingIds, q.field("jobPostingId")));
    
    // Apply status filter if provided
    if (args.status) {
      applicationsQuery = applicationsQuery.filter((q) => 
        q.eq(q.field("status"), args.status)
      );
    }
    
    const applications = await applicationsQuery.collect();
    
    // Enrich with applicant, job posting data
    const enrichedApplications = await Promise.all(
      applications.map(async (application) => {
        const applicant = await ctx.db.get(application.talentId);
        const jobPosting = jobPostings.find(job => job._id === application.jobPostingId);
        
        // Get applicant skills
        const talentSkillRecords = await ctx.db
          .query("talentSkills")
          .withIndex("by_talent", (q) => q.eq("talentId", application.talentId))
          .collect();
        
        const skillIds = talentSkillRecords.map(record => record.skillId);
        const skills = await Promise.all(
          skillIds.map(id => ctx.db.get(id))
        );
        
        // Get applicant languages
        const talentLanguageRecords = await ctx.db
          .query("talentLanguages")
          .withIndex("by_talent", (q) => q.eq("talentId", application.talentId))
          .collect();
        
        const languages = talentLanguageRecords.map(record => record.language);
        
        return {
          ...application,
          applicant: applicant ? {
            _id: applicant._id,
            firstName: applicant.firstName,
            lastName: applicant.lastName,
            email: applicant.email,
            phone: applicant.phone,
            experienceLevel: applicant.experienceLevel,
            positionPreferences: applicant.positionPreferences,
            availability: applicant.availability,
            skills: skills.filter(Boolean).map(skill => ({
              id: skill?._id,
              name: skill?.name,
              category: skill?.category,
            })),
            languages,
            desiredHourlyWage: applicant.desiredHourlyWage,
            desiredYearlySalary: applicant.desiredYearlySalary,
          } : null,
          jobPosting: jobPosting ? {
            _id: jobPosting._id,
            title: jobPosting.title,
            specificPosition: jobPosting.specificPosition,
            shifts: jobPosting.shifts,
            compensationType: jobPosting.compensationType,
            compensationRange: jobPosting.compensationRange,
          } : null,
        };
      })
    );
    
    return enrichedApplications.filter(app => app.applicant && app.jobPosting);
  },
});

// Get job postings for a team
export const getTeamJobPostings = query({
  args: {
    teamId: v.id("teams"),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const talent = await ctx.db
      .query("talent")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!talent) {
      throw new Error("Talent profile not found");
    }
    
    // Check if user has permission for this team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_talent", (q) => 
        q.eq("teamId", args.teamId).eq("talentId", talent._id)
      )
      .unique();
    
    if (!membership) {
      throw new Error("You don't have permission to view job postings for this team");
    }
    
    // Get job postings
    let jobPostingsQuery = ctx.db
      .query("jobPostings")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId));
    
    // Filter by active status if requested
    if (args.activeOnly) {
      jobPostingsQuery = jobPostingsQuery.filter((q) => 
        q.eq(q.field("isActive"), true)
      );
    }
    
    const jobPostings = await jobPostingsQuery.collect();
    
    return jobPostings;
  },
});

// Update team info
export const updateTeam = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    industry: v.optional(v.string()),
    size: v.optional(v.string()),
    location: v.optional(v.string()),
    address: v.optional(v.string()),
    serviceStyle: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { teamId, ...updates } = args;
    
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const talent = await ctx.db
      .query("talent")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!talent) {
      throw new Error("Talent profile not found");
    }
    
    // Check if user has permission for this team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_talent", (q) => 
        q.eq("teamId", teamId).eq("talentId", talent._id)
      )
      .unique();
    
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new Error("You don't have permission to update this team");
    }
    
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    
    if (Object.keys(cleanUpdates).length === 0) {
      return teamId; // Nothing to update
    }
    
    // Update the team
    await ctx.db.patch(teamId, {
      ...cleanUpdates,
      updatedAt: Date.now(),
    });
    
    return teamId;
  },
});

// Delete a team (and all its job postings)
export const deleteTeam = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const talent = await ctx.db
      .query("talent")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!talent) {
      throw new Error("Talent profile not found");
    }
    
    // Check if user is owner of this team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_talent", (q) => 
        q.eq("teamId", args.teamId).eq("talentId", talent._id)
      )
      .unique();
    
    if (!membership || membership.role !== "owner") {
      throw new Error("You don't have permission to delete this team");
    }
    
    // Delete all job postings for this team
    const jobPostings = await ctx.db
      .query("jobPostings")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    
    for (const job of jobPostings) {
      // Delete all applications for this job posting
      const applications = await ctx.db
        .query("applications")
        .withIndex("by_job_posting", (q) => q.eq("jobPostingId", job._id))
        .collect();
      
      for (const app of applications) {
        // Delete any matches related to this application
        const matches = await ctx.db
          .query("matches")
          .withIndex("by_application", (q) => q.eq("applicationId", app._id))
          .collect();
        
        for (const match of matches) {
          await ctx.db.delete(match._id);
        }
        
        await ctx.db.delete(app._id);
      }
      
      await ctx.db.delete(job._id);
    }
    
    // Delete all team members
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    
    for (const member of teamMembers) {
      // Check if this is the member's current team
      const memberTalent = await ctx.db.get(member.talentId);
      if (memberTalent && memberTalent.currentTeamId === args.teamId) {
        // Clear the current team
        await ctx.db.patch(member.talentId, { currentTeamId: undefined });
      }
      
      await ctx.db.delete(member._id);
    }
    
    // Finally, delete the team
    await ctx.db.delete(args.teamId);
    
    return { success: true };
  },
});
