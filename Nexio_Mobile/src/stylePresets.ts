export interface StylePreset {
  id: string;
  name: string;
  description: string;
  promptModifier: string;
  supportedCategories: string[] | 'all';
  creditCost: number;
  preview: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'amazon_white',
    name: 'Amazon White',
    description: 'Pure white, marketplace-ready',
    promptModifier: 'Pure white seamless background. Product fills approximately 85% of the frame. Flat, even studio lighting with a soft shadow directly beneath. No props or accessories. Marketplace compliance hero image quality.',
    supportedCategories: 'all',
    creditCost: 1,
    preview: '⬜',
  },
  {
    id: 'luxury_branding',
    name: 'Luxury Branding',
    description: 'Dark moody, premium feel',
    promptModifier: 'Deep black background. Single dramatic key light from above-right creating bold contrast with subtle rim lighting on edges. Deep rich shadows. Sophisticated premium luxury brand aesthetic. No distracting props.',
    supportedCategories: ['Jewelry', 'Apparel', 'Beauty', 'Electronics', 'HomeDecor', 'Handmade', 'General'],
    creditCost: 1,
    preview: '🖤',
  },
  {
    id: 'tiktok_viral',
    name: 'TikTok Viral',
    description: 'Bold, punchy, scroll-stopping',
    promptModifier: 'Punchy saturated colors. Dynamic non-centered composition. Energetic Gen-Z aesthetic. Bright vibrant background or bold color gradient. Eye-catching and fun. Designed to stop thumbs while scrolling.',
    supportedCategories: ['Apparel', 'Beauty', 'Electronics', 'Sports', 'Food', 'Baby', 'Pet', 'General'],
    creditCost: 1,
    preview: '🎵',
  },
  {
    id: 'minimal_clean',
    name: 'Minimal Clean',
    description: 'White space, calm and elegant',
    promptModifier: 'Minimalist composition with extensive white or very light grey negative space. Soft even lighting, no harsh shadows. Product floats with breathing room all around. Scandinavian-inspired calm and clean aesthetic.',
    supportedCategories: ['Electronics', 'HomeDecor', 'Jewelry', 'Beauty', 'Books', 'Handmade', 'General'],
    creditCost: 1,
    preview: '🤍',
  },
  {
    id: 'editorial_magazine',
    name: 'Editorial',
    description: 'Artistic, magazine quality',
    promptModifier: 'Artistic editorial photography with intentional storytelling composition. Magazine cover or spread quality. Sophisticated color grading. Cinematic lighting. Product is the clear hero but the environment tells a story.',
    supportedCategories: ['Apparel', 'Jewelry', 'Beauty', 'HomeDecor', 'Books', 'Handmade', 'General'],
    creditCost: 1,
    preview: '📸',
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    description: 'Light wood, soft and cozy',
    promptModifier: 'Warm Scandinavian interior aesthetic. Light pine or oak wood surfaces. Soft muted palette of whites, creams, and warm greys. Cozy natural hygge atmosphere. Soft diffused natural light from a nearby window.',
    supportedCategories: ['Furniture', 'HomeDecor', 'Baby', 'Pet', 'Handmade', 'Books', 'General'],
    creditCost: 1,
    preview: '🪵',
  },
  {
    id: 'flatlay_social',
    name: 'Flatlay Social',
    description: 'Top-down styled with props',
    promptModifier: 'Perfect 90-degree top-down flat lay composition. Product surrounded by curated complementary props and accessories that tell a lifestyle story. Clean marble, linen, or wood surface. Shadow-free even lighting. Instagram-worthy editorial styling.',
    supportedCategories: ['Beauty', 'Apparel', 'Food', 'Baby', 'Handmade', 'Books', 'General'],
    creditCost: 1,
    preview: '📷',
  },
  {
    id: 'outdoor_natural',
    name: 'Outdoor Natural',
    description: 'Real setting, golden hour light',
    promptModifier: 'Real outdoor natural setting. Soft golden hour sunlight or bright natural daylight. Authentic environmental context appropriate for the product. Warm, natural, genuine mood. Photorealistic outdoor scene.',
    supportedCategories: ['Apparel', 'Sports', 'Pet', 'Food', 'Baby', 'General'],
    creditCost: 1,
    preview: '🌿',
  },
  {
    id: 'closeup_texture',
    name: 'Close-up Texture',
    description: 'Macro detail and material',
    promptModifier: 'Extreme macro close-up photography emphasizing material texture and craftsmanship. Very shallow depth of field with soft bokeh background. Ultra-sharp focus on the most beautiful or distinctive textural detail of the product.',
    supportedCategories: ['Jewelry', 'Apparel', 'Handmade', 'HomeDecor', 'Baby', 'Food', 'Beauty', 'General'],
    creditCost: 1,
    preview: '🔍',
  },
  {
    id: 'industrial_loft',
    name: 'Industrial Loft',
    description: 'Concrete, metal, urban modern',
    promptModifier: 'Urban industrial aesthetic. Raw concrete or brushed metal surfaces. Exposed brick or steel hints in the background. Moody directional lighting with strong deliberate shadows. Modern masculine urban styling. Brooklyn loft or Berlin studio atmosphere.',
    supportedCategories: ['Furniture', 'Electronics', 'Apparel', 'Sports', 'General'],
    creditCost: 1,
    preview: '🏗️',
  },
];

export function getPresetsForCategory(category: string): StylePreset[] {
  return STYLE_PRESETS.filter(
    p => p.supportedCategories === 'all' || (p.supportedCategories as string[]).includes(category),
  );
}

export function getPresetById(id: string): StylePreset | undefined {
  return STYLE_PRESETS.find(p => p.id === id);
}
