#!/bin/bash

# MotusTots Migration Script: React Native to Next.js
# This script helps migrate the existing React Native app to Next.js

echo "🚀 Starting MotusTots migration to Next.js..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Backup existing files
echo "📦 Creating backup of existing files..."
mkdir -p backup/$(date +%Y%m%d_%H%M%S)
cp -r app backup/$(date +%Y%m%d_%H%M%S)/app
cp -r components backup/$(date +%Y%m%d_%H%M%S)/components
cp -r services backup/$(date +%Y%m%d_%H%M%S)/services
cp -r stores backup/$(date +%Y%m%d_%H%M%S)/stores
cp package.json backup/$(date +%Y%m%d_%H%M%S)/package.json
cp tsconfig.json backup/$(date +%Y%m%d_%H%M%S)/tsconfig.json

echo "✅ Backup created successfully"

# Install Next.js dependencies
echo "📥 Installing Next.js dependencies..."
npm install next@latest react@latest react-dom@latest
npm install @supabase/auth-helpers-nextjs @supabase/auth-helpers-react
npm install react-hook-form @hookform/resolvers zod
npm install date-fns react-datepicker recharts
npm install lucide-react clsx tailwind-merge
npm install framer-motion react-hot-toast
npm install react-dropzone react-beautiful-dnd
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-tabs
npm install @radix-ui/react-toast @radix-ui/react-tooltip
npm install class-variance-authority

# Install dev dependencies
echo "📥 Installing development dependencies..."
npm install -D @types/node @types/react @types/react-dom
npm install -D @types/react-beautiful-dnd
npm install -D eslint eslint-config-next
npm install -D tailwindcss autoprefixer postcss
npm install -D @tailwindcss/forms @tailwindcss/typography
npm install -D prettier prettier-plugin-tailwindcss
npm install -D @storybook/addon-essentials @storybook/addon-interactions
npm install -D @storybook/addon-links @storybook/blocks
npm install -D @storybook/nextjs @storybook/react
npm install -D @storybook/testing-library storybook
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D jest-environment-jsdom

echo "✅ Dependencies installed successfully"

# Create environment file
echo "🔧 Setting up environment configuration..."
if [ ! -f ".env.local" ]; then
    cp env.example .env.local
    echo "📝 Please update .env.local with your Supabase credentials"
fi

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p modules/{auth,dashboard,chores,rewards,routines,education,reminders,coparenting,planners,analytics,settings}/{components,api}
mkdir -p lib
mkdir -p public
mkdir -p .github/workflows

echo "✅ Directory structure created"

# Initialize Git repository if not already done
if [ ! -d ".git" ]; then
    echo "🔧 Initializing Git repository..."
    git init
    echo "node_modules/" > .gitignore
    echo ".next/" >> .gitignore
    echo ".env.local" >> .gitignore
    echo "*.log" >> .gitignore
    echo "coverage/" >> .gitignore
    echo ".storybook-static/" >> .gitignore
    git add .
    git commit -m "Initial Next.js migration"
    echo "✅ Git repository initialized"
fi

echo ""
echo "🎉 Migration completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env.local with your Supabase credentials"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:3000 to see your app"
echo ""
echo "📚 Documentation:"
echo "- Check README.md for detailed setup instructions"
echo "- Review DEPLOYMENT.md for deployment options"
echo "- Each module has its own documentation"
echo ""
echo "🔧 Development commands:"
echo "- npm run dev          # Start development server"
echo "- npm run build        # Build for production"
echo "- npm run test         # Run tests"
echo "- npm run storybook    # Start Storybook"
echo ""
echo "🚀 Happy coding!"
