# Freelancing Platform Admin Panel

Next.js web application for platform administration.

## Features

- Admin authentication
- User management
- Job monitoring
- Transaction management
- Platform analytics
- Freelancer verification

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set environment variables**
   ```bash
   # .env.local
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_APP_NAME=Freelancing Platform Admin
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## Project Structure

```
src/
├── app/             # Next.js app router pages
│   ├── auth/        # Authentication pages
│   ├── dashboard/   # Dashboard pages
│   ├── users/       # User management
│   ├── jobs/        # Job management
│   ├── transactions/ # Transaction management
│   └── analytics/   # Analytics pages
├── components/      # UI components
├── services/        # API services
├── utils/           # Helper functions
├── hooks/           # Custom hooks
└── types/           # TypeScript types
```

## API Integration

The admin panel connects to the backend API at: `http://localhost:5000/api`

See `FRONTEND_API_GUIDE.md` in the backend repository for detailed API documentation.

## Deployment

1. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

2. **Or connect GitHub repository to Vercel for automatic deployment**

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_APP_NAME` - Application name
