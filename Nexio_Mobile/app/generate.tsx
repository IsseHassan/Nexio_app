import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { generateListing } from '../src/services/listingService';
import { analyzeProductQuick } from '../src/services/analyzeService';
import { cacheProductImage, generateAdImage } from '../src/services/aiService';
import { useAdStore } from '../src/store/adStore';
import { getVariationsForCategory } from '../src/constants';
import { getRecommendations } from '../src/services/analyticsService';
import type { IntelligenceResult } from '../src/services/analyticsService';
import { saveKit } from '../src/services/historyService';

const PRIMARY = '#5C3BE5';
const TEXT1   = '#FFFFFF';
const TEXT2   = '#8B8BA7';
const TEXT3   = '#3A3A52';

type StepState = 'pending' | 'running' | 'done' | 'error';

const ALL_STEPS = [
  { key: 'analyze', label: 'Analyzing product' },
  { key: 'images',  label: 'Generating images' },
  { key: 'listing', label: 'Writing listing content' },
  { key: 'export',  label: 'Preparing export files' },
];

const STEPS_BY_GOAL: Record<string, string[]> = {
  full:    ['analyze', 'images', 'listing', 'export'],
  images:  ['analyze', 'images'],
  listing: ['listing'],
  social:  ['listing'],
};

const TITLE_BY_GOAL: Record<string, string> = {
  full:    'Creating Your Product Kit',
  images:  'Generating Product Images',
  listing: 'Writing Your Listing',
  social:  'Creating Social Content',
};

const SUBTITLE_BY_GOAL: Record<string, string> = {
  full:    'This will take about 30–60 seconds',
  images:  'This will take about 30–60 seconds',
  listing: 'This will take about 15–30 seconds',
  social:  'This will take about 15–30 seconds',
};

function StepRow({ label, state }: { label: string; state: StepState }) {
  const fade = useRef(new Animated.Value(state === 'pending' ? 0.35 : 1)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: state === 'pending' ? 0.35 : 1, duration: 300, useNativeDriver: true }).start();
  }, [state]);

  return (
    <Animated.View style={{ opacity: fade, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 }}>
      <View style={{
        width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
        backgroundColor: state === 'done' ? 'rgba(52,211,153,0.12)' : state === 'running' ? 'rgba(92,59,229,0.12)' : '#13131F',
        borderWidth: 1,
        borderColor: state === 'done' ? 'rgba(52,211,153,0.4)' : state === 'running' ? 'rgba(92,59,229,0.5)' : '#1A1A28',
      }}>
        {state === 'running' && <ActivityIndicator size="small" color={PRIMARY} />}
        {state === 'done'    && <Check size={15} color="#34d399" strokeWidth={2.5} />}
        {state === 'pending' && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: TEXT3 }} />}
        {state === 'error'   && <Text style={{ color: '#f87171', fontSize: 14, fontWeight: 'bold' }}>!</Text>}
      </View>
      <Text style={{ color: state === 'pending' ? TEXT3 : TEXT1, fontSize: 15, fontWeight: '500' }}>{label}</Text>
    </Animated.View>
  );
}

function CircularProgress({ pct }: { pct: number }) {
  return (
    <View style={{ width: 140, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: 48 }}>
      <View style={{ width: 130, height: 130, borderRadius: 65, borderWidth: 8, borderColor: '#1A1A28', alignItems: 'center', justifyContent: 'center', position: 'absolute' }} />
      <View style={{ width: 130, height: 130, borderRadius: 65, borderWidth: 8, borderColor: PRIMARY, opacity: Math.max(0.15, pct / 100), position: 'absolute', shadowColor: PRIMARY, shadowOpacity: 0.5, shadowRadius: 16 }} />
      <Text style={{ color: TEXT1, fontSize: 32, fontWeight: '800', letterSpacing: -1 }}>{pct}%</Text>
    </View>
  );
}

