export interface AdVariation {
  id: string;
  type: string;
  label: string;
  prompt: string;
  status: 'idle' | 'generating' | 'completed' | 'error';
  imageUrl?: string;
  description: string;
}

export type CategoryType =
  | 'Furniture'
  | 'Jewelry'
  | 'Electronics'
  | 'Apparel'
  | 'Beauty'
  | 'Food'
  | 'HomeDecor'
  | 'Pet'
  | 'Handmade'
  | 'Sports'
  | 'Books'
  | 'Baby'
  | 'General';

export interface Category {
  id: CategoryType;
  label: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: 'Apparel',     label: 'Fashion & Apparel',  icon: 'Shirt' },
  { id: 'Jewelry',     label: 'Jewelry',             icon: 'Gem' },
  { id: 'Beauty',      label: 'Beauty & Cosmetics',  icon: 'Sparkles' },
  { id: 'Electronics', label: 'Electronics',         icon: 'Smartphone' },
  { id: 'Furniture',   label: 'Furniture',           icon: 'Sofa' },
  { id: 'HomeDecor',   label: 'Home Decor',          icon: 'Lamp' },
  { id: 'Food',        label: 'Food & Beverage',     icon: 'Coffee' },
  { id: 'Pet',         label: 'Pet Products',        icon: 'Heart' },
  { id: 'Handmade',    label: 'Handmade & Craft',    icon: 'Palette' },
  { id: 'Sports',      label: 'Sports & Fitness',    icon: 'Dumbbell' },
  { id: 'Books',       label: 'Books & Media',       icon: 'BookOpen' },
  { id: 'Baby',        label: 'Baby & Kids',         icon: 'Gift' },
  { id: 'General',     label: 'Other Products',      icon: 'Package' },
];

export function getVariationsForCategory(category: CategoryType): Omit<AdVariation, 'id' | 'status' | 'imageUrl'>[] {
  const isJewelry = category === 'Jewelry';
  const isApparel = category === 'Apparel';

  const globalDirective = 'MANDATORY: Preserve all text, logos, labels, and branding exactly as they appear on the product in the original image. Focus EXCLUSIVELY on the single main product; ignore all background clutter, other objects, or busy environments in the original photo.';

  const context: Record<CategoryType, string> = {
    Furniture:   'The product is a piece of furniture. Focus on comfort, fabric texture, structural design, and craftsmanship.',
    Jewelry:     'The product is elegant jewelry. Focus on high-end brilliance, metal reflection, gemstone clarity, and exquisite presentation.',
    Electronics: 'The product is an electronic device. Focus on sleek surfaces, screen quality, connectivity, and modern tech aesthetic.',
    Apparel:     'The product is clothing or footwear. Focus on fabric weave, seams, fit, and movement.',
    Beauty:      'The product is a beauty or cosmetic item. Focus on elegant packaging, texture, color payoff, and premium presentation.',
    Food:        'The product is a food or beverage item. Focus on freshness, appetizing color, texture, and premium plating or packaging.',
    HomeDecor:   'The product is a home décor item. Focus on aesthetic appeal, material finish, and how it enhances a living space.',
    Pet:         'The product is designed for pets. Focus on safety, softness, playful design, and the joy it brings to animals.',
    Handmade:    'The product is handmade or artisanal. Focus on the craftsmanship, unique textures, hand-finished details, and artisan quality.',
    Sports:      'The product is a sports or fitness item. Focus on performance materials, ergonomic design, and active use context.',
    Books:       'The product is a book or media item. Focus on the cover design, binding quality, and the intellectual or creative appeal.',
    Baby:        'The product is designed for babies or kids. Focus on softness, safety, bright colors, and playful, nurturing design.',
    General:     'Focus on the physical properties, branding, and functional details of the product.',
  };

  const cat = context[category];

  const variations: Omit<AdVariation, 'id' | 'status' | 'imageUrl'>[] = [
    {
      type: 'main_shot',
      label: 'Main Catalog Shot',
      description: 'Professional front-angle view.',
      prompt: `${globalDirective} ${cat} A high-end e-commerce product photograph of the central item. Captured from a professional 45-degree angle. Background is a clean, matte solid light-grey studio background. Sharp focus, commercial quality.`
    },
    {
      type: 'human_interaction',
      label: isJewelry ? 'Worn by Model' : 'In Context',
      description: isJewelry ? 'Close-up of model wearing the item.' : 'Product in use.',
      prompt: isJewelry
        ? `${globalDirective} ${cat} A professional e-commerce close-up shot of a model's neck and chest, wearing the necklace. Soft skin texture, elegant posture, minimalist high-fashion studio lighting.`
        : `${globalDirective} ${cat} A professional e-commerce shot of the product in use by a person. Focused strictly on the product itself.`
    },
    {
      type: 'hand_held',
      label: 'Held in Hand',
      description: 'Showing scale and human touch.',
      prompt: `${globalDirective} ${cat} A high-quality e-commerce photograph showing a professional person's hand holding and presenting the product. Focus is sharp on the product. Neutral, clean background.`
    },
    {
      type: 'macro_detail',
      label: 'Macro Detail',
      description: 'Focus on texture and craftsmanship.',
      prompt: `${globalDirective} ${cat} A professional macro photography shot focused on the fine details, texture, finish, or branding labels. Very shallow depth of field, hyper-realistic detail.`
    },
    {
      type: 'studio_stand',
      label: isJewelry ? 'Display Stand' : 'Studio Placement',
      description: isJewelry ? 'Premium jewelry bust presentation.' : 'Minimalist product placement.',
      prompt: isJewelry
        ? `${globalDirective} ${cat} The jewelry displayed elegantly on a professional black velvet jewelry bust stand. Sleek studio background, dramatic lighting.`
        : `${globalDirective} ${cat} The product placed elegantly on a minimalist geometric block in a professional studio. Soft professional shadows.`
    },
    {
      type: 'lifestyle_scene',
      label: 'Lifestyle Scene',
      description: 'Product in a premium environment.',
      prompt: `${globalDirective} ${cat} An elegant lifestyle photo of the product. Placed in a high-end, minimalist modern setting with soft natural daylight. Selective focus on the product.`
    }
  ];

  return variations;
}
