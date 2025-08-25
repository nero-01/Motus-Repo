# MotusTots - Modular Architecture

## Overview

MotusTots has been restructured to use a modular architecture that ensures features are independent and changes in one module don't affect others. This architecture is designed to work seamlessly with Expo Go SDK 52.

## Architecture Principles

### 1. **Module Independence**
- Each feature is contained within its own module
- Modules have their own types, services, stores, and components
- No cross-module dependencies without explicit interfaces

### 2. **Separation of Concerns**
- **Types**: Define interfaces and data structures
- **Services**: Handle business logic and API calls
- **Stores**: Manage state using Zustand
- **Components**: UI components specific to the module

### 3. **Feature Flags**
- Centralized configuration allows enabling/disabling features
- Easy to test features in isolation
- Gradual rollout capabilities

## Module Structure

```
src/modules/
├── auth/                    # Authentication Module
│   ├── types.ts            # Auth-related interfaces
│   ├── services/           # Auth business logic
│   │   ├── authService.ts  # Traditional auth
│   │   └── socialAuthService.ts # Social login
│   ├── store/              # Auth state management
│   │   └── authStore.ts    # Zustand store
│   └── components/         # Auth UI components
│       └── LoginForm.tsx   # Enhanced login form
├── activities/             # Activities Module
│   ├── types.ts           # Activity interfaces
│   ├── services/          # Activity business logic
│   │   └── activityService.ts
│   ├── store/             # Activity state management
│   └── components/        # Activity UI components
├── routines/              # Routines Module
├── chores/                # Chores Module
├── rewards/               # Rewards Module
└── education/             # Education Module
```

## Key Features

### 1. **Enhanced Authentication**
- **Traditional Login**: Email/password authentication
- **Social Login**: Google, Facebook, Apple, Twitter (coming soon)
- **Modular Design**: Easy to add new providers
- **State Management**: Centralized auth state with Zustand

### 2. **Improved Activities System**
- **Rich Activity Data**: Detailed activity information with materials, instructions, and tags
- **Advanced Filtering**: Search, filter by type, category, difficulty, age range
- **Favorites System**: Save and manage favorite activities
- **Progress Tracking**: Track completion and ratings
- **Recommendations**: AI-powered activity suggestions

### 3. **Better User Experience**
- **Modern UI**: Material Design with React Native Paper
- **Responsive Design**: Works on all screen sizes
- **Loading States**: Proper loading indicators
- **Error Handling**: Graceful error handling with user feedback
- **Offline Support**: Basic offline functionality

## Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Social Login Configuration
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
EXPO_PUBLIC_APPLE_CLIENT_ID=your_apple_client_id

# App Configuration
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### Social Login Setup

1. **Google OAuth**:
   - Create a project in Google Cloud Console
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add your app's bundle identifier

2. **Facebook OAuth**:
   - Create a Facebook App
   - Add Facebook Login product
   - Configure OAuth settings
   - Add your app's bundle identifier

3. **Apple Sign-In**:
   - Configure Sign in with Apple in Apple Developer Console
   - Add your app's bundle identifier
   - Generate client ID

## Development Guidelines

### Adding New Modules

1. **Create Module Structure**:
   ```bash
   src/modules/newFeature/
   ├── types.ts
   ├── services/
   ├── store/
   └── components/
   ```

2. **Define Types**:
   ```typescript
   // types.ts
   export interface NewFeature {
     id: string;
     name: string;
     // ... other properties
   }
   ```

3. **Create Service**:
   ```typescript
   // services/newFeatureService.ts
   export class NewFeatureService {
     static async getData(): Promise<NewFeature[]> {
       // Implementation
     }
   }
   ```

4. **Create Store**:
   ```typescript
   // store/newFeatureStore.ts
   export const useNewFeatureStore = create<NewFeatureStore>((set) => ({
     // State and actions
   }));
   ```

### Best Practices

1. **Type Safety**: Always define TypeScript interfaces
2. **Error Handling**: Implement proper error handling in services
3. **Loading States**: Show loading indicators for async operations
4. **Testing**: Write tests for services and components
5. **Documentation**: Document complex business logic

## Benefits of This Architecture

### 1. **Maintainability**
- Clear separation of concerns
- Easy to locate and modify specific features
- Reduced coupling between modules

### 2. **Scalability**
- Easy to add new features
- Independent module development
- Feature flag support for gradual rollouts

### 3. **Testing**
- Isolated module testing
- Mock services for testing
- Clear interfaces for testing

### 4. **Performance**
- Lazy loading of modules
- Optimized bundle size
- Efficient state management

### 5. **Developer Experience**
- Clear project structure
- Consistent patterns
- Easy onboarding for new developers

## Migration Guide

If you're migrating from the old architecture:

1. **Update Imports**: Replace old imports with new module paths
2. **Update Components**: Use new modular components
3. **Update Services**: Use new service classes
4. **Update State Management**: Use Zustand stores instead of local state
5. **Test Thoroughly**: Ensure all features work correctly

## Future Enhancements

1. **Offline Support**: Implement comprehensive offline functionality
2. **Push Notifications**: Add notification system
3. **Analytics**: Implement user analytics
4. **A/B Testing**: Add feature flag-based testing
5. **Performance Monitoring**: Add performance tracking
6. **Accessibility**: Improve accessibility features

## Support

For questions or issues with the new architecture, please refer to:
- Module-specific documentation in each module folder
- TypeScript definitions for type information
- Service classes for business logic documentation
