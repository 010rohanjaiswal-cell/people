# 🚀 Quick Start Guide

Get your Firebase authentication backend running in 5 minutes!

## 1. Setup Firebase Credentials

Run the interactive setup script:
```bash
npm run setup
```

This will prompt you for your Firebase service account credentials and create the `.env` file automatically.

## 2. Start the Server

```bash
npm run dev
```

Your server will start on `http://localhost:3000`

## 3. Test the API

Use the built-in test suite:
```bash
node test/test-auth.js
```

## 4. Manual Testing

### Health Check
```bash
curl http://localhost:3000/health
```

### Send Verification Code
```bash
curl -X POST http://localhost:3000/api/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+16505550000"}'
```

### Verify Phone Number
```bash
curl -X POST http://localhost:3000/api/auth/verify-phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+16505550000", "verificationCode": "123456"}'
```

## 🔑 Firebase Test Numbers

Use these numbers for testing (no real SMS sent):
- `+16505550000`
- `+16505550001` 
- `+16505550002`
- `+16505550003`
- `+16505550004`

## 📱 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| POST | `/api/auth/send-verification-code` | Send verification code |
| POST | `/api/auth/verify-phone` | Verify phone number |
| POST | `/api/auth/refresh-token` | Refresh JWT token |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update user profile |
| POST | `/api/auth/logout` | Logout user |
| DELETE | `/api/auth/account` | Delete account |

## 🚨 Troubleshooting

**Server won't start?**
- Check your `.env` file exists
- Verify Firebase credentials are correct
- Ensure Firebase project has Authentication enabled

**Phone verification fails?**
- Use the test phone numbers above
- Check Firebase Console > Authentication > Sign-in methods > Phone

**Firebase connection error?**
- Verify service account has proper permissions
- Check project ID matches your Firebase project

## 📚 Next Steps

1. **Customize**: Modify validation rules in `middleware/validation.js`
2. **Extend**: Add new routes in `routes/auth.js`
3. **Secure**: Update CORS origins in `server.js` for production
4. **Deploy**: Use PM2, Docker, or your preferred hosting service

## 🆘 Need Help?

- Check the full [README.md](README.md)
- Review Firebase Console settings
- Ensure all dependencies are installed: `npm install`
