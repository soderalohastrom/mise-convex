// This script can be run with the Convex CLI to validate the database schema
// Run with: npx convex run scripts/validate_schema.js

import { query } from "../_generated/server";

// Validate the database schema and check for inconsistencies
export default query({
  handler: async (ctx) => {
    console.log("Starting schema validation...");
    
    const validationResults = {
      issues: [],
      warnings: [],
      stats: {}
    };
    
    // Get all tables from the schema
    const tables = [
      "talent",
      "teams",
      "teamMembers",
      "skills",
      "talentSkills",
      "talentLanguages",
      "jobPostings",
      "applications",
      "matches",
      "predefinedOptions"
    ];
    
    // Validate each table
    for (const table of tables) {
      console.log(`Validating table: ${table}`);
      
      try {
        // Get all documents in the table
        const documents = await ctx.db.query(table).collect();
        validationResults.stats[table] = documents.length;
        
        // Perform table-specific validations
        switch (table) {
          case "talent":
            await validateTalent(ctx, documents, validationResults);
            break;
          case "teams":
            await validateTeams(ctx, documents, validationResults);
            break;
          case "teamMembers":
            await validateTeamMembers(ctx, documents, validationResults);
            break;
          case "talentSkills":
            await validateTalentSkills(ctx, documents, validationResults);
            break;
          case "talentLanguages":
            await validateTalentLanguages(ctx, documents, validationResults);
            break;
          case "jobPostings":
            await validateJobPostings(ctx, documents, validationResults);
            break;
          case "applications":
            await validateApplications(ctx, documents, validationResults);
            break;
          case "matches":
            await validateMatches(ctx, documents, validationResults);
            break;
          case "predefinedOptions":
            await validatePredefinedOptions(ctx, documents, validationResults);
            break;
        }
        
        console.log(`Successfully validated table: ${table}`);
      } catch (error) {
        console.error(`Error validating table ${table}:`, error);
        validationResults.issues.push({
          table,
          error: error.message,
          type: "error"
        });
      }
    }
    
    // Check for orphaned records
    await checkOrphanedRecords(ctx, validationResults);
    
    // Check for duplicate records
    await checkDuplicateRecords(ctx, validationResults);
    
    console.log("Schema validation complete!");
    
    // Summary
    console.log("\nValidation Summary:");
    console.log(`Total issues found: ${validationResults.issues.length}`);
    console.log(`Total warnings found: ${validationResults.warnings.length}`);
    console.log("Table statistics:", validationResults.stats);
    
    if (validationResults.issues.length > 0) {
      console.log("\nIssues:");
      validationResults.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.table}] ${issue.message}`);
      });
    }
    
    if (validationResults.warnings.length > 0) {
      console.log("\nWarnings:");
      validationResults.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. [${warning.table}] ${warning.message}`);
      });
    }
    
    return { 
      success: validationResults.issues.length === 0,
      validationResults
    };
  }
});

// Validate talent records
async function validateTalent(ctx, documents, results) {
  for (const talent of documents) {
    // Check for required fields
    const requiredFields = ["firstName", "lastName", "email", "phone", "tokenIdentifier"];
    for (const field of requiredFields) {
      if (!talent[field]) {
        results.issues.push({
          table: "talent",
          documentId: talent._id,
          message: `Missing required field: ${field}`,
          type: "missing_field"
        });
      }
    }
    
    // Check email format
    if (talent.email && !talent.email.includes("@")) {
      results.issues.push({
        table: "talent",
        documentId: talent._id,
        message: `Invalid email format: ${talent.email}`,
        type: "invalid_format"
      });
    }
    
    // Check for valid availability structure
    if (talent.availability) {
      const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      for (const day of days) {
        if (!talent.availability[day] || !Array.isArray(talent.availability[day])) {
          results.issues.push({
            table: "talent",
            documentId: talent._id,
            message: `Invalid availability structure for ${day}`,
            type: "invalid_structure"
          });
        }
      }
    }
  }
}

