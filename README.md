# Freelancing Platform Backend

A complete backend for a freelancing platform with Client and Freelancer roles, built with Node.js, Express, and MongoDB.

## Features

### 🔐 Authentication & Authorization
- OTP-based login/signup via mobile number
- JWT token-based authentication
- Role-based access control (Client, Freelancer, Admin)
- Admin login with email/password

### 👥 User Management
- **Client Flow**: Register → Complete Profile → Post Jobs → Manage Offers → Make Payments
- **Freelancer Flow**: Register → Manual Verification → Get Approved → Apply for Jobs → Complete Work → Receive Payments
- **Admin Panel**: Manage verifications, transactions, and platform statistics

### 💼 Job Management
- Job posting with detailed requirements
- Job application system with direct apply and custom offers
- Job lifecycle: `open → assigned → work_done → waiting_for_payment → completed`
- Gender preference filtering
- Location-based job matching

### 💰 Payment & Wallet System
- In-app wallet for freelancers
- Secure payment processing
- Withdrawal system with bank transfer simulation
- Transaction history and tracking

### 💬 Messaging System
- Real-time chat between clients and freelancers
- Message read/unread status
- Conversation management

### 📊 Admin Features
- Freelancer verification approval/rejection
- Transaction monitoring
- Platform statistics dashboard
- User management

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd freelancing-platform-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/freelancing-platform
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   ADMIN_EMAIL=admin@freelancingplatform.com
   ADMIN_PASSWORD=admin123456
   ```

4. **Start MongoDB**
   ```bash
   # Start MongoDB service
   mongod
   ```

5. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Send OTP
```http
POST /auth/send-otp
Content-Type: application/json

{
  "phone": "9876543210"
}
```

#### Verify OTP & Login
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456",
  "role": "client"
}
```

#### Admin Login
```http
POST /auth/admin/login
Content-Type: application/json

{
  "email": "admin@freelancingplatform.com",
  "password": "admin123456"
}
```

### Client Endpoints

#### Create/Update Profile
```http
POST /client/profile
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "fullName": "John Doe",
  "dateOfBirth": "1990-05-15",
  "gender": "male",
  "address": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }
}
```

#### Post Job
```http
POST /client/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "House Cleaning Service",
  "description": "Need professional cleaning for 2BHK apartment",
  "amount": 1500,
  "numberOfPeople": 1,
  "address": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "genderPreference": "female"
}
```

#### Get Job Offers
```http
GET /client/jobs/:jobId/offers
Authorization: Bearer <token>
```

#### Accept/Reject Offer
```http
POST /client/offers/:offerId/respond
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "accept",
  "responseMessage": "Offer accepted"
}
```

#### Pay for Job
```http
POST /client/jobs/:jobId/pay
Authorization: Bearer <token>
```

### Freelancer Endpoints

#### Create/Update Profile
```http
POST /freelancer/profile
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "fullName": "Mike Johnson",
  "dateOfBirth": "1992-08-10",
  "gender": "male",
  "address": {
    "street": "789 Pine Road",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001"
  }
}
```

#### Get Available Jobs
```http
GET /freelancer/jobs/available?page=1&limit=10&gender=female
Authorization: Bearer <token>
```

#### Apply for Job
```http
POST /freelancer/jobs/:jobId/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "offeredAmount": 1500,
  "message": "I have experience in cleaning",
  "offerType": "custom_offer"
}
```

#### Mark Work as Done
```http
POST /freelancer/jobs/:jobId/work-done
Authorization: Bearer <token>
```

#### Get Wallet Balance
```http
GET /freelancer/wallet
Authorization: Bearer <token>
```

#### Request Withdrawal
```http
POST /freelancer/withdraw
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 500,
  "bankDetails": {
    "accountNumber": "1234567890",
    "ifscCode": "SBIN0001234",
    "accountHolderName": "Mike Johnson"
  }
}
```

### Admin Endpoints

#### Get Pending Verifications
```http
GET /admin/verifications/pending
Authorization: Bearer <token>
```

#### Approve Freelancer
```http
POST /admin/verifications/:profileId/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "freelancerId": "12345"
}
```

#### Reject Freelancer
```http
POST /admin/verifications/:profileId/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "rejectionReason": "Documents are unclear"
}
```

#### Get Platform Statistics
```http
GET /admin/stats
Authorization: Bearer <token>
```

#### Process Withdrawal
```http
POST /admin/transactions/:transactionId/process-withdrawal
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "approve"
}
```

### Messaging Endpoints

#### Get Messages
```http
GET /api/messages/job/:jobId?page=1&limit=50
Authorization: Bearer <token>
```

#### Send Message
```http
POST /api/messages/job/:jobId
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Hello, when can you start the work?",
  "messageType": "text"
}
```

#### Mark Messages as Read
```http
PUT /api/messages/job/:jobId/read
Authorization: Bearer <token>
```

## Database Schema

### Core Models

1. **User** - Authentication and basic user info
2. **FreelancerProfile** - Freelancer verification and profile data
3. **ClientProfile** - Client profile information
4. **Job** - Job postings with lifecycle management
5. **Offer** - Job applications and offers
6. **Wallet** - User wallet balances
7. **Transaction** - Payment and withdrawal records
8. **Message** - Chat messages between users
9. **OTP** - OTP verification codes

## Job Lifecycle

1. **open** - Job is posted and available for applications
2. **assigned** - Job is assigned to a freelancer
3. **work_done** - Freelancer marks work as completed
4. **waiting_for_payment** - Waiting for client payment
5. **completed** - Payment completed, job finished

## Testing

### Test Data
The seed script creates test data including:
- Admin user (9999999999)
- 2 clients with profiles
- 3 freelancers (2 approved, 1 under review)
- Sample jobs, offers, and transactions

### API Testing
Use tools like Postman or curl to test the endpoints:

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Send OTP
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'
```

## Security Features

- JWT token authentication
- Role-based access control
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet security headers
- File upload restrictions

## File Upload

Supported file types:
- Images: JPEG, PNG, WebP
- Documents: PDF

Maximum file size: 5MB

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error"
    }
  ]
}
```

## Deployment

### Environment Variables
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - JWT expiration time
- `ADMIN_EMAIL` - Admin email for login
- `ADMIN_PASSWORD` - Admin password

### Production Considerations
- Use environment variables for sensitive data
- Set up proper MongoDB authentication
- Configure CORS for your domain
- Set up proper logging
- Use HTTPS in production
- Configure proper file storage (AWS S3, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please open an issue in the repository.
