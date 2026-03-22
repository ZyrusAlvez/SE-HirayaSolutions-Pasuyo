import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { toast } from 'burnt';
import Step1 from '../components/verify/Step1';
import Step2 from '../components/verify/Step2';
import Step3 from '../components/verify/Step3';
import Step4 from '../components/verify/Step4';
import SuccessScreen from '../components/verify/SuccessScreen';

export default function VerifyScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Prefer not' | ''>('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [idNumber, setIdNumber] = useState('');
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
  const [idImage, setIdImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);

  const handleNext = () => {
    if (step === 1) {
      if (!firstName.trim()) {
        toast({ title: 'First name is required', preset: 'error' });
        return;
      }
      if (!lastName.trim()) {
        toast({ title: 'Last name is required', preset: 'error' });
        return;
      }
      if (!gender) {
        toast({ title: 'Gender is required', preset: 'error' });
        return;
      }
      if (!dateOfBirth) {
        toast({ title: 'Date of birth is required', preset: 'error' });
        return;
      }
    }
    if (step === 2) {
      if (!idNumber.trim()) {
        toast({ title: 'ID number is required', preset: 'error' });
        return;
      }
      if (!province) {
        toast({ title: 'Province is required', preset: 'error' });
        return;
      }
      if (!city) {
        toast({ title: 'City is required', preset: 'error' });
        return;
      }
      if (!barangay) {
        toast({ title: 'Barangay is required', preset: 'error' });
        return;
      }
      if (addressType === 'House') {
        if (!houseNo.trim()) {
          toast({ title: 'House number is required', preset: 'error' });
          return;
        }
        if (!street.trim()) {
          toast({ title: 'Street is required', preset: 'error' });
          return;
        }
      }
      if (addressType === 'Apartment') {
        if (!buildingName.trim()) {
          toast({ title: 'Building name is required', preset: 'error' });
          return;
        }
        if (!unitNo.trim()) {
          toast({ title: 'Unit number is required', preset: 'error' });
          return;
        }
        if (!street.trim()) {
          toast({ title: 'Street is required', preset: 'error' });
          return;
        }
      }
      if (addressType === 'Building') {
        if (!buildingName.trim()) {
          toast({ title: 'Building name is required', preset: 'error' });
          return;
        }
        if (!floor.trim()) {
          toast({ title: 'Floor is required', preset: 'error' });
          return;
        }
        if (!unitNo.trim()) {
          toast({ title: 'Unit number is required', preset: 'error' });
          return;
        }
        if (!street.trim()) {
          toast({ title: 'Street is required', preset: 'error' });
          return;
        }
      }
    }
    if (step === 3 && !idImage) {
      toast({ title: 'ID photo is required', preset: 'error' });
      return;
    }
    if (step === 4 && !selfieImage) {
      toast({ title: 'Selfie is required', preset: 'error' });
      return;
    }

    if (step < 4) setStep(step + 1);
    else setStep(5);
  };

  const handleBack = () => {
    if (step === 1) router.back();
    else if (step === 5) return;
    else setStep(step - 1);
  };

  if (step === 5) return <SuccessScreen />;

  return (
    <View className="flex-1 bg-white">
      <View className="bg-[#FEA405] pt-12 pb-6 px-6">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={handleBack} className="mr-3">
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

      <ScrollView className="flex-1 px-6 pt-8">
        {step === 1 && (
          <Step1
            firstName={firstName}
            setFirstName={setFirstName}
            middleName={middleName}
            setMiddleName={setMiddleName}
            lastName={lastName}
            setLastName={setLastName}
            suffix={suffix}
            setSuffix={setSuffix}
            gender={gender}
            setGender={setGender}
            dateOfBirth={dateOfBirth}
            setDateOfBirth={setDateOfBirth}
          />
        )}

        {step === 2 && (
          <Step2
            idNumber={idNumber}
            setIdNumber={setIdNumber}
            addressType={addressType}
            setAddressType={setAddressType}
            province={province}
            setProvince={setProvince}
            city={city}
            setCity={setCity}
            barangay={barangay}
            setBarangay={setBarangay}
            houseNo={houseNo}
            setHouseNo={setHouseNo}
            street={street}
            setStreet={setStreet}
            buildingName={buildingName}
            setBuildingName={setBuildingName}
            unitNo={unitNo}
            setUnitNo={setUnitNo}
            floor={floor}
            setFloor={setFloor}
            blockLot={blockLot}
            setBlockLot={setBlockLot}
            phase={phase}
            setPhase={setPhase}
          />
        )}

        {step === 3 && <Step3 idImage={idImage} setIdImage={setIdImage} />}

        {step === 4 && <Step4 selfieImage={selfieImage} setSelfieImage={setSelfieImage} />}
      </ScrollView>

      <View className="px-6 pb-8 pt-4">
        <TouchableOpacity
          className="bg-[#FEA405] py-4 rounded-2xl"
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text className="text-white text-base font-semibold text-center">
            {step === 4 ? 'Submit' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
