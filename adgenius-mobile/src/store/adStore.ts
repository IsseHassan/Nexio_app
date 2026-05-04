import { create } from 'zustand';
import { AdVariation, CategoryType } from '../constants';
import type { ListingResult, Language, Tone, ListingLength } from '../services/listingService';
import type { VariationScore } from '../services/scoringService';

export interface PickedImage {
  base64: string;
  mimeType: string;
  uri: string;
}

interface AdStore {
  pickedImage: PickedImage | null;
  selectedCategory: CategoryType;
  variations: AdVariation[];
  isGenerating: boolean;

  // Listing
  listingResult: ListingResult | null;
  listingLanguage: Language;
  listingTone: Tone;
  listingLength: ListingLength;

  // Scoring
  imageScores: Record<string, VariationScore> | null;
  overallBestType: string | null;

  setPickedImage: (img: PickedImage | null) => void;
  setCategory: (cat: CategoryType) => void;
  setVariations: (v: AdVariation[]) => void;
  updateVariation: (id: string, patch: Partial<AdVariation>) => void;
  setIsGenerating: (v: boolean) => void;
  setListingResult: (r: ListingResult | null) => void;
  setListingLanguage: (l: Language) => void;
  setListingTone: (t: Tone) => void;
  setListingLength: (l: ListingLength) => void;
  setScoringResult: (scores: Record<string, VariationScore>, overallBest: string) => void;
  reset: () => void;
}

export const useAdStore = create<AdStore>((set) => ({
  pickedImage: null,
  selectedCategory: 'General',
  variations: [],
  isGenerating: false,
  listingResult: null,
  listingLanguage: 'English',
  listingTone: 'professional',
  listingLength: 'medium',
  imageScores: null,
  overallBestType: null,

  setPickedImage: (img) => set({ pickedImage: img }),
  setCategory: (cat) => set({ selectedCategory: cat }),
  setVariations: (v) => set({ variations: v }),
  updateVariation: (id, patch) =>
    set((state) => ({
      variations: state.variations.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    })),
  setIsGenerating: (v) => set({ isGenerating: v }),
  setListingResult: (r) => set({ listingResult: r }),
  setListingLanguage: (l) => set({ listingLanguage: l }),
  setListingTone: (t) => set({ listingTone: t }),
  setListingLength: (l) => set({ listingLength: l }),
  setScoringResult: (scores, overallBest) =>
    set({ imageScores: scores, overallBestType: overallBest }),
  reset: () =>
    set({
      pickedImage: null,
      selectedCategory: 'General',
      variations: [],
      isGenerating: false,
      listingResult: null,
      imageScores: null,
      overallBestType: null,
    }),
}));
