import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useUser } from '@clerk/clerk-react';

// Example component for creating a job posting
export default function JobPostingForm() {
  const { user } = useUser();
  
  // Get the user's teams
  const teams = useQuery(api.index.getMyTeams);
  
  // Get predefined options for dropdowns
  const serviceStyles = useQuery(api.index.getPredefinedOptions, { 
    category: "serviceStyle",
    activeOnly: true,
  });
  
  const positions = useQuery(api.index.getPredefinedOptions, { 
    category: "position",
    activeOnly: true,
  });
  
  const experienceLevels = useQuery(api.index.getPredefinedOptions, { 
    category: "experienceLevel",
    activeOnly: true,
  });
  
  const shifts = useQuery(api.index.getPredefinedOptions, { 
    category: "shift",
    activeOnly: true,
  });
  
  const allSkills = useQuery(api.index.getPredefinedOptions, { 
    category: "skill_all",
    activeOnly: true,
  });
  
  // Mutation to create job posting
  const createJobPosting = useMutation(api.index.createJobPosting);
  
  // Form state
  const [formData, setFormData] = useState({
    teamId: "",
    title: "",
    description: "",
    serviceStyle: "",
    positionType: "FOH", // Default to Front of House
    specificPosition: "",
    experienceRequired: "",
    requiredSkills: [] as string[],
    shifts: {
      monday: [] as string[],
      tuesday: [] as string[],
      wednesday: [] as string[],
      thursday: [] as string[],
      friday: [] as string[],
      saturday: [] as string[],
      sunday: [] as string[],
    },
    compensationType: "hourly", // Default to hourly
    compensationRange: {
      min: 0,
      max: 0,
    },
    isActive: true,
    startDate: "",
  });
  
  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: target.checked,
      });
    } else if (name === 'min' || name === 'max') {
      // Handle nested compensationRange values
      setFormData({
        ...formData,
        compensationRange: {
          ...formData.compensationRange,
          [name]: parseFloat(value) || 0,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  // Handle multi-select changes (for arrays)
  const handleMultiSelectChange = (name: string, value: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        [name]: [...formData[name as keyof typeof formData] as string[], value],
      });
    } else {
      setFormData({
        ...formData,
        [name]: (formData[name as keyof typeof formData] as string[]).filter(item => item !== value),
      });
    }
  };
  
  // Handle shift selection
  const handleShiftChange = (day: string, shift: string, checked: boolean) => {
    const currentShifts = formData.shifts[day as keyof typeof formData.shifts] as string[];
    
    if (checked) {
      setFormData({
        ...formData,
        shifts: {
          ...formData.shifts,
          [day]: [...currentShifts, shift],
        },
      });
    } else {
      setFormData({
        ...formData,
        shifts: {
          ...formData.shifts,
          [day]: currentShifts.filter(s => s !== shift),
        },
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Validate form data
      if (formData.compensationRange.min > formData.compensationRange.max) {
        throw new Error("Minimum compensation cannot be greater than maximum");
      }
      
      // Submit form data to Convex
      await createJobPosting(formData);
      setSuccess(true);
      window.scrollTo(0, 0);
      
      // Reset form to default values
      setFormData({
        ...formData,
        title: "",
        description: "",
        specificPosition: "",
        requiredSkills: [],
        shifts: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
        compensationRange: {
          min: 0,
          max: 0,
        },
        startDate: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!user) {
    return <div className="p-4">Please sign in to create a job posting.</div>;
  }
  
  if (!teams || teams.length === 0) {
    return <div className="p-4">You need to create a team before posting jobs.</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create Job Posting</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Job posting successfully created!
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Team Selection */}
        <section className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Team Information</h2>
          <div>
            <label className="block mb-1">Select Team</label>
            <select
              name="teamId"
              value={formData.teamId}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            >
              <option value="">Select a team</option>
              {teams.map(team => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </section>
        
        {/* Job Details */}
        <section className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Job Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block mb-1">Job Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
                placeholder="e.g., Experienced Line Cook, Senior Server"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block mb-1">Job Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
                rows={5}
                placeholder="Describe the responsibilities, qualifications, and any unique aspects of the position..."
              />
            </div>
          </div>
        </section>
        
        {/* Position Details */}
        <section className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Position Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {serviceStyles ? (
              <div>
                <label className="block mb-1">Service Style</label>
                <select
                  name="serviceStyle"
                  value={formData.serviceStyle}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select service style</option>
                  {serviceStyles.map(style => (
                    <option key={style._id} value={style.value}>
                      {style.displayName}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>Loading service styles...</div>
            )}
            
            <div>
              <label className="block mb-1">Position Type</label>
              <select
                name="positionType"
                value={formData.positionType}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              >
                <option value="BOH">Back of House</option>
                <option value="FOH">Front of House</option>
              </select>
            </div>
            
            {positions ? (
              <div>
                <label className="block mb-1">Specific Position</label>
                <select
                  name="specificPosition"
                  value={formData.specificPosition}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select specific position</option>
                  {positions
                    .filter(pos => {
                      // Filter positions based on BOH/FOH selection
                      const isBOH = pos.value.startsWith("boh_");
                      return formData.positionType === "BOH" ? isBOH : !isBOH;
                    })
                    .map(position => (
                      <option key={position._id} value={position.value}>
                        {position.displayName}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>Loading positions...</div>
            )}
            
            {experienceLevels ? (
              <div>
                <label className="block mb-1">Experience Required</label>
                <select
                  name="experienceRequired"
                  value={formData.experienceRequired}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select experience level</option>
                  {experienceLevels.map(level => (
                    <option key={level._id} value={level.value}>
                      {level.displayName}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>Loading experience levels...</div>
            )}
          </div>
        </section>
        
        {/* Required Skills */}
        <section className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Required Skills</h2>
          
          {allSkills ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {allSkills
                .filter(skill => {
                  // Filter skills based on BOH/FOH selection
                  if (formData.positionType === "BOH") {
                    return skill.category === "skill_BOH" || skill.category === "skill_General";
                  } else {
                    return skill.category === "skill_FOH" || skill.category === "skill_General";
                  }
                })
                .map(skill => (
                  <div key={skill._id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`skill-${skill._id}`}
                      checked={formData.requiredSkills.includes(skill.value)}
                      onChange={(e) => handleMultiSelectChange('requiredSkills', skill.value, e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor={`skill-${skill._id}`}>{skill.displayName}</label>
                  </div>
                ))}
            </div>
          ) : (
            <div>Loading skills...</div>
          )}
        </section>
        
        {/* Shifts */}
        <section className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Shift Requirements</h2>
          
          {shifts ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="p-2 border">Day</th>
                    {shifts.map(shift => (
                      <th key={shift._id} className="p-2 border">{shift.displayName}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <tr key={day}>
                      <td className="p-2 border capitalize">{day}</td>
                      {shifts.map(shift => (
                        <td key={`${day}-${shift._id}`} className="p-2 border text-center">
                          <input
                            type="checkbox"
                            checked={(formData.shifts[day as keyof typeof formData.shifts] as string[]).includes(shift.value)}
                            onChange={(e) => handleShiftChange(day, shift.value, e.target.checked)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div>Loading shifts...</div>
          )}
        </section>
        
        {/* Compensation */}
        <section className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Compensation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Compensation Type</label>
              <select
                name="compensationType"
                value={formData.compensationType}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              >
                <option value="hourly">Hourly</option>
                <option value="salary">Salary</option>
              </select>
            </div>
            
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">
                  Minimum {formData.compensationType === "hourly" ? "Hourly Rate ($)" : "Annual Salary ($)"}
                </label>
                <input
                  type="number"
                  name="min"
                  value={formData.compensationRange.min || ''}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                  min="0"
                  step={formData.compensationType === "hourly" ? "0.50" : "1000"}
                />
              </div>
              <div>
                <label className="block mb-1">
                  Maximum {formData.compensationType === "hourly" ? "Hourly Rate ($)" : "Annual Salary ($)"}
                </label>
                <input
                  type="number"
                  name="max"
                  value={formData.compensationRange.max || ''}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                  min="0"
                  step={formData.compensationType === "hourly" ? "0.50" : "1000"}
                />
              </div>
            </div>
          </div>
        </section>
        
        {/* Start Date */}
        <section className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Start Date</h2>
          <div>
            <label className="block mb-1">When does this position start?</label>
            <select
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            >
              <option value="">Select start date</option>
              <option value="Immediately">Immediately</option>
              <option value="Within 2 weeks">Within 2 weeks</option>
              <option value="Within 1 month">Within 1 month</option>
              <option value="Flexible">Flexible</option>
            </select>
          </div>
        </section>
        
        {/* Job Status */}
        <section className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Job Status</h2>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={(e) => handleChange(e)}
              className="mr-2"
            />
            <label htmlFor="isActive">Make this job posting active immediately</label>
          </div>
        </section>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Job Posting'}
          </button>
        </div>
      </form>
    </div>
  );
}
