# Deployment Guide

This guide covers deploying the MotusTots Next.js application to various platforms.

## 🚀 Quick Deploy with Vercel (Recommended)

### 1. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a Next.js project

### 2. Configure Environment Variables

In your Vercel project settings, add these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_secret_key
```

### 3. Deploy

Vercel will automatically deploy your app and provide a URL. Each push to the main branch will trigger a new deployment.

## 🌐 Other Deployment Options

### Netlify

1. **Connect Repository**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Build Settings**:
   ```
   Build command: npm run build
   Publish directory: .next
   ```

3. **Environment Variables**:
   Add the same environment variables as Vercel

### Railway

1. **Connect Repository**:
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"

2. **Environment Variables**:
   Add the required environment variables in the Railway dashboard

3. **Deploy**:
   Railway will automatically build and deploy your app

### DigitalOcean App Platform

1. **Create App**:
   - Go to DigitalOcean App Platform
   - Click "Create App"
   - Connect your GitHub repository

2. **Configure Build**:
   - Build Command: `npm run build`
   - Run Command: `npm start`
   - Output Directory: `.next`

3. **Environment Variables**:
   Add the required environment variables

### AWS Amplify

1. **Connect Repository**:
   - Go to AWS Amplify Console
   - Click "New app" → "Host web app"
   - Connect your GitHub repository

2. **Build Settings**:
   Amplify will auto-detect Next.js and configure build settings

3. **Environment Variables**:
   Add the required environment variables in the Amplify console

## 🔧 Production Configuration

### 1. Environment Variables

Ensure these are set in production:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=your_secure_secret_key

# Optional
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

### 2. Supabase Production Setup

1. **Create Production Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project for production

2. **Run Database Schema**:
   ```sql
   -- Run the schema from database_schema.sql
   ```

3. **Configure RLS Policies**:
   ```sql
   -- Run the policies from fix_rls_policies.sql
   ```

4. **Update Environment Variables**:
   Use the production Supabase URL and keys

### 3. Custom Domain (Optional)

1. **Vercel**:
   - Go to your project settings
   - Click "Domains"
   - Add your custom domain
   - Update DNS records as instructed

2. **Other Platforms**:
   - Follow platform-specific instructions for custom domains

## 🔒 Security Considerations

### 1. Environment Variables

- Never commit `.env.local` to version control
- Use platform-specific secret management
- Rotate secrets regularly

### 2. Supabase Security

- Enable Row Level Security (RLS) on all tables
- Use service role keys only for server-side operations
- Regularly review and update RLS policies

### 3. HTTPS

- All modern platforms provide HTTPS by default
- Ensure your custom domain uses HTTPS

## 📊 Monitoring and Analytics

### 1. Vercel Analytics

If using Vercel, enable Vercel Analytics for performance monitoring.

### 2. Google Analytics

Add your GA ID to environment variables:

```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 3. Error Monitoring

Consider adding error monitoring services:
- Sentry
- LogRocket
- Bugsnag

## 🔄 CI/CD Pipeline

The project includes GitHub Actions for automated testing and deployment:

1. **On Push to Main**:
   - Run tests
   - Type checking
   - Linting
   - Build verification

2. **On Pull Request**:
   - Run tests
   - Type checking
   - Linting

3. **Deployment**:
   - Automatic deployment to production (main branch)
   - Manual deployment for other branches

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check environment variables are set
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Runtime Errors**:
   - Check browser console for errors
   - Verify Supabase connection
   - Check authentication flow

3. **Performance Issues**:
   - Enable Next.js production optimizations
   - Use image optimization
   - Implement proper caching

### Support

For deployment issues:
1. Check platform-specific documentation
2. Review build logs
3. Verify environment variables
4. Test locally with production environment

## 📈 Scaling Considerations

### 1. Database Scaling

- Supabase automatically scales PostgreSQL
- Monitor query performance
- Use proper indexing

### 2. Application Scaling

- Next.js handles scaling automatically
- Use CDN for static assets
- Implement proper caching strategies

### 3. Cost Optimization

- Monitor usage on your chosen platform
- Use appropriate instance sizes
- Implement proper caching to reduce database calls
