# 🚀 MotusTots Quick Start Guide

Get MotusTots up and running in 10 minutes!

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo Go app on your phone
- Supabase account (free tier works)

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/motustots.git
cd motustots

# Install dependencies
npm install
```

## Step 2: Set Up Supabase

1. **Create a Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Sign up/login and create a new project
   - Wait for the project to be ready

2. **Get your credentials**
   - Go to Settings → API
   - Copy your Project URL and anon public key

3. **Set up environment variables**
   ```bash
   cp config/env.example.ts config/env.ts
   ```
   
   Edit `config/env.ts`:
   ```typescript
   export const SUPABASE_URL = 'your-project-url';
   export const SUPABASE_ANON_KEY = 'your-anon-key';
   ```

## Step 3: Set Up Database

1. **Run the database schema**
   - Go to your Supabase project
   - Navigate to SQL Editor
   - Copy and paste the contents of `database_schema.sql`
   - Click "Run" to execute

2. **Fix RLS policies (if needed)**
   - If you encounter permission errors, run `fix_rls_policies.sql`
   - This fixes common Row Level Security issues

## Step 4: Start the App

```bash
# Start the development server
npx expo start
```

## Step 5: Test on Your Device

1. **Install Expo Go**
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Connect to the app**
   - Scan the QR code from your terminal
   - The app will load on your device

## Step 6: Create Your First Family

1. **Sign up**
   - Open the app
   - Create a new account with your email

2. **Set up your family**
   - Follow the onboarding process
   - Add your family name
   - Add your children

3. **Start using the app**
   - Create your first chore
   - Set up a reward
   - Assign tasks to your children

## 🎯 Quick Test Features

### Test Chores
1. Go to **Planners → Chores**
2. Tap the **+** button to create a chore
3. Fill in the details and save
4. Assign it to a child
5. Mark it as complete

### Test Rewards
1. Go to **Rewards**
2. Create a new reward
3. Set a point cost
4. Have a child redeem it
5. Approve the redemption

### Test Education
1. Go to **Education**
2. Create a worksheet
3. Assign it to a child
4. Mark it as complete with a score

## 🔧 Troubleshooting

### Common Issues

**"Cannot connect to Supabase"**
- Check your environment variables
- Verify your Supabase project is active
- Check your internet connection

**"Permission denied" errors**
- Run the RLS policies fix: `fix_rls_policies.sql`
- Check that RLS is enabled in Supabase

**"App won't load"**
- Clear Expo cache: `npx expo start --clear`
- Restart the development server
- Check for TypeScript errors

**"Database tables missing"**
- Make sure you ran `database_schema.sql`
- Check the SQL editor for any errors
- Verify all tables were created

### Getting Help

- Check the [main README](README.md) for detailed documentation
- Look at the [Supabase setup guide](SUPABASE_SETUP.md)
- Open an issue on GitHub if you're stuck

## 🎉 You're Ready!

Your MotusTots app is now running! Start exploring the features:

- **Dashboard**: See your family's overview
- **Chores**: Manage household tasks
- **Rewards**: Set up the points system
- **Education**: Create learning activities
- **Co-Parenting**: Coordinate with other parents

Happy parenting! 🚀 