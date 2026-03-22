import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import TextInput from '../ui/TextInput';

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
  const [tempDate, setTempDate] = useState(new Date(2000, 0, 1));
  const [dateInput, setDateInput] = useState('');

  useEffect(() => {
    if (dateOfBirth) {
      setTempDate(dateOfBirth);
      setDateInput(formatDateForInput(dateOfBirth));
    }
  }, [dateOfBirth]);

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleWebDateChange = (text: string) => {
    setDateInput(text);
    if (text) {
      const date = new Date(text);
      if (!isNaN(date.getTime())) {
        setDateOfBirth(date);
      }
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setDateOfBirth(selectedDate);
      }
    } else {
      // iOS - update temp date immediately as user scrolls
      if (selectedDate) {
        setTempDate(selectedDate);
      }
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
      
      <TextInput
        label="First Name"
        required
        placeholder="Juan"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
      />

      <TextInput
        label="Middle Name"
        placeholder="Santos"
        value={middleName}
        onChangeText={setMiddleName}
        autoCapitalize="words"
      />

      <TextInput
        label="Last Name"
        required
        placeholder="Dela Cruz"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
      />

      <TextInput
        label="Suffix"
        placeholder="Jr., Sr., III (optional)"
        value={suffix}
        onChangeText={setSuffix}
        autoCapitalize="characters"
      />

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
        {Platform.OS === 'web' ? (
          <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 relative">
            <input
              type="date"
              value={dateInput}
              onChange={(e: any) => handleWebDateChange(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '16px 0',
                fontSize: '16px',
                border: 'none',
                backgroundColor: 'transparent',
                outline: 'none',
                fontFamily: 'inherit',
                cursor: 'pointer',
                colorScheme: 'light'
              }}
            />
          </View>
        ) : (
          <TouchableOpacity
            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4"
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Text className={dateOfBirth ? 'text-base text-gray-800' : 'text-base text-gray-400'}>
              {dateOfBirth ? dateOfBirth.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Select date'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {Platform.OS === 'ios' && showDatePicker && (
        <Modal transparent animationType="slide" visible={showDatePicker} onRequestClose={() => setShowDatePicker(false)}>
          <View className="flex-1 justify-end">
            <TouchableOpacity className="flex-1 bg-black/50" activeOpacity={1} onPress={() => setShowDatePicker(false)} />
            <View className="bg-white rounded-t-3xl">
              <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text className="text-[#FEA405] text-base">Cancel</Text>
                </TouchableOpacity>
                <Text className="font-semibold text-base">Date of Birth</Text>
                <TouchableOpacity onPress={confirmIOSDate}>
                  <Text className="text-[#FEA405] text-base font-semibold">Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker value={tempDate} mode="date" display="spinner" onChange={handleDateChange} maximumDate={new Date()} />
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker value={tempDate} mode="date" display="default" onChange={handleDateChange} maximumDate={new Date()} />
      )}
    </View>
  );
}
