# Mise Matching Algorithm

This document describes the talent-job matching algorithm used in the Mise application.

## Overview

The matching algorithm is designed to connect talent (service industry workers) with appropriate job postings based on various criteria. The algorithm calculates a "match score" for each job posting relative to a talent's profile, enabling the system to suggest the most suitable positions.

## Match Score Calculation

The match score is a numeric value (0-100) that represents how well a talent matches a job posting. Higher scores indicate better matches. The score is calculated based on the following factors:

### Scoring Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Position Match | 30 points | Whether the talent's position preferences include the job's position |
| Service Style Match | 20 points | Whether the talent's preferred service styles include the job's service style |
| Location Match | 20 points | Whether the talent's preferred work area matches the job's location |
| Availability Match | 15 points | Whether the talent's availability overlaps with the job's required shifts |
| Compensation Match | 15 points | Whether the talent's desired compensation falls within the job's range |
| Skills Match | Additional points | Proportional to the number of required skills the talent possesses |
| Experience Match | Additional points | Whether the talent's experience meets or exceeds job requirements |

### Score Calculation Implementation

```typescript
// Calculate match score based on various factors
let matchScore = 0;

// Position match (30 points)
if (talent.positionPreferences.includes(job.specificPosition)) {
  matchScore += 30;
}

// Service style match (20 points)
if (talent.serviceStylePreferences.includes(job.serviceStyle)) {
  matchScore += 20;
}

// Location match (20 points)
if (talent.interestedWorkingArea === team?.location) {
  matchScore += 20;
}

// Availability match (15 points)
// Check if talent is available for at least some of the shifts
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

// Compensation match (15 points)
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
```

## Implementation in Job Search

The matching algorithm is primarily implemented in the `searchJobPostings` function, which finds and ranks job postings for a talent:

```typescript
export const searchJobPostings = query({
  args: {
    location: v.optional(v.string()),
    positionType: v.optional(v.string()), // BOH or FOH
    specificPosition: v.optional(v.string()),
    serviceStyle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current user
    const talent = await getCurrentTalent(ctx);
    
    // Start with all active job postings
    let jobPostings = await ctx.db
      .query("jobPostings")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    // Apply filters based on arguments
    // [Filter code omitted for brevity]
    
    // Enhance job postings with team info and match score
    const enhancedJobPostings = await Promise.all(
      jobPostings.map(async (job) => {
        const team = await ctx.db.get(job.teamId);
        
        // Calculate match score based on various factors
        let matchScore = 0;
        
        // [Score calculation as shown above]
        
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
```

## Talent Search for Teams

Teams can also search for talent using a similar matching mechanism, implemented in the `searchTalent` function:

```typescript
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
    // Verify permissions
    // [Permission check code omitted for brevity]
    
    // Apply filters
    // [Filter code omitted for brevity]
    
    // Enrich with skills and languages
    // [Enrichment code omitted for brevity]
    
    // Calculate match scores and sort
    // [Score calculation and sorting omitted for brevity]
    
    // Return sorted talent profiles
    return sortedTalentProfiles;
  },
});
```

## Future Enhancements

The current matching algorithm provides a solid foundation, but several enhancements could be made in future iterations:

### Weighted Skill Matching

Currently, the algorithm gives equal weight to all skills. A more sophisticated approach would be to weight skills based on their importance for the specific position.

```typescript
// Enhanced skill matching
const skillMatchScore = requiredSkills.reduce((score, skillId) => {
  const hasSkill = talentSkills.some(skill => skill.skillId === skillId);
  const skillImportance = getSkillImportance(skillId, job.specificPosition);
  return score + (hasSkill ? skillImportance : 0);
}, 0);

matchScore += skillMatchScore;
```

### Availability Weighting

Instead of a binary availability match, the system could calculate a percentage of shift coverage:

```typescript
// Calculate percentage of shift coverage
let shiftCoverage = 0;
let totalShifts = 0;

for (const day of DAYS_OF_WEEK) {
  const talentShifts = talent.availability[day] || [];
  const jobShifts = job.shifts[day] || [];
  
  for (const shift of jobShifts) {
    totalShifts++;
    if (talentShifts.includes(shift)) {
      shiftCoverage++;
    }
  }
}

const availabilityScore = totalShifts > 0 
  ? 15 * (shiftCoverage / totalShifts) 
  : 0;

matchScore += availabilityScore;
```

### Machine Learning Approach

As the platform collects more data on successful matches, a machine learning model could be trained to predict match success based on historical data.

```typescript
// Pseudocode for ML-based matching
async function calculateMLMatchScore(talent, job) {
  const features = extractFeatures(talent, job);
  const prediction = await matchPredictionModel.predict(features);
  return prediction.score * 100; // Convert to 0-100 scale
}
```

### Feedback-Based Refinement

Incorporate feedback from both talent and teams to refine match scores over time:

```typescript
// Adjust match score based on feedback
const teamFeedback = await getTeamFeedbackForPosition(job.specificPosition);
const talentFeedback = await getTalentFeedbackForServiceStyle(job.serviceStyle);

matchScore = matchScore * (1 + teamFeedback.factor) * (1 + talentFeedback.factor);
```

## Conclusion

The matching algorithm is a central feature of the Mise platform, providing intelligent recommendations to connect talent with suitable positions. By considering multiple factors and weighting them appropriately, the system can effectively suggest matches that meet both the talent's preferences and the team's requirements.

As the platform grows and more data becomes available, the algorithm can be refined to improve match quality, ultimately creating better outcomes for both talent and teams in the hospitality industry.
