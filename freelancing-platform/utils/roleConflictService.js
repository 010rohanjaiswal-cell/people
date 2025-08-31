const User = require('../models/User');
const Job = require('../models/Job');

class RoleConflictService {
  /**
   * Check if a user can switch to a new role
   * @param {string} phone - User's phone number
   * @param {string} newRole - The role they want to switch to
   * @returns {Object} - Validation result
   */
  static async validateRoleSwitch(phone, newRole) {
    try {
      // Find existing user with this phone number
      const existingUser = await User.findOne({ phone });
      
      if (!existingUser) {
        // New user, no conflict
        return {
          canSwitch: true,
          message: 'New user registration allowed'
        };
      }

      // If same role, allow login
      if (existingUser.role === newRole) {
        return {
          canSwitch: true,
          message: 'Same role login allowed'
        };
      }

      // Check for role conflicts
      if (existingUser.role === 'client' && newRole === 'freelancer') {
        return await this.validateClientToFreelancer(existingUser);
      } else if (existingUser.role === 'freelancer' && newRole === 'client') {
        return await this.validateFreelancerToClient(existingUser);
      }

      return {
        canSwitch: true,
        message: 'Role switch allowed'
      };
    } catch (error) {
      console.error('Role conflict validation error:', error);
      return {
        canSwitch: false,
        message: 'Error validating role switch'
      };
    }
  }

  /**
   * Validate if a client can switch to freelancer role
   * @param {Object} user - User object
   * @returns {Object} - Validation result
   */
  static async validateClientToFreelancer(user) {
    try {
      // Check if user has any open jobs
      const openJobs = await Job.find({
        clientId: user._id,
        status: 'open',
        isActive: true
      });

      if (openJobs.length > 0) {
        return {
          canSwitch: false,
          message: `You have ${openJobs.length} open job(s) posted as a client. Please close all open jobs before switching to freelancer role.`,
          openJobsCount: openJobs.length,
          openJobs: openJobs.map(job => ({
            id: job._id,
            title: job.title,
            amount: job.amount,
            createdAt: job.createdAt
          }))
        };
      }

      return {
        canSwitch: true,
        message: 'No open jobs found, role switch allowed'
      };
    } catch (error) {
      console.error('Client to freelancer validation error:', error);
      return {
        canSwitch: false,
        message: 'Error checking open jobs'
      };
    }
  }

  /**
   * Validate if a freelancer can switch to client role
   * @param {Object} user - User object
   * @returns {Object} - Validation result
   */
  static async validateFreelancerToClient(user) {
    try {
      // Check if freelancer has any active assigned jobs
      const activeJobs = await Job.find({
        freelancerId: user._id,
        status: { $in: ['assigned', 'work_done', 'waiting_for_payment'] }
      });

      if (activeJobs.length > 0) {
        return {
          canSwitch: false,
          message: `You have ${activeJobs.length} active job(s) as a freelancer. Please complete all active jobs before switching to client role.`,
          activeJobsCount: activeJobs.length,
          activeJobs: activeJobs.map(job => ({
            id: job._id,
            title: job.title,
            status: job.status,
            amount: job.amount
          }))
        };
      }

      return {
        canSwitch: true,
        message: 'No active jobs found, role switch allowed'
      };
    } catch (error) {
      console.error('Freelancer to client validation error:', error);
      return {
        canSwitch: false,
        message: 'Error checking active jobs'
      };
    }
  }

  /**
   * Get user's current role and any conflicts
   * @param {string} phone - User's phone number
   * @returns {Object} - User role information
   */
  static async getUserRoleInfo(phone) {
    try {
      const user = await User.findOne({ phone });
      
      if (!user) {
        return {
          exists: false,
          message: 'User not found'
        };
      }

      let conflicts = null;
      
      if (user.role === 'client') {
        const openJobs = await Job.find({
          clientId: user._id,
          status: 'open',
          isActive: true
        });
        
        if (openJobs.length > 0) {
          conflicts = {
            type: 'open_jobs',
            count: openJobs.length,
            jobs: openJobs.map(job => ({
              id: job._id,
              title: job.title,
              amount: job.amount,
              createdAt: job.createdAt
            }))
          };
        }
      } else if (user.role === 'freelancer') {
        const activeJobs = await Job.find({
          freelancerId: user._id,
          status: { $in: ['assigned', 'work_done', 'waiting_for_payment'] }
        });
        
        if (activeJobs.length > 0) {
          conflicts = {
            type: 'active_jobs',
            count: activeJobs.length,
            jobs: activeJobs.map(job => ({
              id: job._id,
              title: job.title,
              status: job.status,
              amount: job.amount
            }))
          };
        }
      }

      return {
        exists: true,
        role: user.role,
        userId: user._id,
        isVerified: user.isVerified,
        conflicts
      };
    } catch (error) {
      console.error('Get user role info error:', error);
      return {
        exists: false,
        message: 'Error retrieving user information'
      };
    }
  }
}

module.exports = RoleConflictService;
