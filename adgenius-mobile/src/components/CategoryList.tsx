import { Gem, Package, Shirt, Smartphone, Sofa } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CATEGORIES, CategoryType } from '../constants';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Sofa,
  Gem,
  Smartphone,
  Shirt,
  Package,
};

interface Props {
  selected: CategoryType;
  onSelect: (cat: CategoryType) => void;
}

export function CategoryList({ selected, onSelect }: Props) {
  return (
    <View>
      <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3 px-4">
        Product Category
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4 gap-2"
      >
        {CATEGORIES.map((cat) => {
          const Icon = ICON_MAP[cat.icon] ?? Package;
          const isActive = selected === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => onSelect(cat.id)}
              className={`flex-row items-center gap-2 px-4 py-2.5 rounded-xl border ${
                isActive
                  ? 'bg-indigo-600 border-indigo-500'
                  : 'bg-zinc-800/60 border-zinc-700'
              }`}
            >
              <Icon size={15} color={isActive ? '#fff' : '#a1a1aa'} />
              <Text
                className={`text-sm font-medium ${isActive ? 'text-white' : 'text-zinc-400'}`}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
