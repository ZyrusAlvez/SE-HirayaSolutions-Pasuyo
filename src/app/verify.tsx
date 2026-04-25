import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { toast } from '../utils/toast';
import { getVerifyStepError, postVerification, VerifyFormState } from '../controllers/profileController';
import Step1 from '../view/presentation/verify/Step1';
import Step2 from '../view/presentation/verify/Step2';
import Step3 from '../view/presentation/verify/Step3';
import Step4 from '../view/presentation/verify/Step4';
import SuccessScreen from '../view/presentation/verify/SuccessScreen';

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

  const formState: VerifyFormState = {
    firstName, middleName, lastName, suffix, gender,
    dateOfBirth, addressType, province, city, barangay,
    houseNo, street, buildingName, unitNo, floor, blockLot, phase,
    utilityBillType, utilityBillFrontUri, utilityBillBackUri,
    idType, idFrontUri, idBackUri,
  };

  const handleNext = async () => {
    const error = getVerifyStepError(step, formState);
    if (error) { toast({ title: error, preset: 'error' }); return; }

    if (step === 4) {
      setSubmitting(true);
      const result = await postVerification(formState);
      setSubmitting(false);
      if (!result.success) { toast({ title: result.error, preset: 'error' }); return; }
      setStep(5);
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

  if (step === 5) return <SuccessScreen />;

  return (
    <View className="flex-1 bg-white">
      <View style={{ backgroundColor: '#FEA405', paddingTop: Platform.OS === 'web' ? 24 : 48, paddingBottom: 24, paddingHorizontal: 24 }}>
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

      <View style={{ paddingHorizontal: 24, paddingBottom: Platform.OS === 'web' ? 16 : 32, paddingTop: 16, alignItems: isLarge ? 'center' : undefined }}>
        <View style={{ width: contentWidth ?? '100%' }}>
          <TouchableOpacity
            testID="verify-next-btn"
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
