import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create or update talent profile from registration form
export const createOrUpdateTalentProfile = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    lastFourSSN: v.string(),
    legallyWorkInUS: v.boolean(),
    inHospitalityIndustry: v.boolean(),
    over21: v.boolean(),
    livingArea: v.string(),
    interestedWorkingArea: v.string(),
    commuteMethod: v.array(v.string()),
    serviceStylePreferences: v.array(v.string()),
    positionPreferences: v.array(v.string()),
    experienceLevel: v.string(),
    availability: v.object({
      monday: v.array(v.string()),
      tuesday: v.array(v.string()),
      wednesday: v.array(v.string()),
      thursday: v.array(v.string()),
      friday: v.array(v.string()),
      saturday: v.array(v.string()),
      sunday: v.array(v.string()),
    }),
    lastJobName: v.optional(v.string()),
    lastJobPosition: v.optional(v.string()),
    lastJobDuration: v.optional(v.string()),
    lastJobLeaveReason: v.optional(v.string()),
    lastJobContactable: v.optional(v.boolean()),
    desiredHourlyWage: v.optional(v.number()),
    desiredYearlySalary: v.optional(v.number()),
    startDatePreference: v.string(),
    additionalNotes: v.optional(v.string()),
    skills: v.array(v.string()), // Skill names
    languages: v.array(v.string()), // Language names
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const tokenIdentifier = identity.tokenIdentifier;
    
    // Check if talent profile already exists
    const existingTalent = await ctx.db
      .query("talent")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();
    
    let talentId;
    
    if (existingTalent) {
      // Update existing talent
      talentId = existingTalent._id;
      await ctx.db.patch(talentId, {
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email,
        phone: args.phone,
        lastFourSSN: args.lastFourSSN,
        legallyWorkInUS: args.legallyWorkInUS,
        inHospitalityIndustry: args.inHospitalityIndustry,
        over21: args.over21,
        livingArea: args.livingArea,
        interestedWorkingArea: args.interestedWorkingArea,
        commuteMethod: args.commuteMethod,
        serviceStylePreferences: args.serviceStylePreferences,
        positionPreferences: args.positionPreferences,
        experienceLevel: args.experienceLevel,
        availability: args.availability,
        lastJobName: args.lastJobName,
        lastJobPosition: args.lastJobPosition,
        lastJobDuration: args.lastJobDuration,
        lastJobLeaveReason: args.lastJobLeaveReason,
        lastJobContactable: args.lastJobContactable,
        desiredHourlyWage: args.desiredHourlyWage,
        desiredYearlySalary: args.desiredYearlySalary,
        startDatePreference: args.startDatePreference,
        additionalNotes: args.additionalNotes,
        profileComplete: true,
        updatedAt: Date.now(),
      });
    } else {
      // Create new talent
      talentId = await ctx.db.insert("talent", {
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email,
        phone: args.phone,
        tokenIdentifier,
        lastFourSSN: args.lastFourSSN,
        legallyWorkInUS: args.legallyWorkInUS,
        inHospitalityIndustry: args.inHospitalityIndustry,
        over21: args.over21,
        livingArea: args.livingArea,
        interestedWorkingArea: args.interestedWorkingArea,
        commuteMethod: args.commuteMethod,
        serviceStylePreferences: args.serviceStylePreferences,
        positionPreferences: args.positionPreferences,
        experienceLevel: args.experienceLevel,
        availability: args.availability,
        lastJobName: args.lastJobName,
        lastJobPosition: args.lastJobPosition,
        lastJobDuration: args.lastJobDuration,
        lastJobLeaveReason: args.lastJobLeaveReason,
        lastJobContactable: args.lastJobContactable,
        desiredHourlyWage: args.desiredHourlyWage,
        desiredYearlySalary: args.desiredYearlySalary,
        startDatePreference: args.startDatePreference,
        additionalNotes: args.additionalNotes,
        profileComplete: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // Handle skills - first clear existing ones
    const existingSkills = await ctx.db
      .query("talentSkills")
      .withIndex("by_talent", (q) => q.eq("talentId", talentId))
      .collect();
    
    for (const skillRecord of existingSkills) {
      await ctx.db.delete(skillRecord._id);
    }
    
    // Add new skills
    for (const skillName of args.skills) {
      // Get or create the skill
      let skillId;
      const existingSkill = await ctx.db
        .query("skills")
        .filter((q) => q.eq(q.field("name"), skillName))
        .first();
      
      if (existingSkill) {
        skillId = existingSkill._id;
      } else {
        // Determine category based on skill name
        let category = "General";
        if ([
          "Knife skills", "Sauté", "Grill", "Garde manger", "Sushi/sashimi", 
          "Wok", "Pasta", "BBQ", "Baking", "Pizza", "Prep", "Wood fire",
          "Recipe following", "Recipe writing"
        ].includes(skillName)) {
          category = "BOH";
        } else if ([
          "Wine knowledge", "Cocktail knowledge", "Beer knowledge", 
          "Food knowledge", "Coffee skills", "Can carry up to 4 plates",
          "POS Toast", "Square", "TouchBistro", "Clover", "Dinerware", "Revel"
        ].includes(skillName)) {
          category = "FOH";
        }
        
        skillId = await ctx.db.insert("skills", {
          name: skillName,
          category,
          createdAt: Date.now(),
        });
      }
      
      // Add the skill to talent
      await ctx.db.insert("talentSkills", {
        talentId,
        skillId,
        addedAt: Date.now(),
      });
    }
    
    // Handle languages - first clear existing ones
    const existingLanguages = await ctx.db
      .query("talentLanguages")
      .withIndex("by_talent", (q) => q.eq("talentId", talentId))
      .collect();
    
    for (const langRecord of existingLanguages) {
      await ctx.db.delete(langRecord._id);
    }
    
    // Add new languages
    for (const language of args.languages) {
      await ctx.db.insert("talentLanguages", {
        talentId,
        language,
        addedAt: Date.now(),
      });
    }
    
    return talentId;
  },
});

