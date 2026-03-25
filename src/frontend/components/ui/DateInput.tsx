import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  label?: string;
  required?: boolean;
  value: Date | null;
  onChange: (date: Date) => void;
  maxDate?: Date;
  minDate?: Date;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const ACCENT = '#FEA405';

export default function DateInput({ label, required, value, onChange, maxDate, minDate }: Props) {
  const today = new Date();
  const max = maxDate ?? today;
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 48, 360);

  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<'calendar' | 'year'>('calendar');
  const [viewYear, setViewYear] = useState((value ?? max).getFullYear());
  const [viewMonth, setViewMonth] = useState((value ?? max).getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);
  while (cells.length % 7 !== 0) cells.push(null);

  const isDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    if (minDate && d < minDate) return true;
    if (d > max) return true;
    return false;
  };
  const isSelected = (day: number) =>
    !!value && value.getFullYear() === viewYear && value.getMonth() === viewMonth && value.getDate() === day;
  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDayPress = (day: number) => {
    if (isDisabled(day)) return;
    onChange(new Date(viewYear, viewMonth, day));
    setShow(false);
  };

  const handleOpen = () => {
    setMode('calendar');
    setViewYear((value ?? max).getFullYear());
    setViewMonth((value ?? max).getMonth());
    setShow(true);
  };

  const displayValue = value
    ? value.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  // Year range: 120 years back to max year
  const maxYear = max.getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => maxYear - i);

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-xs text-gray-500 mb-1 ml-1">
          {label}{required && ' *'}
        </Text>
      )}

      <TouchableOpacity
        onPress={handleOpen}
        className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center"
        activeOpacity={0.7}
      >
        <Ionicons name="calendar-outline" size={18} color={ACCENT} />
        <Text className={`ml-2 text-base flex-1 ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {displayValue ?? 'Select date'}
        </Text>
        {value && (
          <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); onChange(null as any); }} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <Modal visible={show} transparent animationType="fade" onRequestClose={() => setShow(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setShow(false)}
        >
          <TouchableOpacity activeOpacity={1} style={{ width: cardWidth, backgroundColor: '#fff', borderRadius: 20, padding: 20 }}>
            {mode === 'year' ? (
              <>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="font-bold text-base text-gray-900">Select Year</Text>
                  <TouchableOpacity onPress={() => setMode('calendar')}>
                    <Ionicons name="close" size={20} color="#374151" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
                  {years.map((y) => (
                    <TouchableOpacity
                      key={y}
                      onPress={() => { setViewYear(y); setMode('calendar'); }}
                      style={{ paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, backgroundColor: y === viewYear ? ACCENT : 'transparent', marginBottom: 2 }}
                    >
                      <Text style={{ textAlign: 'center', fontWeight: y === viewYear ? '700' : '400', color: y === viewYear ? '#fff' : '#111827', fontSize: 15 }}>
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              <>
                {/* Header */}
                <View className="flex-row items-center justify-between mb-4">
                  <TouchableOpacity onPress={prevMonth} className="p-1">
                    <Ionicons name="chevron-back" size={20} color="#374151" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setMode('year')} className="flex-row items-center" style={{ gap: 4 }}>
                    <Text className="font-bold text-base text-gray-900">{MONTHS[viewMonth]} {viewYear}</Text>
                    <Ionicons name="chevron-down" size={14} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={nextMonth} className="p-1">
                    <Ionicons name="chevron-forward" size={20} color="#374151" />
                  </TouchableOpacity>
                </View>

                {/* Day labels */}
                <View className="flex-row mb-2">
                  {DAYS.map(d => (
                    <Text key={d} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#9CA3AF', fontWeight: '600' }}>{d}</Text>
                  ))}
                </View>

                {/* Calendar grid */}
                {Array.from({ length: cells.length / 7 }, (_, row) => (
                  <View key={row} className="flex-row mb-1">
                    {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
                      if (!day) return <View key={col} style={{ flex: 1 }} />;
                      const disabled = isDisabled(day);
                      const selected = isSelected(day);
                      const todayCell = isToday(day);
                      return (
                        <TouchableOpacity
                          key={col}
                          onPress={() => handleDayPress(day)}
                          disabled={disabled}
                          style={{ flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 100, backgroundColor: selected ? ACCENT : 'transparent' }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: todayCell ? '700' : '400', color: selected ? '#fff' : disabled ? '#D1D5DB' : todayCell ? ACCENT : '#111827' }}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
