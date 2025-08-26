# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
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

## Endpoints

### 1. Authentication

#### 1.1 Send OTP
```http
POST /auth/send-otp
```

**Request Body:**
```json
{
  "phone": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

#### 1.2 Verify OTP & Login
```http
POST /auth/verify-otp
```

**Request Body:**
```json
{
  "phone": "9876543210",
  "otp": "123456",
  "role": "client"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "phone": "9876543210",
      "role": "client",
      "isVerified": true
    }
  }
}
```

#### 1.3 Admin Login
```http
POST /auth/admin/login
```

**Request Body:**
```json
{
  "email": "admin@freelancingplatform.com",
  "password": "admin123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "email": "admin@freelancingplatform.com",
      "role": "admin"
    }
  }
}
```

#### 1.4 Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "phone": "9876543210",
      "role": "client",
      "isVerified": true,
      "isActive": true,
      "lastLogin": "2024-01-20T10:30:00.000Z",
      "createdAt": "2024-01-15T08:00:00.000Z",
      "updatedAt": "2024-01-20T10:30:00.000Z"
    }
  }
}
```

### 2. Client Endpoints

#### 2.1 Get Client Profile
```http
GET /client/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "userId": "60f7b3b3b3b3b3b3b3b3b3b3",
      "fullName": "John Doe",
      "dateOfBirth": "1990-05-15T00:00:00.000Z",
      "gender": "male",
      "address": {
        "street": "123 Main Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "country": "India"
      },
      "profilePhoto": "profilePhoto-1234567890.jpg",
      "isProfileComplete": true,
      "totalJobsPosted": 2,
      "totalSpent": 2500,
      "rating": 4.5,
      "createdAt": "2024-01-15T08:00:00.000Z",
      "updatedAt": "2024-01-20T10:30:00.000Z"
    }
  }
}
```

#### 2.2 Create/Update Client Profile
```http
POST /client/profile
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
fullName: John Doe
dateOfBirth: 1990-05-15
gender: male
address[street]: 123 Main Street
address[city]: Mumbai
address[state]: Maharashtra
address[pincode]: 400001
profilePhoto: [file]
```

**Response:**
```json
{
  "success": true,
  "message": "Profile saved successfully",
  "data": {
    "profile": {
      // Profile object
    }
  }
}
```

#### 2.3 Post Job
```http
POST /client/jobs
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "House Cleaning Service",
  "description": "Need professional cleaning for 2BHK apartment. Must be thorough and use eco-friendly products.",
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

**Response:**
```json
{
  "success": true,
  "message": "Job posted successfully",
  "data": {
    "job": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "clientId": "60f7b3b3b3b3b3b3b3b3b3b3",
      "title": "House Cleaning Service",
      "description": "Need professional cleaning for 2BHK apartment...",
      "amount": 1500,
      "numberOfPeople": 1,
      "address": {
        "street": "123 Main Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001"
      },
      "genderPreference": "female",
      "status": "open",
      "isActive": true,
      "createdAt": "2024-01-20T10:30:00.000Z",
      "updatedAt": "2024-01-20T10:30:00.000Z"
    }
  }
}
```

#### 2.4 Get Client's Jobs
```http
GET /client/jobs?page=1&limit=10&status=open
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "title": "House Cleaning Service",
        "description": "Need professional cleaning...",
        "amount": 1500,
        "status": "open",
        "freelancerId": null,
        "createdAt": "2024-01-20T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

