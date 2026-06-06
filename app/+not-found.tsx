import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page not found', headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>🔍</Text>
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.subtitle}>
          This screen doesn&apos;t exist. It may have been moved or the link is incorrect.
        </Text>
        <Link href="/" asChild>
          <TouchableOpacity style={styles.homeBtn}>
            <Text style={styles.homeBtnText}>Go to Home</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/reminders" asChild>
          <TouchableOpacity style={styles.remindersBtn}>
            <Text style={styles.remindersBtnText}>📅 Reminders</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#F4F6F9',
  },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#006A60', marginBottom: 10 },
  subtitle: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 320,
  },
  homeBtn: {
    backgroundColor: '#006A60',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  homeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  remindersBtn: {
    borderWidth: 1.5,
    borderColor: '#006A60',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  remindersBtnText: { color: '#006A60', fontWeight: '600', fontSize: 15 },
});
