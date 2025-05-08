import { query } from "./_generated/server";
import { v } from "convex/values";

// Search for talent based on various criteria (for team owners/admins)
export const searchTalent = query({
  args: {
    position: v.optional(v.string()),
    skillNames: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
    experienceLevel: v.optional(v.string()),
    availability: v.optional(v.object({
      day: v.string(), // e.g., "monday"
      shift: v.string(), // e.g., "Morning"
    })),
    serviceStyle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const user = await ctx.db
      .query("talent")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Check if user has permission to search talent (should be a team owner/admin)
    const teamMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_talent", (q) => q.eq("talentId", user._id))
      .filter((q) => q.eq(q.field("role"), "owner") || q.eq(q.field("role"), "admin"))
      .collect();
    
    if (teamMemberships.length === 0) {
      throw new Error("You don't have permission to search talent");
    }
    
    // Start with all talent
    let talentProfiles = await ctx.db.query("talent").collect();
    
    // Apply filters
    if (args.position) {
      talentProfiles = talentProfiles.filter(t => 
        t.positionPreferences.includes(args.position)
      );
    }
    
    if (args.location) {
      talentProfiles = talentProfiles.filter(t => 
        t.interestedWorkingArea === args.location
      );
    }
    
    if (args.experienceLevel) {
      talentProfiles = talentProfiles.filter(t => 
        t.experienceLevel === args.experienceLevel
      );
    }
    
    if (args.serviceStyle) {
      talentProfiles = talentProfiles.filter(t => 
        t.serviceStylePreferences.includes(args.serviceStyle)
      );
    }
    
    if (args.availability) {
      talentProfiles = talentProfiles.filter(t => {
        const { day, shift } = args.availability;
        const shifts = t.availability[day] || [];
        return shifts.includes(shift);
      });
    }
    
    // Get skill IDs for the requested skill names
    let skillIds = [];
    if (args.skillNames && args.skillNames.length > 0) {
      const skills = await Promise.all(
        args.skillNames.map(async (name) => {
          return await ctx.db
            .query("skills")
            .filter((q) => q.eq(q.field("name"), name))
            .first();
        })
      );
      
      skillIds = skills.filter(Boolean).map(skill => skill._id);
      
      // If we have skill filters but none match, return empty array
      if (args.skillNames.length > 0 && skillIds.length === 0) {
        return [];
      }
    }
    
    // Fetch all talent skill records
    const allTalentSkillRecords = await ctx.db.query("talentSkills").collect();
    
    // Filter talent by skills if needed
    if (skillIds.length > 0) {
      const talentIdsWithSkills = new Set();
      
      for (const record of allTalentSkillRecords) {
        if (skillIds.includes(record.skillId)) {
          talentIdsWithSkills.add(record.talentId);
        }
      }
      
      talentProfiles = talentProfiles.filter(t => 
        talentIdsWithSkills.has(t._id)
      );
    }
    
    // Enrich with skills and languages
    const enrichedTalentProfiles = await Promise.all(
      talentProfiles.map(async (profile) => {
        // Get skills
        const talentSkillRecords = allTalentSkillRecords.filter(
          record => record.talentId === profile._id
        );
        
        const skillIds = talentSkillRecords.map(record => record.skillId);
        const skills = await Promise.all(
          skillIds.map(id => ctx.db.get(id))
        );
        
        // Get languages
        const talentLanguageRecords = await ctx.db
          .query("talentLanguages")
          .withIndex("by_talent", (q) => q.eq("talentId", profile._id))
          .collect();
        
        const languages = talentLanguageRecords.map(record => record.language);
        
        return {
          ...profile,
          skills: skills.filter(Boolean).map(skill => ({
            id: skill?._id,
            name: skill?.name,
            category: skill?.category,
          })),
          languages,
        };
      })
    );
    
    // Remove sensitive information
    return enrichedTalentProfiles.map(profile => ({
      _id: profile._id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      experienceLevel: profile.experienceLevel,
      livingArea: profile.livingArea,
      interestedWorkingArea: profile.interestedWorkingArea,
      positionPreferences: profile.positionPreferences,
      serviceStylePreferences: profile.serviceStylePreferences,
      availability: profile.availability,
      skills: profile.skills,
      languages: profile.languages,
      desiredHourlyWage: profile.desiredHourlyWage,
      desiredYearlySalary: profile.desiredYearlySalary,
      startDatePreference: profile.startDatePreference,
    }));
  },
});

