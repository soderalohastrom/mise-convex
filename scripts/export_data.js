// This script can be run with the Convex CLI to export all data from the database
// Run with: npx convex run scripts/export_data.js
// The data will be exported to the ./data_export directory

import { query } from "../_generated/server";
import fs from "fs";
import path from "path";

// Export all data from the database
export default query({
  handler: async (ctx) => {
    console.log("Starting database export...");
    
    // Create export directory if it doesn't exist
    const exportDir = path.join(process.cwd(), "data_export");
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    // Get timestamp for the export
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    
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
    
    const exportResults = {};
    
    // Export each table
    for (const table of tables) {
      console.log(`Exporting table: ${table}`);
      
      try {
        // Get all documents in the table
        const documents = await ctx.db.query(table).collect();
        
        // Save to file
        const filePath = path.join(exportDir, `${table}_${timestamp}.json`);
        fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
        
        console.log(`Successfully exported table: ${table} to ${filePath}`);
        exportResults[table] = {
          success: true,
          count: documents.length,
          filePath
        };
      } catch (error) {
        console.error(`Error exporting table ${table}:`, error);
        exportResults[table] = {
          success: false,
          error: error.message
        };
      }
    }
    
    // Create a summary file
    const summaryPath = path.join(exportDir, `export_summary_${timestamp}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify({
      timestamp,
      tables: exportResults
    }, null, 2));
    
    console.log("Database export complete!");
    console.log(`Export summary saved to: ${summaryPath}`);
    
    return { 
      success: true, 
      message: "Database has been exported successfully",
      exportDir,
      summary: exportResults
    };
  }
});
