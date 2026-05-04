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
      className={`mx-4 py-4 rounded-xl flex-row items-center justify-center gap-2 ${
        isDisabled ? 'bg-indigo-600/40' : 'bg-indigo-600'
      }`}
    >
      {loading ? (
        <>
          <ActivityIndicator size="small" color="#fff" />
          <Text className="text-white font-bold text-base">Generating...</Text>
        </>
      ) : (
        <>
          <View className="w-5 h-5 items-center justify-center">
            <Sparkles size={18} color="#fff" />
          </View>
          <Text className="text-white font-bold text-base">Generate Catalog</Text>
        </>
      )}
    </Pressable>
  );
}