// Get talent profile with skills and languages
export const getTalentProfile = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    const talent = await ctx.db
      .query("talent")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!talent) {
      return null;
    }
    
    // Get skills
    const talentSkillRecords = await ctx.db
      .query("talentSkills")
      .withIndex("by_talent", (q) => q.eq("talentId", talent._id))
      .collect();
    
    const skillIds = talentSkillRecords.map(record => record.skillId);
    const skills = await Promise.all(
      skillIds.map(id => ctx.db.get(id))
    );
    
    // Get languages
    const talentLanguageRecords = await ctx.db
      .query("talentLanguages")
      .withIndex("by_talent", (q) => q.eq("talentId", talent._id))
      .collect();
    
    const languages = talentLanguageRecords.map(record => record.language);
    
    return {
      ...talent,
      skills: skills.filter(Boolean).map(skill => ({
        id: skill?._id,
        name: skill?.name,
        category: skill?.category,
      })),
      languages,
    };
  },
});

// Search for job postings that match talent's criteria
export const searchJobPostings = query({
  args: {
    location: v.optional(v.string()),
    positionType: v.optional(v.string()), // BOH or FOH
    specificPosition: v.optional(v.string()),
    serviceStyle: v.optional(v.string()),
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
    
    // Start with all active job postings
    let jobPostings = await ctx.db
      .query("jobPostings")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    // Apply filters based on arguments
    if (args.location) {
      // Get teams in the specified location
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_location", (q) => q.eq("location", args.location))
        .collect();
      
      const teamIds = teams.map(team => team._id);
      jobPostings = jobPostings.filter(job => teamIds.includes(job.teamId));
    }
    
    if (args.positionType) {
      jobPostings = jobPostings.filter(job => job.positionType === args.positionType);
    }
    
    if (args.specificPosition) {
      jobPostings = jobPostings.filter(job => job.specificPosition === args.specificPosition);
    }
    
    if (args.serviceStyle) {
      jobPostings = jobPostings.filter(job => job.serviceStyle === args.serviceStyle);
    }
    
    // Enhance job postings with team info and match score
    const enhancedJobPostings = await Promise.all(
      jobPostings.map(async (job) => {
        const team = await ctx.db.get(job.teamId);
        
        // Calculate match score based on various factors
        let matchScore = 0;
        
        // Position match
        if (talent.positionPreferences.includes(job.specificPosition)) {
          matchScore += 30;
        }
        
        // Service style match
        if (talent.serviceStylePreferences.includes(job.serviceStyle)) {
          matchScore += 20;
        }
        
        // Location match
        if (talent.interestedWorkingArea === team?.location) {
          matchScore += 20;
        }
        
        // Availability match - check if talent is available for at least some of the shifts
        let availabilityMatch = false;
        for (const day of ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]) {
          const talentShifts = talent.availability[day] || [];
          const jobShifts = job.shifts[day] || [];
          
          // If there's an overlap in shifts, increase the score
          if (talentShifts.some(shift => jobShifts.includes(shift))) {
            availabilityMatch = true;
            break;
          }
        }
        
        if (availabilityMatch) {
          matchScore += 15;
        }
        
        // Compensation match
        if (job.compensationType === "hourly" && talent.desiredHourlyWage) {
          if (talent.desiredHourlyWage >= job.compensationRange.min && 
              talent.desiredHourlyWage <= job.compensationRange.max) {
            matchScore += 15;
          }
        } else if (job.compensationType === "salary" && talent.desiredYearlySalary) {
          if (talent.desiredYearlySalary >= job.compensationRange.min && 
              talent.desiredYearlySalary <= job.compensationRange.max) {
            matchScore += 15;
          }
        }
        
        return {
          ...job,
          team: team ? {
            _id: team._id,
            name: team.name,
            location: team.location,
            serviceStyle: team.serviceStyle,
          } : null,
          matchScore,
        };
      })
    );
    
    // Sort by match score (highest first)
    return enhancedJobPostings.sort((a, b) => b.matchScore - a.matchScore);
  },
});

// Get current user's talent profile
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    return {
      id: identity.subject,
      name: identity.name,
      email: identity.email,
      tokenIdentifier: identity.tokenIdentifier,
    };
  },
});

// Delete talent profile and all related data
export const deleteTalentProfile = mutation({
  handler: async (ctx) => {
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
    
    const talentId = talent._id;
    
    // Delete related team memberships
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_talent", (q) => q.eq("talentId", talentId))
      .collect();
    
    for (const membership of memberships) {
      await ctx.db.delete(membership._id);
    }
    
    // Delete related skills
    const talentSkills = await ctx.db
      .query("talentSkills")
      .withIndex("by_talent", (q) => q.eq("talentId", talentId))
      .collect();
    
    for (const skillRecord of talentSkills) {
      await ctx.db.delete(skillRecord._id);
    }
    
    // Delete related languages
    const talentLanguages = await ctx.db
      .query("talentLanguages")
      .withIndex("by_talent", (q) => q.eq("talentId", talentId))
      .collect();
    
    for (const langRecord of talentLanguages) {
      await ctx.db.delete(langRecord._id);
    }
    
    // Delete related applications
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_talent", (q) => q.eq("talentId", talentId))
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
    await ctx.db.delete(talentId);
    
    return { success: true };
  },
});
