import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Avatar, List, Divider, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            if (__DEV__) console.log('Signing out...');
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Family Owner';
      case 'parent':
        return 'Parent';
      case 'co_parent':
        return 'Co-Parent';
      case 'member':
        return 'Member';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return '#FF9800';
      case 'parent':
        return '#4CAF50';
      case 'co_parent':
        return '#2196F3';
      case 'member':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const handleNavigateToFeature = (route: string) => {
    router.push(route);
  };

  const profileFeatures = [
    {
      id: 'co-parenting',
      title: 'Co-Parenting',
      description: 'Calendar, messages, expenses, and documents',
      icon: '👨‍👩‍👧‍👦',
      color: '#E3F2FD',
      route: '/features/co-parenting',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Family insights and statistics',
      icon: '📊',
      color: '#E8F5E8',
      route: '/features/analytics',
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'App preferences and account settings',
      icon: '⚙️',
      color: '#FFF3E0',
      route: '/features/settings',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* User Profile */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <Avatar.Text 
              size={80} 
              label="JD" 
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>John Doe</Text>
              <Text style={styles.email}>john.doe@example.com</Text>
              <Chip 
                mode="outlined" 
                style={[styles.roleChip, { borderColor: getRoleColor('owner') }]}
              >
                <Text style={[styles.roleText, { color: getRoleColor('owner') }]}>
                  {getRoleDisplayName('owner')}
                </Text>
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Family Overview */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Family Overview</Text>
          <View style={styles.familyStats}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>1</Text>
              <Text style={styles.statLabel}>Child</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Active Routines</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>85%</Text>
              <Text style={styles.statLabel}>Weekly Progress</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Family Members */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Family Members</Text>
          <List.Item
            title="John Doe"
            description="Family Owner"
            left={() => <Avatar.Text size={40} label="JD" />}
            right={() => (
              <Chip 
                mode="outlined" 
                style={[styles.memberChip, { borderColor: getRoleColor('owner') }]}
              >
                <Text style={[styles.memberChipText, { color: getRoleColor('owner') }]}>
                  Owner
                </Text>
              </Chip>
            )}
          />
          <Divider />
          <List.Item
            title="Sarah Doe"
            description="Co-Parent"
            left={() => <Avatar.Text size={40} label="SD" />}
            right={() => (
              <Chip 
                mode="outlined" 
                style={[styles.memberChip, { borderColor: getRoleColor('co_parent') }]}
              >
                <Text style={[styles.memberChipText, { color: getRoleColor('co_parent') }]}>
                  Co-Parent
                </Text>
              </Chip>
            )}
          />
        </Card.Content>
      </Card>

      {/* Children */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Children</Text>
          <List.Item
            title="Emma Doe"
            description="Age 8 • Grade 3"
            left={() => <Avatar.Text size={40} label="ED" />}
            right={() => (
              <View style={styles.childInfo}>
                <Text style={styles.childAge}>8 years</Text>
                <Text style={styles.childGrade}>Grade 3</Text>
              </View>
            )}
          />
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => handleNavigateToFeature('/features/routines/create')}
              style={styles.actionButton}
              icon="plus"
            >
              New Routine
            </Button>
            <Button
              mode="contained"
              onPress={() => handleNavigateToFeature('/features/chores/create')}
              style={styles.actionButton}
              icon="plus"
            >
              Add Chore
            </Button>
            <Button
              mode="contained"
              onPress={() => handleNavigateToFeature('/features/planners/meals')}
              style={styles.actionButton}
              icon="food"
            >
              Plan Meal
            </Button>
            <Button
              mode="contained"
              onPress={() => handleNavigateToFeature('/features/worksheets')}
              style={styles.actionButton}
              icon="book"
            >
              Start Learning
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Features */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Features</Text>
          {profileFeatures.map((feature) => (
            <List.Item
              key={feature.id}
              title={feature.title}
              description={feature.description}
              left={() => (
                <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                  <Text style={styles.featureIconText}>{feature.icon}</Text>
                </View>
              )}
              onPress={() => handleNavigateToFeature(feature.route)}
              style={styles.featureItem}
            />
          ))}
        </Card.Content>
      </Card>

      {/* Account Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Account</Text>
          <List.Item
            title="Edit Profile"
            description="Update your personal information"
            left={() => <List.Icon icon="account-edit" />}
            onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon!')}
          />
          <Divider />
          <List.Item
            title="Change Password"
            description="Update your account password"
            left={() => <List.Icon icon="lock" />}
            onPress={() => Alert.alert('Coming Soon', 'Password change will be available soon!')}
          />
          <Divider />
          <List.Item
            title="Privacy Settings"
            description="Manage your privacy preferences"
            left={() => <List.Icon icon="shield" />}
            onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available soon!')}
          />
          <Divider />
          <List.Item
            title="Help & Support"
            description="Get help and contact support"
            left={() => <List.Icon icon="help-circle" />}
            onPress={() => Alert.alert('Coming Soon', 'Help & support will be available soon!')}
          />
        </Card.Content>
      </Card>

      {/* Sign Out */}
      <Card style={styles.card}>
        <Card.Content>
          <Button
            mode="outlined"
            onPress={handleSignOut}
            style={styles.signOutButton}
            textColor="#F44336"
          >
            Sign Out
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  roleChip: {
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  familyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#006A60',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  memberChip: {
    alignSelf: 'center',
  },
  memberChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  childInfo: {
    alignItems: 'flex-end',
  },
  childAge: {
    fontSize: 14,
    fontWeight: '500',
  },
  childGrade: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    marginBottom: 8,
  },
  featureItem: {
    paddingVertical: 4,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureIconText: {
    fontSize: 20,
  },
  signOutButton: {
    borderColor: '#F44336',
  },
}); 