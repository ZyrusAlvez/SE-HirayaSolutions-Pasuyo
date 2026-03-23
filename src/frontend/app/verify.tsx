import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { toast } from '../lib/toast';
import Step1 from '../components/verify/Step1';
import Step2 from '../components/verify/Step2';
import Step3 from '../components/verify/Step3';
import Step4 from '../components/verify/Step4';
import SuccessScreen from '../components/verify/SuccessScreen';
import { supabase } from '../lib/supabase';
import { archiveCurrentFiles, uploadFile } from '../lib/verificationService';

export default function VerifyScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Prefer not' | ''>('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);

  const [addressType, setAddressType] = useState<'House' | 'Apartment' | 'Building'>('House');
  const [province, setProvince] = useState<{ code: string; name: string } | null>(null);
  const [city, setCity] = useState<{ code: string; name: string } | null>(null);
  const [barangay, setBarangay] = useState<{ code: string; name: string } | null>(null);
  const [houseNo, setHouseNo] = useState('');
  const [street, setStreet] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [unitNo, setUnitNo] = useState('');
  const [floor, setFloor] = useState('');
  const [blockLot, setBlockLot] = useState('');
  const [phase, setPhase] = useState('');

  const [utilityBillType, setUtilityBillType] = useState<'Water' | 'Electricity' | 'Internet' | ''>('');
  const [utilityBillFrontUri, setUtilityBillFrontUri] = useState<string | null>(null);
  const [utilityBillBackUri, setUtilityBillBackUri] = useState<string | null>(null);

  const [idType, setIdType] = useState('');
  const [idFrontUri, setIdFrontUri] = useState<string | null>(null);
  const [idBackUri, setIdBackUri] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const userId = user.id;

      // 1. Archive existing files
      await archiveCurrentFiles(userId);

      // 2. Upload new files
      const [utilityFrontUrl, utilityBackUrl, idFrontUrl, idBackUrl] = await Promise.all([
        uploadFile(utilityBillFrontUri!, `${userId}/current/utility-bill-front.jpg`),
        uploadFile(utilityBillBackUri!, `${userId}/current/utility-bill-back.jpg`),
        uploadFile(idFrontUri!, `${userId}/current/id-front.jpg`),
        uploadFile(idBackUri!, `${userId}/current/id-back.jpg`),
      ]);

      // 3. Upsert profile
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        suffix,
        gender,
        date_of_birth: dateOfBirth!.toISOString().split('T')[0],
        address_type: addressType,
        address_province: province!.name,
        address_city: city!.name,
        address_barangay: barangay!.name,
        address_street: street,
        address_house_no: houseNo,
        address_building: buildingName,
        address_unit: unitNo,
        address_floor: floor,
        address_block_lot: blockLot,
        address_phase_subdivision: phase,
        utility_bill_type: utilityBillType.toLowerCase(),
        utility_bill_front_url: utilityFrontUrl,
        utility_bill_back_url: utilityBackUrl,
        id_type: idType,
        id_front_url: idFrontUrl,
        id_back_url: idBackUrl,
        pending_verification: true,
        verified: false,
        verification_submitted_at: new Date().toISOString(),
      });
      if (profileError) throw new Error(`Failed to save profile: ${profileError.message}`);

      // 4. Update auth user metadata
      const { error: metaError } = await supabase.auth.updateUser({
        data: { name: `${firstName} ${lastName}` },
      });
      if (metaError) throw new Error(`Failed to update user metadata: ${metaError.message}`);

      setStep(5);
    } catch (err: any) {
      toast({ title: err.message ?? 'Submission failed. Please try again.', preset: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!firstName.trim()) { toast({ title: 'First name is required', preset: 'error' }); return; }
      if (!lastName.trim()) { toast({ title: 'Last name is required', preset: 'error' }); return; }
      if (!gender) { toast({ title: 'Gender is required', preset: 'error' }); return; }
      if (!dateOfBirth) { toast({ title: 'Date of birth is required', preset: 'error' }); return; }
    }
    if (step === 2) {
      if (!province) { toast({ title: 'Province is required', preset: 'error' }); return; }
      if (!city) { toast({ title: 'City is required', preset: 'error' }); return; }
      if (!barangay) { toast({ title: 'Barangay is required', preset: 'error' }); return; }
      if (addressType === 'House') {
        if (!houseNo.trim()) { toast({ title: 'House number is required', preset: 'error' }); return; }
        if (!street.trim()) { toast({ title: 'Street is required', preset: 'error' }); return; }
      }
      if (addressType === 'Apartment') {
        if (!buildingName.trim()) { toast({ title: 'Building name is required', preset: 'error' }); return; }
        if (!unitNo.trim()) { toast({ title: 'Unit number is required', preset: 'error' }); return; }
        if (!street.trim()) { toast({ title: 'Street is required', preset: 'error' }); return; }
      }
      if (addressType === 'Building') {
        if (!buildingName.trim()) { toast({ title: 'Building name is required', preset: 'error' }); return; }
        if (!floor.trim()) { toast({ title: 'Floor is required', preset: 'error' }); return; }
        if (!unitNo.trim()) { toast({ title: 'Unit number is required', preset: 'error' }); return; }
        if (!street.trim()) { toast({ title: 'Street is required', preset: 'error' }); return; }
      }
    }
    if (step === 3) {
      if (!utilityBillType) { toast({ title: 'Please select a bill type', preset: 'error' }); return; }
      if (!utilityBillFrontUri) { toast({ title: 'Front photo is required', preset: 'error' }); return; }
      if (!utilityBillBackUri) { toast({ title: 'Back photo is required', preset: 'error' }); return; }
    }
    if (step === 4) {
      if (!idType) { toast({ title: 'Please select an ID type', preset: 'error' }); return; }
      if (!idFrontUri) { toast({ title: 'Front photo is required', preset: 'error' }); return; }
      if (!idBackUri) { toast({ title: 'Back photo is required', preset: 'error' }); return; }
      handleSubmit();
      return;
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 1) router.back();
    else setStep(step - 1);
  };

  const { width } = useWindowDimensions();
  const isLarge = width >= 768;
  const contentWidth = isLarge ? Math.min(width * 0.55, 640) : undefined;

  if (step === 5) return <SuccessScreen />

  return (
    <View className="flex-1 bg-white">
      <View style={{ backgroundColor: '#FEA405', paddingTop: 48, paddingBottom: 24, paddingHorizontal: 24 }}>
        <View style={{ width: contentWidth, alignSelf: isLarge ? 'center' : undefined }}>
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={handleBack} className="mr-3" disabled={submitting}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold">Verify Account</Text>
          </View>
          <View className="flex-row justify-between">
            {[1, 2, 3, 4].map((s) => (
              <View key={s} className={`h-1 flex-1 mx-1 rounded ${s <= step ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ alignItems: isLarge ? 'center' : undefined, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16 }}>
        <View style={{ width: contentWidth ?? '100%' }}>
          {step === 1 && (
            <Step1
              firstName={firstName} setFirstName={setFirstName}
              middleName={middleName} setMiddleName={setMiddleName}
              lastName={lastName} setLastName={setLastName}
              suffix={suffix} setSuffix={setSuffix}
              gender={gender} setGender={setGender}
              dateOfBirth={dateOfBirth} setDateOfBirth={setDateOfBirth}
            />
          )}
          {step === 2 && (
            <Step2
              addressType={addressType} setAddressType={setAddressType}
              province={province} setProvince={setProvince}
              city={city} setCity={setCity}
              barangay={barangay} setBarangay={setBarangay}
              houseNo={houseNo} setHouseNo={setHouseNo}
              street={street} setStreet={setStreet}
              buildingName={buildingName} setBuildingName={setBuildingName}
              unitNo={unitNo} setUnitNo={setUnitNo}
              floor={floor} setFloor={setFloor}
              blockLot={blockLot} setBlockLot={setBlockLot}
              phase={phase} setPhase={setPhase}
            />
          )}
          {step === 3 && (
            <Step3
              utilityBillType={utilityBillType} setUtilityBillType={setUtilityBillType}
              utilityBillFrontUri={utilityBillFrontUri} setUtilityBillFrontUri={setUtilityBillFrontUri}
              utilityBillBackUri={utilityBillBackUri} setUtilityBillBackUri={setUtilityBillBackUri}
            />
          )}
          {step === 4 && (
            <Step4
              idType={idType} setIdType={setIdType}
              idFrontUri={idFrontUri} setIdFrontUri={setIdFrontUri}
              idBackUri={idBackUri} setIdBackUri={setIdBackUri}
            />
          )}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16, alignItems: isLarge ? 'center' : undefined }}>
        <View style={{ width: contentWidth ?? '100%' }}>
          <TouchableOpacity
            className={`py-4 rounded-2xl items-center ${submitting ? 'bg-[#FEA405]/60' : 'bg-[#FEA405]'}`}
            onPress={handleNext}
            activeOpacity={0.8}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-semibold">
                {step === 4 ? 'Submit' : 'Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
