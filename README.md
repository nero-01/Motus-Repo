# MotusTots - Family Management App

A comprehensive Next.js-based family management application designed to help parents organize chores, rewards, routines, and educational activities for their children.

## 🏗️ Architecture Overview

This application uses a **modular architecture** to ensure feature isolation and prevent interdependencies. Each feature is self-contained with its own:

- **Types** (`types.ts`) - TypeScript interfaces and types
- **Store** (`store.ts`) - Zustand state management
- **Components** (`components/`) - React components
- **API Routes** (`api/`) - Next.js API endpoints
- **Pages** (`pages/`) - Next.js pages

## 📁 Project Structure

```
motustots/
├── app/                          # Next.js App Router
│   ├── auth/                     # Authentication pages
│   ├── dashboard/                # Main dashboard
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/                   # Shared components
│   ├── providers.tsx            # Context providers
│   └── ui/                      # UI components
├── modules/                      # Feature modules (isolated)
│   ├── auth/                    # Authentication module
│   │   ├── components/          # Auth-specific components
│   │   ├── store.ts            # Auth state management
│   │   └── types.ts            # Auth types
│   ├── dashboard/               # Dashboard module
│   ├── chores/                  # Chores module
│   ├── rewards/                 # Rewards module
│   ├── routines/                # Routines module
│   ├── education/               # Education module
│   ├── reminders/               # Reminders module
│   ├── coparenting/             # Co-parenting module
│   ├── planners/                # Planners module
│   ├── analytics/               # Analytics module
│   └── settings/                # Settings module
├── lib/                         # Utility libraries
├── types/                       # Global types
└── public/                      # Static assets
```

## 🚀 Features

### Core Modules

1. **Authentication** - User registration, login, password reset
2. **Dashboard** - Overview of family activities and quick actions
3. **Chores** - Create, assign, and track household chores
4. **Rewards** - Reward system for completed tasks
5. **Routines** - Daily and weekly routine management
6. **Education** - Educational worksheets and activities
7. **Reminders** - Task and event reminders
8. **Co-parenting** - Shared calendar, expenses, and messaging
9. **Planners** - Meal planning and scheduling
10. **Analytics** - Progress tracking and insights
11. **Settings** - User and family preferences

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Forms**: React Hook Form + Zod
- **UI Components**: Radix UI + Lucide React
- **Charts**: Recharts
- **Testing**: Jest + React Testing Library
- **Storybook**: Component documentation

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd motustots
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   Fill in your Supabase credentials and other required values.

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the database schema from `database_schema.sql`
   - Update your environment variables with Supabase URL and keys

5. **Production builds (EAS)**  
   For production builds, set `EXPO_PUBLIC_APP_ENV`, `EXPO_PUBLIC_SUPABASE_URL`, and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in **EAS Secrets** — see **SETUP_GUIDE.md** (section: Production builds – required environment variables).
   You can validate locally/CI with `npm run check:prod-env`.

6. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔧 Development

### Adding a New Module

1. **Create module structure**:
   ```bash
   mkdir -p modules/your-module/{components,api}
   touch modules/your-module/{types.ts,store.ts,index.ts}
   ```

2. **Define types** in `modules/your-module/types.ts`

3. **Create state management** in `modules/your-module/store.ts`

4. **Build components** in `modules/your-module/components/`

5. **Add API routes** in `modules/your-module/api/`

6. **Create pages** in `app/your-module/`

### Module Isolation Benefits

- **Independent Development**: Work on one module without affecting others
- **Separate State Management**: Each module has its own Zustand store
- **Isolated Components**: Components are scoped to their module
- **Type Safety**: Strong typing within each module
- **Easy Testing**: Test modules independently
- **Scalable Architecture**: Easy to add new features

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run Storybook
npm run storybook
```

## 📚 Storybook

Component documentation and development:
```bash
npm run storybook
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔒 Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes following the modular architecture
4. Add tests for new functionality
5. Commit your changes: `git commit -am 'Add new feature'`
6. Push to the branch: `git push origin feature/your-feature`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in each module
- Review the Storybook component library

## 🔄 Migration from React Native

This Next.js version provides several advantages over the React Native version:

- **Better Performance**: Server-side rendering and optimized builds
- **Easier Development**: Web-based development with hot reload
- **Cross-platform**: Works on all devices with a web browser
- **Modular Architecture**: Better feature isolation and maintainability
- **Rich Ecosystem**: Access to the entire npm ecosystem
- **SEO Friendly**: Better search engine optimization
- **Easier Deployment**: Deploy to any web hosting platform 