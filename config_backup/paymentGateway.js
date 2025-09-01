const axios = require('axios');

class PaymentGateway {
  constructor() {
    this.clientId = process.env.PAYMENT_CLIENT_ID || 'TEST-M23OKIGC1N363_25081';
    this.clientSecret = process.env.PAYMENT_CLIENT_SECRET || 'OWFkNzQxNjAtZjQ2Yi00YjRkLWE0ZDMtOWQxMzQ0NWZiMGZm';
    this.baseUrl = process.env.PAYMENT_BASE_URL || 'https://api.phonepe.com/apis/hermes'; // Update with actual API URL
    this.merchantId = process.env.PAYMENT_MERCHANT_ID || 'TEST_MERCHANT';
    this.redirectUrl = process.env.PAYMENT_REDIRECT_URL || 'http://localhost:3000/payment/callback';
    this.callbackUrl = process.env.PAYMENT_CALLBACK_URL || 'http://localhost:10000/api/payments/callback';
  }

  // Generate authentication headers
  generateHeaders() {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'X-VERIFY': this.generateChecksum()
    };
  }

  // Generate checksum for request verification
  generateChecksum(payload = '') {
    // This should be implemented according to PhonePe's checksum algorithm
    // For now, using a simple hash
    const crypto = require('crypto');
    return crypto.createHash('sha256')
      .update(payload + this.clientSecret)
      .digest('hex');
  }

  // Create payment request
  async createPaymentRequest(paymentData) {
    try {
      const {
        amount,
        orderId,
        customerPhone,
        customerName,
        description,
        jobId
      } = paymentData;

      const payload = {
        merchantId: this.merchantId,
        merchantTransactionId: orderId,
        amount: amount * 100, // Convert to paise
        redirectUrl: this.redirectUrl,
        redirectMode: 'REDIRECT',
        callbackUrl: this.callbackUrl,
        merchantUserId: customerPhone,
        mobileNumber: customerPhone,
        paymentInstrument: {
          type: 'PAY_PAGE'
        },
        merchantOrderId: orderId,
        message: description,
        email: `${customerPhone}@example.com`, // You can update this
        shortName: customerName,
        name: customerName,
        appId: this.clientId,
        saltKey: this.clientSecret,
        saltIndex: 1
      };

      const headers = this.generateHeaders();
      
      const response = await axios.post(
        `${this.baseUrl}/pg/v1/pay`,
        payload,
        { headers }
      );

      return {
        success: true,
        data: response.data,
        paymentUrl: response.data.data.instrumentResponse.redirectInfo.url
      };

    } catch (error) {
      console.error('Payment request error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Verify payment status
  async verifyPayment(transactionId) {
    try {
      const headers = this.generateHeaders();
      
      const response = await axios.get(
        `${this.baseUrl}/pg/v1/status/${this.merchantId}/${transactionId}`,
        { headers }
      );

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('Payment verification error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Process payment callback
  processCallback(callbackData) {
    try {
      // Verify callback signature
      const receivedChecksum = callbackData.checksum;
      const calculatedChecksum = this.generateChecksum(JSON.stringify(callbackData));
      
      if (receivedChecksum !== calculatedChecksum) {
        return {
          success: false,
          error: 'Invalid checksum'
        };
      }

      return {
        success: true,
        data: {
          transactionId: callbackData.merchantTransactionId,
          orderId: callbackData.merchantOrderId,
          amount: callbackData.amount / 100, // Convert from paise
          status: callbackData.code === 'PAYMENT_SUCCESS' ? 'success' : 'failed',
          paymentMethod: callbackData.paymentInstrument?.type || 'unknown',
          customerPhone: callbackData.merchantUserId,
          responseCode: callbackData.code,
          responseMessage: callbackData.message
        }
      };

    } catch (error) {
      console.error('Callback processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Refund payment
  async refundPayment(refundData) {
    try {
      const {
        transactionId,
        amount,
        reason
      } = refundData;

      const payload = {
        merchantId: this.merchantId,
        merchantTransactionId: transactionId,
        amount: amount * 100, // Convert to paise
        callbackUrl: this.callbackUrl,
        merchantUserId: 'REFUND_USER',
        originalTransactionId: transactionId,
        refundNote: reason || 'Refund requested'
      };

      const headers = this.generateHeaders();
      
      const response = await axios.post(
        `${this.baseUrl}/pg/v1/refund`,
        payload,
        { headers }
      );

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('Refund error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }
}

module.exports = new PaymentGateway();
