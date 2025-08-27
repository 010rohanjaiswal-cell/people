# Payment Gateway Integration Documentation

## 🎯 **Overview**
This document outlines the integration of PhonePe payment gateway into the freelancing platform for real-time payment processing.

## 🔧 **Configuration**

### **Environment Variables**
```env
# Payment Gateway Configuration
PAYMENT_CLIENT_ID=TEST-M23OKIGC1N363_25081
PAYMENT_CLIENT_SECRET=OWFkNzQxNjAtZjQ2Yi00YjRkLWE0ZDMtOWQxMzQ0NWZiMGZm
PAYMENT_BASE_URL=https://api.phonepe.com/apis/hermes
PAYMENT_MERCHANT_ID=TEST_MERCHANT
PAYMENT_REDIRECT_URL=http://localhost:3000/payment/callback
PAYMENT_CALLBACK_URL=http://localhost:10000/api/payments/callback
```

### **Testing Credentials**
- **Client ID**: `TEST-M23OKIGC1N363_25081`
- **Client Secret**: `OWFkNzQxNjAtZjQ2Yi00YjRkLWE0ZDMtOWQxMzQ0NWZiMGZm`

## 🔄 **Payment Flow**

### **1. Job Completion Flow**
```
Freelancer → "Work Done" → Job Status: work_done
Client → "Pay" → Payment Gateway → Success → Job Status: completed
```

### **2. Payment Process**
1. **Client initiates payment** for completed job
2. **Payment gateway creates** payment request
3. **Client redirected** to payment page
4. **Payment processed** via PhonePe
5. **Callback received** and processed
6. **Job status updated** to completed
7. **Freelancer wallet credited**

## 📋 **API Endpoints**

### **Payment Initiation**
```http
POST /api/payments/initiate/:jobId
Authorization: Bearer <client_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "data": {
    "transaction": {
      "_id": "transaction_id",
      "amount": 1500,
      "status": "pending",
      "paymentMethod": "phonepe"
    },
    "paymentUrl": "https://payment-gateway.com/pay/...",
    "orderId": "ORDER_TXN123456789"
  }
}
```

### **Payment Callback**
```http
POST /api/payments/callback
Content-Type: application/json
```

**Callback Data:**
```json
{
  "merchantTransactionId": "TXN123456789",
  "merchantOrderId": "ORDER_TXN123456789",
  "amount": 150000,
  "code": "PAYMENT_SUCCESS",
  "message": "Payment successful",
  "checksum": "hash_value"
}
```

### **Payment Verification**
```http
GET /api/payments/verify/:transactionId
Authorization: Bearer <token>
```

### **Payment History**
```http
GET /api/payments/history?page=1&limit=10&type=payment
Authorization: Bearer <token>
```

### **Refund Request**
```http
POST /api/payments/refund/:transactionId
Authorization: Bearer <client_token>
Content-Type: application/json

{
  "reason": "Service not as expected"
}
```

## 🗄️ **Database Schema Updates**

### **Transaction Model**
```javascript
{
  // ... existing fields
  paymentMethod: {
    type: String,
    enum: ['wallet', 'bank_transfer', 'upi', 'card', 'phonepe', 'gateway'],
    default: 'wallet'
  },
  gatewayTransactionId: String,
  gatewayOrderId: String,
  gatewayResponse: Mixed
}
```

## 🔒 **Security Features**

### **1. Checksum Verification**
- All callbacks verified using checksum
- Prevents unauthorized payment confirmations

### **2. Transaction Validation**
- Payment amount validation
- Job status validation
- User authorization checks

### **3. Duplicate Prevention**
- Prevents multiple payments for same job
- Unique transaction IDs

## 🧪 **Testing**

### **Test Payment Flow**
1. **Create a job** and assign to freelancer
2. **Mark work as done** (freelancer)
3. **Initiate payment** (client)
4. **Complete payment** via gateway
5. **Verify callback** processing
6. **Check job status** and wallet balance

### **Test Commands**
```bash
# Initiate payment
curl -X POST http://localhost:10000/api/payments/initiate/job_id \
  -H "Authorization: Bearer client_token"

# Verify payment
curl -X GET http://localhost:10000/api/payments/verify/transaction_id \
  -H "Authorization: Bearer token"

# Get payment history
curl -X GET http://localhost:10000/api/payments/history \
  -H "Authorization: Bearer token"
```

## 🎯 **Frontend Integration**

### **Client App**
1. **Payment Button**: Show "Pay" button for work_done jobs
2. **Payment Modal**: Display payment gateway URL
3. **Status Tracking**: Show payment status
4. **History**: Display payment history

### **Freelancer App**
1. **Wallet Balance**: Show updated balance after payment
2. **Transaction History**: View all payments received
3. **Job Status**: Track job completion status

## 🚀 **Production Deployment**

### **Environment Setup**
1. **Update credentials** with production values
2. **Configure callback URLs** for production domain
3. **Set up SSL** for secure communication
4. **Configure webhooks** for payment notifications

### **Monitoring**
1. **Payment success rate** tracking
2. **Failed payment** alerts
3. **Transaction reconciliation**
4. **Error logging** and monitoring

## 🔄 **Job Status Flow**
```
open → assigned → work_done → waiting_for_payment → completed
```

### **Status Transitions**
- **work_done**: Freelancer marks work complete
- **waiting_for_payment**: Payment initiated
- **completed**: Payment successful, job finished

## 💰 **Wallet System**

### **Freelancer Wallet**
- **Credited** when payment successful
- **Withdrawal** to bank account
- **Transaction history** tracking

### **Payment Methods**
- **PhonePe Gateway**: Real-time payments
- **Wallet Transfer**: Internal transfers
- **Bank Transfer**: Withdrawals

## 🎉 **Benefits**

### **For Clients**
- **Secure payments** via trusted gateway
- **Multiple payment options**
- **Real-time confirmation**
- **Refund capability**

### **For Freelancers**
- **Instant payment** processing
- **Secure fund transfer**
- **Transaction transparency**
- **Multiple withdrawal options**

### **For Platform**
- **Reduced payment friction**
- **Better user experience**
- **Secure payment processing**
- **Comprehensive audit trail**

## 📞 **Support**

### **Payment Issues**
- Check transaction logs
- Verify callback processing
- Contact payment gateway support
- Review error messages

### **Integration Help**
- Review API documentation
- Check environment configuration
- Verify callback URLs
- Test with sandbox credentials
