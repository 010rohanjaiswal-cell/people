const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const paymentGateway = require('../config/paymentGateway');
const Transaction = require('../models/Transaction');
const Job = require('../models/Job');
const Wallet = require('../models/Wallet');
const FreelancerProfile = require('../models/FreelancerProfile');
const ClientProfile = require('../models/ClientProfile');
const { validationRules, handleValidationErrors } = require('../utils/validation');

// Initialize payment for job
router.post('/initiate/:jobId',
  auth,
  roleAuth('client'),
  async (req, res) => {
    try {
      const { jobId } = req.params;

      // Check if job exists and is ready for payment
      const job = await Job.findOne({
        _id: jobId,
        clientId: req.user._id,
        status: 'work_done'
      }).populate('freelancerId');

      if (!job) {
        return res.status(400).json({
          success: false,
          message: 'Job not found or not ready for payment'
        });
      }

      // Check if payment already exists
      const existingTransaction = await Transaction.findOne({
        jobId: job._id,
        clientId: req.user._id,
        type: 'payment',
        status: { $in: ['pending', 'completed'] }
      });

      if (existingTransaction) {
        return res.status(400).json({
          success: false,
          message: 'Payment already initiated for this job'
        });
      }

      // Create transaction record
      const transaction = new Transaction({
        jobId: job._id,
        clientId: req.user._id,
        freelancerId: job.freelancerId._id,
        amount: job.amount,
        type: 'payment',
        status: 'pending',
        description: `Payment for job: ${job.title}`,
        paymentMethod: 'phonepe'
      });

      await transaction.save();

      // Generate order ID
      const orderId = `ORDER_${transaction.referenceId}`;

      // Create payment request
      const paymentData = {
        amount: job.amount,
        orderId: orderId,
        customerPhone: req.user.phone,
        customerName: req.user.name || 'Client',
        description: `Payment for job: ${job.title}`,
        jobId: job._id
      };

      const paymentResponse = await paymentGateway.createPaymentRequest(paymentData);

      if (!paymentResponse.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create payment request',
          error: paymentResponse.error
        });
      }

      // Update transaction with gateway details
      transaction.gatewayOrderId = orderId;
      transaction.gatewayResponse = paymentResponse.data;
      await transaction.save();

      res.json({
        success: true,
        message: 'Payment initiated successfully',
        data: {
          transaction: transaction,
          paymentUrl: paymentResponse.paymentUrl,
          orderId: orderId
        }
      });

    } catch (error) {
      console.error('Initiate payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate payment'
      });
    }
  }
);

// Payment callback from gateway
router.post('/callback',
  async (req, res) => {
    try {
      console.log('Payment callback received:', req.body);

      // Process callback data
      const callbackResult = paymentGateway.processCallback(req.body);

      if (!callbackResult.success) {
        console.error('Callback processing failed:', callbackResult.error);
        return res.status(400).json({
          success: false,
          message: 'Invalid callback data'
        });
      }

      const { transactionId, orderId, amount, status, paymentMethod, customerPhone } = callbackResult.data;

      // Find transaction by order ID
      const transaction = await Transaction.findOne({
        gatewayOrderId: orderId
      }).populate('jobId freelancerId clientId');

      if (!transaction) {
        console.error('Transaction not found for order:', orderId);
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Update transaction with gateway response
      transaction.gatewayTransactionId = transactionId;
      transaction.gatewayResponse = req.body;

      if (status === 'success') {
        // Payment successful
        transaction.status = 'completed';
        transaction.completedAt = new Date();

        // Update job status
        if (transaction.jobId) {
          transaction.jobId.status = 'completed';
          transaction.jobId.paymentCompletedAt = new Date();
          await transaction.jobId.save();
        }

        // Process commission and update wallets
        const commissionService = require('../utils/commissionService');
        const commissionResult = await commissionService.processCommission({
          jobId: transaction.jobId._id,
          clientId: transaction.clientId._id,
          freelancerId: transaction.freelancerId._id,
          amount: transaction.amount,
          transactionId: transaction.referenceId,
          paymentMethod: transaction.paymentMethod
        });

        if (!commissionResult.success) {
          console.error('Commission processing failed:', commissionResult.error);
        }

        // Update freelancer stats with commission-adjusted amount
        const freelancerProfile = await FreelancerProfile.findOne({ userId: transaction.freelancerId._id });
        if (freelancerProfile) {
          freelancerProfile.totalJobs += 1;
          freelancerProfile.completedJobs += 1;
          freelancerProfile.totalEarnings += commissionResult.data.commissionDetails.freelancerAmount;
          await freelancerProfile.save();
        }

        // Update client stats
        const clientProfile = await ClientProfile.findOne({ userId: transaction.clientId._id });
        if (clientProfile) {
          clientProfile.totalSpent += transaction.amount;
          await clientProfile.save();
        }

      } else {
        // Payment failed
        transaction.status = 'failed';
        transaction.failureReason = callbackResult.data.responseMessage;
      }

      await transaction.save();

      // Send response to gateway
      res.json({
        success: true,
        message: 'Callback processed successfully'
      });

    } catch (error) {
      console.error('Payment callback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process callback'
      });
    }
  }
);

