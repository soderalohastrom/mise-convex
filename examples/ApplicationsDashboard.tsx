import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import { useState } from 'react';
import { Id } from '../convex/_generated/dataModel';

// Example component for viewing and managing applications
export default function ApplicationsDashboard() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'talent' | 'team'>('talent');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  
  // Get the user's applications (as talent)
  const myApplications = useQuery(api.index.getMyApplications);
  
  // Get the user's teams
  const myTeams = useQuery(api.index.getMyTeams);
  
  // Get team applications when a team is selected
  const teamApplications = useQuery(
    api.index.getTeamApplications,
    selectedTeam ? { teamId: selectedTeam as Id<"teams"> } : "skip"
  );
  
  // Get team job postings
  const teamJobPostings = useQuery(
    api.index.getTeamJobPostings,
    selectedTeam ? { teamId: selectedTeam as Id<"teams"> } : "skip"
  );
  
  // Mutations
  const withdrawApplication = useMutation(api.index.withdrawApplication);
  const updateApplicationStatus = useMutation(api.index.updateApplicationStatus);
  
  // Handle withdrawing an application
  const handleWithdraw = async (applicationId: Id<"applications">) => {
    if (confirm("Are you sure you want to withdraw this application?")) {
      try {
        await withdrawApplication({ applicationId });
      } catch (error) {
        console.error("Failed to withdraw application:", error);
        alert("Failed to withdraw application. Please try again.");
      }
    }
  };
  
  // Handle updating application status
  const handleStatusUpdate = async (applicationId: Id<"applications">, status: string) => {
    try {
      await updateApplicationStatus({ applicationId, status });
    } catch (error) {
      console.error("Failed to update application status:", error);
      alert("Failed to update status. Please try again.");
    }
  };
  
  if (!user) {
    return <div className="p-4">Please sign in to view applications.</div>;
  }
  
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Applications Dashboard</h1>
      
      {/* Dashboard Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'talent' 
              ? 'border-b-2 border-blue-500 text-blue-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('talent')}
        >
          My Applications
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'team' 
              ? 'border-b-2 border-blue-500 text-blue-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('team')}
          disabled={!myTeams || myTeams.length === 0}
        >
          Team Applications
        </button>
      </div>
      
      {/* My Applications (Talent View) */}
      {activeTab === 'talent' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">My Job Applications</h2>
          
          {!myApplications ? (
            <div>Loading your applications...</div>
          ) : myApplications.length === 0 ? (
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p>You haven't applied to any jobs yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 text-left">Position</th>
                    <th className="py-3 px-4 text-left">Team</th>
                    <th className="py-3 px-4 text-left">Applied On</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myApplications.map(app => (
                    <tr key={app._id} className="border-t">
                      <td className="py-3 px-4">{app.jobTitle}</td>
                      <td className="py-3 px-4">{app.teamName}</td>
                      <td className="py-3 px-4">{new Date(app.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span 
                          className={`inline-block px-2 py-1 rounded text-xs 
                            ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              app.status === 'matched' ? 'bg-green-100 text-green-800' : 
                              app.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'}`}
                        >
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {app.status === 'pending' && (
                          <button
                            onClick={() => handleWithdraw(app._id)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Withdraw
                          </button>
                        )}
                        
                        {app.status === 'matched' && (
                          <button
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            View Details
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Team Applications (Team View) */}
      {activeTab === 'team' && (
        <div>
          {/* Team Selector */}
          <div className="mb-6">
            <label className="block mb-1 font-medium">Select Team</label>
            <select
              value={selectedTeam || ''}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full md:w-1/2 p-2 border rounded"
            >
              <option value="">Select a team</option>
              {myTeams?.map(team => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          
          {selectedTeam ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Applications for {myTeams?.find(t => t._id === selectedTeam)?.name}</h2>
              
              {!teamApplications ? (
                <div>Loading team applications...</div>
              ) : teamApplications.length === 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p>No applications received yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-3 px-4 text-left">Applicant</th>
                        <th className="py-3 px-4 text-left">Position</th>
                        <th className="py-3 px-4 text-left">Applied On</th>
                        <th className="py-3 px-4 text-left">Experience</th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamApplications.map(app => (
                        <tr key={app._id} className="border-t">
                          <td className="py-3 px-4">{app.talentName}</td>
                          <td className="py-3 px-4">{app.jobTitle}</td>
                          <td className="py-3 px-4">{new Date(app.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-4">{app.experienceLevel}</td>
                          <td className="py-3 px-4">
                            <span 
                              className={`inline-block px-2 py-1 rounded text-xs 
                                ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  app.status === 'matched' ? 'bg-green-100 text-green-800' : 
                                  app.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                  'bg-gray-100 text-gray-800'}`}
                            >
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {app.status === 'pending' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleStatusUpdate(app._id, 'matched')}
                                  className="text-sm text-green-600 hover:text-green-800"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(app._id, 'rejected')}
                                  className="text-sm text-red-600 hover:text-red-800"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            
                            <button
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              View Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <h2 className="text-xl font-semibold my-6">Active Job Postings</h2>
              
              {!teamJobPostings ? (
                <div>Loading job postings...</div>
              ) : teamJobPostings.length === 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p>No active job postings.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamJobPostings.filter(job => job.isActive).map(job => (
                    <div key={job._id} className="border rounded-lg p-4 bg-white">
                      <h3 className="font-bold text-lg">{job.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {job.compensationType === 'hourly' 
                          ? `$${job.compensationRange.min}-$${job.compensationRange.max}/hr` 
                          : `$${job.compensationRange.min.toLocaleString()}-$${job.compensationRange.max.toLocaleString()}/yr`}
                      </p>
                      <p className="line-clamp-3 text-sm mb-2">{job.description}</p>
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                        <button className="text-sm text-blue-600 hover:text-blue-800">
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p>Please select a team to view applications.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