// Validate teams records
async function validateTeams(ctx, documents, results) {
  for (const team of documents) {
    // Check for required fields
    const requiredFields = ["name", "contactEmail", "location", "serviceStyle"];
    for (const field of requiredFields) {
      if (!team[field]) {
        results.issues.push({
          table: "teams",
          documentId: team._id,
          message: `Missing required field: ${field}`,
          type: "missing_field"
        });
      }
    }
    
    // Check if owner exists
    if (team.ownerId) {
      const owner = await ctx.db.get(team.ownerId);
      if (!owner) {
        results.issues.push({
          table: "teams",
          documentId: team._id,
          message: `Owner with ID ${team.ownerId} does not exist`,
          type: "invalid_reference"
        });
      }
    } else {
      results.warnings.push({
        table: "teams",
        documentId: team._id,
        message: "Team has no owner assigned",
        type: "missing_owner"
      });
    }
  }
}

// Validate team members
async function validateTeamMembers(ctx, documents, results) {
  for (const member of documents) {
    // Check for required fields
    const requiredFields = ["talentId", "teamId", "position", "role"];
    for (const field of requiredFields) {
      if (!member[field]) {
        results.issues.push({
          table: "teamMembers",
          documentId: member._id,
          message: `Missing required field: ${field}`,
          type: "missing_field"
        });
      }
    }
    
    // Check if talent exists
    if (member.talentId) {
      const talent = await ctx.db.get(member.talentId);
      if (!talent) {
        results.issues.push({
          table: "teamMembers",
          documentId: member._id,
          message: `Talent with ID ${member.talentId} does not exist`,
          type: "invalid_reference"
        });
      }
    }
    
    // Check if team exists
    if (member.teamId) {
      const team = await ctx.db.get(member.teamId);
      if (!team) {
        results.issues.push({
          table: "teamMembers",
          documentId: member._id,
          message: `Team with ID ${member.teamId} does not exist`,
          type: "invalid_reference"
        });
      }
    }
  }
}

// Validate talent skills
async function validateTalentSkills(ctx, documents, results) {
  for (const talentSkill of documents) {
    // Check for required fields
    const requiredFields = ["talentId", "skillId"];
    for (const field of requiredFields) {
      if (!talentSkill[field]) {
        results.issues.push({
          table: "talentSkills",
          documentId: talentSkill._id,
          message: `Missing required field: ${field}`,
          type: "missing_field"
        });
      }
    }
    
    // Check if talent exists
    if (talentSkill.talentId) {
      const talent = await ctx.db.get(talentSkill.talentId);
      if (!talent) {
        results.issues.push({
          table: "talentSkills",
          documentId: talentSkill._id,
          message: `Talent with ID ${talentSkill.talentId} does not exist`,
          type: "invalid_reference"
        });
      }
    }
    
    // Check if skill exists
    if (talentSkill.skillId) {
      const skill = await ctx.db.get(talentSkill.skillId);
      if (!skill) {
        results.issues.push({
          table: "talentSkills",
          documentId: talentSkill._id,
          message: `Skill with ID ${talentSkill.skillId} does not exist`,
          type: "invalid_reference"
        });
      }
    }
  }
}

// Validate talent languages
async function validateTalentLanguages(ctx, documents, results) {
  for (const talentLanguage of documents) {
    // Check for required fields
    const requiredFields = ["talentId", "language"];
    for (const field of requiredFields) {
      if (!talentLanguage[field]) {
        results.issues.push({
          table: "talentLanguages",
          documentId: talentLanguage._id,
          message: `Missing required field: ${field}`,
          type: "missing_field"
        });
      }
    }
    
    // Check if talent exists
    if (talentLanguage.talentId) {
      const talent = await ctx.db.get(talentLanguage.talentId);
      if (!talent) {
        results.issues.push({
          table: "talentLanguages",
          documentId: talentLanguage._id,
          message: `Talent with ID ${talentLanguage.talentId} does not exist`,
          type: "invalid_reference"
        });
      }
    }
  }
}

