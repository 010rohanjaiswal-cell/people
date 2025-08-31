'use client';

import { useState, useEffect } from 'react';
import { adminService, VerificationRequest } from '@/services/adminService';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  UserIcon,
  HomeIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function VerificationsPage() {
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [imagePreview, setImagePreview] = useState<{ url: string; alt: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchVerifications();
  }, [activeTab]);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllVerifications(activeTab);
      console.log('Fetched verifications:', response);
      setVerifications(response);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (verification: VerificationRequest) => {
    console.log('🔍 Opening modal for verification:', verification);
    console.log('🔍 Modal data - Profile Photo:', verification.profilePhoto);
    console.log('🔍 Modal data - Documents:', verification.documents);
    setSelectedVerification(verification);
    setShowModal(true);
    console.log('🔍 Modal state set - showModal: true');
  };

  const handleApprove = async (verificationId: string) => {
    try {
      setActionLoading(true);
      const freelancerId = Math.floor(10000 + Math.random() * 900000).toString();
      await adminService.approveFreelancer(verificationId, freelancerId);
      await fetchVerifications();
      setShowModal(false);
      setSelectedVerification(null);
    } catch (error) {
      console.error('Error approving verification:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (verificationId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      await adminService.rejectFreelancer(verificationId, rejectionReason);
      await fetchVerifications();
      setShowModal(false);
      setSelectedVerification(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting verification:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const openImagePreview = (url: string, alt: string) => {
    setImagePreview({ url, alt });
  };

  const closeImagePreview = () => {
    setImagePreview(null);
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Verifications', href: '/dashboard/verifications', icon: DocumentTextIcon, current: true },
    { name: 'Users', href: '/dashboard/users', icon: UserIcon },
    { name: 'Jobs', href: '/dashboard/jobs', icon: DocumentTextIcon },
    { name: 'Transactions', href: '/dashboard/transactions', icon: CurrencyDollarIcon },
    { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        </div>
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.current
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Freelancer Verifications</h1>
            <p className="mt-2 text-gray-600">Review and manage freelancer verification requests</p>
          </div>

          {/* Queue Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'pending'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <ClockIcon className="inline h-5 w-5 mr-2" />
                  Pending
                </button>
                <button
                  onClick={() => setActiveTab('approved')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'approved'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <CheckCircleIcon className="inline h-5 w-5 mr-2" />
                  Approved
                </button>
                <button
                  onClick={() => setActiveTab('rejected')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'rejected'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <XCircleIcon className="inline h-5 w-5 mr-2" />
                  Rejected
                </button>
              </nav>
            </div>
          </div>

          {verifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-400 mb-4">
                {activeTab === 'pending' && <ClockIcon className="mx-auto h-12 w-12" />}
                {activeTab === 'approved' && <CheckCircleIcon className="mx-auto h-12 w-12" />}
                {activeTab === 'rejected' && <XCircleIcon className="mx-auto h-12 w-12" />}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {activeTab} verifications
              </h3>
              <p className="text-gray-500">
                {activeTab === 'pending' && 'All verification requests have been processed.'}
                {activeTab === 'approved' && 'No approved verifications found.'}
                {activeTab === 'rejected' && 'No rejected verifications found.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Verifications ({verifications.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Freelancer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Documents
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {verifications.map((verification) => (
                      <tr key={verification._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {verification.profilePhoto ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover cursor-pointer"
                                  src={verification.profilePhoto}
                                  alt="Profile"
                                  onClick={() => openImagePreview(verification.profilePhoto!, 'Profile Photo')}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-gray-500 text-sm font-medium">
                                    {verification.fullName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{verification.fullName}</div>
                              <div className="text-sm text-gray-500 capitalize">{verification.gender}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{verification.userId?.phone || verification.phone}</div>
                          <div className="text-sm text-gray-500">No email</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(verification.verificationStatus)}
                            <span className="ml-2">{getStatusBadge(verification.verificationStatus)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {verification.profilePhoto && (
                              <div className="w-8 h-8 rounded border cursor-pointer" onClick={() => openImagePreview(verification.profilePhoto!, 'Profile Photo')}>
                                <img src={verification.profilePhoto} alt="Profile" className="w-full h-full object-cover rounded" />
                              </div>
                            )}
                            {verification.documents?.aadhaarFront && (
                              <div className="w-8 h-8 rounded border cursor-pointer" onClick={() => openImagePreview(verification.documents!.aadhaarFront!, 'Aadhaar Front')}>
                                <img src={verification.documents.aadhaarFront} alt="Aadhaar Front" className="w-full h-full object-cover rounded" />
                              </div>
                            )}
                            {verification.documents?.aadhaarBack && (
                              <div className="w-8 h-8 rounded border cursor-pointer" onClick={() => openImagePreview(verification.documents!.aadhaarBack!, 'Aadhaar Back')}>
                                <img src={verification.documents.aadhaarBack} alt="Aadhaar Back" className="w-full h-full object-cover rounded" />
                              </div>
                            )}
                            {verification.documents?.panFront && (
                              <div className="w-8 h-8 rounded border cursor-pointer" onClick={() => openImagePreview(verification.documents!.panFront!, 'PAN Card')}>
                                <img src={verification.documents.panFront} alt="PAN Card" className="w-full h-full object-cover rounded" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(verification.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {activeTab === 'pending' && (
                            <button
                              onClick={() => handleReview(verification)}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                            >
                              Review
                            </button>
                          )}
                          {activeTab !== 'pending' && (
                            <button
                              onClick={() => handleReview(verification)}
                              className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                            >
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verification Modal */}
      {showModal && selectedVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Review Freelancer Profile
              </h3>
            </div>
            
            {/* Body */}
            <div className="px-6 py-4">
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedVerification.fullName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedVerification.userId?.phone || selectedVerification.phone}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedVerification.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{selectedVerification.gender}</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedVerification.address?.street}, {selectedVerification.address?.city}, {selectedVerification.address?.state} - {selectedVerification.address?.pincode}
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700">Submission Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedVerification.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Documents</label>
                <div className="space-y-6">
                  
                  {/* Profile Photo Container */}
                  <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
                    <h4 className="font-semibold text-blue-800 mb-3">Profile Photo</h4>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 h-32 border-2 border-blue-500 rounded-lg overflow-hidden bg-white cursor-pointer" onClick={() => selectedVerification.profilePhoto && openImagePreview(selectedVerification.profilePhoto, 'Profile Photo')}>
                        {selectedVerification.profilePhoto ? (
                          <img 
                            src={selectedVerification.profilePhoto}
                            alt="Profile Photo"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('❌ Profile Photo failed to load:', e.currentTarget.src);
                              e.currentTarget.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('✅ Profile Photo loaded successfully');
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-blue-500">
                            No Photo
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-blue-700">
                          <strong>Status:</strong> {selectedVerification.profilePhoto ? 'Uploaded' : 'Not uploaded'}
                        </p>
                        <p className="text-xs text-blue-600 mt-1 break-all">
                          {selectedVerification.profilePhoto || 'No URL available'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Aadhaar Front Container */}
                  <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                    <h4 className="font-semibold text-green-800 mb-3">Aadhaar Front</h4>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 h-32 border-2 border-green-500 rounded-lg overflow-hidden bg-white cursor-pointer" onClick={() => selectedVerification.documents?.aadhaarFront && openImagePreview(selectedVerification.documents.aadhaarFront, 'Aadhaar Front')}>
                        {selectedVerification.documents?.aadhaarFront ? (
                          <img 
                            src={selectedVerification.documents.aadhaarFront}
                            alt="Aadhaar Front"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('❌ Aadhaar Front failed to load:', e.currentTarget.src);
                              e.currentTarget.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('✅ Aadhaar Front loaded successfully');
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-green-500">
                            No Photo
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-green-700">
                          <strong>Status:</strong> {selectedVerification.documents?.aadhaarFront ? 'Uploaded' : 'Not uploaded'}
                        </p>
                        <p className="text-xs text-green-600 mt-1 break-all">
                          {selectedVerification.documents?.aadhaarFront || 'No URL available'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Aadhaar Back Container */}
                  <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
                    <h4 className="font-semibold text-purple-800 mb-3">Aadhaar Back</h4>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 h-32 border-2 border-purple-500 rounded-lg overflow-hidden bg-white cursor-pointer" onClick={() => selectedVerification.documents?.aadhaarBack && openImagePreview(selectedVerification.documents.aadhaarBack, 'Aadhaar Back')}>
                        {selectedVerification.documents?.aadhaarBack ? (
                          <img 
                            src={selectedVerification.documents.aadhaarBack}
                            alt="Aadhaar Back"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('❌ Aadhaar Back failed to load:', e.currentTarget.src);
                              e.currentTarget.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('✅ Aadhaar Back loaded successfully');
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-purple-500">
                            No Photo
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-purple-700">
                          <strong>Status:</strong> {selectedVerification.documents?.aadhaarBack ? 'Uploaded' : 'Not uploaded'}
                        </p>
                        <p className="text-xs text-purple-600 mt-1 break-all">
                          {selectedVerification.documents?.aadhaarBack || 'No URL available'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PAN Card Container */}
                  <div className="border-2 border-orange-300 rounded-lg p-4 bg-orange-50">
                    <h4 className="font-semibold text-orange-800 mb-3">PAN Card</h4>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 h-32 border-2 border-orange-500 rounded-lg overflow-hidden bg-white cursor-pointer" onClick={() => selectedVerification.documents?.panFront && openImagePreview(selectedVerification.documents.panFront, 'PAN Card')}>
                        {selectedVerification.documents?.panFront ? (
                          <img 
                            src={selectedVerification.documents.panFront}
                            alt="PAN Card"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('❌ PAN Card failed to load:', e.currentTarget.src);
                              e.currentTarget.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('✅ PAN Card loaded successfully');
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-orange-500">
                            No Photo
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-orange-700">
                          <strong>Status:</strong> {selectedVerification.documents?.panFront ? 'Uploaded' : 'Not uploaded'}
                        </p>
                        <p className="text-xs text-orange-600 mt-1 break-all">
                          {selectedVerification.documents?.panFront || 'No URL available'}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Rejection Reason - Only show for pending verifications */}
              {activeTab === 'pending' && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason (if rejecting)</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter reason for rejection..."
                  />
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              {activeTab === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedVerification._id)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(selectedVerification._id)}
                    disabled={actionLoading || !rejectionReason.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Processing...' : 'Reject'}
                  </button>
                </>
              )}
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setShowModal(false)}
              >
                {activeTab === 'pending' ? 'Cancel' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {imagePreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-75" onClick={closeImagePreview}>
          <div className="relative max-w-4xl max-h-[90vh] overflow-auto">
            <button
              onClick={closeImagePreview}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={imagePreview.url}
              alt={imagePreview.alt}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 rounded px-3 py-1 text-sm">
              {imagePreview.alt}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
