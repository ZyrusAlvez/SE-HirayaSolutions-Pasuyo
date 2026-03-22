import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Step1Props {
  firstName: string;
  setFirstName: (value: string) => void;
  middleName: string;
  setMiddleName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  suffix: string;
  setSuffix: (value: string) => void;
  gender: 'Male' | 'Female' | 'Prefer not' | '';
  setGender: (value: 'Male' | 'Female' | 'Prefer not') => void;
  dateOfBirth: Date | null;
  setDateOfBirth: (value: Date) => void;
}

export default function Step1({
  firstName, setFirstName, middleName, setMiddleName,
  lastName, setLastName, suffix, setSuffix,
  gender, setGender, dateOfBirth, setDateOfBirth
}: Step1Props) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(dateOfBirth || new Date(2000, 0, 1));

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setDateOfBirth(selectedDate);
      }
    } else {
      if (selectedDate) setTempDate(selectedDate);
    }
  };

  const confirmIOSDate = () => {
    setDateOfBirth(tempDate);
    setShowDatePicker(false);
  };

  return (
    <View>
      <Text className="text-xl font-bold text-gray-800 mb-2">Personal Information</Text>
      <Text className="text-gray-600 mb-6">Enter your details as they appear on your ID</Text>
      
      <View className="mb-4">
        <Text className="text-xs text-gray-500 mb-1 ml-1">First Name *</Text>
        <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4">
          <TextInput
            className="py-4 text-base"
            placeholder="Juan"
            placeholderTextColor="#9CA3AF"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-xs text-gray-500 mb-1 ml-1">Middle Name</Text>
        <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4">
          <TextInput
            className="py-4 text-base"
            placeholder="Santos"
            placeholderTextColor="#9CA3AF"
            value={middleName}
            onChangeText={setMiddleName}
            autoCapitalize="words"
          />
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-xs text-gray-500 mb-1 ml-1">Last Name *</Text>
        <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4">
          <TextInput
            className="py-4 text-base"
            placeholder="Dela Cruz"
            placeholderTextColor="#9CA3AF"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-xs text-gray-500 mb-1 ml-1">Suffix</Text>
        <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4">
          <TextInput
            className="py-4 text-base"
            placeholder="Jr., Sr., III (optional)"
            placeholderTextColor="#9CA3AF"
            value={suffix}
            onChangeText={setSuffix}
            autoCapitalize="characters"
          />
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-xs text-gray-500 mb-1 ml-1">Gender *</Text>
        <View className="flex-row gap-2">
          {(['Male', 'Female', 'Prefer not'] as const).map((g) => (
            <TouchableOpacity
              key={g}
              className={`flex-1 py-3 rounded-2xl border ${
                gender === g ? 'bg-[#FEA405] border-[#FEA405]' : 'bg-gray-50 border-gray-200'
              }`}
              onPress={() => setGender(g)}
              activeOpacity={0.7}
            >
              <Text className={`text-center font-medium ${
                gender === g ? 'text-white' : 'text-gray-700'
              }`}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-xs text-gray-500 mb-1 ml-1">Date of Birth *</Text>
        <TouchableOpacity
          className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center justify-between"
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
        >
          <Text className={dateOfBirth ? 'text-gray-800' : 'text-gray-400'}>
            {dateOfBirth ? dateOfBirth.toLocaleDateString() : 'Select date'}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {Platform.OS === 'ios' ? (
        <Modal visible={showDatePicker} transparent animationType="slide">
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl">
              <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text className="text-[#FEA405] text-base">Cancel</Text>
                </TouchableOpacity>
                <Text className="font-semibold text-gray-800">Select Date</Text>
                <TouchableOpacity onPress={confirmIOSDate}>
                  <Text className="text-[#FEA405] text-base font-semibold">Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            </View>
          </View>
        </Modal>
      ) : (
        showDatePicker && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )
      )}
    </View>
  );
}
