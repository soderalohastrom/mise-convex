import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get predefined options for a category
export const getPredefinedOptions = query({
  args: {
    category: v.string(),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      return await ctx.db
        .query("predefinedOptions")
        .withIndex("by_category_and_active", (q) => 
          q.eq("category", args.category).eq("isActive", true)
        )
        .collect();
    } else {
      return await ctx.db
        .query("predefinedOptions")
        .withIndex("by_category", (q) => q.eq("category", args.category))
        .collect();
    }
  },
});

// Add predefined option
export const addPredefinedOption = mutation({
  args: {
    category: v.string(),
    value: v.string(),
    displayName: v.string(),
    isActive: v.boolean(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // This would need proper admin-level permission check in a real app
    
    // Get the highest order for this category if order not provided
    let order = args.order;
    if (order === undefined) {
      const options = await ctx.db
        .query("predefinedOptions")
        .withIndex("by_category", (q) => q.eq("category", args.category))
        .collect();
      
      const maxOrder = options.reduce(
        (max, opt) => Math.max(max, opt.order || 0), 
        0
      );
      
      order = maxOrder + 1;
    }
    
    return await ctx.db.insert("predefinedOptions", {
      category: args.category,
      value: args.value,
      displayName: args.displayName,
      isActive: args.isActive,
      order,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Initialize default predefined options (run during app setup)
export const initializePredefinedOptions = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // This would need proper admin-level permission check in a real app
    
    // Check if options already exist
    const existingOptions = await ctx.db
      .query("predefinedOptions")
      .first();
    
    if (existingOptions) {
      return { status: "Options already exist" };
    }
    
    // Service Styles
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
    
    // Positions - BOH
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
    
    // Positions - FOH
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
    
    // Skills - BOH
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
    
    for (let i = 0; i < bohSkills.length; i++) {
      await ctx.db.insert("predefinedOptions", {
        category: "skill_BOH",
        value: bohSkills[i],
        displayName: bohSkills[i],
        isActive: true,
        order: i + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // Skills - FOH
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
    
    for (let i = 0; i < fohSkills.length; i++) {
      await ctx.db.insert("predefinedOptions", {
        category: "skill_FOH",
        value: fohSkills[i],
        displayName: fohSkills[i],
        isActive: true,
        order: i + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // Skills - General
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
    
    for (let i = 0; i < generalSkills.length; i++) {
      await ctx.db.insert("predefinedOptions", {
        category: "skill_General",
        value: generalSkills[i],
        displayName: generalSkills[i],
        isActive: true,
        order: i + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // Areas (Seattle neighborhoods)
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
    
    // Commute Methods
    const commuteMethods = [
      "I have a car",
      "I use the bus/train",
      "I use ride share services",
      "Cycle or walk",
      "Other",
    ];
    
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
    
    // Shifts
    const shifts = [
      "Morning",
      "Midday",
      "Swing",
      "Nights",
      "Graveyard",
    ];
    
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
    
    // Experience Levels
    const experienceLevels = [
      "Entry level",
      "1-2 years",
      "3-5 years",
      "5-10 years",
      "10+ years",
    ];
    
    for (let i = 0; i < experienceLevels.length; i++) {
      await ctx.db.insert("predefinedOptions", {
        category: "experienceLevel",
        value: experienceLevels[i],
        displayName: experienceLevels[i],
        isActive: true,
        order: i + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // Languages
    const languages = [
      "English",
      "Spanish",
      "Chinese",
      "Vietnamese",
      "Korean",
      "Japanese",
      "French",
      "Italian",
      "German",
      "Russian",
      "Tagalog",
      "Arabic",
      "Other",
    ];
    
    for (let i = 0; i < languages.length; i++) {
      await ctx.db.insert("predefinedOptions", {
        category: "language",
        value: languages[i],
        displayName: languages[i],
        isActive: true,
        order: i + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    return { status: "Success", initializedCategories: [
      "serviceStyle",
      "position",
      "skill_BOH",
      "skill_FOH",
      "skill_General",
      "area",
      "commuteMethod",
      "shift",
      "experienceLevel",
      "language",
    ]};
  },
});

// Update predefined option
export const updatePredefinedOption = mutation({
  args: {
    optionId: v.id("predefinedOptions"),
    displayName: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // This would need proper admin-level permission check in a real app
    
    // Remove undefined values
    const updates = {};
    if (args.displayName !== undefined) updates.displayName = args.displayName;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.order !== undefined) updates.order = args.order;
    
    if (Object.keys(updates).length === 0) {
      return args.optionId; // Nothing to update
    }
    
    // Update the option
    await ctx.db.patch(args.optionId, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    return args.optionId;
  },
});

// Helper function to filter options by search term
export const searchPredefinedOptions = query({
  args: {
    category: v.string(),
    searchTerm: v.string(),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let options;
    
    if (args.activeOnly) {
      options = await ctx.db
        .query("predefinedOptions")
        .withIndex("by_category_and_active", (q) => 
          q.eq("category", args.category).eq("isActive", true)
        )
        .collect();
    } else {
      options = await ctx.db
        .query("predefinedOptions")
        .withIndex("by_category", (q) => q.eq("category", args.category))
        .collect();
    }
    
    // Filter by search term (case-insensitive)
    const searchTerm = args.searchTerm.toLowerCase();
    const filteredOptions = options.filter(option => 
      option.displayName.toLowerCase().includes(searchTerm) ||
      option.value.toLowerCase().includes(searchTerm)
    );
    
    // Sort by order
    return filteredOptions.sort((a, b) => a.order - b.order);
  },
});

// Get all available categories
export const getOptionCategories = query({
  handler: async (ctx) => {
    const distinctCategories = await ctx.db
      .query("predefinedOptions")
      .collect()
      .then(options => 
        [...new Set(options.map(opt => opt.category))]
      );
    
    return distinctCategories;
  },
});
