import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import { Id } from '../convex/_generated/dataModel';

// Example component for searching and applying to jobs
export default function JobSearch() {
  const { user } = useUser();
  
  // State for filters
  const [filters, setFilters] = useState({
    area: "",
    serviceStyle: "",
    position: "",
    compensationType: "",
    minCompensation: "",
    maxCompensation: "",
  });
  
  // State for job details modal
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Get predefined options for dropdowns
  const areas = useQuery(api.index.getPredefinedOptions, { 
    category: "area",
    activeOnly: true,
  });
  
  const serviceStyles = useQuery(api.index.getPredefinedOptions, { 
    category: "serviceStyle",
    activeOnly: true,
  });
  
  const positions = useQuery(api.index.getPredefinedOptions, { 
    category: "position",
    activeOnly: true,
  });
  
  // Search for job postings with filters
  const jobPostings = useQuery(api.index.searchJobPostings, {
    filters: {
      area: filters.area,
      serviceStyle: filters.serviceStyle,
      position: filters.position,
      compensationType: filters.compensationType || undefined,
      minCompensation: filters.minCompensation ? parseFloat(filters.minCompensation) : undefined,
      maxCompensation: filters.maxCompensation ? parseFloat(filters.maxCompensation) : undefined,
    }
  });
  
  // Apply to job mutation
  const applyToJob = useMutation(api.index.applyToJob);
  
  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };
  
  // Handle job application
  const handleApply = async (jobId: Id<"jobPostings">) => {
    if (!user) {
      alert("Please sign in to apply for jobs");
      return;
    }
    
    try {
      await applyToJob({ jobPostingId: jobId });
      alert("Application submitted successfully!");
      setShowModal(false);
    } catch (error) {
      console.error("Failed to apply:", error);
      alert("Failed to submit application. Please try again.");
    }
  };
  
  // Handle viewing job details
  const handleViewDetails = (job: any) => {
    setSelectedJob(job);
    setShowModal(true);
  };
  
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Find Your Next Hospitality Job</h1>
      
      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {areas ? (
            <div>
              <label className="block mb-1 text-sm">Area</label>
              <select
                name="area"
                value={filters.area}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
              >
                <option value="">All Areas</option>
                {areas.map(area => (
                  <option key={area._id} value={area.value}>
                    {area.displayName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>Loading areas...</div>
          )}
          
          {serviceStyles ? (
            <div>
              <label className="block mb-1 text-sm">Service Style</label>
              <select
                name="serviceStyle"
                value={filters.serviceStyle}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
              >
                <option value="">All Service Styles</option>
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
          
          {positions ? (
            <div>
              <label className="block mb-1 text-sm">Position</label>
              <select
                name="position"
                value={filters.position}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
              >
                <option value="">All Positions</option>
                {positions.map(position => (
                  <option key={position._id} value={position.value}>
                    {position.displayName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>Loading positions...</div>
          )}
          
          <div>
            <label className="block mb-1 text-sm">Compensation Type</label>
            <select
              name="compensationType"
              value={filters.compensationType}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Any</option>
              <option value="hourly">Hourly</option>
              <option value="salary">Salary</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-1 text-sm">Min Compensation ($)</label>
            <input
              type="number"
              name="minCompensation"
              value={filters.minCompensation}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
              placeholder="Minimum"
              min="0"
            />
          </div>
          
          <div>
            <label className="block mb-1 text-sm">Max Compensation ($)</label>
            <input
              type="number"
              name="maxCompensation"
              value={filters.maxCompensation}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
              placeholder="Maximum"
              min="0"
            />
          </div>
        </div>
      </div>
      
      {/* Job Listings */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Job Openings</h2>
        
        {!jobPostings ? (
          <div>Loading job postings...</div>
        ) : jobPostings.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-lg">No job postings match your filters.</p>
            <p className="text-sm text-gray-600 mt-2">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {jobPostings.map(job => (
              <div key={job._id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                <div className="flex justify-between">
                  <h3 className="font-bold text-lg">{job.title}</h3>
                  <span className="inline-block px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                    {job.compensationType === 'hourly' ? 'Hourly' : 'Salary'}
                  </span>
                </div>
                
                <p className="text-sm font-semibold text-gray-700">{job.teamName}</p>
                
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                    {job.serviceStyle}
                  </span>
                  <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                    {job.area}
                  </span>
                  <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                    {job.experienceRequired}
                  </span>
                </div>
                
                <p className="mt-3 text-sm line-clamp-2">{job.description}</p>
                
                <div className="mt-3 text-sm">
                  <p className="font-semibold">
                    {job.compensationType === 'hourly' 
                      ? `$${job.compensationRange.min.toFixed(2)}-$${job.compensationRange.max.toFixed(2)}/hr` 
                      : `$${job.compensationRange.min.toLocaleString()}-$${job.compensationRange.max.toLocaleString()}/year`}
                  </p>
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleViewDetails(job)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Job Details Modal */}
      {showModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold">{selectedJob.title}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              
              <p className="text-lg font-semibold mt-2">{selectedJob.teamName}</p>
              <p className="text-gray-600">{selectedJob.area}</p>
              
              <div className="mt-4">
                <h3 className="font-semibold text-lg">Compensation</h3>
                <p>
                  {selectedJob.compensationType === 'hourly' 
                    ? `$${selectedJob.compensationRange.min.toFixed(2)}-$${selectedJob.compensationRange.max.toFixed(2)} per hour` 
                    : `$${selectedJob.compensationRange.min.toLocaleString()}-$${selectedJob.compensationRange.max.toLocaleString()} per year`}
                </p>
              </div>
              
              <div className="mt-4">
                <h3 className="font-semibold text-lg">Description</h3>
                <p className="whitespace-pre-line">{selectedJob.description}</p>
              </div>
              
              <div className="mt-4">
                <h3 className="font-semibold text-lg">Requirements</h3>
                <p>Experience Level: {selectedJob.experienceRequired}</p>
                <p>Service Style: {selectedJob.serviceStyle}</p>
                <p>Position Type: {selectedJob.positionType === 'FOH' ? 'Front of House' : 'Back of House'}</p>
                
                {selectedJob.requiredSkills && selectedJob.requiredSkills.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Required Skills:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedJob.requiredSkills.map((skill: string, index: number) => (
                        <span key={index} className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4">
                <h3 className="font-semibold text-lg">Schedule</h3>
                <div className="grid grid-cols-7 gap-2 mt-2">
                  {Object.entries(selectedJob.shifts).map(([day, shifts]: [string, any]) => (
                    <div key={day} className="text-center">
                      <p className="font-medium capitalize">{day}</p>
                      <div className="mt-1">
                        {shifts.length === 0 ? (
                          <span className="text-xs text-gray-500">-</span>
                        ) : (
                          shifts.map((shift: string, index: number) => (
                            <p key={index} className="text-xs bg-gray-100 rounded px-1 py-0.5 mb-1">
                              {shift}
                            </p>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="font-semibold text-lg">Additional Information</h3>
                <p>Start Date: {selectedJob.startDate}</p>
                <p>Posted on: {new Date(selectedJob.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded mr-4"
                >
                  Close
                </button>
                <button
                  onClick={() => handleApply(selectedJob._id)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  disabled={!user}
                >
                  Apply Now
                </button>
              </div>
              
              {!user && (
                <p className="text-center text-red-500 mt-4">
                  Please sign in to apply for this job.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