// Verify payment status
router.get('/verify/:transactionId',
  auth,
  async (req, res) => {
    try {
      const { transactionId } = req.params;

      const transaction = await Transaction.findOne({
        gatewayTransactionId: transactionId
      }).populate('jobId freelancerId clientId');

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Verify with gateway
      const verificationResult = await paymentGateway.verifyPayment(transactionId);

      if (verificationResult.success) {
        // Update transaction if status changed
        const gatewayStatus = verificationResult.data.code === 'PAYMENT_SUCCESS' ? 'completed' : 'failed';
        
        if (transaction.status !== gatewayStatus) {
          transaction.status = gatewayStatus;
          transaction.gatewayResponse = verificationResult.data;
          
          if (gatewayStatus === 'completed') {
            transaction.completedAt = new Date();
          }
          
          await transaction.save();
        }
      }

      res.json({
        success: true,
        data: {
          transaction: transaction,
          gatewayStatus: verificationResult.success ? verificationResult.data : null
        }
      });

    } catch (error) {
      console.error('Verify payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify payment'
      });
    }
  }
);

// Get payment history
router.get('/history',
  auth,
  async (req, res) => {
    try {
      const { page = 1, limit = 10, type } = req.query;
      const skip = (page - 1) * limit;

      const query = {
        $or: [
          { clientId: req.user._id },
          { freelancerId: req.user._id }
        ]
      };

      if (type) {
        query.type = type;
      }

      const transactions = await Transaction.find(query)
        .populate('jobId', 'title')
        .populate('clientId', 'phone')
        .populate('freelancerId', 'phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Transaction.countDocuments(query);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get payment history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment history'
      });
    }
  }
);

// Request refund
router.post('/refund/:transactionId',
  auth,
  roleAuth('client'),
  validationRules.refund,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { transactionId } = req.params;
      const { reason } = req.body;

      const transaction = await Transaction.findOne({
        gatewayTransactionId: transactionId,
        clientId: req.user._id,
        type: 'payment',
        status: 'completed'
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found or not eligible for refund'
        });
      }

      // Create refund request
      const refundData = {
        transactionId: transactionId,
        amount: transaction.amount,
        reason: reason
      };

      const refundResult = await paymentGateway.refundPayment(refundData);

      if (!refundResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to process refund',
          error: refundResult.error
        });
      }

      // Create refund transaction
      const refundTransaction = new Transaction({
        jobId: transaction.jobId,
        clientId: req.user._id,
        freelancerId: transaction.freelancerId,
        amount: transaction.amount,
        type: 'refund',
        status: 'pending',
        description: `Refund for transaction: ${transactionId}`,
        paymentMethod: 'phonepe',
        gatewayTransactionId: refundResult.data.merchantTransactionId,
        gatewayOrderId: `REFUND_${transaction.referenceId}`,
        gatewayResponse: refundResult.data
      });

      await refundTransaction.save();

      res.json({
        success: true,
        message: 'Refund request submitted successfully',
        data: { refundTransaction }
      });

    } catch (error) {
      console.error('Refund error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process refund'
      });
    }
  }
);

module.exports = router;
