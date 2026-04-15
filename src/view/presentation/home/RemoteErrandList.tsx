import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import SortBar, { SortState } from './SortBar';

const DEFAULT_AVATAR = require('@/assets/images/default_profile.jpg');

interface Errand {
  id: string;
  title: string;
  description: string;
  budget?: number;
  deadline?: string;
  poster_name?: string;
  poster_avatar?: string;
  poster_is_verified?: boolean;
}

interface Props {
  errands: Errand[];
}

export default function RemoteErrandList({ errands }: Props) {
  const router = useRouter();
  const [sort, setSort] = useState<SortState>({ key: 'budget', dir: 'asc' });

  const sorted = [...errands].sort((a, b) => {
    let diff = 0;
    if (sort.key === 'deadline') {
      const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      diff = da - db;
    } else if (sort.key === 'budget') {
      diff = (a.budget ?? 0) - (b.budget ?? 0);
    }
    return sort.dir === 'asc' ? diff : -diff;
  });

  if (errands.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
        <Ionicons name="globe-outline" size={48} color="#9CA3AF" />
        <Text style={{ color: '#9CA3AF', marginTop: 8 }}>No remote errands yet</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
      <SortBar sort={sort} onSort={setSort} keys={['deadline', 'budget']} />
      <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8, marginLeft: 4 }}>Tap a row to see more info</Text>
      <View style={{ backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' }}>
        {sorted.map((e, i) => (
          <TouchableOpacity
            key={e.id}
            activeOpacity={0.7}
            onPress={() => router.push(`/errand/${e.id}`)}
            style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: i === sorted.length - 1 ? 0 : 1, borderBottomColor: '#F3F4F6' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <Image
                source={e.poster_avatar && e.poster_avatar !== 'default' ? { uri: e.poster_avatar } : DEFAULT_AVATAR}
                style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }}
              />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', flexShrink: 1 }} numberOfLines={1}>
                    {e.title}
                  </Text>
                  {e.poster_is_verified && (
                    <MaterialIcons name="verified" size={14} color="#1D9BF0" />
                  )}
                </View>
              </View>
            </View>
            {sort.key === 'deadline' ? (
              e.deadline ? (
                <View style={{ backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#EF4444' }}>
                    {new Date(e.deadline).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              ) : (
                <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF' }}>No deadline</Text>
                </View>
              )
            ) : (
              e.budget != null && (
                <View style={{ backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706' }}>₱{e.budget}</Text>
                </View>
              )
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
