// This file serves as the main entry point for exporting Convex functions

// Re-export functions from individual files for easier client access
// This allows client code to import from a single point, e.g.,
// import { api } from "./_generated/api";
// const talentProfile = useQuery(api.index.getTalentProfile);

// Talent related functions
export {
  createOrUpdateTalentProfile,
  getTalentProfile,
  searchJobPostings,
  getCurrentUser,
  deleteTalentProfile,
} from "./talent";

// Team related functions
export {
  createTeam,
  getMyTeams,
  createJobPosting,
  getTeamApplications,
  getTeamJobPostings,
  updateTeam,
  deleteTeam,
} from "./teams";

// Application related functions
export {
  applyToJob,
  getMyApplications,
  withdrawApplication,
  getApplicationDetails,
} from "./applications";

// Matching related functions
export {
  updateApplicationStatus,
  getMyMatches,
  getTeamMatches,
  updateMatchStatus,
} from "./matching";

// Search related functions
export {
  searchTalent,
  searchJobPostings as advancedSearchJobPostings,
} from "./search";

// Utility functions
export {
  getPredefinedOptions,
  addPredefinedOption,
  initializePredefinedOptions,
  updatePredefinedOption,
  searchPredefinedOptions,
  getOptionCategories,
} from "./utils";

// This convention provides a clean organization for the client API
// while maintaining a modular organization of the server codebase
