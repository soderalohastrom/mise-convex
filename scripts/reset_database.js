// This script can be run with the Convex CLI to reset the database by clearing all tables
// Run with: npx convex run scripts/reset_database.js

import { mutation } from "../_generated/server";

// Reset the database by clearing all tables
export default mutation({
  handler: async (ctx) => {
    console.log("Starting database reset...");
    
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
    
    // Clear each table
    for (const table of tables) {
      console.log(`Clearing table: ${table}`);
      
      try {
        // Get all documents in the table
        const documents = await ctx.db.query(table).collect();
        
        // Delete each document
        for (const doc of documents) {
          await ctx.db.delete(doc._id);
        }
        
        console.log(`Successfully cleared table: ${table}`);
      } catch (error) {
        console.error(`Error clearing table ${table}:`, error);
      }
    }
    
    console.log("Database reset complete!");
    return { success: true, message: "Database has been reset successfully" };
  }
});