// Search for job postings with advanced filters
export const searchJobPostings = query({
  args: {
    location: v.optional(v.string()),
    positionType: v.optional(v.string()), // BOH or FOH
    specificPosition: v.optional(v.string()),
    serviceStyle: v.optional(v.string()),
    compensationType: v.optional(v.string()),
    compensationMin: v.optional(v.number()),
    compensationMax: v.optional(v.number()),
    requiredSkills: v.optional(v.array(v.string())), // Skill names
    availability: v.optional(v.object({
      day: v.string(), // e.g., "monday"
      shift: v.string(), // e.g., "Morning"
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // Start with all active job postings
    let jobPostings = await ctx.db
      .query("jobPostings")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    // Apply filters
    if (args.positionType) {
      jobPostings = jobPostings.filter(job => job.positionType === args.positionType);
    }
    
    if (args.specificPosition) {
      jobPostings = jobPostings.filter(job => job.specificPosition === args.specificPosition);
    }
    
    if (args.serviceStyle) {
      jobPostings = jobPostings.filter(job => job.serviceStyle === args.serviceStyle);
    }
    
    if (args.compensationType) {
      jobPostings = jobPostings.filter(job => job.compensationType === args.compensationType);
    }
    
    if (args.compensationMin !== undefined) {
      jobPostings = jobPostings.filter(job => job.compensationRange.max >= args.compensationMin);
    }
    
    if (args.compensationMax !== undefined) {
      jobPostings = jobPostings.filter(job => job.compensationRange.min <= args.compensationMax);
    }
    
    if (args.availability) {
      jobPostings = jobPostings.filter(job => {
        const { day, shift } = args.availability;
        const shifts = job.shifts[day] || [];
        return shifts.includes(shift);
      });
    }
    
    // Get skills by name
    let skillIds = [];
    if (args.requiredSkills && args.requiredSkills.length > 0) {
      const skills = await Promise.all(
        args.requiredSkills.map(async (name) => {
          return await ctx.db
            .query("skills")
            .filter((q) => q.eq(q.field("name"), name))
            .first();
        })
      );
      
      skillIds = skills.filter(Boolean).map(skill => skill._id);
      
      // Filter jobs by skill requirement
      jobPostings = jobPostings.filter(job => {
        // Check if any of the job's required skills match our filtered skills
        return job.requiredSkills.some(skillId => 
          skillIds.includes(skillId)
        );
      });
    }
    
    // Filter by location if provided
    let filteredPostings = jobPostings;
    if (args.location) {
      // Get teams in the specified location
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_location", (q) => q.eq("location", args.location))
        .collect();
      
      const teamIds = teams.map(team => team._id);
      filteredPostings = jobPostings.filter(job => teamIds.includes(job.teamId));
    }
    
    // Enrich with team info
    const enrichedJobPostings = await Promise.all(
      filteredPostings.map(async (job) => {
        const team = await ctx.db.get(job.teamId);
        
        // Get required skills
        const skills = await Promise.all(
          job.requiredSkills.map(id => ctx.db.get(id))
        );
        
        return {
          ...job,
          team: team ? {
            _id: team._id,
            name: team.name,
            location: team.location,
            serviceStyle: team.serviceStyle,
          } : null,
          requiredSkills: skills.filter(Boolean).map(skill => ({
            id: skill?._id,
            name: skill?.name,
            category: skill?.category,
          })),
        };
      })
    );
    
    return enrichedJobPostings.filter(job => job.team);
  },
});
