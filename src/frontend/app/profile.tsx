import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { toast } from 'burnt';

const DEFAULT_AVATAR = require('../assets/images/default_profile.jpg');

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<any>(DEFAULT_AVATAR);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);

  const isDirty = displayName !== originalName || !!pendingImageUri;
  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata.name || user.user_metadata.full_name || '';
        setDisplayName(name);
        setOriginalName(name);
        setEmail(user.email || '');
        const url = user.user_metadata.avatar_url;
        if (url && url !== 'default') setAvatarUrl({ uri: url });
      }
    } catch {
      toast({ title: 'Failed to load profile', preset: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { toast({ title: 'Permission required', preset: 'error' }); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const maxSize = 2 * 1024 * 1024;
      if (asset.mimeType && !allowedTypes.includes(asset.mimeType)) {
        toast({ title: 'Only JPG, PNG, or WEBP images are allowed', preset: 'error' }); return;
      }
      if (asset.fileSize && asset.fileSize > maxSize) {
        toast({ title: 'Image must be under 2MB', preset: 'error' }); return;
      }
      setPendingImageUri(asset.uri);
      setAvatarUrl({ uri: asset.uri });
    }
  };

  const uploadAvatar = async (uri: string, name: string, userEmail: string): Promise<string> => {
    const safeName = name.trim().replace(/\s+/g, '_');
    const safeEmail = userEmail.replace(/[@.]/g, '_');
    const path = `profile image/${safeName}_${safeEmail}.jpg`;
    const response = await fetch(uri);
    const blob = await response.blob();
    const { error } = await supabase.storage.from('avatars').upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const handleSave = async () => {
    if (!displayName.trim()) { toast({ title: 'Display name is required', preset: 'error' }); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');
      let finalAvatarUrl = avatarUrl?.uri || 'default';
      if (pendingImageUri) {
        finalAvatarUrl = await uploadAvatar(pendingImageUri, displayName, user.email || '');
        setPendingImageUri(null);
        setAvatarUrl({ uri: finalAvatarUrl });
      }
      const { error } = await supabase.auth.updateUser({ data: { name: displayName, avatar_url: finalAvatarUrl } });
      if (error) throw error;
      toast({ title: 'Profile updated', preset: 'done' });
      setOriginalName(displayName);
      setPendingImageUri(null);
    } catch {
      toast({ title: 'Failed to update profile', preset: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { toast({ title: 'Logout failed', preset: 'error' }); }
    else { router.replace('/login'); }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#FEA405" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Orange header */}
      <View className="bg-[#FEA405] pt-12 pb-20 px-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.replace('/')} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Profile Settings</Text>
      </View>

      {/* Avatar — overlaps header */}
      <View className="items-center -mt-14 mb-6">
        <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
          <View className="relative">
            <View style={{ width: 112, height: 112, borderRadius: 56, borderWidth: 4, borderColor: '#fff', backgroundColor: '#E5E7EB', overflow: 'hidden' }}>
              <Image
                source={avatarUrl}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>
            <View className="absolute bottom-0 right-0 bg-[#FEA405] rounded-full p-2">
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </View>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800 mt-3">{displayName || 'No name set'}</Text>
        <Text className="text-sm text-gray-400 mt-0.5">{email}</Text>
      </View>

      {/* Form card */}
      <View className="mx-4 bg-white rounded-3xl p-6 mb-4" style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Account Info</Text>

        <View className="mb-4">
          <Text className="text-xs text-gray-500 mb-1 ml-1">Display Name</Text>
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4">
            <Ionicons name="person-outline" size={18} color="#9CA3AF" />
            <TextInput
              className="flex-1 py-4 ml-2 text-base"
              placeholder="Enter your display name"
              placeholderTextColor="#9CA3AF"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-xs text-gray-500 mb-1 ml-1">Email</Text>
          <View className="flex-row items-center bg-gray-100 border border-gray-200 rounded-2xl px-4">
            <Ionicons name="mail-outline" size={18} color="#9CA3AF" />
            <Text className="flex-1 py-4 ml-2 text-base text-gray-400">{email}</Text>
            <Ionicons name="lock-closed-outline" size={14} color="#D1D5DB" />
          </View>
        </View>

        <TouchableOpacity
          className="flex-row items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4"
          onPress={() => router.push({ pathname: '/reset-password', params: { from: 'profile', email } })}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <Ionicons name="key-outline" size={18} color="#9CA3AF" />
            <Text className="ml-2 text-base text-gray-700">Change Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      </ScrollView>

      {/* Logout — pinned to bottom */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-3 bg-gray-50">
        {isDirty && (
          <TouchableOpacity
            className="bg-[#FEA405] py-4 rounded-2xl mb-3"
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-semibold text-center">
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          className="bg-white border border-red-300 py-4 rounded-2xl flex-row items-center justify-center"
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text className="text-red-500 text-base font-semibold ml-2">Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
