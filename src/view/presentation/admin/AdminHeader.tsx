import { useState } from 'react';
import { View, TouchableOpacity, Image, Text, Platform, StyleSheet, useWindowDimensions, Modal } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '@/controllers/authController';

const NAV_ITEMS = [
  { label: 'Accounts', route: '/admin/account' },
  { label: 'Errands', route: '/admin/errand' },
  { label: 'Account Verification', route: '/admin/account-verification' },
  { label: 'Payment Verification', route: '/admin/payment-verification' },
  { label: 'Reports', route: '/admin/report' },
  { label: 'Logs', route: '/admin/logs' },
] as const;

const ACCENT = '#FEA405';
const BREAKPOINT = 900;

export default function AdminHeader() {
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = '/' + segments.join('/');
  const { width } = useWindowDimensions();
  const compact = width < BREAKPOINT;
  const [menuOpen, setMenuOpen] = useState(false);
  const [signOutVisible, setSignOutVisible] = useState(false);

  const navItems = (
    <>
      {NAV_ITEMS.map(item => {
        const active = currentRoute === item.route || currentRoute.startsWith(item.route + '/');
        return (
          <TouchableOpacity
            key={item.route}
            onPress={() => { router.push(item.route as any); setMenuOpen(false); }}
            activeOpacity={0.7}
            style={compact && styles.menuItem}
          >
            <Text style={[styles.navText, active && styles.navTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity onPress={() => setSignOutVisible(true)} activeOpacity={0.7} style={compact && styles.menuItem}>
        <Text style={[styles.navText, { color: '#EF4444' }]}>Sign out</Text>
      </TouchableOpacity>
    </>
  );

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
        {compact ? (
          <TouchableOpacity onPress={() => setMenuOpen(v => !v)} activeOpacity={0.7}>
            <Ionicons name={menuOpen ? 'close' : 'menu'} size={24} color="#374151" />
          </TouchableOpacity>
        ) : (
          <View style={styles.nav}>{navItems}</View>
        )}
      </View>
      {compact && menuOpen && (
        <View style={styles.dropdown}>{navItems}</View>
      )}

      <Modal visible={signOutVisible} transparent animationType="fade" onRequestClose={() => setSignOutVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalDesc}>Are you sure you want to sign out?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setSignOutVisible(false)} style={styles.cancelBtn} activeOpacity={0.7}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setSignOutVisible(false); logout(); }} style={styles.confirmBtn} activeOpacity={0.7}>
                <Text style={styles.confirmText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    zIndex: 50,
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
    fontSize: 14,
    fontWeight: '400',
    color: '#111827',
    marginTop: 14,
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
  dropdown: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  menuItem: {
    paddingVertical: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});
