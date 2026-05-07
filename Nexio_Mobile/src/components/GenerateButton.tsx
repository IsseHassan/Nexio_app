import { Sparkles } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

interface Props {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function GenerateButton({ onPress, disabled, loading }: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={{ marginHorizontal: 16, paddingVertical: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: isDisabled ? 'rgba(215,135,106,0.4)' : '#E8664A' }}
    >
      {loading ? (
        <>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Generating...</Text>
        </>
      ) : (
        <>
          <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="#fff" />
          </View>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Generate Catalog</Text>
        </>
      )}
    </Pressable>
  );
}
