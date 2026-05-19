import { create } from 'zustand';
import { AdVariation, CategoryType } from '../constants';
import type { ListingResult, Language, Tone, ListingLength } from '../services/listingService';
import type { VariationScore } from '../services/scoringService';
import type { QuickAnalysis } from '../services/analyzeService';
import type { KitFullData } from '../services/historyService';

export type GenerationGoal = 'full' | 'images' | 'listing' | 'social';

export interface PickedImage {
  base64: string;
  mimeType: string;
  uri: string;
}

export interface StyleImageSet {
  presetId: string;
  presetName: string;
  status: 'generating' | 'done' | 'error';
  imageUrls: string[];
}

interface AdStore {
  pickedImage: PickedImage | null;
  angleImages: PickedImage[];
  productText: string;
  voiceTranscript: string;
  selectedCategory: CategoryType;
  variations: AdVariation[];
  isGenerating: boolean;

  listingResult: ListingResult | null;
  listingLanguage: Language;
  listingTone: Tone;
  listingLength: ListingLength;

  imageScores: Record<string, VariationScore> | null;
  overallBestType: string | null;

  goal: GenerationGoal;

  productAnalysis: QuickAnalysis | null;
  styleImages: StyleImageSet[];

  setPickedImage: (img: PickedImage | null) => void;
  setAngleImages: (imgs: PickedImage[]) => void;
  addAngleImage: (img: PickedImage) => void;
  removeAngleImage: (index: number) => void;
  setProductText: (t: string) => void;
  setVoiceTranscript: (t: string) => void;
  setCategory: (cat: CategoryType) => void;
  setVariations: (v: AdVariation[]) => void;
  updateVariation: (id: string, patch: Partial<AdVariation>) => void;
  setIsGenerating: (v: boolean) => void;
  setListingResult: (r: ListingResult | null) => void;
  setListingLanguage: (l: Language) => void;
  setListingTone: (t: Tone) => void;
  setListingLength: (l: ListingLength) => void;
  setScoringResult: (scores: Record<string, VariationScore>, overallBest: string) => void;
  setGoal: (g: GenerationGoal) => void;
  setProductAnalysis: (a: QuickAnalysis | null) => void;
  addStyleImageSet: (s: StyleImageSet) => void;
  updateStyleImageSet: (presetId: string, patch: Partial<StyleImageSet>) => void;
  restoreKit: (data: KitFullData) => void;
  reset: () => void;
}

export const useAdStore = create<AdStore>((set) => ({
  pickedImage: null,
  angleImages: [],
  productText: '',
  voiceTranscript: '',
  selectedCategory: 'General',
  variations: [],
  isGenerating: false,
  listingResult: null,
  listingLanguage: 'English',
  listingTone: 'professional',
  listingLength: 'medium',
  imageScores: null,
  overallBestType: null,
  goal: 'full',
  productAnalysis: null,
  styleImages: [],

  setPickedImage:     (img)  => set({ pickedImage: img }),
  setAngleImages:     (imgs) => set({ angleImages: imgs }),
  addAngleImage:      (img)  => set(s => ({ angleImages: [...s.angleImages, img] })),
  removeAngleImage:   (idx)  => set(s => ({ angleImages: s.angleImages.filter((_, i) => i !== idx) })),
  setProductText:     (t)    => set({ productText: t }),
  setVoiceTranscript: (t)    => set({ voiceTranscript: t }),
  setCategory:        (cat)  => set({ selectedCategory: cat }),
  setVariations:      (v)    => set({ variations: v }),
  updateVariation: (id, patch) =>
    set(s => ({ variations: s.variations.map(v => v.id === id ? { ...v, ...patch } : v) })),
  setIsGenerating:  (v) => set({ isGenerating: v }),
  setListingResult: (r) => set({ listingResult: r }),
  setListingLanguage: (l) => set({ listingLanguage: l }),
  setListingTone:     (t) => set({ listingTone: t }),
  setListingLength:   (l) => set({ listingLength: l }),
  setScoringResult: (scores, overallBest) =>
    set({ imageScores: scores, overallBestType: overallBest }),
  setGoal: (g) => set({ goal: g }),
  setProductAnalysis: (a) => set({ productAnalysis: a }),
  addStyleImageSet: (s) =>
    set(state => ({ styleImages: [...state.styleImages, s] })),
  updateStyleImageSet: (presetId, patch) =>
    set(state => ({
      styleImages: state.styleImages.map(s => s.presetId === presetId ? { ...s, ...patch } : s),
    })),
  restoreKit: (data) =>
    set({
      selectedCategory: data.category as CategoryType,
      goal: data.goal,
      variations: data.variations,
      listingResult: data.listingResult,
      productAnalysis: data.productAnalysis,
      pickedImage: data.productImageUri
        ? { uri: data.productImageUri, base64: '', mimeType: 'image/jpeg' }
        : null,
      isGenerating: false,
      imageScores: null,
      overallBestType: null,
      styleImages: [],
      angleImages: [],
      productText: '',
      voiceTranscript: '',
    }),
  reset: () =>
    set({
      pickedImage: null,
      angleImages: [],
      productText: '',
      voiceTranscript: '',
      selectedCategory: 'General',
      variations: [],
      isGenerating: false,
      listingResult: null,
      imageScores: null,
      overallBestType: null,
      productAnalysis: null,
      styleImages: [],
    }),
}));
