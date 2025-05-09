import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useUser } from '@clerk/clerk-react';

// Example component for creating/updating a talent profile
export default function TalentProfileForm() {
  const { user } = useUser();
  
  // Get existing profile if any
  const profile = useQuery(api.index.getTalentProfile);
  
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
  
  const areas = useQuery(api.index.getPredefinedOptions, { 
    category: "area",
    activeOnly: true,
  });
  
  const commuteMethods = useQuery(api.index.getPredefinedOptions, { 
    category: "commuteMethod",
    activeOnly: true,
  });
  
  const shifts = useQuery(api.index.getPredefinedOptions, { 
    category: "shift",
    activeOnly: true,
  });
  
  const bohSkills = useQuery(api.index.getPredefinedOptions, { 
    category: "skill_BOH",
    activeOnly: true,
  });
  
  const fohSkills = useQuery(api.index.getPredefinedOptions, { 
    category: "skill_FOH",
    activeOnly: true,
  });
  
  const generalSkills = useQuery(api.index.getPredefinedOptions, { 
    category: "skill_General",
    activeOnly: true,
  });
  
  const languages = useQuery(api.index.getPredefinedOptions, { 
    category: "language",
    activeOnly: true,
  });
  
  // Mutation to create/update profile
  const saveProfile = useMutation(api.index.createOrUpdateTalentProfile);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    lastFourSSN: "",
    legallyWorkInUS: false,
    inHospitalityIndustry: false,
    over21: false,
    livingArea: "",
    interestedWorkingArea: "",
    commuteMethod: [],
    serviceStylePreferences: [],
    positionPreferences: [],
    experienceLevel: "",
    availability: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
    lastJobName: "",
    lastJobPosition: "",
    lastJobDuration: "",
    lastJobLeaveReason: "",
    lastJobContactable: false,
    desiredHourlyWage: undefined,
    desiredYearlySalary: undefined,
    startDatePreference: "Immediately",
    additionalNotes: "",
    skills: [],
    languages: [],
  });
  
  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Populate form with existing profile data when loaded
  useEffect(() => {
    if (profile) {
      // Extract skills and languages from profile
      const skillNames = profile.skills?.map(skill => skill.name) || [];
      const languageNames = profile.languages || [];
      
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        lastFourSSN: profile.lastFourSSN || "",
        legallyWorkInUS: profile.legallyWorkInUS || false,
        inHospitalityIndustry: profile.inHospitalityIndustry || false,
        over21: profile.over21 || false,
        livingArea: profile.livingArea || "",
        interestedWorkingArea: profile.interestedWorkingArea || "",
        commuteMethod: profile.commuteMethod || [],
        serviceStylePreferences: profile.serviceStylePreferences || [],
        positionPreferences: profile.positionPreferences || [],
        experienceLevel: profile.experienceLevel || "",
        availability: profile.availability || {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
        lastJobName: profile.lastJobName || "",
        lastJobPosition: profile.lastJobPosition || "",
        lastJobDuration: profile.lastJobDuration || "",
        lastJobLeaveReason: profile.lastJobLeaveReason || "",
        lastJobContactable: profile.lastJobContactable || false,
        desiredHourlyWage: profile.desiredHourlyWage,
        desiredYearlySalary: profile.desiredYearlySalary,
        startDatePreference: profile.startDatePreference || "Immediately",
        additionalNotes: profile.additionalNotes || "",
        skills: skillNames,
        languages: languageNames,
      });
    } else if (user) {
      // Populate basic info from Clerk user if available
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.emailAddresses[0]?.emailAddress || "",
      }));
    }
  }, [profile, user]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: target.checked,
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
  
  // Handle availability changes
  const handleAvailabilityChange = (day: string, shift: string, checked: boolean) => {
    const currentShifts = formData.availability[day as keyof typeof formData.availability] as string[];
    
    if (checked) {
      setFormData({
        ...formData,
        availability: {
          ...formData.availability,
          [day]: [...currentShifts, shift],
        },
      });
    } else {
      setFormData({
        ...formData,
        availability: {
          ...formData.availability,
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
      // Submit form data to Convex
      await saveProfile(formData);
      setSuccess(true);
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!user) {
    return <div className="p-4">Please sign in to create or update your profile.</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Talent Profile</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Profile successfully saved!
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <section className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Last 4 of SSN (Your MISE ID)</label>
              <input
                type="text"
                name="lastFourSSN"
                value={formData.lastFourSSN}
                onChange={handleChange}
                required
                maxLength={4}
                pattern="[0-9]{4}"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </section>
        
        {/* Legal Requirements */}
        <section className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Legal Requirements</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="legallyWorkInUS"
                name="legallyWorkInUS"
                checked={formData.legallyWorkInUS}
                onChange={(e) => handleChange(e)}
                className="mr-2"
              />
              <label htmlFor="legallyWorkInUS">I am legally authorized to work in the United States</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="inHospitalityIndustry"
                name="inHospitalityIndustry"
                checked={formData.inHospitalityIndustry}
                onChange={(e) => handleChange(e)}
                className="mr-2"
              />
              <label htmlFor="inHospitalityIndustry">I currently work in the hospitality industry</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="over21"
                name="over21"
                checked={formData.over21}
                onChange={(e) => handleChange(e)}
                className="mr-2"
              />
              <label htmlFor="over21">I am over 21 years of age</label>
            </div>
          </div>
        </section>
        
        {/* Location Information */}
        <section className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Location Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {areas ? (
              <>
                <div>
                  <label className="block mb-1">Where do you live?</label>
                  <select
                    name="livingArea"
                    value={formData.livingArea}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select area</option>
                    {areas.map(area => (
                      <option key={area._id} value={area.value}>
                        {area.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Where would you like to work?</label>
                  <select
                    name="interestedWorkingArea"
                    value={formData.interestedWorkingArea}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select area</option>
                    {areas.map(area => (
                      <option key={area._id} value={area.value}>
                        {area.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div>Loading area options...</div>
            )}
          </div>
          
          {commuteMethods ? (
            <div className="mt-4">
              <label className="block mb-2">How do you commute?</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {commuteMethods.map(method => (
                  <div key={method._id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`commute-${method._id}`}
                      checked={formData.commuteMethod.includes(method.value)}
                      onChange={(e) => handleMultiSelectChange('commuteMethod', method.value, e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor={`commute-${method._id}`}>{method.displayName}</label>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>Loading commute methods...</div>
          )}
        </section>
        
        {/* Job Preferences */}
        <section className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Job Preferences</h2>
          
          {serviceStyles ? (
            <div className="mb-4">
              <label className="block mb-2">Service Style Preferences</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {serviceStyles.map(style => (
                  <div key={style._id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`style-${style._id}`}
                      checked={formData.serviceStylePreferences.includes(style.value)}
                      onChange={(e) => handleMultiSelectChange('serviceStylePreferences', style.value, e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor={`style-${style._id}`}>{style.displayName}</label>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>Loading service styles...</div>
          )}
          
          {positions ? (
            <div className="mb-4">
              <label className="block mb-2">Position Preferences (select up to 3)</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {positions.map(position => (
                  <div key={position._id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`position-${position._id}`}
                      checked={formData.positionPreferences.includes(position.value)}
                      onChange={(e) => {
                        // Only allow up to 3 selections
                        if (e.target.checked && formData.positionPreferences.length >= 3) {
                          alert("You can select up to 3 positions");
                          return;
                        }
                        handleMultiSelectChange('positionPreferences', position.value, e.target.checked);
                      }}
                      className="mr-2"
                    />
                    <label htmlFor={`position-${position._id}`}>{position.displayName}</label>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>Loading positions...</div>
          )}
          
          {experienceLevels ? (
            <div>
              <label className="block mb-1">Experience Level (in your top position)</label>
              <select
                name="experienceLevel"
                value={formData.experienceLevel}
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
        </section>
        
        {/* Availability */}
        <section className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Availability</h2>
          
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
                            checked={(formData.availability[day as keyof typeof formData.availability] as string[]).includes(shift.value)}
                            onChange={(e) => handleAvailabilityChange(day, shift.value, e.target.checked)}
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
        
        {/* Previous Job */}
        <section className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Previous Job</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Last Job Name</label>
              <input
                type="text"
                name="lastJobName"
                value={formData.lastJobName}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Position</label>
              <input
                type="text"
                name="lastJobPosition"
                value={formData.lastJobPosition}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Duration</label>
              <input
                type="text"
                name="lastJobDuration"
                value={formData.lastJobDuration}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="e.g., 2 years, 6 months"
              />
            </div>
            <div>
              <label className="block mb-1">Reason for Leaving</label>
              <input
                type="text"
                name="lastJobLeaveReason"
                value={formData.lastJobLeaveReason}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex items-center md:col-span-2">
              <input
                type="checkbox"
                id="lastJobContactable"
                name="lastJobContactable"
                checked={formData.lastJobContactable}
                onChange={(e) => handleChange(e)}
                className="mr-2"
              />
              <label htmlFor="lastJobContactable">OK to contact this employer</label>
            </div>
          </div>
        </section>
        
        {/* Compensation */}
        <section className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Compensation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Desired Hourly Wage ($)</label>
              <input
                type="number"
                name="desiredHourlyWage"
                value={formData.desiredHourlyWage || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                min="0"
                step="0.50"
              />
            </div>
            <div>
              <label className="block mb-1">Desired Yearly Salary ($)</label>
              <input
                type="number"
                name="desiredYearlySalary"
                value={formData.desiredYearlySalary || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                min="0"
                step="1000"
              />
            </div>
          </div>
        </section>
        
        {/* Start Date */}
        <section className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Start Date Preference</h2>
          <div>
            <select
              name="startDatePreference"
              value={formData.startDatePreference}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            >
              <option value="Immediately">Immediately</option>
              <option value="2 weeks">2 weeks notice</option>
              <option value="1 month">1 month notice</option>
              <option value="Custom">Custom (specify in notes)</option>
            </select>
          </div>
        </section>
        
        {/* Skills */}
        <section className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Skills</h2>
          
          {bohSkills ? (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Back of House Skills</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {bohSkills.map(skill => (
                  <div key={skill._id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`skill-${skill._id}`}
                      checked={formData.skills.includes(skill.value)}
                      onChange={(e) => handleMultiSelectChange('skills', skill.value, e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor={`skill-${skill._id}`}>{skill.displayName}</label>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>Loading BOH skills...</div>
          )}
          
          {fohSkills ? (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Front of House Skills</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {fohSkills.map(skill => (
                  <div key={skill._id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`skill-${skill._id}`}
                      checked={formData.skills.includes(skill.value)}
                      onChange={(e) => handleMultiSelectChange('skills', skill.value, e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor={`skill-${skill._id}`}>{skill.displayName}</label>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>Loading FOH skills...</div>
          )}
          
          {generalSkills ? (
            <div className="mb-4">
              <h3 className="font-medium mb-2">General Skills</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {generalSkills.map(skill => (
                  <div key={skill._id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`skill-${skill._id}`}
                      checked={formData.skills.includes(skill.value)}
                      onChange={(e) => handleMultiSelectChange('skills', skill.value, e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor={`skill-${skill._id}`}>{skill.displayName}</label>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>Loading general skills...</div>
          )}
        </section>
        
        {/* Languages */}
        <section className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Languages</h2>
          
          {languages ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {languages.map(language => (
                <div key={language._id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`language-${language._id}`}
                    checked={formData.languages.includes(language.value)}
                    onChange={(e) => handleMultiSelectChange('languages', language.value, e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor={`language-${language._id}`}>{language.displayName}</label>
                </div>
              ))}
            </div>
          ) : (
            <div>Loading languages...</div>
          )}
        </section>
        
        {/* Additional Notes */}
        <section className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Additional Notes</h2>
          <textarea
            name="additionalNotes"
            value={formData.additionalNotes}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows={4}
            placeholder="Any additional information you'd like to share..."
          />
        </section>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
