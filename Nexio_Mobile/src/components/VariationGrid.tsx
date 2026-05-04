import { View } from 'react-native';
import { AdVariation } from '../constants';
import { VariationCard } from './VariationCard';

interface Props {
  variations: AdVariation[];
  onPreview: (variation: AdVariation) => void;
}

export function VariationGrid({ variations, onPreview }: Props) {
  const rows: AdVariation[][] = [];
  for (let i = 0; i < variations.length; i += 2) {
    rows.push(variations.slice(i, i + 2));
  }

  return (
    <View>
      {rows.map((pair, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: 'row' }}>
          {pair.map(v => (
            <VariationCard key={v.id} variation={v} onPreview={onPreview} />
          ))}
          {pair.length === 1 && <View style={{ flex: 1, margin: 6 }} />}
        </View>
      ))}
      <View style={{ height: 24 }} />
    </View>
  );
}