// Validate job postings
async function validateJobPostings(ctx, documents, results) {
  for (const jobPosting of documents) {
    // Check for required fields
    const requiredFields = ["teamId", "title", "description", "serviceStyle", "positionType", "specificPosition"];
    for (const field of requiredFields) {
      if (!jobPosting[field]) {
        results.issues.push({
          table: "jobPostings",
          documentId: jobPosting._id,
          message: `Missing required field: ${field}`,
          type: "missing_field"
        });
      }
    }
    
    // Check if team exists
    if (jobPosting.teamId) {
      const team = await ctx.db.get(jobPosting.teamId);
      if (!team) {
        results.issues.push({
          table: "jobPostings",
          documentId: jobPosting._id,
          message: `Team with ID ${jobPosting.teamId} does not exist`,
          type: "invalid_reference"
        });
      }
    }
    
    // Check for valid shifts structure
    if (jobPosting.shifts) {
      const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      for (const day of days) {
        if (!jobPosting.shifts[day] || !Array.isArray(jobPosting.shifts[day])) {
          results.issues.push({
            table: "jobPostings",
            documentId: jobPosting._id,
            message: `Invalid shifts structure for ${day}`,
            type: "invalid_structure"
          });
        }
      }
    }
    
    // Check if required skills exist
    if (jobPosting.requiredSkills && Array.isArray(jobPosting.requiredSkills)) {
      for (const skillId of jobPosting.requiredSkills) {
        const skill = await ctx.db.get(skillId);
        if (!skill) {
          results.issues.push({
            table: "jobPostings",
            documentId: jobPosting._id,
            message: `Required skill with ID ${skillId} does not exist`,
            type: "invalid_reference"
          });
        }
      }
    }
  }
}

// Validate applications
async function validateApplications(ctx, documents, results) {
  for (const application of documents) {
    // Check for required fields
    const requiredFields = ["talentId", "jobPostingId", "status"];
    for (const field of requiredFields) {
      if (!application[field]) {
        results.issues.push({
          table: "applications",
          documentId: application._id,
          message: `Missing required field: ${field}`,
          type: "missing_field"
        });
      }
    }
    
    // Check if talent exists
    if (application.talentId) {
      const talent = await ctx.db.get(application.talentId);
      if (!talent) {
        results.issues.push({
          table: "applications",
          documentId: application._id,
          message: `Talent with ID ${application.talentId} does not exist`,
          type: "invalid_reference"
        });
      }
    }
    
    // Check if job posting exists
    if (application.jobPostingId) {
      const jobPosting = await ctx.db.get(application.jobPostingId);
      if (!jobPosting) {
        results.issues.push({
          table: "applications",
          documentId: application._id,
          message: `Job posting with ID ${application.jobPostingId} does not exist`,
          type: "invalid_reference"
        });
      }
    }
    
    // Check status value
    const validStatuses = ["pending", "matched", "rejected"];
    if (application.status && !validStatuses.includes(application.status)) {
      results.issues.push({
        table: "applications",
        documentId: application._id,
        message: `Invalid status value: ${application.status}`,
        type: "invalid_value"
      });
    }
  }
}

// Validate matches
async function validateMatches(ctx, documents, results) {
  for (const match of documents) {
    // Check for required fields
    const requiredFields = ["applicationId", "talentId", "teamId", "jobPostingId", "status"];
    for (const field of requiredFields) {
      if (!match[field]) {
        results.issues.push({
          table: "matches",
          documentId: match._id,
          message: `Missing required field: ${field}`,
          type: "missing_field"
        });
      }
    }
    
    // Check if application exists
    if (match.applicationId) {
      const application = await ctx.db.get(match.applicationId);
      if (!application) {
        results.issues.push({
          table: "matches",
          documentId: match._id,
          message: `Application with ID ${match.applicationId} does not exist`,
          type: "invalid_reference"
        });
      }
    }
    
    // Check if talent exists
    if (match.talentId) {
      const talent = await ctx.db.get(match.talentId);
      if (!talent) {
        results.issues.push({
          table: "matches",
          documentId: match._id,
          message: `Talent with ID ${match.talentId} does not exist`,
          type: "invalid_reference"
        });
      }
    }
    
    // Check if team exists
    if (match.teamId) {
      const team = await ctx.db.get(match.teamId);
      if (!team) {
        results.issues.push({
          table: "matches",
          documentId: match._id,
          message: `Team with ID ${match.teamId} does not exist`,
          type: "invalid_reference"
        });
      }
    }
    
    // Check if job posting exists
    if (match.jobPostingId) {
      const jobPosting = await ctx.db.get(match.jobPostingId);
      if (!jobPosting) {
        results.issues.push({
          table: "matches",
          documentId: match._id,
          message: `Job posting with ID ${match.jobPostingId} does not exist`,
          type: "invalid_reference"
        });
      }
    }
    
    // Check status value
    const validStatuses = ["active", "completed", "terminated"];
    if (match.status && !validStatuses.includes(match.status)) {
      results.issues.push({
        table: "matches",
        documentId: match._id,
        message: `Invalid status value: ${match.status}`,
        type: "invalid_value"
      });
    }
  }
}

