import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Platform, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import AdminNavBar from '../../components/admin/AdminNavBar';
import UserCard, { UserProfile } from '../../components/admin/UserCard';
import VerificationCard, { PendingUser } from '../../components/admin/VerificationCard';

const ACCENT = '#FEA405';

type SortKey = 'newest' | 'oldest' | 'verified' | 'unverified' | 'pending' | 'suspended';

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Verified', value: 'verified' },
  { label: 'Unverified', value: 'unverified' },
  { label: 'Pending', value: 'pending' },
  { label: 'Suspended', value: 'suspended' },
];

interface FullUserProfile extends UserProfile {
  pending_verification: boolean;
  avatar_url: string | null;
  verification_submitted_at: string | null;
  id_type: string | null;
  is_active: boolean;
}

export default function AdminAccountsScreen() {
  const [users, setUsers] = useState<FullUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    const { data } = await supabaseAdmin
      .from('admin_user_profiles')
      .select('id, display_name, email, verified, role, created_at, rating, pending_verification, avatar_url, verification_submitted_at, id_type');
    
    if (data) {
      const usersWithStatus = await Promise.all(
        data.map(async (user) => {
          const { data: profileData } = await supabaseAdmin
            .from('profiles')
            .select('is_active')
            .eq('id', user.id)
            .maybeSingle();
          return { ...user, is_active: profileData?.is_active ?? true };
        })
      );
      setUsers(usersWithStatus as FullUserProfile[]);
    }
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchUsers();

    // Poll every 5 seconds for updates
    const interval = setInterval(() => {
      fetchUsers();
    }, 5000);

    return () => { 
      clearInterval(interval);
    };
  }, []);

  const filtered = useMemo(() => {
    let list = [...users];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        (u.display_name ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q)
      );
    }

    if (sort === 'pending') return list.filter(u => u.pending_verification === true);
    if (sort === 'suspended') return list.filter(u => u.is_active === false);
    if (sort === 'verified') return list.filter(u => u.verified === true);
    if (sort === 'unverified') return list.filter(u => u.verified === false);

    switch (sort) {
      case 'newest': list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      case 'oldest': list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
    }

    return list;
  }, [users, search, sort]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View className={`bg-white border-b border-gray-100 ${Platform.OS !== 'web' ? 'pt-12' : 'pt-2'} pb-3 px-6 flex-row items-center justify-between`}>
        <View>
          <Text className="text-xl font-bold text-gray-900">User Accounts</Text>
          <Text className="text-xs text-gray-400 mt-0.5">{users.length} total users</Text>
        </View>
        <TouchableOpacity onPress={() => supabase.auth.signOut()} activeOpacity={0.7} style={{ padding: 8 }}>
          <Ionicons name="log-out-outline" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 gap-2">
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Search by name or email..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            className="flex-1 py-2.5 text-sm text-gray-800"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row gap-2 flex-wrap">
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setSort(opt.value)}
              className={`px-3 py-1.5 rounded-full border ${sort === opt.value ? 'bg-[#FEA405] border-[#FEA405]' : 'bg-white border-gray-200'}`}
            >
              <Text className={`text-xs font-medium ${sort === opt.value ? 'text-white' : 'text-gray-600'}`}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-400 text-sm">Loading users...</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            renderItem={({ item }) => sort === 'pending'
              ? <VerificationCard user={item as unknown as PendingUser} />
              : <UserCard user={item} />
            }
            contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ACCENT]} tintColor={ACCENT} />}
            ListEmptyComponent={
              <View className="items-center justify-center mt-16">
                <Ionicons name="people-outline" size={40} color="#E5E7EB" />
                <Text className="text-gray-400 text-sm mt-2">No users found</Text>
              </View>
            }
          />
        )}
      </View>

      <AdminNavBar />
    </View>
  );
}
