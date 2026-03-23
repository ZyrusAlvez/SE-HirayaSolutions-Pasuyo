import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DatePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minimumDate?: Date;
  placeholder?: string;
}

export default function DatePicker({ label, value, onChange, minimumDate, placeholder = 'Select date' }: DatePickerProps) {
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIos, setShowIos] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const displayValue = value
    ? value.toLocaleDateString('en-PH', { dateStyle: 'medium' })
    : placeholder;

  const handlePress = () => {
    setTempDate(value ?? new Date());
    if (Platform.OS === 'ios') setShowIos(true);
    else setShowAndroid(true);
  };

  return (
    <View className="mb-4">
      {label && <Text className="text-xs text-gray-500 mb-1 ml-1">{label}</Text>}

      {Platform.OS === 'web' ? (
        <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 flex-row items-center">
          <Ionicons name="calendar-outline" size={18} color="#FEA405" />
          <input
            type="date"
            min={minimumDate ? minimumDate.toISOString().split('T')[0] : undefined}
            value={value ? value.toISOString().split('T')[0] : ''}
            onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
            style={{
              flex: 1,
              marginLeft: 8,
              paddingTop: 16,
              paddingBottom: 16,
              border: 'none',
              outline: 'none',
              fontSize: 16,
              color: value ? '#111827' : '#9CA3AF',
              background: 'transparent',
            }}
          />
        </View>
      ) : (
        <TouchableOpacity
          onPress={handlePress}
          className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center"
        >
          <Ionicons name="calendar-outline" size={18} color="#FEA405" />
          <Text className={`ml-2 text-base ${value ? 'text-gray-900' : 'text-gray-400'}`}>
            {displayValue}
          </Text>
        </TouchableOpacity>
      )}

      {/* Android */}
      {Platform.OS === 'android' && showAndroid && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          minimumDate={minimumDate}
          onChange={(_, date) => {
            setShowAndroid(false);
            if (date) onChange(date);
          }}
        />
      )}

      {/* iOS bottom sheet */}
      {Platform.OS === 'ios' && (
        <Modal visible={showIos} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <View className="bg-white rounded-t-2xl px-4 pt-4 pb-8">
              <View className="flex-row justify-between items-center mb-2">
                <TouchableOpacity onPress={() => setShowIos(false)}>
                  <Text className="text-gray-500 text-base">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { onChange(tempDate); setShowIos(false); }}>
                  <Text className="font-bold text-base text-[#FEA405]">Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                minimumDate={minimumDate}
                onChange={(_, date) => { if (date) setTempDate(date); }}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
