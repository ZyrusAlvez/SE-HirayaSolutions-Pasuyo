import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { fetchProvinces, fetchCities, fetchBarangays, Province, City, Barangay } from '../../lib/psgc';
import AddressDropdown from './AddressDropdown';
import { toast } from 'burnt';

interface Step2Props {
  idNumber: string;
  setIdNumber: (value: string) => void;
  addressType: 'House' | 'Apartment' | 'Building';
  setAddressType: (value: 'House' | 'Apartment' | 'Building') => void;
  province: { code: string; name: string } | null;
  setProvince: (value: { code: string; name: string } | null) => void;
  city: { code: string; name: string } | null;
  setCity: (value: { code: string; name: string } | null) => void;
  barangay: { code: string; name: string } | null;
  setBarangay: (value: { code: string; name: string } | null) => void;
  houseNo: string;
  setHouseNo: (value: string) => void;
  street: string;
  setStreet: (value: string) => void;
  buildingName: string;
  setBuildingName: (value: string) => void;
  unitNo: string;
  setUnitNo: (value: string) => void;
  floor: string;
  setFloor: (value: string) => void;
  blockLot: string;
  setBlockLot: (value: string) => void;
  phase: string;
  setPhase: (value: string) => void;
}

export default function Step2(props: Step2Props) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

  useEffect(() => {
    loadProvinces();
  }, []);

  useEffect(() => {
    if (props.province) loadCities(props.province.code);
  }, [props.province]);

  useEffect(() => {
    if (props.city) loadBarangays(props.city.code);
  }, [props.city]);

  const loadProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const data = await fetchProvinces();
      setProvinces(data);
    } catch {
      toast({ title: 'Failed to load provinces', preset: 'error' });
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadCities = async (provinceCode: string) => {
    setLoadingCities(true);
    try {
      const data = await fetchCities(provinceCode);
      setCities(data);
    } catch {
      toast({ title: 'Failed to load cities', preset: 'error' });
    } finally {
      setLoadingCities(false);
    }
  };

  const loadBarangays = async (cityCode: string) => {
    setLoadingBarangays(true);
    try {
      const data = await fetchBarangays(cityCode);
      setBarangays(data);
    } catch {
      toast({ title: 'Failed to load barangays', preset: 'error' });
    } finally {
      setLoadingBarangays(false);
    }
  };

  const handleProvinceChange = (province: { code: string; name: string }) => {
    props.setProvince(province);
    props.setCity(null);
    props.setBarangay(null);
    setCities([]);
    setBarangays([]);
  };

  const handleCityChange = (city: { code: string; name: string }) => {
    props.setCity(city);
    props.setBarangay(null);
    setBarangays([]);
  };
  return (
    <View>
      <Text className="text-xl font-bold text-gray-800 mb-2">ID & Address</Text>
      <Text className="text-gray-600 mb-6">Enter your ID number and complete address</Text>
      
      <View className="mb-4">
        <Text className="text-xs text-gray-500 mb-1 ml-1">ID Number *</Text>
        <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4">
          <TextInput
            className="py-4 text-base"
            placeholder="1234-5678-9012"
            placeholderTextColor="#9CA3AF"
            value={props.idNumber}
            onChangeText={props.setIdNumber}
          />
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-xs text-gray-500 mb-1 ml-1">Address Type *</Text>
        <View className="flex-row gap-2">
          {(['House', 'Apartment', 'Building'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              className={`flex-1 py-3 rounded-2xl border ${
                props.addressType === type ? 'bg-[#FEA405] border-[#FEA405]' : 'bg-gray-50 border-gray-200'
              }`}
              onPress={() => props.setAddressType(type)}
              activeOpacity={0.7}
            >
              <Text className={`text-center font-medium ${
                props.addressType === type ? 'text-white' : 'text-gray-700'
              }`}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <AddressDropdown
        label="Province"
        placeholder="Select province"
        value={props.province}
        onSelect={handleProvinceChange}
        items={provinces}
        loading={loadingProvinces}
      />

      <AddressDropdown
        label="City/Municipality"
        placeholder="Select city"
        value={props.city}
        onSelect={handleCityChange}
        items={cities}
        loading={loadingCities}
        disabled={!props.province}
      />

      <AddressDropdown
        label="Barangay"
        placeholder="Select barangay"
        value={props.barangay}
        onSelect={props.setBarangay}
        items={barangays}
        loading={loadingBarangays}
        disabled={!props.city}
      />

      {props.addressType === 'House' && (
        <>
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1 ml-1">House No. *</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4">
              <TextInput
                className="py-4 text-base"
                placeholder="123"
                placeholderTextColor="#9CA3AF"
                value={props.houseNo}
                onChangeText={props.setHouseNo}
              />
            </View>
          </View>
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1 ml-1">Street *</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4">
              <TextInput
                className="py-4 text-base"
                placeholder="Main Street"
                placeholderTextColor="#9CA3AF"
                value={props.street}
                onChangeText={props.setStreet}
              />
            </View>
          </View>
        </>
      )}

      {props.addressType === 'Apartment' && (
        <>
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1 ml-1">Building Name *</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4">
              <TextInput
                className="py-4 text-base"
                placeholder="Sunrise Apartments"
                placeholderTextColor="#9CA3AF"
                value={props.buildingName}
                onChangeText={props.setBuildingName}
              />
            </View>
          </View>
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1 ml-1">Unit No. *</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4">
              <TextInput
                className="py-4 text-base"
                placeholder="Unit 101"
                placeholderTextColor="#9CA3AF"
                value={props.unitNo}
                onChangeText={props.setUnitNo}
              />
            </View>
          </View>
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1 ml-1">Floor</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4">
              <TextInput
                className="py-4 text-base"
                placeholder="1st Floor"
                placeholderTextColor="#9CA3AF"
                value={props.floor}
                onChangeText={props.setFloor}
              />
            </View>
          </View>
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1 ml-1">Block/Lot</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4">
              <TextInput
                className="py-4 text-base"
                placeholder="Block 1, Lot 2"
                placeholderTextColor="#9CA3AF"
                value={props.blockLot}
                onChangeText={props.setBlockLot}
              />
            </View>
          </View>
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1 ml-1">Phase</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4">
              <TextInput
                className="py-4 text-base"
                placeholder="Phase 1"
                placeholderTextColor="#9CA3AF"
                value={props.phase}
                onChangeText={props.setPhase}
              />
            </View>
          </View>
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1 ml-1">Street *</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4">
              <TextInput
                className="py-4 text-base"
                placeholder="Main Street"
                placeholderTextColor="#9CA3AF"
                value={props.street}
                onChangeText={props.setStreet}
              />
            </View>
          </View>
        </>
      )}

      {props.addressType === 'Building' && (
        <>
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1 ml-1">Building Name *</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4">
              <TextInput
                className="py-4 text-base"
                placeholder="Corporate Tower"
                placeholderTextColor="#9CA3AF"
                value={props.buildingName}
                onChangeText={props.setBuildingName}
              />
            </View>
          </View>
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1 ml-1">Floor *</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4">
              <TextInput
                className="py-4 text-base"
                placeholder="5th Floor"
                placeholderTextColor="#9CA3AF"
                value={props.floor}
                onChangeText={props.setFloor}
              />
            </View>
          </View>
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1 ml-1">Unit No. *</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4">
              <TextInput
                className="py-4 text-base"
                placeholder="Unit 501"
                placeholderTextColor="#9CA3AF"
                value={props.unitNo}
                onChangeText={props.setUnitNo}
              />
            </View>
          </View>
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1 ml-1">Block/Lot</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4">
              <TextInput
                className="py-4 text-base"
                placeholder="Block 1, Lot 2"
                placeholderTextColor="#9CA3AF"
                value={props.blockLot}
                onChangeText={props.setBlockLot}
              />
            </View>
          </View>
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1 ml-1">Phase</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4">
              <TextInput
                className="py-4 text-base"
                placeholder="Phase 1"
                placeholderTextColor="#9CA3AF"
                value={props.phase}
                onChangeText={props.setPhase}
              />
            </View>
          </View>
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1 ml-1">Street *</Text>
            <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4">
              <TextInput
                className="py-4 text-base"
                placeholder="Main Street"
                placeholderTextColor="#9CA3AF"
                value={props.street}
                onChangeText={props.setStreet}
              />
            </View>
          </View>
        </>
      )}
    </View>
  );
}
