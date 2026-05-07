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
      <Text style={{ color: '#7A7A7A', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, paddingHorizontal: 16 }}>
        Product Category
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}
      >
        {CATEGORIES.map((cat) => {
          const Icon = ICON_MAP[cat.icon] ?? Package;
          const isActive = selected === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => onSelect(cat.id)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, backgroundColor: isActive ? '#E8664A' : '#F6F2EE', borderColor: isActive ? '#E8664A' : '#CFCBC7' }}
            >
              <Icon size={15} color={isActive ? '#fff' : '#7A7A7A'} />
              <Text style={{ fontSize: 14, fontWeight: '500', color: isActive ? '#fff' : '#7A7A7A' }}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
