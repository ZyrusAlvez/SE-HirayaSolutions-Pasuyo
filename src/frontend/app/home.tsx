import { useState, useEffect } from 'react';
import { View, TouchableOpacity, Alert, Platform, Image, Text, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

let MapView: any, Marker: any, UrlTile: any;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  UrlTile = maps.UrlTile;
}

export default function HomeScreen() {
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [WebMap, setWebMap] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      import('../components/WebMap').then((mod) => setWebMap(() => mod.default));
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use this app');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-white px-6 pt-12 pb-4 flex-row items-center justify-between border-b border-gray-100">
          <TouchableOpacity className="p-2" activeOpacity={0.7}>
            <Ionicons name="menu" size={28} color="#000" />
          </TouchableOpacity>
          <Image 
            source={require('../assets/logo/Pasuyo_full.png')}
            style={{ width: 120, height: 40 }}
            resizeMode="contain"
          />
          <TouchableOpacity 
            className="p-2" 
            onPress={() => router.push('/profile')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-circle-outline" size={28} color="#FEA405" />
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View className="flex-1 px-6 py-4">
          <View className="flex-1 rounded-2xl overflow-hidden shadow-md">
            {location && WebMap && (
              <WebMap latitude={location.coords.latitude} longitude={location.coords.longitude} />
            )}
          </View>
        </View>

        {/* Navigation Bar */}
        <View className="bg-white px-6 py-4 flex-row justify-around border-t border-gray-100">
          <TouchableOpacity className="items-center" activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={24} color="#FEA405" />
            <Text className="text-xs mt-1 text-gray-700">Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center" activeOpacity={0.7}>
            <Ionicons name="add-circle" size={32} color="#FEA405" />
            <Text className="text-xs mt-1 text-gray-700">Post Hustle</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center" activeOpacity={0.7}>
            <Ionicons name="list-outline" size={24} color="#FEA405" />
            <Text className="text-xs mt-1 text-gray-700">My Tasks</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white px-6 pt-12 pb-4 flex-row items-center justify-between border-b border-gray-100">
        <TouchableOpacity className="p-2" activeOpacity={0.7}>
          <Ionicons name="menu" size={28} color="#000" />
        </TouchableOpacity>
        <Image 
          source={require('../assets/logo/Pasuyo_full.png')}
          style={{ width: 120, height: 40 }}
          resizeMode="contain"
        />
        <TouchableOpacity 
          className="p-2" 
          onPress={() => router.push('/profile')}
          activeOpacity={0.7}
        >
          <Ionicons name="person-circle-outline" size={28} color="#FEA405" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View className="flex-1 px-6 py-4">
        <View className="flex-1 rounded-2xl overflow-hidden shadow-md">
          {location && (
            <MapView
              className="flex-1"
              initialRegion={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation
              showsMyLocationButton
            >
              <UrlTile
                urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maximumZ={19}
              />
              <Marker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                title="You are here"
              />
            </MapView>
          )}
        </View>
      </View>

      {/* Navigation Bar */}
      <View className="bg-white px-6 py-4 flex-row justify-around border-t border-gray-100">
        <TouchableOpacity className="items-center" activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={24} color="#FEA405" />
          <Text className="text-xs mt-1 text-gray-700">Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center" activeOpacity={0.7}>
          <Ionicons name="add-circle" size={32} color="#FEA405" />
          <Text className="text-xs mt-1 text-gray-700">Post Hustle</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center" activeOpacity={0.7}>
          <Ionicons name="list-outline" size={24} color="#FEA405" />
          <Text className="text-xs mt-1 text-gray-700">My Tasks</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
