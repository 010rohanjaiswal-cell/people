# Firebase Authentication Backend

A robust Node.js/Express backend for Firebase authentication with phone number verification, supporting both Firebase test numbers and production phone authentication.

## Features

- 🔐 **Phone Number Authentication** - Secure phone number verification
- 📱 **Firebase Test Numbers** - Built-in support for Firebase testing phone numbers
- 🛡️ **JWT Tokens** - Custom JWT token generation and management
- 🔒 **Route Protection** - Middleware for protecting authenticated routes
- 📊 **User Management** - Create, read, update, and delete user profiles
- 🚀 **Production Ready** - Security middleware, rate limiting, and error handling
- 📝 **Input Validation** - Request validation using express-validator
- 🗄️ **Firestore Integration** - User data storage in Firestore

## Prerequisites

- Node.js 16+ 
- Firebase project with Authentication and Firestore enabled
- Firebase service account credentials

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd firebase-auth-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your Firebase credentials in the `.env` file:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your-service-account-email@your-project.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your-client-id
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
   FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account-email%40your-project.iam.gserviceaccount.com
   
   JWT_SECRET=your-super-secret-jwt-key-here
   PORT=3000
   NODE_ENV=development
   ```

4. **Get Firebase Service Account Credentials**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Download the JSON file and copy the values to your `.env` file

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## API Endpoints

### Authentication

#### 1. Send Verification Code
```http
POST /api/auth/send-verification-code
Content-Type: application/json

{
  "phoneNumber": "+16505550000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent successfully",
  "phoneNumber": "+16505550000",
  "isTestNumber": true,
  "verificationCode": "123456",
  "expiresIn": "10 minutes"
}
```

#### 2. Verify Phone Number
```http
POST /api/auth/verify-phone
Content-Type: application/json

{
  "phoneNumber": "+16505550000",
  "verificationCode": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Phone number verified successfully",
  "user": {
    "uid": "user123",
    "phoneNumber": "+16505550000",
    "email": null,
    "displayName": "User_1234567890",
    "isPhoneVerified": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7 days"
}
```

#### 3. Refresh Token
```http
POST /api/auth/refresh-token
Authorization: Bearer <your-jwt-token>
```

#### 4. Get User Profile
```http
GET /api/auth/profile
Authorization: Bearer <your-firebase-id-token>
```

#### 5. Update User Profile
```http
PUT /api/auth/profile
Authorization: Bearer <your-firebase-id-token>
Content-Type: application/json

{
  "displayName": "John Doe",
  "email": "john@example.com"
}
```

#### 6. Logout
```http
POST /api/auth/logout
Authorization: Bearer <your-jwt-token>
```

#### 7. Delete Account
```http
DELETE /api/auth/account
Authorization: Bearer <your-firebase-id-token>
```

## Firebase Test Phone Numbers

For development and testing, you can use these Firebase test phone numbers:

- `+16505550000` - Test number 1
- `+16505550001` - Test number 2
- `+16505550002` - Test number 3
- `+16505550003` - Test number 4
- `+16505550004` - Test number 5

These numbers will automatically receive verification codes without sending actual SMS messages.

## Authentication Flow

1. **Send Verification Code**: User requests a verification code for their phone number
2. **Verify Phone Number**: User submits the verification code to authenticate
3. **User Creation/Login**: If verification succeeds, user is created (if new) or logged in
4. **Token Generation**: JWT token is generated and returned to the client
5. **Protected Routes**: Use the token in the `Authorization` header for protected endpoints

## Security Features

- **Helmet**: Security headers for Express
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Validation**: Request data validation and sanitization
- **JWT Tokens**: Secure token-based authentication
- **Firebase Admin SDK**: Official Firebase authentication

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FIREBASE_PROJECT_ID` | Your Firebase project ID | Required |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key | Required |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | Required |
| `JWT_SECRET` | Secret key for JWT signing | Required |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment (development/production) | development |
| `RATE_LIMIT_WINDOW_MS` | Rate limiting window in milliseconds | 900000 (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": [] // Validation errors (if applicable)
}
```

## Testing

```bash
npm test
```

## Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Use a strong, unique `JWT_SECRET`
3. Configure proper CORS origins
4. Set up environment-specific Firebase configurations
5. Use a process manager like PM2 or Docker
6. Set up proper logging and monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the Firebase documentation
- Review the API endpoints above
- Check your environment configuration
- Ensure Firebase services are properly enabled
