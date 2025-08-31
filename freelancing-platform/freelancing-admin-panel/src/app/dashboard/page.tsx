'use client';

import { useState, useEffect } from 'react';
import { adminService, PlatformStats } from '@/services/adminService';
import AdminLayout from '@/components/AdminLayout';
import { 
  UsersIcon, 
  BriefcaseIcon, 
  ClockIcon, 
  CurrencyRupeeIcon,
  DocumentCheckIcon,
  ChartBarIcon,
  CogIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
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

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
      href: '/dashboard/users'
    },
    {
      title: 'Total Jobs',
      value: stats?.totalJobs || 0,
      icon: BriefcaseIcon,
      color: 'bg-green-500',
      href: '/dashboard/jobs'
    },
    {
      title: 'Pending Verifications',
      value: stats?.pendingVerifications || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      href: '/dashboard/verifications'
    },
    {
      title: 'Total Revenue',
      value: `₹${(stats?.revenue || 0).toLocaleString()}`,
      icon: CurrencyRupeeIcon,
      color: 'bg-purple-500',
      href: '/dashboard/revenue'
    }
  ];

  const quickActions = [
    {
      title: 'Review Verifications',
      description: 'Approve or reject freelancer profiles',
      icon: DocumentCheckIcon,
      href: '/dashboard/verifications',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Manage Users',
      description: 'View and manage platform users',
      icon: UsersIcon,
      href: '/dashboard/users',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'View Jobs',
      description: 'Monitor active and completed jobs',
      icon: BriefcaseIcon,
      href: '/dashboard/jobs',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      title: 'Transactions',
      description: 'Review payments and withdrawals',
      icon: CurrencyRupeeIcon,
      href: '/dashboard/transactions',
      color: 'bg-yellow-600 hover:bg-yellow-700'
    },
    {
      title: 'Analytics',
      description: 'View platform analytics and reports',
      icon: ChartBarIcon,
      href: '/dashboard/analytics',
      color: 'bg-indigo-600 hover:bg-indigo-700'
    },
    {
      title: 'Settings',
      description: 'Configure platform settings',
      icon: CogIcon,
      href: '/dashboard/settings',
      color: 'bg-gray-600 hover:bg-gray-700'
    }
  ];

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-2 text-gray-600">Welcome to the Freelancing Platform Admin Panel</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadStats}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {statCards.map((stat, index) => (
              <div key={index} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 ${stat.color} rounded-md flex items-center justify-center`}>
                        <stat.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{stat.title}</dt>
                        <dd className="text-lg font-medium text-gray-900">{stat.value}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quickActions.map((action, index) => (
                <a
                  key={index}
                  href={action.href}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{action.title}</h3>
                      <p className="text-sm text-gray-500">{action.description}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">New freelancer verification request received</span>
                  <span className="text-xs text-gray-400">2 minutes ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Job "Website Development" completed</span>
                  <span className="text-xs text-gray-400">1 hour ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">New user registration</span>
                  <span className="text-xs text-gray-400">3 hours ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Payment processed successfully</span>
                  <span className="text-xs text-gray-400">5 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
