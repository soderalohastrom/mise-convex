// This script can be run with the Convex CLI to initialize the database with sample data
// Run with: npx convex run -f scripts/init_data.js

import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Initialize the database with sample data
export default mutation({
  handler: async (ctx) => {
    console.log("Initializing database with sample data...");
    
    // Sample service styles
    const serviceStyles = [
      "Fine dining", 
      "Fine casual", 
      "Fast casual", 
      "Dive", 
      "Counter service", 
      "Fast food", 
      "Banquette", 
      "Catering", 
      "Club",
    ];
    
    // Sample positions - BOH
    const bohPositions = [
      "Chef", 
      "Sous chef", 
      "Cook", 
      "Line cook", 
      "Pastry chef", 
      "Garde manger", 
      "Baker", 
      "Sushi/Sashimi", 
      "Pizzaiolo", 
      "Prep cook", 
      "Dishwasher", 
      "Expo", 
      "BOH manager",
    ];
    
    // Sample positions - FOH
    const fohPositions = [
      "Server", 
      "Bartender", 
      "Host", 
      "Busser", 
      "Barback", 
      "Barista", 
      "Counter service", 
      "FOH manager",
    ];
    
    // Sample BOH skills
    const bohSkills = [
      "Knife skills", 
      "Sauté", 
      "Grill", 
      "Garde manger", 
      "Sushi/sashimi", 
      "Wok", 
      "Pasta", 
      "BBQ", 
      "Baking", 
      "Pizza", 
      "Prep", 
      "Wood fire", 
      "Recipe following", 
      "Recipe writing",
    ];
    
    // Sample FOH skills
    const fohSkills = [
      "Wine knowledge", 
      "Cocktail knowledge", 
      "Beer knowledge", 
      "Food knowledge", 
      "Coffee skills", 
      "Can carry up to 4 plates", 
      "POS Toast", 
      "Square", 
      "TouchBistro", 
      "Clover", 
      "Dinerware", 
      "Revel",
    ];
    
    // Sample general skills
    const generalSkills = [
      "Second or multiple languages", 
      "Sign language", 
      "Multitasker", 
      "Acute awareness", 
      "Great listener", 
      "Great communicator", 
      "Team player", 
      "Attention to detail", 
      "Great Time management", 
      "Work well under pressure", 
      "Excel spreadsheets", 
      "Quickbooks", 
      "Problem solving", 
      "Patience", 
      "Math skills", 
      "Drivers license", 
      "Mast liquor card", 
      "Food handlers card",
    ];
    
    // Sample areas (Seattle neighborhoods)
    const areas = [
      "Downtown/SLU", 
      "Fremont/Ballard/Queen Anne", 
      "Capitol Hill/Madison Park", 
      "Beacon Hill/Columbia City", 
      "Central District/International District", 
      "West Seattle/Alki", 
      "White Center/South Park/South End", 
      "Roosevelt/U District", 
      "Northgate/North End", 
      "Bellevue/Eastside", 
      "Islands",
    ];
    
    // Sample languages
    const languages = [
      "English", 
      "Spanish", 
      "French", 
      "Mandarin", 
      "Cantonese", 
      "Vietnamese", 
      "Tagalog", 
      "Korean", 
      "Japanese", 
      "Russian", 
      "Arabic",
    ];
    
    // Sample commute methods
    const commuteMethods = [
      "I have a car", 
      "I use the bus/train", 
      "I use ride share services", 
      "Cycle or walk", 
      "Other",
    ];
    
    // Sample shifts
    const shifts = [
      "Morning", 
      "Midday", 
      "Swing", 
      "Nights", 
      "Graveyard",
    ];

    // First, add all skills to the skills table
    console.log("Creating skills...");
    const skillIds = {};
    
    // Add BOH skills
    for (const skill of bohSkills) {
      const skillId = await ctx.db.insert("skills", {
        name: skill,
        category: "BOH",
        createdAt: Date.now(),
      });
      skillIds[skill] = skillId;
    }
    
    // Add FOH skills
    for (const skill of fohSkills) {
      const skillId = await ctx.db.insert("skills", {
        name: skill,
        category: "FOH",
        createdAt: Date.now(),
      });
      skillIds[skill] = skillId;
    }
    
    // Add general skills
    for (const skill of generalSkills) {
      const skillId = await ctx.db.insert("skills", {
        name: skill,
        category: "General",
        createdAt: Date.now(),
      });
      skillIds[skill] = skillId;
    }
    
    // Then, add predefined options
    console.log("Creating predefined options...");
    
    // Service Styles
    for (let i = 0; i < serviceStyles.length; i++) {
      await ctx.db.insert("predefinedOptions", {
        category: "serviceStyle",
        value: serviceStyles[i],
        displayName: serviceStyles[i],
        isActive: true,
        order: i + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // Positions - BOH and FOH
    for (let i = 0; i < bohPositions.length; i++) {
      await ctx.db.insert("predefinedOptions", {
        category: "position",
        value: bohPositions[i],
        displayName: bohPositions[i],
        isActive: true,
        order: i + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    for (let i = 0; i < fohPositions.length; i++) {
      await ctx.db.insert("predefinedOptions", {
        category: "position",
        value: fohPositions[i],
        displayName: fohPositions[i],
        isActive: true,
        order: bohPositions.length + i + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // Areas
    for (let i = 0; i < areas.length; i++) {
      await ctx.db.insert("predefinedOptions", {
        category: "area",
        value: areas[i],
        displayName: areas[i],
        isActive: true,
        order: i + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // Shifts
    for (let i = 0; i < shifts.length; i++) {
      await ctx.db.insert("predefinedOptions", {
        category: "shift",
        value: shifts[i],
        displayName: shifts[i],
        isActive: true,
        order: i + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // Commute Methods
    for (let i = 0; i < commuteMethods.length; i++) {
      await ctx.db.insert("predefinedOptions", {
        category: "commuteMethod",
        value: commuteMethods[i],
        displayName: commuteMethods[i],
        isActive: true,
        order: i + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // Sample talent data
    console.log("Creating sample talent profiles...");
    const sampleTalent = [
      {
        firstName: "Alex",
        lastName: "Johnson",
        email: "alex.johnson@example.com",
        phone: "206-555-1234",
        lastFourSSN: "1234",
        tokenIdentifier: "clerk:sample-alex", // Mock Clerk token
        legallyWorkInUS: true,
        inHospitalityIndustry: true,
        over21: true,
        livingArea: "Capitol Hill/Madison Park",
        interestedWorkingArea: "Downtown/SLU",
        commuteMethod: ["I use the bus/train", "I use ride share services"],
        serviceStylePreferences: ["Fine dining", "Fine casual"],
        positionPreferences: ["Bartender", "Server", "Barback"],
        experienceLevel: "5+ years",
        availability: {
          monday: ["Morning", "Midday"],
          tuesday: ["Morning", "Midday", "Swing"],
          wednesday: ["Morning", "Midday", "Swing"],
          thursday: ["Swing", "Nights"],
          friday: ["Swing", "Nights"],
          saturday: ["Swing", "Nights"],
          sunday: [],
        },
        lastJobName: "The Metropolitan Grill",
        lastJobPosition: "Bartender",
        lastJobDuration: "3 years",
        lastJobLeaveReason: "Looking for new opportunities",
        lastJobContactable: true,
        desiredHourlyWage: 25,
        startDatePreference: "Immediately",
        profileComplete: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        skills: ["Wine knowledge", "Cocktail knowledge", "Beer knowledge", "Team player"],
        languages: ["English", "Spanish"]
      },
      {
        firstName: "Taylor",
        lastName: "Smith",
        email: "taylor.smith@example.com",
        phone: "206-555-5678",
        lastFourSSN: "5678",
        tokenIdentifier: "clerk:sample-taylor", // Mock Clerk token
        legallyWorkInUS: true,
        inHospitalityIndustry: true,
        over21: true,
        livingArea: "Fremont/Ballard/Queen Anne",
        interestedWorkingArea: "Fremont/Ballard/Queen Anne",
        commuteMethod: ["I have a car", "Cycle or walk"],
        serviceStylePreferences: ["Fine casual", "Fast casual", "Counter service"],
        positionPreferences: ["Cook", "Line cook", "Prep cook"],
        experienceLevel: "3-4 years",
        availability: {
          monday: ["Morning", "Midday", "Swing"],
          tuesday: ["Morning", "Midday", "Swing"],
          wednesday: ["Morning", "Midday"],
          thursday: ["Morning", "Midday"],
          friday: ["Midday", "Swing", "Nights"],
          saturday: ["Midday", "Swing", "Nights"],
          sunday: ["Midday", "Swing"],
        },
        lastJobName: "Canlis",
        lastJobPosition: "Line Cook",
        lastJobDuration: "2 years",
        lastJobLeaveReason: "Relocated",
        lastJobContactable: true,
        desiredHourlyWage: 22,
        startDatePreference: "Within 2 weeks",
        profileComplete: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        skills: ["Knife skills", "Sauté", "Grill", "Pasta", "Recipe following"],
        languages: ["English", "French"]
      },
      {
        firstName: "Jordan",
        lastName: "Rivera",
        email: "jordan.rivera@example.com",
        phone: "206-555-9012",
        lastFourSSN: "9012",
        tokenIdentifier: "clerk:sample-jordan", // Mock Clerk token
        legallyWorkInUS: true,
        inHospitalityIndustry: true,
        over21: true,
        livingArea: "West Seattle/Alki",
        interestedWorkingArea: "Downtown/SLU",
        commuteMethod: ["I use the bus/train"],
        serviceStylePreferences: ["Fine dining", "Fine casual", "Banquette"],
        positionPreferences: ["Server", "Host", "FOH manager"],
        experienceLevel: "5+ years",
        availability: {
          monday: ["Midday", "Swing", "Nights"],
          tuesday: ["Midday", "Swing", "Nights"],
          wednesday: ["Swing", "Nights"],
          thursday: ["Swing", "Nights"],
          friday: ["Nights"],
          saturday: ["Nights"],
          sunday: ["Midday", "Swing", "Nights"],
        },
        lastJobName: "Wild Ginger",
        lastJobPosition: "Server Lead",
        lastJobDuration: "4 years",
        lastJobLeaveReason: "Seeking better compensation",
        lastJobContactable: true,
        desiredHourlyWage: 28,
        startDatePreference: "Within 1 month",
        profileComplete: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        skills: ["Wine knowledge", "Food knowledge", "Team player", "Great Time management", "Second or multiple languages"],
        languages: ["English", "Spanish", "French"]
      }
    ];

    // Create the talent profiles
    for (const talent of sampleTalent) {
      const {skills: talentSkills, languages: talentLanguages, ...talentData} = talent;
      
      const talentId = await ctx.db.insert("talent", talentData);
      
      // Add skills
      for (const skillName of talentSkills) {
        const skillId = skillIds[skillName];
        if (skillId) {
          await ctx.db.insert("talentSkills", {
            talentId,
            skillId,
            addedAt: Date.now(),
          });
        }
      }
      
      // Add languages
      for (const language of talentLanguages) {
        await ctx.db.insert("talentLanguages", {
          talentId,
          language,
          addedAt: Date.now(),
        });
      }
    }
    
    // Sample team data
    console.log("Creating sample teams...");
    const sampleTeams = [
      {
        name: "The Seattle Bistro",
        description: "A fine dining establishment with French influence in the heart of downtown",
        industry: "Restaurant",
        size: "Medium (30-50 employees)",
        location: "Downtown/SLU",
        address: "123 Pike St, Seattle, WA 98101",
        serviceStyle: "Fine dining",
        contactEmail: "manager@seattlebistro.example.com",
        contactPhone: "206-555-0001",
        ownerId: null, // Will be filled with first talent
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        name: "Fremont Cafe",
        description: "A cozy cafe featuring local ingredients and community atmosphere",
        industry: "Cafe",
        size: "Small (10-30 employees)",
        location: "Fremont/Ballard/Queen Anne",
        address: "456 Fremont Ave N, Seattle, WA 98103",
        serviceStyle: "Counter service",
        contactEmail: "owner@fremontcafe.example.com",
        contactPhone: "206-555-0002",
        ownerId: null, // Will be filled with second talent
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        name: "West Seattle Grill",
        description: "A neighborhood favorite serving American classics with a Pacific Northwest twist",
        industry: "Restaurant",
        size: "Medium (30-50 employees)",
        location: "West Seattle/Alki",
        address: "789 Alki Ave SW, Seattle, WA, 98116",
        serviceStyle: "Fine casual",
        contactEmail: "manager@westseattlegrill.example.com",
        contactPhone: "206-555-0003",
        ownerId: null, // Will be filled with third talent
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    ];
    
    // Get the created talent records
    const talents = await ctx.db.query("talent").collect();
    
    // Create the teams
    const teamIds = [];
    for (let i = 0; i < sampleTeams.length; i++) {
      if (i < talents.length) {
        sampleTeams[i].ownerId = talents[i]._id;
      }
      
      const teamId = await ctx.db.insert("teams", sampleTeams[i]);
      teamIds.push(teamId);
      
      // If we have a valid owner, add them as a team member
      if (sampleTeams[i].ownerId) {
        await ctx.db.insert("teamMembers", {
          talentId: sampleTeams[i].ownerId,
          teamId,
          position: "Manager",
          role: "owner",
          joinedAt: Date.now(),
        });
        
        // Update talent's current team
        await ctx.db.patch(sampleTeams[i].ownerId, {
          currentTeamId: teamId,
        });
      }
    }
    
    // Sample job postings
    console.log("Creating sample job postings...");
    const sampleJobPostings = [
      {
        teamId: teamIds[0], // Seattle Bistro
        title: "Experienced Bartender Needed",
        description: "Looking for an experienced bartender with a passion for craft cocktails and extensive wine knowledge. Must be able to work in a fast-paced environment and provide exceptional customer service.",
        serviceStyle: "Fine dining",
        positionType: "FOH",
        specificPosition: "Bartender",
        experienceRequired: "3+ years",
        requiredSkills: [skillIds["Cocktail knowledge"], skillIds["Wine knowledge"], skillIds["Team player"]],
        shifts: {
          monday: ["Swing", "Nights"],
          tuesday: ["Swing", "Nights"],
          wednesday: ["Swing", "Nights"],
          thursday: ["Swing", "Nights"],
          friday: ["Swing", "Nights"],
          saturday: ["Swing", "Nights"],
          sunday: [],
        },
        compensationType: "hourly",
        compensationRange: {
          min: 20,
          max: 28,
        },
        isActive: true,
        startDate: "Immediately",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        teamId: teamIds[1], // Fremont Cafe
        title: "Line Cook Position",
        description: "Seeking a passionate line cook to join our team. Experience with breakfast and lunch service preferred. We focus on local, seasonal ingredients in a fast-casual environment.",
        serviceStyle: "Counter service",
        positionType: "BOH",
        specificPosition: "Line cook",
        experienceRequired: "1+ years",
        requiredSkills: [skillIds["Knife skills"], skillIds["Grill"], skillIds["Recipe following"]],
        shifts: {
          monday: ["Morning", "Midday"],
          tuesday: ["Morning", "Midday"],
          wednesday: ["Morning", "Midday"],
          thursday: ["Morning", "Midday"],
          friday: ["Morning", "Midday"],
          saturday: ["Morning", "Midday"],
          sunday: ["Morning", "Midday"],
        },
        compensationType: "hourly",
        compensationRange: {
          min: 18,
          max: 22,
        },
        isActive: true,
        startDate: "Within 2 weeks",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        teamId: teamIds[2], // West Seattle Grill
        title: "Server Position Available",
        description: "Hiring experienced servers for dinner service. Knowledge of wine pairings and fine dining service standards required. Join our team in a vibrant neighborhood restaurant.",
        serviceStyle: "Fine casual",
        positionType: "FOH",
        specificPosition: "Server",
        experienceRequired: "2+ years",
        requiredSkills: [skillIds["Food knowledge"], skillIds["Wine knowledge"], skillIds["Team player"]],
        shifts: {
          monday: [],
          tuesday: ["Swing", "Nights"],
          wednesday: ["Swing", "Nights"],
          thursday: ["Swing", "Nights"],
          friday: ["Swing", "Nights"],
          saturday: ["Swing", "Nights"],
          sunday: ["Midday", "Swing"],
        },
        compensationType: "hourly",
        compensationRange: {
          min: 18,
          max: 25,
        },
        isActive: true,
        startDate: "Within 1 month",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    ];
    
    // Create the job postings
    const jobPostingIds = [];
    for (const jobPosting of sampleJobPostings) {
      const jobPostingId = await ctx.db.insert("jobPostings", jobPosting);
      jobPostingIds.push(jobPostingId);
    }
    
    // Sample applications
    console.log("Creating sample applications...");
    // These would be created by talent applying to jobs
    // For example, the first talent (Alex) applying to the third job posting (Server)
    if (talents.length > 0 && jobPostingIds.length > 2) {
      const applicationId = await ctx.db.insert("applications", {
        talentId: talents[0]._id,
        jobPostingId: jobPostingIds[2],
        status: "pending",
        notes: "I'm very interested in this position and believe my experience would be a great fit for your team.",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      // Third talent (Jordan) applying to the first job posting (Bartender)
      if (talents.length > 2) {
        await ctx.db.insert("applications", {
          talentId: talents[2]._id,
          jobPostingId: jobPostingIds[0],
          status: "matched",
          notes: "I have extensive experience with craft cocktails and wine service.",
          createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
          updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        });
        
        // Create a match for this application
        await ctx.db.insert("matches", {
          applicationId,
          talentId: talents[2]._id,
          teamId: teamIds[0],
          jobPostingId: jobPostingIds[0],
          startDate: "Immediately",
          position: "Bartender",
          compensationType: "hourly",
          compensationAmount: 25,
          status: "active",
          createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
          updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        });
        
        // Add talent to team
        await ctx.db.insert("teamMembers", {
          talentId: talents[2]._id,
          teamId: teamIds[0],
          position: "Bartender",
          role: "member",
          joinedAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        });
      }
    }
    
    console.log("Database initialization complete!");
    return { success: true };
  }
});
