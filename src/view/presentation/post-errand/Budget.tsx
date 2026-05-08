import TextInput from '../../components/TextInput';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function Budget({ value, onChange }: Props) {
  return (
    <TextInput
      label="Budget (₱)"
      required
      placeholder="e.g. 500"
      value={value}
      onChangeText={(v) => {
        const clean = v.replace(/[^0-9.]/g, '');
        const [int, ...rest] = clean.split('.');
        onChange(rest.length ? `${int}.${rest.join('')}` : clean);
      }}
      keyboardType="decimal-pad"
    />
  );
}
