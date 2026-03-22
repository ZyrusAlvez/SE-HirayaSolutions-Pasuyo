import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { fetchProvinces, fetchCities, fetchBarangays, Province, City, Barangay } from '../../lib/psgc';
import AddressDropdown from './AddressDropdown';
import { toast } from 'burnt';
import TextInput from '../ui/TextInput';

interface Step2Props {
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
      <Text className="text-xl font-bold text-gray-800 mb-2">Address</Text>
      <Text className="text-gray-600 mb-6">Enter your complete address</Text>

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
          <TextInput
            label="House No."
            required
            placeholder="123"
            value={props.houseNo}
            onChangeText={props.setHouseNo}
          />
          <TextInput
            label="Street"
            required
            placeholder="Main Street"
            value={props.street}
            onChangeText={props.setStreet}
          />
        </>
      )}

      {props.addressType === 'Apartment' && (
        <>
          <TextInput
            label="Building Name"
            required
            placeholder="Sunrise Apartments"
            value={props.buildingName}
            onChangeText={props.setBuildingName}
          />
          <TextInput
            label="Unit No."
            required
            placeholder="Unit 101"
            value={props.unitNo}
            onChangeText={props.setUnitNo}
          />
          <TextInput
            label="Floor"
            placeholder="1st Floor"
            value={props.floor}
            onChangeText={props.setFloor}
          />
          <TextInput
            label="Block/Lot"
            placeholder="Block 1, Lot 2"
            value={props.blockLot}
            onChangeText={props.setBlockLot}
          />
          <TextInput
            label="Phase"
            placeholder="Phase 1"
            value={props.phase}
            onChangeText={props.setPhase}
          />
          <TextInput
            label="Street"
            required
            placeholder="Main Street"
            value={props.street}
            onChangeText={props.setStreet}
          />
        </>
      )}

      {props.addressType === 'Building' && (
        <>
          <TextInput
            label="Building Name"
            required
            placeholder="Corporate Tower"
            value={props.buildingName}
            onChangeText={props.setBuildingName}
          />
          <TextInput
            label="Floor"
            required
            placeholder="5th Floor"
            value={props.floor}
            onChangeText={props.setFloor}
          />
          <TextInput
            label="Unit No."
            required
            placeholder="Unit 501"
            value={props.unitNo}
            onChangeText={props.setUnitNo}
          />
          <TextInput
            label="Block/Lot"
            placeholder="Block 1, Lot 2"
            value={props.blockLot}
            onChangeText={props.setBlockLot}
          />
          <TextInput
            label="Phase"
            placeholder="Phase 1"
            value={props.phase}
            onChangeText={props.setPhase}
          />
          <TextInput
            label="Street"
            required
            placeholder="Main Street"
            value={props.street}
            onChangeText={props.setStreet}
          />
        </>
      )}
    </View>
  );
}
