import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useProfile } from '@/context/ProfileContext';
import Header from '@/view/components/Header';
import { submitServiceFeePayment, getUnpaidServiceFeeTotal } from '@/controllers/serviceFeeController';
import { toast } from '@/utils/toast';

export default function PayServiceFeeScreen() {
  const router = useRouter();
  const { avatarUrl, verificationStatus } = useProfile();
  const [loading, setLoading] = useState(true);
  const [unpaidTotal, setUnpaidTotal] = useState(0);
  const [referenceNo, setReferenceNo] = useState('');
  const [amountSent, setAmountSent] = useState('');
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refError, setRefError] = useState('');
  const [amountError, setAmountError] = useState('');

  useFocusEffect(useCallback(() => {
    setLoading(true);
    getUnpaidServiceFeeTotal().then((result) => {
      if (result.success) setUnpaidTotal(result.data);
      setLoading(false);
    });
  }, []));

  const totalFees = unpaidTotal;

  const validateRef = (value: string) => {
    setReferenceNo(value);
    const digits = value.replace(/\s/g, '');
    if (digits.length > 0 && digits.length < 6) {
      setRefError('Must be at least 6 digits');
    } else if (digits.length > 0 && !/^\d+$/.test(digits)) {
      setRefError('Digits only');
    } else {
      setRefError('');
    }
  };

  const validateAmount = (value: string) => {
    setAmountSent(value);
    if (value && isNaN(Number(value))) {
      setAmountError('Enter a valid number');
    } else {
      setAmountError('');
    }
  };

  const pickScreenshot = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setScreenshotUri(result.assets[0].uri);
    }
  };

  const canSubmit = referenceNo.replace(/\s/g, '').length >= 6 && /^\d+$/.test(referenceNo.replace(/\s/g, '')) && amountSent.trim().length > 0 && !isNaN(Number(amountSent)) && screenshotUri !== null && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !screenshotUri) return;
    setSubmitting(true);
    const result = await submitServiceFeePayment(referenceNo, amountSent, screenshotUri);
    setSubmitting(false);
    if (result.success) {
      toast({ title: 'Payment submitted! Awaiting admin verification.', preset: 'done' });
      router.back();
    } else {
      toast({ title: result.error, preset: 'error' });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <Header avatarUrl={avatarUrl} verificationStatus={verificationStatus} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 }}>
          <Ionicons name="arrow-back" size={18} color="#6B7280" />
          <Text style={{ fontSize: 13, color: '#6B7280' }}>Back</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 }}>Pay Service Fee</Text>
        <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Complete your payment via GCash to continue accepting errands.</Text>

        {/* Amount card */}
        <View style={{ backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
          <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>Amount to Pay</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#6B7280" />
          ) : (
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#111827' }}>₱{totalFees.toLocaleString()}</Text>
          )}
        </View>

        {/* GCash details */}
        <View style={{ backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 12 }}>Send payment to</Text>
          <View style={{ backgroundColor: '#F0F9FF', borderRadius: 10, padding: 12, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>GCash Number</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>09936620701</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>Account Name</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>ZY**S A.</Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={{ backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14, marginBottom: 20, gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#92400E' }}>Instructions</Text>
          <Text style={{ fontSize: 12, color: '#92400E', lineHeight: 18 }}>1. Open your GCash app and send the exact amount shown above.</Text>
          <Text style={{ fontSize: 12, color: '#92400E', lineHeight: 18 }}>2. After sending, note the last 6 digits (or full reference number) from your receipt.</Text>
          <Text style={{ fontSize: 12, color: '#92400E', lineHeight: 18 }}>3. Take a screenshot of the payment confirmation.</Text>
          <Text style={{ fontSize: 12, color: '#92400E', lineHeight: 18 }}>4. Fill in the form below and submit.</Text>
        </View>

        {/* Form */}
        <View style={{ gap: 16 }}>
          {/* Amount sent */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Amount Sent (₱)</Text>
            <TextInput
              value={amountSent}
              onChangeText={validateAmount}
              placeholder={`e.g. ${totalFees}`}
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              style={{ backgroundColor: 'white', borderWidth: 1, borderColor: amountError ? '#EF4444' : '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827' }}
            />
            {amountError ? <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{amountError}</Text> : null}
          </View>

          {/* Reference number */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>GCash Reference Number (last 6 digits or full)</Text>
            <TextInput
              value={referenceNo}
              onChangeText={validateRef}
              placeholder="e.g. 567890"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={20}
              style={{ backgroundColor: 'white', borderWidth: 1, borderColor: refError ? '#EF4444' : '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827' }}
            />
            {refError ? <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{refError}</Text> : null}
          </View>

          {/* Screenshot */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Payment Screenshot</Text>
            {screenshotUri ? (
              <View style={{ position: 'relative' }}>
                <Image source={{ uri: screenshotUri }} style={{ width: '100%', height: 200, borderRadius: 10 }} resizeMode="cover" />
                <TouchableOpacity
                  onPress={() => setScreenshotUri(null)}
                  activeOpacity={0.7}
                  style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={pickScreenshot}
                activeOpacity={0.7}
                style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 10, padding: 24, alignItems: 'center', gap: 6 }}
              >
                <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                <Text style={{ fontSize: 12, color: '#6B7280' }}>Tap to upload screenshot</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Warnings */}
        <View style={{ backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, marginTop: 20, gap: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#991B1B' }}>Important</Text>
          <Text style={{ fontSize: 11, color: '#991B1B', lineHeight: 16 }}>• Send the exact amount. Overpayments or underpayments may delay verification.</Text>
          <Text style={{ fontSize: 11, color: '#991B1B', lineHeight: 16 }}>• If the amount you entered does not match the actual amount sent, your payment will be rejected.</Text>
          <Text style={{ fontSize: 11, color: '#991B1B', lineHeight: 16 }}>• Do not edit or crop the screenshot. It must clearly show the amount, reference number, and recipient.</Text>
          <Text style={{ fontSize: 11, color: '#991B1B', lineHeight: 16 }}>• Submitting fake or invalid proof will result in account suspension.</Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.7}
          testID="submit-payment-btn"
          style={{ marginTop: 24, backgroundColor: canSubmit ? '#34D399' : '#D1D5DB', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Submit Payment</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
