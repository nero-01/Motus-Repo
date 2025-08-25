# 🚀 Quick Setup Guide - MotusTots

Get MotusTots running in 5 minutes!

## 📋 Prerequisites
- Node.js (v16+)
- Expo Go app on your phone
- Supabase account (free)

## ⚡ Quick Start

### 1. **Clone & Install**
```bash
git clone <repository-url>
cd MotusTots
npm install
```

### 2. **Set up Supabase**
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings → API and copy your URL and anon key

### 3. **Configure Environment**
```bash
cp config/env.example.ts config/env.ts
```
Edit `config/env.ts`:
```typescript
export const ENV = {
  SUPABASE_URL: 'your-supabase-url-here',
  SUPABASE_ANON_KEY: 'your-supabase-anon-key-here',
  APP_ENV: 'development',
};
```

### 4. **Set up Database**
1. Go to your Supabase project → SQL Editor
2. Copy and paste the contents of `database_schema.sql`
3. Run the SQL script
4. Copy and paste the contents of `fix_worksheet_progress.sql`
5. Run the fix script

### 5. **Start the App**
```bash
npx expo start
```

### 6. **Test on Your Phone**
1. Install Expo Go from App Store/Google Play
2. Scan the QR code from the terminal
3. The app will load on your phone!

## 🎯 What You Can Do Right Now

### ✅ **Working Features**
- **Create Account** - Register and login
- **Create Family** - Set up your family profile
- **Add Children** - Create child profiles
- **Education** - Try interactive worksheets
- **Activities** - Navigate through all features
- **Routines** - Create daily routines
- **Chores** - Assign household tasks
- **Rewards** - Set up point system
- **Analytics** - View family statistics

### 🎮 **Try the Education System**
1. Go to Education tab
2. Tap "Start" on any worksheet
3. Answer multiple choice questions
4. See your score and progress!

## 🔧 Troubleshooting

### **App won't start?**
- Make sure Node.js is installed
- Run `npm install` again
- Check your environment variables

### **Database errors?**
- Make sure you ran both SQL scripts
- Check your Supabase credentials
- Verify RLS policies are enabled

### **Can't connect to Supabase?**
- Check your internet connection
- Verify your API keys are correct
- Make sure your Supabase project is active

## 📱 App Structure

```
🏠 Home - Family overview
⭐ Activities - Quick access to all features
📚 Education - Interactive worksheets
👤 Profile - Settings and account
```

## 🎉 You're Ready!

The app is now running with:
- ✅ Full authentication
- ✅ Family management
- ✅ Interactive education
- ✅ Chores and rewards
- ✅ Analytics dashboard
- ✅ Beautiful UI

**Next Steps:**
1. Explore all the features
2. Add your family members
3. Try the education worksheets
4. Set up some routines and chores

---

**Need Help?** Check the full documentation in `README.md` or `APP_STATUS.md` 