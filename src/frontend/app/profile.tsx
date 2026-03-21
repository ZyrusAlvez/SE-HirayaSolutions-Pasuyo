import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { toast } from 'burnt';

const DEFAULT_AVATAR = 'https://avatar.iran.liara.run/public/boy';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const isGoogle = user.app_metadata.provider === 'google';
        setIsGoogleUser(isGoogle);
        setDisplayName(user.user_metadata.name || user.user_metadata.full_name || '');
        
        if (isGoogle && user.user_metadata.avatar_url) {
          setAvatarUrl(user.user_metadata.avatar_url);
        } else if (user.user_metadata.avatar_url) {
          setAvatarUrl(user.user_metadata.avatar_url);
        }
      }
    } catch (error) {
      toast({ title: 'Failed to load profile', preset: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast({ title: 'Permission required', preset: 'error' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast({ title: 'Display name is required', preset: 'error' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: displayName,
          avatar_url: avatarUrl,
        },
      });

      if (error) throw error;
      toast({ title: 'Profile updated', preset: 'done' });
    } catch (error) {
      toast({ title: 'Failed to update profile', preset: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: 'Logout failed', preset: 'error' });
    } else {
      router.replace('/login');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#FEA405" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="bg-[#FEA405] pt-12 pb-6 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Profile Settings</Text>
      </View>

      <View className="p-6">
        <View className="items-center mb-6">
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
            <View className="relative">
              <Image
                source={{ uri: avatarUrl }}
                className="w-32 h-32 rounded-full"
              />
              <View className="absolute bottom-0 right-0 bg-[#FEA405] rounded-full p-2">
                <Ionicons name="camera" size={20} color="white" />
              </View>
            </View>
          </TouchableOpacity>
          {isGoogleUser && (
            <Text className="text-gray-500 text-xs mt-2">Google Account</Text>
          )}
        </View>

        <View className="mb-6">
          <Text className="text-gray-700 font-semibold mb-2">Display Name</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-base"
            placeholder="Enter your display name"
            placeholderTextColor="#9CA3AF"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
        </View>

        <TouchableOpacity
          className="bg-[#FEA405] py-4 rounded-2xl mb-4"
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text className="text-white text-base font-semibold text-center">
            {saving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-red-500 py-4 rounded-2xl"
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text className="text-white text-base font-semibold text-center">
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
