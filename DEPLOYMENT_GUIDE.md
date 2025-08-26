# 🚀 Render Deployment Guide

## 📋 **Prerequisites**

1. **GitHub Repository**: Your code is already on GitHub at `https://github.com/010rohanjaiswal-cell/people.git`
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **MongoDB Atlas**: Set up a cloud database (recommended for production)

## 🔧 **Step 1: Set Up MongoDB Atlas (Recommended)**

### **Create MongoDB Atlas Database:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (M0 Free tier)
4. Set up database access (username/password)
5. Set up network access (allow all IPs: 0.0.0.0/0)
6. Get your connection string

### **Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/freelancing-platform?retryWrites=true&w=majority
```

## 🚀 **Step 2: Deploy to Render**

### **Method 1: Using Render Dashboard**

1. **Sign in to Render**
   - Go to [render.com](https://render.com)
   - Sign in with your GitHub account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `010rohanjaiswal-cell/people`
   - Select the repository

3. **Configure Service**
   - **Name**: `freelancer-backend-jv21`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Set Environment Variables**
   Click "Environment" tab and add these variables:

   ```env
   NODE_ENV=production
   PORT=10000
       MONGODB_URI=mongodb+srv://rohanjaiswar2467:N8iwsBEfkbF2Dd2S@cluster1.sg9pmcf.mongodb.net/freelancing-platform?retryWrites=true&w=majority&appName=Cluster1
   JWT_SECRET=your-super-secure-jwt-secret-key-for-production
   JWT_EXPIRES_IN=7d
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=your-twilio-phone-number
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads
   ADMIN_EMAIL=admin@freelancingplatform.com
   ADMIN_PASSWORD=your-secure-admin-password
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your app

### **Method 2: Using render.yaml (Blueprints)**

1. **Push the render.yaml file**
   ```bash
   git add render.yaml Procfile
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Deploy via Blueprint**
   - Go to Render Dashboard
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will use the render.yaml configuration

## 🔧 **Step 3: Configure Environment Variables**

### **Required Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `10000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | `your-secure-secret` |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `ADMIN_EMAIL` | Admin email | `admin@freelancingplatform.com` |
| `ADMIN_PASSWORD` | Admin password | `secure-password` |

### **Optional Variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | - |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | - |
| `TWILIO_PHONE_NUMBER` | Twilio Phone Number | - |
| `MAX_FILE_SIZE` | Max file upload size | `5242880` |
| `UPLOAD_PATH` | Upload directory | `./uploads` |

## 🧪 **Step 4: Test Deployment**

### **Health Check:**
```bash
curl https://freelancer-backend-jv21.onrender.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Freelancing Platform API is running"
}
```

### **Test Admin Login:**
```bash
curl -X POST https://freelancer-backend-jv21.onrender.com/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@freelancingplatform.com",
    "password": "your-admin-password"
  }'
```

## 🔄 **Step 5: Automatic Deployments**

### **Enable Auto-Deploy:**
- Render automatically deploys when you push to the main branch
- You can configure branch rules in the Render dashboard

### **Manual Deploy:**
- Go to your service dashboard
- Click "Manual Deploy" → "Deploy latest commit"

## 📊 **Step 6: Monitor Your App**

### **Logs:**
- View real-time logs in the Render dashboard
- Monitor for errors and performance issues

### **Metrics:**
- CPU and memory usage
- Response times
- Error rates

## 🔒 **Step 7: Security Considerations**

### **Environment Variables:**
- Never commit sensitive data to Git
- Use Render's environment variable system
- Rotate secrets regularly

### **Database Security:**
- Use MongoDB Atlas with proper authentication
- Restrict network access
- Enable encryption at rest

### **API Security:**
- Use HTTPS (automatic with Render)
- Implement rate limiting
- Validate all inputs

## 🚀 **Step 8: Production Checklist**

- [ ] MongoDB Atlas database configured
- [ ] Environment variables set
- [ ] Health check endpoint working
- [ ] Admin login functional
- [ ] File uploads working
- [ ] CORS configured for frontend
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Performance monitoring enabled

## 🔗 **Useful Links**

- **Render Dashboard**: https://dashboard.render.com
- **MongoDB Atlas**: https://www.mongodb.com/atlas
- **API Documentation**: Check your deployed app at `/api/health`
- **GitHub Repository**: https://github.com/010rohanjaiswal-cell/people.git

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **Build Fails**
   - Check build logs in Render dashboard
   - Ensure all dependencies are in package.json

2. **Database Connection Error**
   - Verify MongoDB URI is correct
   - Check network access settings in Atlas

3. **Environment Variables Not Set**
   - Double-check all required variables
   - Restart the service after adding variables

4. **Port Issues**
   - Render uses PORT environment variable
   - Ensure your app listens on process.env.PORT

### **Support:**
- Render Documentation: https://render.com/docs
- MongoDB Atlas Documentation: https://docs.atlas.mongodb.com
- GitHub Issues: Create an issue in your repository

---

## 🎉 **Deployment Complete!**

Once deployed, your API will be available at:
**https://freelancer-backend-jv21.onrender.com**

Your frontend applications can now connect to this production API! 🚀
