const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

class CommissionService {
  constructor() {
    // Commission rate as percentage (10% = 0.10)
    this.commissionRate = process.env.COMMISSION_RATE ? parseFloat(process.env.COMMISSION_RATE) / 100 : 0.10; // Default 10%
    
    // No minimum commission - allow any job amount
    this.minCommission = 0; // No minimum commission
    
    // No maximum commission limit - jobs can be of any amount
    this.maxCommission = null;
  }

  /**
   * Calculate commission amount for a given payment amount
   * @param {number} amount - The total payment amount
   * @returns {object} - Commission details
   */
  calculateCommission(amount) {
    // Calculate commission as 10% of the amount (no minimum)
    const commissionAmount = Math.round(amount * this.commissionRate);

    // No maximum commission limit - use calculated amount
    const finalCommission = commissionAmount;

    const freelancerAmount = amount - finalCommission;

    return {
      totalAmount: amount,
      commissionAmount: finalCommission,
      freelancerAmount: freelancerAmount,
      commissionRate: this.commissionRate * 100, // Convert to percentage
      commissionPercentage: ((finalCommission / amount) * 100).toFixed(2)
    };
  }

  /**
   * Process commission for a completed payment
   * @param {object} paymentData - Payment transaction data
   * @returns {object} - Processing result
   */
  async processCommission(paymentData) {
    try {
      const {
        jobId,
        clientId,
        freelancerId,
        amount,
        transactionId,
        paymentMethod = 'gateway'
      } = paymentData;

      // Calculate commission
      const commissionDetails = this.calculateCommission(amount);

      // Create commission transaction
      const commissionTransaction = new Transaction({
        jobId,
        clientId,
        freelancerId,
        amount: commissionDetails.commissionAmount,
        type: 'commission',
        status: 'completed',
        description: `Platform commission (${commissionDetails.commissionPercentage}%) for job payment`,
        paymentMethod,
        referenceId: `COMM_${transactionId}`,
        completedAt: new Date()
      });

      await commissionTransaction.save();

      // Credit commission to platform wallet (admin wallet)
      let platformWallet = await Wallet.findOne({ userId: process.env.PLATFORM_ADMIN_ID });
      if (!platformWallet) {
        // Create platform wallet if it doesn't exist
        platformWallet = new Wallet({
          userId: process.env.PLATFORM_ADMIN_ID || '000000000000000000000000', // Default admin ID
          balance: 0,
          isActive: true
        });
      }
      
      platformWallet.balance += commissionDetails.commissionAmount;
      await platformWallet.save();

      // Credit remaining amount to freelancer wallet
      let freelancerWallet = await Wallet.findOne({ userId: freelancerId });
      if (!freelancerWallet) {
        freelancerWallet = new Wallet({ userId: freelancerId });
      }
      
      freelancerWallet.balance += commissionDetails.freelancerAmount;
      await freelancerWallet.save();

      return {
        success: true,
        data: {
          commissionDetails,
          commissionTransaction,
          freelancerWallet: {
            balance: freelancerWallet.balance,
            creditedAmount: commissionDetails.freelancerAmount
          },
          platformWallet: {
            balance: platformWallet.balance,
            creditedAmount: commissionDetails.commissionAmount
          }
        }
      };

    } catch (error) {
      console.error('Commission processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get commission statistics
   * @returns {object} - Commission statistics
   */
  async getCommissionStats() {
    try {
      const totalCommission = await Transaction.aggregate([
        {
          $match: {
            type: 'commission',
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalTransactions: { $sum: 1 }
          }
        }
      ]);

      const monthlyCommission = await Transaction.aggregate([
        {
          $match: {
            type: 'commission',
            status: 'completed',
            createdAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalTransactions: { $sum: 1 }
          }
        }
      ]);

      return {
        success: true,
        data: {
          commissionRate: this.commissionRate * 100,
          minCommission: 0, // No minimum limit
          maxCommission: null, // No maximum limit
          totalCommission: totalCommission[0]?.totalAmount || 0,
          totalCommissionTransactions: totalCommission[0]?.totalTransactions || 0,
          monthlyCommission: monthlyCommission[0]?.totalAmount || 0,
          monthlyCommissionTransactions: monthlyCommission[0]?.totalTransactions || 0
        }
      };

    } catch (error) {
      console.error('Commission stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update commission rate
   * @param {number} newRate - New commission rate as percentage
   * @returns {object} - Update result
   */
  updateCommissionRate(newRate) {
    if (newRate < 0 || newRate > 100) {
      return {
        success: false,
        error: 'Commission rate must be between 0 and 100'
      };
    }

    this.commissionRate = newRate / 100;
    return {
      success: true,
      data: {
        newRate: newRate,
        message: 'Commission rate updated successfully'
      }
    };
  }

  /**
   * Update minimum commission amount (disabled - no minimum limit)
   * @param {number} newMinCommission - New minimum commission amount
   * @returns {object} - Update result
   */
  updateMinCommission(newMinCommission) {
    return {
      success: false,
      error: 'Minimum commission limit is disabled - jobs can be of any amount'
    };
  }

  /**
   * Update maximum commission amount (disabled - no maximum limit)
   * @param {number} newMaxCommission - New maximum commission amount
   * @returns {object} - Update result
   */
  updateMaxCommission(newMaxCommission) {
    return {
      success: false,
      error: 'Maximum commission limit is disabled - jobs can be of any amount'
    };
  }
}

module.exports = new CommissionService();