// Validate predefined options
async function validatePredefinedOptions(ctx, documents, results) {
  for (const option of documents) {
    // Check for required fields
    const requiredFields = ["category", "value", "displayName"];
    for (const field of requiredFields) {
      if (!option[field]) {
        results.issues.push({
          table: "predefinedOptions",
          documentId: option._id,
          message: `Missing required field: ${field}`,
          type: "missing_field"
        });
      }
    }
    
    // Check category value
    const validCategories = ["serviceStyle", "position", "area", "shift", "commuteMethod"];
    if (option.category && !validCategories.includes(option.category)) {
      results.issues.push({
        table: "predefinedOptions",
        documentId: option._id,
        message: `Invalid category value: ${option.category}`,
        type: "invalid_value"
      });
    }
  }
}

// Check for orphaned records
async function checkOrphanedRecords(ctx, results) {
  console.log("Checking for orphaned records...");
  
  // Check for team members without a valid team
  const teamMembers = await ctx.db.query("teamMembers").collect();
  const teamIds = new Set((await ctx.db.query("teams").collect()).map(team => team._id));
  
  for (const member of teamMembers) {
    if (!teamIds.has(member.teamId)) {
      results.issues.push({
        table: "teamMembers",
        documentId: member._id,
        message: `Team member references non-existent team: ${member.teamId}`,
        type: "orphaned_record"
      });
    }
  }
  
  // Check for job postings without a valid team
  const jobPostings = await ctx.db.query("jobPostings").collect();
  
  for (const jobPosting of jobPostings) {
    if (!teamIds.has(jobPosting.teamId)) {
      results.issues.push({
        table: "jobPostings",
        documentId: jobPosting._id,
        message: `Job posting references non-existent team: ${jobPosting.teamId}`,
        type: "orphaned_record"
      });
    }
  }
}

// Check for duplicate records
async function checkDuplicateRecords(ctx, results) {
  console.log("Checking for duplicate records...");
  
  // Check for duplicate talent skills
  const talentSkills = await ctx.db.query("talentSkills").collect();
  const talentSkillMap = new Map();
  
  for (const talentSkill of talentSkills) {
    const key = `${talentSkill.talentId}-${talentSkill.skillId}`;
    if (talentSkillMap.has(key)) {
      results.warnings.push({
        table: "talentSkills",
        documentId: talentSkill._id,
        message: `Duplicate talent skill: Talent ${talentSkill.talentId} already has skill ${talentSkill.skillId}`,
        type: "duplicate_record"
      });
    } else {
      talentSkillMap.set(key, talentSkill._id);
    }
  }
  
  // Check for duplicate talent languages
  const talentLanguages = await ctx.db.query("talentLanguages").collect();
  const talentLanguageMap = new Map();
  
  for (const talentLanguage of talentLanguages) {
    const key = `${talentLanguage.talentId}-${talentLanguage.language}`;
    if (talentLanguageMap.has(key)) {
      results.warnings.push({
        table: "talentLanguages",
        documentId: talentLanguage._id,
        message: `Duplicate talent language: Talent ${talentLanguage.talentId} already has language ${talentLanguage.language}`,
        type: "duplicate_record"
      });
    } else {
      talentLanguageMap.set(key, talentLanguage._id);
    }
  }
  
  // Check for duplicate applications
  const applications = await ctx.db.query("applications").collect();
  const applicationMap = new Map();
  
  for (const application of applications) {
    const key = `${application.talentId}-${application.jobPostingId}`;
    if (applicationMap.has(key)) {
      results.warnings.push({
        table: "applications",
        documentId: application._id,
        message: `Duplicate application: Talent ${application.talentId} already applied to job ${application.jobPostingId}`,
        type: "duplicate_record"
      });
    } else {
      applicationMap.set(key, application._id);
    }
  }
}
