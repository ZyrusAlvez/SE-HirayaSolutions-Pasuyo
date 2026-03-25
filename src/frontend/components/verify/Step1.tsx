import { View, Text, TouchableOpacity } from 'react-native';
import TextInput from '../ui/TextInput';
import DateInput from '../ui/DateInput';

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

      <DateInput
        label="Date of Birth"
        required
        value={dateOfBirth}
        onChange={setDateOfBirth}
        maxDate={new Date()}
      />
    </View>
  );
}