#### 2.5 Get Job Offers
```http
GET /client/jobs/:jobId/offers?page=1&limit=10&status=pending
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "offers": [
      {
        "id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "jobId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "freelancerId": {
          "id": "60f7b3b3b3b3b3b3b3b3b3b3",
          "phone": "9876543212",
          "freelancerProfile": {
            "fullName": "Mike Johnson",
            "rating": 4.7,
            "totalJobs": 5,
            "completedJobs": 5
          }
        },
        "originalAmount": 1500,
        "offeredAmount": 1500,
        "message": "I have experience in cleaning",
        "status": "pending",
        "offerType": "direct_apply",
        "createdAt": "2024-01-20T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

#### 2.6 Accept/Reject Offer
```http
POST /client/offers/:offerId/respond
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "action": "accept",
  "responseMessage": "Offer accepted"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Offer accepted successfully",
  "data": {
    "offer": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "status": "accepted",
      "respondedAt": "2024-01-20T10:30:00.000Z",
      "responseMessage": "Offer accepted"
    }
  }
}
```

#### 2.7 Pay for Job
```http
POST /client/jobs/:jobId/pay
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Payment completed successfully",
  "data": {
    "transaction": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "jobId": "60f7b3b3b3b3b3b3b3b3b3b3",
      "clientId": "60f7b3b3b3b3b3b3b3b3b3b3",
      "freelancerId": "60f7b3b3b3b3b3b3b3b3b3b3",
      "amount": 1500,
      "type": "payment",
      "status": "completed",
      "description": "Payment for job: House Cleaning Service",
      "referenceId": "TXN1234567890",
      "completedAt": "2024-01-20T10:30:00.000Z"
    },
    "job": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "status": "completed",
      "paymentCompletedAt": "2024-01-20T10:30:00.000Z"
    }
  }
}
```

#### 2.8 Search Freelancers
```http
GET /client/search/freelancers?freelancerId=12345&page=1&limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "freelancers": [
      {
        "id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "freelancerId": "12345",
        "fullName": "Mike Johnson",
        "rating": 4.7,
        "totalJobs": 5,
        "completedJobs": 5,
        "totalEarnings": 3500,
        "verificationStatus": "approved",
        "userId": {
          "id": "60f7b3b3b3b3b3b3b3b3b3b3",
          "phone": "9876543212"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### 3. Freelancer Endpoints

#### 3.1 Get Freelancer Profile
```http
GET /freelancer/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "userId": "60f7b3b3b3b3b3b3b3b3b3b3",
      "freelancerId": "12345",
      "fullName": "Mike Johnson",
      "dateOfBirth": "1992-08-10T00:00:00.000Z",
      "gender": "male",
      "address": {
        "street": "789 Pine Road",
        "city": "Bangalore",
        "state": "Karnataka",
        "pincode": "560001",
        "country": "India"
      },
      "profilePhoto": "profilePhoto-1234567890.jpg",
      "documents": {
        "aadhaarFront": "aadhaarFront-1234567890.jpg",
        "aadhaarBack": "aadhaarBack-1234567890.jpg",
        "drivingLicenseFront": "drivingLicenseFront-1234567890.jpg",
        "drivingLicenseBack": "drivingLicenseBack-1234567890.jpg",
        "panFront": "panFront-1234567890.jpg"
      },
      "verificationStatus": "approved",
      "isProfileComplete": true,
      "rating": 4.7,
      "totalJobs": 5,
      "completedJobs": 5,
      "totalEarnings": 3500,
      "createdAt": "2024-01-15T08:00:00.000Z",
      "updatedAt": "2024-01-20T10:30:00.000Z"
    }
  }
}
```

#### 3.2 Create/Update Freelancer Profile
```http
POST /freelancer/profile
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
fullName: Mike Johnson
dateOfBirth: 1992-08-10
gender: male
address[street]: 789 Pine Road
address[city]: Bangalore
address[state]: Karnataka
address[pincode]: 560001
aadhaarFront: [file]
aadhaarBack: [file]
drivingLicenseFront: [file]
drivingLicenseBack: [file]
panFront: [file]
```

**Response:**
```json
{
  "success": true,
  "message": "Profile saved successfully",
  "data": {
    "profile": {
      // Profile object
    }
  }
}
```

#### 3.3 Get Available Jobs
```http
GET /freelancer/jobs/available?page=1&limit=10&gender=female
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "title": "House Cleaning Service",
        "description": "Need professional cleaning...",
        "amount": 1500,
        "numberOfPeople": 1,
        "genderPreference": "female",
        "status": "open",
        "clientId": {
          "id": "60f7b3b3b3b3b3b3b3b3b3b3",
          "phone": "9876543210"
        },
        "createdAt": "2024-01-20T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

#### 3.4 Apply for Job
```http
POST /freelancer/jobs/:jobId/apply
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "offeredAmount": 1500,
  "message": "I have experience in cleaning and can start immediately.",
  "offerType": "custom_offer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job application submitted successfully",
  "data": {
    "offer": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "jobId": "60f7b3b3b3b3b3b3b3b3b3b3",
      "freelancerId": "60f7b3b3b3b3b3b3b3b3b3b3",
      "clientId": "60f7b3b3b3b3b3b3b3b3b3b3",
      "originalAmount": 1500,
      "offeredAmount": 1500,
      "message": "I have experience in cleaning...",
      "status": "pending",
      "offerType": "custom_offer",
      "createdAt": "2024-01-20T10:30:00.000Z"
    }
  }
}
```

#### 3.5 Mark Work as Done
```http
POST /freelancer/jobs/:jobId/work-done
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Work marked as completed",
  "data": {
    "job": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "status": "work_done",
      "workCompletedAt": "2024-01-20T10:30:00.000Z"
    }
  }
}
```

#### 3.6 Get Wallet Balance
```http
GET /freelancer/wallet
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "wallet": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "userId": "60f7b3b3b3b3b3b3b3b3b3b3",
      "balance": 1200,
      "isActive": true,
      "createdAt": "2024-01-15T08:00:00.000Z",
      "updatedAt": "2024-01-20T10:30:00.000Z"
    }
  }
}
```

#### 3.7 Request Withdrawal
```http
POST /freelancer/withdraw
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 500,
  "bankDetails": {
    "accountNumber": "1234567890",
    "ifscCode": "SBIN0001234",
    "accountHolderName": "Mike Johnson"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal request submitted successfully",
  "data": {
    "transaction": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "freelancerId": "60f7b3b3b3b3b3b3b3b3b3b3",
      "amount": 500,
      "type": "withdrawal",
      "status": "pending",
      "description": "Withdrawal request",
      "referenceId": "TXN1234567890",
      "paymentMethod": "bank_transfer",
      "bankDetails": {
        "accountNumber": "1234567890",
        "ifscCode": "SBIN0001234",
        "accountHolderName": "Mike Johnson"
      },
      "createdAt": "2024-01-20T10:30:00.000Z"
    }
  }
}
```

### 4. Admin Endpoints

#### 4.1 Get Pending Verifications
```http
GET /admin/verifications/pending?page=1&limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verifications": [
      {
        "id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "userId": {
          "id": "60f7b3b3b3b3b3b3b3b3b3b3",
          "phone": "9876543214",
          "createdAt": "2024-01-15T08:00:00.000Z"
        },
        "fullName": "Alex Brown",
        "verificationStatus": "under_review",
        "createdAt": "2024-01-15T08:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

