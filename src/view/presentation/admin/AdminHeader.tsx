import { View, TouchableOpacity, Image, Text, Platform, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { logout } from '@/controllers/authController';

const NAV_ITEMS = [
  { label: 'Accounts', route: '/admin/accounts' },
  { label: 'Errands', route: '/admin/errands' },
  { label: 'Account Verification', route: '/admin/account-verification' },
  { label: 'Payment Verification', route: '/admin/payment-verification' },
  { label: 'Reports', route: '/admin/reports' },
  { label: 'Logs', route: '/admin/logs' },
] as const;

const ACCENT = '#FEA405';

export default function AdminHeader() {
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = '/' + segments.join('/');

  return (
    <View style={[styles.container, Platform.OS !== 'web' && { paddingTop: 48 }]}>
      <View style={styles.inner}>
        <View style={styles.left}>
          <Image
            source={require('@/assets/logo/Pasuyo_full.png')}
            style={{ width: 100, height: 32 }}
            resizeMode="contain"
          />
          <Text style={styles.title}>Admin Dashboard</Text>
        </View>
        <View style={styles.nav}>
          {NAV_ITEMS.map(item => {
            const active = currentRoute === item.route;
            return (
              <TouchableOpacity
                key={item.route}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <Text style={[styles.navText, active && styles.navTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity onPress={() => logout()} activeOpacity={0.7}>
            <Text style={[styles.navText, { color: '#EF4444' }]}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingTop: 8,
    paddingBottom: 12,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  navText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  navTextActive: {
    color: ACCENT,
    fontWeight: '700',
  },
});
