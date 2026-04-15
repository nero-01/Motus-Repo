import React from 'react';
import { router } from 'expo-router';
import FamilyDashboard from '../../../src/modules/family/components/FamilyDashboard';

export default function FamilyDashboardScreen() {
  return (
    <FamilyDashboard
      onNavigateToSettings={() => router.push('/features/settings')}
      onNavigateToAnalytics={() => router.push('/features/analytics')}
    />
  );
}
