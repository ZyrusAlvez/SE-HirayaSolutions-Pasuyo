import TextInput from '../../components/TextInput';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function AddressDetails({ value, onChange }: Props) {
  return (
    <TextInput
      label="Additional Address Info"
      placeholder="e.g. Unit 4B, 2nd floor, near the blue gate"
      value={value}
      onChangeText={onChange}
    />
  );
}
