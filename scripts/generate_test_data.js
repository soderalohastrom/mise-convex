// This script can be run with the Convex CLI to generate more varied test data
// Run with: npx convex run scripts/generate_test_data.js

import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Generate more varied test data for development and testing
export default mutation({
  args: {
    talentCount: v.optional(v.number()),
    teamsCount: v.optional(v.number()),
    jobPostingsPerTeam: v.optional(v.number()),
    applicationsCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.log("Generating test data...");
    
    // Set default counts if not provided
    const talentCount = args.talentCount || 10;
    const teamsCount = args.teamsCount || 5;
    const jobPostingsPerTeam = args.jobPostingsPerTeam || 2;
    const applicationsCount = args.applicationsCount || 15;
    
    // Sample data arrays
    const firstNames = ["Alex", "Taylor", "Jordan", "Morgan", "Casey", "Riley", "Jamie", "Avery", "Quinn", "Dakota", "Skyler", "Reese", "Parker", "Hayden", "Cameron"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson"];
    
    const restaurantNames = [
      "The Rustic Table", "Seaside Grill", "Urban Spice", "Harvest & Rye", "The Copper Pot", 
      "Ember & Oak", "Salt & Vine", "Pacific Northwest Bistro", "The Hidden Kitchen", "Evergreen Eatery",
      "The Hungry Whale", "Maple & Ash", "The Savory Plate", "Wildflower Dining", "The Butcher's Daughter"
    ];
    
    const restaurantDescriptions = [
      "A farm-to-table restaurant focusing on seasonal ingredients",
      "Seafood-focused establishment with panoramic water views",
      "Modern fusion cuisine in an urban setting",
      "Rustic American fare with an extensive whiskey selection",
      "Family-owned bistro specializing in copper pot cooking",
      "Wood-fired cooking in an elegant atmosphere",
      "Wine bar with Mediterranean small plates",
      "Celebrating the bounty of the Pacific Northwest",
      "Speakeasy-style restaurant with innovative cuisine",
      "Sustainable dining focused on local ingredients",
      "Seafood restaurant with a casual atmosphere",
      "Upscale steakhouse with a focus on wood-fired cooking",
      "Comfort food with a gourmet twist",
      "Vegetable-forward cuisine in a botanical setting",
      "Meat-centric restaurant with a nose-to-tail philosophy"
    ];
    
    // Get existing skills
    const skills = await ctx.db.query("skills").collect();
    const skillsByCategory = {
      "BOH": skills.filter(skill => skill.category === "BOH"),
      "FOH": skills.filter(skill => skill.category === "FOH"),
      "General": skills.filter(skill => skill.category === "General")
    };
    
    // Get predefined options
    const serviceStyles = await ctx.db.query("predefinedOptions")
      .withIndex("by_category", q => q.eq("category", "serviceStyle"))
      .collect();
    
    const areas = await ctx.db.query("predefinedOptions")
      .withIndex("by_category", q => q.eq("category", "area"))
      .collect();
    
    const shifts = await ctx.db.query("predefinedOptions")
      .withIndex("by_category", q => q.eq("category", "shift"))
      .collect();
    
    const commuteMethods = await ctx.db.query("predefinedOptions")
      .withIndex("by_category", q => q.eq("category", "commuteMethod"))
      .collect();
    
    const positions = await ctx.db.query("predefinedOptions")
      .withIndex("by_category", q => q.eq("category", "position"))
      .collect();
    
    const bohPositions = positions.filter(p => p.value.includes("BOH"));
    const fohPositions = positions.filter(p => p.value.includes("FOH"));
    
    const languages = ["English", "Spanish", "French", "Mandarin", "Cantonese", "Vietnamese", "Tagalog", "Korean", "Japanese", "Russian", "Arabic"];
    
    // Helper function to get random items from an array
    const getRandomItems = (array, min = 1, max = 3) => {
      const count = Math.floor(Math.random() * (max - min + 1)) + min;
      const shuffled = [...array].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };
    
    // Helper function to generate random availability
    const generateAvailability = () => {
      const shiftValues = shifts.map(s => s.value);
      return {
        monday: Math.random() > 0.3 ? getRandomItems(shiftValues, 0, 3) : [],
        tuesday: Math.random() > 0.3 ? getRandomItems(shiftValues, 0, 3) : [],
        wednesday: Math.random() > 0.3 ? getRandomItems(shiftValues, 0, 3) : [],
        thursday: Math.random() > 0.3 ? getRandomItems(shiftValues, 0, 3) : [],
        friday: Math.random() > 0.3 ? getRandomItems(shiftValues, 0, 3) : [],
        saturday: Math.random() > 0.3 ? getRandomItems(shiftValues, 0, 3) : [],
        sunday: Math.random() > 0.3 ? getRandomItems(shiftValues, 0, 3) : [],
      };
    };
    
    // Generate talent profiles
    console.log(`Generating ${talentCount} talent profiles...`);
    const talentIds = [];
    
    for (let i = 0; i < talentCount; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
      
      // Determine if FOH or BOH focused
      const isFOH = Math.random() > 0.5;
      const positionPool = isFOH ? fohPositions : bohPositions;
      const skillPool = isFOH ? skillsByCategory.FOH : skillsByCategory.BOH;
      const generalSkills = skillsByCategory.General;
      
      // Create talent profile
      const talentData = {
        firstName,
        lastName,
        email,
        phone: `206-555-${1000 + i}`,
        lastFourSSN: `${1000 + i}`.slice(-4),
        tokenIdentifier: `clerk:test-${firstName.toLowerCase()}-${i}`,
        legallyWorkInUS: Math.random() > 0.05, // 95% can work legally
        inHospitalityIndustry: true,
        over21: Math.random() > 0.1, // 90% are over 21
        livingArea: areas[Math.floor(Math.random() * areas.length)].value,
        interestedWorkingArea: areas[Math.floor(Math.random() * areas.length)].value,
        commuteMethod: getRandomItems(commuteMethods.map(c => c.value), 1, 2),
        serviceStylePreferences: getRandomItems(serviceStyles.map(s => s.value), 1, 3),
        positionPreferences: getRandomItems(positionPool.map(p => p.value), 1, 3),
        experienceLevel: ["0-1 years", "1-2 years", "3-4 years", "5+ years"][Math.floor(Math.random() * 4)],
        availability: generateAvailability(),
        lastJobName: restaurantNames[Math.floor(Math.random() * restaurantNames.length)],
        lastJobPosition: positionPool[Math.floor(Math.random() * positionPool.length)].value,
        lastJobDuration: `${Math.floor(Math.random() * 5) + 1} years`,
        lastJobLeaveReason: ["Looking for new opportunities", "Relocated", "Seeking better compensation", "Restaurant closed", "Career growth"][Math.floor(Math.random() * 5)],
        lastJobContactable: Math.random() > 0.2,
        desiredHourlyWage: Math.floor(Math.random() * 15) + 15, // $15-30
        startDatePreference: ["Immediately", "Within 1 week", "Within 2 weeks", "Within 1 month"][Math.floor(Math.random() * 4)],
        profileComplete: true,
        createdAt: Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000, // 0-30 days ago
        updatedAt: Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000, // 0-7 days ago
      };
      
      const talentId = await ctx.db.insert("talent", talentData);
      talentIds.push(talentId);
      
      // Add skills
      const selectedSkills = [
        ...getRandomItems(skillPool, 2, 5),
        ...getRandomItems(generalSkills, 1, 3)
      ];
      
      for (const skill of selectedSkills) {
        await ctx.db.insert("talentSkills", {
          talentId,
          skillId: skill._id,
          addedAt: Date.now(),
        });
      }
      
      // Add languages
      const selectedLanguages = getRandomItems(languages, 1, 3);
      for (const language of selectedLanguages) {
        await ctx.db.insert("talentLanguages", {
          talentId,
          language,
          addedAt: Date.now(),
        });
      }
    }
    
    // Generate teams
    console.log(`Generating ${teamsCount} teams...`);
    const teamIds = [];
    
    for (let i = 0; i < teamsCount; i++) {
      const name = restaurantNames[i % restaurantNames.length];
      const description = restaurantDescriptions[i % restaurantDescriptions.length];
      const serviceStyle = serviceStyles[Math.floor(Math.random() * serviceStyles.length)].value;
      const location = areas[Math.floor(Math.random() * areas.length)].value;
      
      // Assign an owner from the talent pool
      const ownerId = talentIds[Math.floor(Math.random() * talentIds.length)];
      
      const teamData = {
        name,
        description,
        industry: "Restaurant",
        size: ["Small (under 30 employees)", "Medium (30-50 employees)", "Large (50+ employees)"][Math.floor(Math.random() * 3)],
        location,
        address: `${100 + i} Main St, Seattle, WA 981${10 + Math.floor(i/10)}`,
        serviceStyle,
        contactEmail: `manager@${name.toLowerCase().replace(/\s+/g, '')}.example.com`,
        contactPhone: `206-555-${2000 + i}`,
        ownerId,
        createdAt: Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000, // 0-90 days ago
        updatedAt: Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000, // 0-14 days ago
      };
      
      const teamId = await ctx.db.insert("teams", teamData);
      teamIds.push(teamId);
      
      // Add owner as team member
      await ctx.db.insert("teamMembers", {
        talentId: ownerId,
        teamId,
        position: "Manager",
        role: "owner",
        joinedAt: teamData.createdAt,
      });
      
      // Add some random team members
      const memberCount = Math.floor(Math.random() * 3) + 1; // 1-3 additional members
      const potentialMembers = talentIds.filter(id => id !== ownerId);
      const selectedMembers = getRandomItems(potentialMembers, memberCount, memberCount);
      
      for (const memberId of selectedMembers) {
        const talent = await ctx.db.get(memberId);
        const position = talent.positionPreferences[0];
        
        await ctx.db.insert("teamMembers", {
          talentId: memberId,
          teamId,
          position,
          role: "member",
          joinedAt: Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000, // 0-60 days ago
        });
      }
      
      // Generate job postings for this team
      for (let j = 0; j < jobPostingsPerTeam; j++) {
        const isFOH = Math.random() > 0.5;
        const positionPool = isFOH ? fohPositions : bohPositions;
        const position = positionPool[Math.floor(Math.random() * positionPool.length)].value;
        const positionType = isFOH ? "FOH" : "BOH";
        
        // Get skills relevant to this position type
        const relevantSkills = isFOH ? skillsByCategory.FOH : skillsByCategory.BOH;
        const requiredSkillIds = getRandomItems(relevantSkills, 2, 4).map(skill => skill._id);
        
        const jobPostingData = {
          teamId,
          title: `${position} Needed at ${name}`,
          description: `We are looking for an experienced ${position} to join our team. ${Math.random() > 0.5 ? "Full-time position with benefits." : "Part-time position with flexible hours."}`,
          serviceStyle,
          positionType,
          specificPosition: position,
          experienceRequired: ["Entry level", "1+ years", "2+ years", "3+ years", "5+ years"][Math.floor(Math.random() * 5)],
          requiredSkills: requiredSkillIds,
          shifts: generateAvailability(),
          compensationType: "hourly",
          compensationRange: {
            min: 15 + Math.floor(Math.random() * 10),
            max: 25 + Math.floor(Math.random() * 15),
          },
          isActive: Math.random() > 0.1, // 90% are active
          startDate: ["Immediately", "Within 1 week", "Within 2 weeks", "Within 1 month"][Math.floor(Math.random() * 4)],
          createdAt: Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000, // 0-30 days ago
          updatedAt: Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000, // 0-7 days ago
        };
        
        const jobPostingId = await ctx.db.insert("jobPostings", jobPostingData);
      }
    }
    
    // Get all job postings
    const jobPostings = await ctx.db.query("jobPostings").collect();
    
    // Generate applications
    console.log(`Generating ${applicationsCount} applications...`);
    
    for (let i = 0; i < applicationsCount; i++) {
      const talentId = talentIds[Math.floor(Math.random() * talentIds.length)];
      const jobPosting = jobPostings[Math.floor(Math.random() * jobPostings.length)];
      
      // Check if this application already exists
      const existingApplication = await ctx.db.query("applications")
        .withIndex("by_talent_and_job", q => 
          q.eq("talentId", talentId).eq("jobPostingId", jobPosting._id)
        )
        .first();
      
      if (existingApplication) {
        continue; // Skip if already exists
      }
      
      const applicationStatus = ["pending", "matched", "rejected"][Math.floor(Math.random() * 3)];
      const createdAt = Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000; // 0-30 days ago
      
      const applicationData = {
        talentId,
        jobPostingId: jobPosting._id,
        status: applicationStatus,
        notes: [
          "I'm very interested in this position and believe my experience would be a great fit for your team.",
          "I have extensive experience in this role and am looking for a new opportunity.",
          "I'm excited about the possibility of joining your team and contributing to your success.",
          "My background in the industry makes me a strong candidate for this position.",
          "I'm passionate about hospitality and would love to be part of your team."
        ][Math.floor(Math.random() * 5)],
        createdAt,
        updatedAt: applicationStatus === "pending" ? createdAt : createdAt + Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000,
      };
      
      const applicationId = await ctx.db.insert("applications", applicationData);
      
      // If matched, create a match record
      if (applicationStatus === "matched") {
        await ctx.db.insert("matches", {
          applicationId,
          talentId,
          teamId: jobPosting.teamId,
          jobPostingId: jobPosting._id,
          startDate: jobPosting.startDate || "Immediately",
          position: jobPosting.specificPosition,
          compensationType: jobPosting.compensationType,
          compensationAmount: jobPosting.compensationType === "hourly" 
            ? (jobPosting.compensationRange.min + jobPosting.compensationRange.max) / 2
            : jobPosting.compensationRange.min,
          status: "active",
          createdAt: applicationData.updatedAt,
          updatedAt: applicationData.updatedAt,
        });
        
        // Add talent to team if not already a member
        const existingMembership = await ctx.db.query("teamMembers")
          .withIndex("by_team_and_talent", q => 
            q.eq("teamId", jobPosting.teamId).eq("talentId", talentId)
          )
          .first();
        
        if (!existingMembership) {
          await ctx.db.insert("teamMembers", {
            talentId,
            teamId: jobPosting.teamId,
            position: jobPosting.specificPosition,
            role: "member",
            joinedAt: applicationData.updatedAt,
          });
        }
      }
    }
    
    console.log("Test data generation complete!");
    return { 
      success: true, 
      message: "Test data has been generated successfully",
      counts: {
        talent: talentCount,
        teams: teamsCount,
        jobPostings: jobPostings.length,
        applications: applicationsCount
      }
    };
  }
});
