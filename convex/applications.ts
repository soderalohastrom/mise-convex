import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Apply to a job posting
export const applyToJob = mutation({
  args: {
    jobPostingId: v.id("jobPostings"),
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
    
    // Check if job posting exists and is active
    const jobPosting = await ctx.db.get(args.jobPostingId);
    if (!jobPosting || !jobPosting.isActive) {
      throw new Error("Job posting not found or inactive");
    }
    
    // Check if already applied
    const existingApplication = await ctx.db
      .query("applications")
      .withIndex("by_talent_and_job_posting", (q) => 
        q.eq("talentId", talent._id).eq("jobPostingId", args.jobPostingId)
      )
      .unique();
    
    if (existingApplication) {
      throw new Error("You have already applied to this job posting");
    }
    
    // Create application
    const applicationId = await ctx.db.insert("applications", {
      talentId: talent._id,
      jobPostingId: args.jobPostingId,
      status: "pending",
      notes: args.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Get team info for notification purposes
    const team = await ctx.db.get(jobPosting.teamId);
    
    // In a real app, you might want to send a notification to the team here
    
    return {
      applicationId,
      jobTitle: jobPosting.title,
      teamName: team?.name,
    };
  },
});

// Get my applications
export const getMyApplications = query({
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
    
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_talent", (q) => q.eq("talentId", talent._id))
      .collect();
    
    // Get job postings and teams for each application
    const enhancedApplications = await Promise.all(
      applications.map(async (application) => {
        const jobPosting = await ctx.db.get(application.jobPostingId);
        if (!jobPosting) return null;
        
        const team = await ctx.db.get(jobPosting.teamId);
        
        return {
          ...application,
          jobPosting: {
            _id: jobPosting._id,
            title: jobPosting.title,
            specificPosition: jobPosting.specificPosition,
            compensationType: jobPosting.compensationType,
            compensationRange: jobPosting.compensationRange,
          },
          team: team ? {
            _id: team._id,
            name: team.name,
            location: team.location,
          } : null,
        };
      })
    );
    
    return enhancedApplications.filter(Boolean);
  },
});

// Update application status (for talent)
export const withdrawApplication = mutation({
  args: {
    applicationId: v.id("applications"),
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
    
    // Verify this is the talent's application
    if (application.talentId !== talent._id) {
      throw new Error("Not authorized to withdraw this application");
    }
    
    // Update application status
    await ctx.db.patch(args.applicationId, {
      status: "withdrawn",
      updatedAt: Date.now(),
    });
    
    return args.applicationId;
  },
});

// Get application details
export const getApplicationDetails = query({
  args: {
    applicationId: v.id("applications"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new Error("Application not found");
    }
    
    const talent = await ctx.db
      .query("talent")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!talent) {
      throw new Error("Talent profile not found");
    }
    
    // Check authorization - either applicant or team admin/owner
    const isApplicant = application.talentId === talent._id;
    
    if (!isApplicant) {
      // Check if user is part of the team
      const jobPosting = await ctx.db.get(application.jobPostingId);
      if (!jobPosting) {
        throw new Error("Job posting not found");
      }
      
      const membership = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_talent", (q) => 
          q.eq("teamId", jobPosting.teamId).eq("talentId", talent._id)
        )
        .unique();
      
      if (!membership || !["owner", "admin"].includes(membership.role)) {
        throw new Error("Not authorized to view this application");
      }
    }
    
    // Get full details
    const jobPosting = await ctx.db.get(application.jobPostingId);
    const team = jobPosting ? await ctx.db.get(jobPosting.teamId) : null;
    const applicant = await ctx.db.get(application.talentId);
    
    // Get matches
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_application", (q) => q.eq("applicationId", args.applicationId))
      .collect();
    
    return {
      ...application,
      jobPosting: jobPosting ? {
        _id: jobPosting._id,
        title: jobPosting.title,
        description: jobPosting.description,
        serviceStyle: jobPosting.serviceStyle,
        positionType: jobPosting.positionType,
        specificPosition: jobPosting.specificPosition,
        experienceRequired: jobPosting.experienceRequired,
        shifts: jobPosting.shifts,
        compensationType: jobPosting.compensationType,
        compensationRange: jobPosting.compensationRange,
      } : null,
      team: team ? {
        _id: team._id,
        name: team.name,
        location: team.location,
        serviceStyle: team.serviceStyle,
        contactEmail: team.contactEmail,
        contactPhone: team.contactPhone,
      } : null,
      applicant: isApplicant || matches.length > 0 ? {
        _id: applicant?._id,
        firstName: applicant?.firstName,
        lastName: applicant?.lastName,
        email: applicant?.email,
        phone: applicant?.phone,
      } : {
        _id: applicant?._id,
        firstName: applicant?.firstName,
        lastName: applicant?.lastName,
      },
      matches: matches.map(match => ({
        _id: match._id,
        status: match.status,
        startDate: match.startDate,
        position: match.position,
        compensationType: match.compensationType,
        compensationAmount: match.compensationAmount,
        createdAt: match.createdAt,
      })),
    };
  },
});