export default function GenerateScreen() {
  const insets = useSafeAreaInsets();
  const {
    pickedImage, selectedCategory, goal,
    listingLanguage, listingTone, listingLength,
    setListingResult, setVariations, updateVariation, setIsGenerating,
    setProductAnalysis,
  } = useAdStore();

  const activeKeys = STEPS_BY_GOAL[goal] ?? STEPS_BY_GOAL.full;
  const activeSteps = ALL_STEPS.filter(s => activeKeys.includes(s.key));

  const [states, setStates] = useState<Record<string, StepState>>(() => {
    const s: Record<string, StepState> = { analyze: 'done', images: 'done', listing: 'done', export: 'done' };
    activeKeys.forEach((key, i) => { s[key] = i === 0 ? 'running' : 'pending'; });
    return s;
  });
  const [pct, setPct] = useState(5);
  const ran = useRef(false);

  function setStep(key: string, s: StepState) {
    setStates(prev => ({ ...prev, [key]: s }));
  }

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    run();
  }, []);

  async function run() {
    if (!pickedImage) { router.replace('/'); return; }

    const needsImages  = goal === 'full' || goal === 'images';
    const needsListing = goal === 'full' || goal === 'listing' || goal === 'social';

    // Clear stale data from any previous run that isn't being regenerated now
    if (!needsImages)  setVariations([]);
    if (!needsListing) setListingResult(null);

    // ── Step 1: Analyze (only when generating images) ───────────────────────
    let analysis;
    let recResult: IntelligenceResult | null = null;
    if (needsImages) {
      setPct(10);
      try {
        [analysis, recResult] = await Promise.all([
          analyzeProductQuick(pickedImage.base64, pickedImage.mimeType),
          getRecommendations(selectedCategory).catch(() => null),
        ]);
        setProductAnalysis(analysis);
      } catch (e) {
        console.warn('[generate] analyze failed:', e);
      }
      setStep('analyze', 'done');
      setPct(18);
    }

    // ── Start listing in background (fast text endpoint) ─────────────────────
    let listingPromise: Promise<any> | null = null;
    if (needsListing) {
      setStep('listing', 'running');
      if (!needsImages) setPct(20); // listing-only goal: show early progress
      listingPromise = generateListing({
        image: { base64: pickedImage.base64, mimeType: pickedImage.mimeType },
        category: selectedCategory,
        language: listingLanguage,
        tone: listingTone,
        length: listingLength,
      });
      // For listing/social goals animate progress while waiting
      if (!needsImages) {
        const tick = setInterval(() => setPct(p => Math.min(p + 3, 78)), 1500);
        listingPromise.finally(() => clearInterval(tick));
      }
    }

    // ── Step 2: Images ───────────────────────────────────────────────────────
    if (needsImages) {
      setStep('images', 'running');
      const vars = getVariationsForCategory(selectedCategory, analysis).map(t => ({
        ...t,
        id: Math.random().toString(36).substr(2, 9),
        status: 'idle' as const,
      }));
      if (recResult?.top_recommendations?.length) {
        const rank = (v: typeof vars[0]) => {
          const idx = recResult!.top_recommendations.findIndex(
            r => r.style.toLowerCase().includes(v.label.toLowerCase()) ||
                 v.label.toLowerCase().includes(r.style.toLowerCase().split(' ')[0])
          );
          return idx === -1 ? 999 : idx;
        };
        vars.sort((a, b) => rank(a) - rank(b));
      }
      setVariations(vars);
      setIsGenerating(true);
      setPct(22);

      const sessionId = await cacheProductImage(pickedImage.base64, pickedImage.mimeType);
      setPct(26);

      let completed = 0;
      await Promise.all(vars.map(async v => {
        updateVariation(v.id, { status: 'generating' });
        try {
          const imageUrl = await generateAdImage(sessionId, v.prompt);
          updateVariation(v.id, { status: 'completed', imageUrl });
        } catch (e) {
          console.error('[generate] image failed:', e);
          updateVariation(v.id, { status: 'error' });
        }
        completed++;
        setPct(26 + Math.round((completed / vars.length) * 34));
      }));

      setIsGenerating(false);
      setStep('images', 'done');
      setPct(needsListing ? 62 : 90);
    }

    // ── Step 3: Await listing ────────────────────────────────────────────────
    if (listingPromise) {
      try {
        const result = await listingPromise;
        setListingResult(result);
        setStep('listing', 'done');
      } catch (e) {
        console.error('[generate] listing failed:', e);
        setStep('listing', 'error');
      }
      setPct(85);
    }

    // ── Step 4: Export prep (full kit only) ──────────────────────────────────
    if (goal === 'full') {
      setStep('export', 'running');
      await new Promise(r => setTimeout(r, 500));
      setStep('export', 'done');
    }

    setPct(100);
    await new Promise(r => setTimeout(r, 700));

    // Persist completed kit to local history (fire-and-forget)
    const snap = useAdStore.getState();
    saveKit({
      category: snap.selectedCategory,
      goal: snap.goal,
      productImageUri: snap.pickedImage?.uri ?? '',
      variations: snap.variations,
      listingResult: snap.listingResult,
      productAnalysis: snap.productAnalysis,
    }).catch(() => {});

    router.replace('/kit');
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0B0F', paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={{ alignItems: 'center', paddingTop: 60, paddingBottom: 48 }}>
        <Text style={{ color: TEXT1, fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 }}>
          {TITLE_BY_GOAL[goal] ?? TITLE_BY_GOAL.full}
        </Text>
        <Text style={{ color: TEXT2, fontSize: 13 }}>
          {SUBTITLE_BY_GOAL[goal] ?? SUBTITLE_BY_GOAL.full}
        </Text>
      </View>

      <View style={{ alignItems: 'center' }}>
        <CircularProgress pct={pct} />
      </View>

      <View style={{ paddingHorizontal: 40 }}>
        {activeSteps.map(s => (
          <StepRow key={s.key} label={s.label} state={states[s.key]} />
        ))}
      </View>

      <View style={{ position: 'absolute', bottom: insets.bottom + 28, left: 0, right: 0, alignItems: 'center' }}>
        <View style={{ backgroundColor: '#13131F', borderRadius: 12, borderWidth: 1, borderColor: '#1A1A28', paddingHorizontal: 16, paddingVertical: 10 }}>
          <Text style={{ color: TEXT2, fontSize: 12 }}>
            💡 <Text style={{ fontWeight: '600' }}>Tip: </Text>You can close this screen. We'll notify you when it's ready.
          </Text>
        </View>
      </View>
    </View>
  );
}
