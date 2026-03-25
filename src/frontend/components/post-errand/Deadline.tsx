import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  value: Date | null;
  onChange: (date: Date | null) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const ACCENT = '#FEA405';

function TimeInput({ value, min, max, onChange }: { value: string; min: number; max: number; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  const ref = useRef<any>(null);

  return (
    <TextInput
      ref={ref}
      style={{
        width: 64, height: 56, borderWidth: 1,
        borderColor: focused ? ACCENT : '#E5E7EB',
        borderRadius: 12, textAlign: 'center', fontSize: 22,
        fontWeight: '600', color: '#111827', backgroundColor: '#F9FAFB',
      }}
      value={focused ? undefined : value}
      defaultValue={value}
      keyboardType="number-pad"
      maxLength={2}
      onFocus={() => { setFocused(true); ref.current?.clear(); }}
      onBlur={() => setFocused(false)}
      onChangeText={(v) => {
        const n = parseInt(v.replace(/[^0-9]/g, ''));
        if (isNaN(n)) return;
        if (n >= min && n <= max) onChange(String(n).padStart(2, '0'));
      }}
      onEndEditing={(e) => {
        const n = parseInt(e.nativeEvent.text);
        if (isNaN(n) || n < min || n > max) onChange(value);
      }}
    />
  );
}

export default function Deadline({ value, onChange }: Props) {
  const today = new Date();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 48, 400);
  const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const [show, setShow] = useState(false);
  const [step, setStep] = useState<'date' | 'time'>('date');
  const [viewYear, setViewYear] = useState((value ?? today).getFullYear());
  const [viewMonth, setViewMonth] = useState((value ?? today).getMonth());
  const [selectedDay, setSelectedDay] = useState<{ y: number; m: number; d: number } | null>(
    value ? { y: value.getFullYear(), m: value.getMonth(), d: value.getDate() } : null
  );
  const [hour, setHour] = useState(value ? String(value.getHours() % 12 || 12).padStart(2, '0') : '12');
  const [minute, setMinute] = useState(value ? String(value.getMinutes()).padStart(2, '0') : '00');
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(value ? (value.getHours() >= 12 ? 'PM' : 'AM') : 'AM');
  const [noDeadline, setNoDeadline] = useState(false);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isDisabled = (day: number) => new Date(viewYear, viewMonth, day) < minDate;
  const isSelected = (day: number) => selectedDay?.y === viewYear && selectedDay?.m === viewMonth && selectedDay?.d === day;
  const isToday = (day: number) => today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  const handleDayPress = (day: number) => { setSelectedDay({ y: viewYear, m: viewMonth, d: day }); setStep('time'); };

  const handleConfirmTime = () => {
    if (!selectedDay) return;
    const h = parseInt(hour), m = parseInt(minute);
    if (isNaN(h) || isNaN(m)) return;
    const hours24 = ampm === 'PM' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
    onChange(new Date(selectedDay.y, selectedDay.m, selectedDay.d, hours24, m));
    setShow(false);
    setStep('date');
  };

  const handleOpen = () => {
    setStep('date');
    setViewYear((value ?? today).getFullYear());
    setViewMonth((value ?? today).getMonth());
    setShow(true);
  };

  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);
  while (cells.length % 7 !== 0) cells.push(null);

  const displayValue = value ? value.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : null;

  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-xs text-gray-500 ml-1">Deadline</Text>
        <TouchableOpacity
          onPress={() => { const next = !noDeadline; setNoDeadline(next); if (next) onChange(null); }}
          className="flex-row items-center"
          hitSlop={8}
        >
          <View style={{
            width: 16, height: 16, borderRadius: 4, borderWidth: 1.5,
            borderColor: noDeadline ? ACCENT : '#D1D5DB',
            backgroundColor: noDeadline ? ACCENT : 'transparent',
            alignItems: 'center', justifyContent: 'center', marginRight: 4,
          }}>
            {noDeadline && <Ionicons name="checkmark" size={10} color="#fff" />}
          </View>
          <Text className="text-xs text-gray-500">No deadline</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => !noDeadline && handleOpen()}
        className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center"
        style={{ opacity: noDeadline ? 0.4 : 1 }}
      >
        <Ionicons name="calendar-outline" size={18} color={ACCENT} />
        <Text className={`ml-2 text-base flex-1 ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {displayValue ?? 'Select deadline'}
        </Text>
        {value && (
          <TouchableOpacity onPress={() => onChange(null)} hitSlop={8}>
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
            {step === 'date' ? (
              <>
                <View className="flex-row items-center justify-between mb-4">
                  <TouchableOpacity onPress={prevMonth} className="p-1">
                    <Ionicons name="chevron-back" size={20} color="#374151" />
                  </TouchableOpacity>
                  <Text className="font-bold text-base text-gray-900">{MONTHS[viewMonth]} {viewYear}</Text>
                  <TouchableOpacity onPress={nextMonth} className="p-1">
                    <Ionicons name="chevron-forward" size={20} color="#374151" />
                  </TouchableOpacity>
                </View>

                <View className="flex-row mb-2">
                  {DAYS.map(d => (
                    <Text key={d} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#9CA3AF', fontWeight: '600' }}>{d}</Text>
                  ))}
                </View>

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
                          onPress={() => !disabled && handleDayPress(day)}
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
            ) : (
              <>
                <TouchableOpacity onPress={() => setStep('date')} className="flex-row items-center mb-4">
                  <Ionicons name="chevron-back" size={18} color="#374151" />
                  <Text className="text-sm text-gray-500 ml-1">
                    {selectedDay ? `${MONTHS[selectedDay.m]} ${selectedDay.d}, ${selectedDay.y}` : ''}
                  </Text>
                </TouchableOpacity>

                <Text className="font-bold text-base text-gray-900 mb-6 text-center">Set Time</Text>

                <View className="flex-row items-center justify-center mb-6" style={{ gap: 8 }}>
                  <TimeInput value={hour} min={1} max={12} onChange={setHour} />
                  <Text style={{ fontSize: 28, fontWeight: '700', color: '#9CA3AF', marginBottom: 2 }}>:</Text>
                  <TimeInput value={minute} min={0} max={59} onChange={setMinute} />
                  <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden', marginLeft: 4 }}>
                    {(['AM', 'PM'] as const).map((p) => (
                      <TouchableOpacity
                        key={p}
                        onPress={() => setAmpm(p)}
                        style={{ paddingHorizontal: 14, paddingVertical: 12, backgroundColor: ampm === p ? ACCENT : '#F9FAFB' }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: ampm === p ? '#fff' : '#6B7280' }}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity onPress={handleConfirmTime} className="rounded-2xl py-3 items-center" style={{ backgroundColor: ACCENT }}>
                  <Text className="text-white font-bold text-base">Confirm</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
