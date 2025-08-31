'use client';

import { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';
import AdminLayout from '@/components/AdminLayout';
import { 
  BriefcaseIcon, 
  UserIcon, 
  MapPinIcon, 
  CalendarIcon,
  CurrencyRupeeIcon,
  EyeIcon,
  TrashIcon,
  FunnelIcon,
  XMarkIcon,
  PhoneIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface Job {
  _id: string;
  title: string;
  description: string;
  amount?: number;
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  client?: {
    _id: string;
    fullName: string;
    phone: string;
  };
  applications?: number;
  offers?: number;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [statusFilter]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await adminService.getJobs(statusFilter === 'all' ? undefined : statusFilter);
      setJobs(data.jobs || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address: any) => {
    if (typeof address === 'string') return address;
    if (address?.street) return address.street;
    if (address?.city) return `${address.city}, ${address.state}`;
    return 'Address not specified';
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (job.client?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatAddress(job.address || {}).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewJob = (job: Job) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      try {
        await adminService.deleteJob(jobId);
        await loadJobs(); // Refresh the list
      } catch (err: any) {
        console.error('Failed to delete job:', err);
        alert('Failed to delete job: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading jobs...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
              <p className="mt-2 text-gray-600">Monitor and manage all client posted jobs</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadJobs}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Jobs
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="search"
                    placeholder="Search by job title, client name, or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <FunnelIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Status Filter */}
              <div className="sm:w-48">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status Filter
                </label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Jobs</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Jobs List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Jobs ({filteredJobs.length})
              </h3>
            </div>
            
            {filteredJobs.length === 0 ? (
              <div className="p-6 text-center">
                <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'No jobs have been posted yet.'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredJobs.map((job) => (
                  <div key={job._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Job Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <BriefcaseIcon className="h-6 w-6 text-blue-600" />
                            <h4 className="text-lg font-medium text-gray-900">{job.title}</h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleViewJob(job)}
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                              title="View Details"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteJob(job._id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete Job"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>

                        {/* Job Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {job.client?.fullName || 'Unknown Client'}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <MapPinIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {formatAddress(job.address || {})}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <CurrencyRupeeIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {job.amount 
                                ? `₹${job.amount.toLocaleString()}`
                                : 'Amount not specified'
                              }
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Posted {formatDate(job.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Job Description */}
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {job.description}
                        </p>

                        {/* Job Stats */}
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span>Applications: {job.applications || 0}</span>
                          <span>Offers: {job.offers || 0}</span>
                          <span>Client: {job.client?.phone || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Job Details Modal */}
        {showJobModal && selectedJob && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Job Details</h3>
                <button
                  onClick={() => setShowJobModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Job Title and Status */}
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-semibold text-gray-900">{selectedJob.title}</h4>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedJob.status)}`}>
                    {selectedJob.status.charAt(0).toUpperCase() + selectedJob.status.slice(1)}
                  </span>
                </div>

                {/* Client Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Client Information</h5>
                  <div className="space-y-2">
                                         <div className="flex items-center space-x-2">
                       <UserIcon className="h-4 w-4 text-gray-400" />
                       <span className="text-sm text-gray-600">{selectedJob.client?.fullName || 'Unknown Client'}</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <PhoneIcon className="h-4 w-4 text-gray-400" />
                       <span className="text-sm text-gray-600">{selectedJob.client?.phone || 'Unknown'}</span>
                     </div>
                  </div>
                </div>

                {/* Job Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Budget Range</h5>
                    <div className="flex items-center space-x-2">
                      <CurrencyRupeeIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {selectedJob.amount 
                          ? `₹${selectedJob.amount.toLocaleString()}`
                          : 'Amount not specified'
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Posted Date</h5>
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{formatDate(selectedJob.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Location</h5>
                                       <div className="flex items-center space-x-2">
                       <MapPinIcon className="h-4 w-4 text-gray-400" />
                       <span className="text-sm text-gray-600">{formatAddress(selectedJob.address || {})}</span>
                     </div>
                </div>

                {/* Description */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Description</h5>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedJob.description}</p>
                </div>

                {/* Job Statistics */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Job Statistics</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Applications</span>
                      <p className="text-lg font-semibold text-gray-900">{selectedJob.applications || 0}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Offers</span>
                      <p className="text-lg font-semibold text-gray-900">{selectedJob.offers || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowJobModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDeleteJob(selectedJob._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete Job
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
