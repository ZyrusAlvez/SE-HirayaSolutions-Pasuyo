import TextInput from '../../components/TextInput';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function Budget({ value, onChange }: Props) {
  return (
    <TextInput
      label="Budget (₱)"
      placeholder="e.g. 500"
      value={value}
      onChangeText={(v) => onChange(v.replace(/[^0-9.]/g, ''))}
      keyboardType="decimal-pad"
    />
  );
}
