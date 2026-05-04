import * as Haptics from 'expo-haptics';
import { generateAdImage } from '../services/aiService';
import { useAdStore } from '../store/adStore';
import { CategoryType, getVariationsForCategory } from '../constants';

export function useAdGeneration() {
  const { pickedImage, selectedCategory, setVariations, updateVariation, setIsGenerating } =
    useAdStore();

  async function startGeneration(overrideCategory?: CategoryType) {
    if (!pickedImage) return;

    const category = overrideCategory ?? selectedCategory;
    const templates = getVariationsForCategory(category);

    const initial = templates.map((t, i) => ({
      ...t,
      id: `variation-${i}`,
      status: 'generating' as const,
    }));
    setVariations(initial);
    setIsGenerating(true);

    for (const variation of initial) {
      try {
        const imageUrl = await generateAdImage(
          pickedImage.base64,
          pickedImage.mimeType,
          variation.prompt
        );
        updateVariation(variation.id, { status: 'completed', imageUrl });
      } catch {
        updateVariation(variation.id, { status: 'error' });
      }
    }

    setIsGenerating(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  return { startGeneration };
}