#### 4.2 Approve Freelancer
```http
POST /admin/verifications/:profileId/approve
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "freelancerId": "12345"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Freelancer verification approved",
  "data": {
    "profile": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "verificationStatus": "approved",
      "freelancerId": "12345"
    }
  }
}
```

#### 4.3 Reject Freelancer
```http
POST /admin/verifications/:profileId/reject
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "rejectionReason": "Documents are unclear and need to be resubmitted"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Freelancer verification rejected",
  "data": {
    "profile": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "verificationStatus": "rejected",
      "rejectionReason": "Documents are unclear and need to be resubmitted"
    }
  }
}
```

#### 4.4 Get Platform Statistics
```http
GET /admin/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 6,
      "clients": 2,
      "freelancers": 3,
      "verifiedFreelancers": 2,
      "pendingVerifications": 1
    },
    "jobs": {
      "total": 3,
      "open": 1,
      "completed": 1,
      "totalAmount": 1500
    },
    "transactions": {
      "total": 2,
      "completed": 2,
      "pendingWithdrawals": 0,
      "totalAmount": 2000
    },
    "recentActivity": {
      "jobs": [
        {
          "id": "60f7b3b3b3b3b3b3b3b3b3b3",
          "title": "House Cleaning Service",
          "clientId": {
            "id": "60f7b3b3b3b3b3b3b3b3b3b3",
            "phone": "9876543210"
          },
          "createdAt": "2024-01-20T10:30:00.000Z"
        }
      ],
      "transactions": [
        {
          "id": "60f7b3b3b3b3b3b3b3b3b3b3",
          "amount": 1500,
          "type": "payment",
          "status": "completed",
          "clientId": {
            "id": "60f7b3b3b3b3b3b3b3b3b3b3",
            "phone": "9876543210"
          },
          "freelancerId": {
            "id": "60f7b3b3b3b3b3b3b3b3b3b3",
            "phone": "9876543212"
          },
          "createdAt": "2024-01-20T10:30:00.000Z"
        }
      ]
    }
  }
}
```

### 5. Messaging Endpoints

#### 5.1 Get Messages
```http
GET /api/messages/job/:jobId?page=1&limit=50
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "jobId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "senderId": {
          "id": "60f7b3b3b3b3b3b3b3b3b3b3",
          "phone": "9876543210",
          "role": "client"
        },
        "receiverId": {
          "id": "60f7b3b3b3b3b3b3b3b3b3b3",
          "phone": "9876543212",
          "role": "freelancer"
        },
        "message": "Hello, when can you start the work?",
        "messageType": "text",
        "isRead": false,
        "createdAt": "2024-01-20T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1,
      "pages": 1
    }
  }
}
```

#### 5.2 Send Message
```http
POST /api/messages/job/:jobId
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "Hello, when can you start the work?",
  "messageType": "text"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "jobId": "60f7b3b3b3b3b3b3b3b3b3b3",
      "senderId": {
        "id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "phone": "9876543210",
        "role": "client"
      },
      "receiverId": {
        "id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "phone": "9876543212",
        "role": "freelancer"
      },
      "message": "Hello, when can you start the work?",
      "messageType": "text",
      "isRead": false,
      "createdAt": "2024-01-20T10:30:00.000Z"
    }
  }
}
```

#### 5.3 Mark Messages as Read
```http
PUT /api/messages/job/:jobId/read
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Messages marked as read"
}
```

#### 5.4 Get Unread Count
```http
GET /api/messages/unread-count
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Validation error or invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

## Common Error Messages

- `"Access denied. No token provided."` - Missing JWT token
- `"Invalid token or user not found."` - Invalid JWT token
- `"Access denied. Insufficient permissions."` - Role-based access denied
- `"Validation failed"` - Input validation error
- `"Profile not found"` - User profile doesn't exist
- `"Job not found"` - Job doesn't exist or user doesn't have access
- `"Insufficient balance"` - Wallet balance too low for withdrawal
- `"You have already applied for this job"` - Duplicate job application
- `"Job not available"` - Job is not in open status
