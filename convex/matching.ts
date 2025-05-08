import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Update application status (for team owners/admins)
export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("applications"),
    status: v.string(), // "pending", "matched", "rejected"
    notes: v.optional(v.string()),
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
    
    // Get the application
    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new Error("Application not found");
    }
    
    // Get the job posting to check team
    const jobPosting = await ctx.db.get(application.jobPostingId);
    if (!jobPosting) {
      throw new Error("Job posting not found");
    }
    
    // Check if user has permission for this team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_talent", (q) => 
        q.eq("teamId", jobPosting.teamId).eq("talentId", talent._id)
      )
      .unique();
    
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new Error("You don't have permission to update applications for this team");
    }
    
    // Update application status
    await ctx.db.patch(args.applicationId, {
      status: args.status,
      notes: args.notes !== undefined ? args.notes : application.notes,
      updatedAt: Date.now(),
    });
    
    // If matched, create a match record
    if (args.status === "matched") {
      await ctx.db.insert("matches", {
        applicationId: args.applicationId,
        talentId: application.talentId,
        teamId: jobPosting.teamId,
        jobPostingId: application.jobPostingId,
        startDate: jobPosting.startDate || "Immediately",
        position: jobPosting.specificPosition,
        compensationType: jobPosting.compensationType,
        compensationAmount: jobPosting.compensationType === "hourly" 
          ? (jobPosting.compensationRange.min + jobPosting.compensationRange.max) / 2
          : jobPosting.compensationRange.min,
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      // Add talent to team
      const existingTeamMembership = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_talent", (q) => 
          q.eq("teamId", jobPosting.teamId).eq("talentId", application.talentId)
        )
        .unique();
      
      if (!existingTeamMembership) {
        await ctx.db.insert("teamMembers", {
          talentId: application.talentId,
          teamId: jobPosting.teamId,
          position: jobPosting.specificPosition,
          role: "member",
          joinedAt: Date.now(),
        });
      }
    }
    
    return args.applicationId;
  },
});

// Get all matches for a talent
export const getMyMatches = query({
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
    
    // Get all matches
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_talent", (q) => q.eq("talentId", talent._id))
      .collect();
    
    // Enrich with team and job posting data
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const team = await ctx.db.get(match.teamId);
        const jobPosting = await ctx.db.get(match.jobPostingId);
        
        return {
          ...match,
          team: team ? {
            _id: team._id,
            name: team.name,
            location: team.location,
            serviceStyle: team.serviceStyle,
            contactEmail: team.contactEmail,
            contactPhone: team.contactPhone,
          } : null,
          jobPosting: jobPosting ? {
            _id: jobPosting._id,
            title: jobPosting.title,
            description: jobPosting.description,
            shifts: jobPosting.shifts,
          } : null,
        };
      })
    );
    
    return enrichedMatches.filter(match => match.team && match.jobPosting);
  },
});

// Get all matches for a team
export const getTeamMatches = query({
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
    
    // Check if user has permission for this team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_talent", (q) => 
        q.eq("teamId", args.teamId).eq("talentId", talent._id)
      )
      .unique();
    
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new Error("You don't have permission to view matches for this team");
    }
    
    // Get all matches for this team
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    
    // Enrich with talent and job posting data
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const matchedTalent = await ctx.db.get(match.talentId);
        const jobPosting = await ctx.db.get(match.jobPostingId);
        
        return {
          ...match,
          talent: matchedTalent ? {
            _id: matchedTalent._id,
            firstName: matchedTalent.firstName,
            lastName: matchedTalent.lastName,
            email: matchedTalent.email,
            phone: matchedTalent.phone,
          } : null,
          jobPosting: jobPosting ? {
            _id: jobPosting._id,
            title: jobPosting.title,
            specificPosition: jobPosting.specificPosition,
          } : null,
        };
      })
    );
    
    return enrichedMatches.filter(match => match.talent && match.jobPosting);
  },
});

// Update match status
export const updateMatchStatus = mutation({
  args: {
    matchId: v.id("matches"),
    status: v.string(), // "active", "completed", "terminated"
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
    
    // Get the match
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }
    
    // Check if user has permission (either talent or team admin/owner)
    const isTalent = match.talentId === talent._id;
    
    if (!isTalent) {
      // Check if user is team admin/owner
      const membership = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_talent", (q) => 
          q.eq("teamId", match.teamId).eq("talentId", talent._id)
        )
        .unique();
      
      if (!membership || !["owner", "admin"].includes(membership.role)) {
        throw new Error("You don't have permission to update this match");
      }
    }
    
    // Update match status
    await ctx.db.patch(args.matchId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    
    // If terminated, handle team membership if applicable
    if (args.status === "terminated") {
      // Check if there are any other active matches for this talent with this team
      const otherActiveMatches = await ctx.db
        .query("matches")
        .filter((q) => 
          q.and(
            q.eq(q.field("teamId"), match.teamId),
            q.eq(q.field("talentId"), match.talentId),
            q.eq(q.field("status"), "active"),
            q.neq(q.field("_id"), args.matchId)
          )
        )
        .first();
      
      // If no other active matches, update team membership if requested by team
      if (!otherActiveMatches && !isTalent) {
        // Get team membership
        const membership = await ctx.db
          .query("teamMembers")
          .withIndex("by_team_and_talent", (q) => 
            q.eq("teamId", match.teamId).eq("talentId", match.talentId)
          )
          .unique();
        
        if (membership) {
          await ctx.db.delete(membership._id);
        }
        
        // If this was the talent's current team, clear it
        const matchedTalent = await ctx.db.get(match.talentId);
        if (matchedTalent && matchedTalent.currentTeamId === match.teamId) {
          await ctx.db.patch(match.talentId, { currentTeamId: undefined });
        }
      }
    }
    
    return args.matchId;
  },
});
