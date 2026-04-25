import { Text, TextStyle } from 'react-native';

interface Props {
  text: string;
  query: string;
  style?: TextStyle;
  highlightColor?: string;
  numberOfLines?: number;
}

export default function HighlightText({ text, query, style, highlightColor = '#FEA405', numberOfLines }: Props) {
  if (!query.trim()) return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;

  const parts: { text: string; match: boolean }[] = [];
  const lower = text.toLowerCase();
  const q = query.trim().toLowerCase();
  let cursor = 0;

  while (cursor < text.length) {
    const idx = lower.indexOf(q, cursor);
    if (idx === -1) {
      parts.push({ text: text.slice(cursor), match: false });
      break;
    }
    if (idx > cursor) parts.push({ text: text.slice(cursor, idx), match: false });
    parts.push({ text: text.slice(idx, idx + q.length), match: true });
    cursor = idx + q.length;
  }

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((p, i) =>
        p.match ? <Text key={i} style={{ backgroundColor: highlightColor + '33', color: highlightColor, fontWeight: '700' }}>{p.text}</Text> : p.text
      )}
    </Text>
  );
}
