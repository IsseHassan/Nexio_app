export interface AdVariation {
  id: string;
  type: string;
  label: string;
  prompt: string;
  status: 'idle' | 'generating' | 'completed' | 'error';
  imageUrl?: string;
  description: string;
}

export type CategoryType = 'Furniture' | 'Jewelry' | 'Electronics' | 'Apparel' | 'General';

export interface Category {
  id: CategoryType;
  label: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: 'Furniture', label: 'Furniture (Sofa)', icon: 'Sofa' },
  { id: 'Jewelry', label: 'Jewelry (Necklace)', icon: 'Gem' },
  { id: 'Electronics', label: 'Electronics', icon: 'Smartphone' },
  { id: 'Apparel', label: 'Fashion & Apparel', icon: 'Shirt' },
  { id: 'General', label: 'Other Products', icon: 'Package' }
];

export function getVariationsForCategory(category: CategoryType): Omit<AdVariation, 'id' | 'status' | 'imageUrl'>[] {
  const isJewelry = category === 'Jewelry';
  const isApparel = category === 'Apparel';

  const globalDirective = 'MANDATORY: Preserve all text, logos, labels, and branding exactly as they appear on the product in the original image. Focus EXCLUSIVELY on the single main product; ignore all background clutter, other objects, or busy environments in the original photo.';

  const context = {
    Furniture: 'The product is a piece of furniture, like a sofa. Focus on comfort, fabric texture, and structural design.',
    Jewelry: 'The product is elegant jewelry, like a necklace. Focus on high-end brilliance, metal reflection, gemstone clarity, and exquisite presentation.',
    Electronics: 'The product is an electronic device. Focus on sleek surfaces, screen quality, connectivity ports, and modern tech aesthetic.',
    Apparel: 'The product is clothing or footwear. Focus on fabric weave, seams, fit, and movement.',
    General: 'Focus on the physical properties, branding, and functional details of the product.'
  }[category];

  const backgrounds = [
    'a clean, matte solid light-grey studio background',
    'a professional, minimalist architectural jewelry display stand',
    'a professional, pale-toned seamless sweep background',
    'a neutral, minimalist studio floor with a soft gradient',
    'a bright, airy studio space with intentional lighting',
    'a clean modern minimalist interior with soft architectural detail'
  ];

  const variations: Omit<AdVariation, 'id' | 'status' | 'imageUrl'>[] = [
    {
      type: 'main_shot',
      label: 'Main Catalog Shot',
      description: 'Professional front-angle view.',
      prompt: `${globalDirective} ${context} A high-end e-commerce product photograph of the central item. Captured from a professional 45-degree angle. Background is ${backgrounds[0]}. Sharp focus, commercial quality.`
    },
    {
      type: 'human_interaction',
      label: isJewelry ? 'Worn by Model' : 'In Context',
      description: isJewelry ? 'Close-up of model wearing the item.' : 'Product in use.',
      prompt: isJewelry 
        ? `${globalDirective} ${context} A professional e-commerce close-up shot of a model's neck and chest, wearing the necklace. Soft skin texture, elegant posture, minimalist high-fashion studio lighting.`
        : `${globalDirective} ${context} A professional e-commerce shot of the product in use by a person. Focused strictly on the product itself.`
    },
    {
      type: 'hand_held',
      label: 'Held in Hand',
      description: 'Showing scale and human touch.',
      prompt: `${globalDirective} ${context} A high-quality e-commerce photograph showing a professional person's hand holding and presenting the product. Focus is sharp on the product. Neutral, clean background.`
    },
    {
      type: 'macro_detail',
      label: 'Macro Detail',
      description: 'Focus on texture and craftsmanship.',
      prompt: `${globalDirective} ${context} A professional macro photography shot focused on the fine details, stitching, clasp, or branding labels. Very shallow depth of field, hyper-realistic detail.`
    },
    {
      type: 'studio_stand',
      label: isJewelry ? 'Display Stand' : 'Studio Placement',
      description: isJewelry ? 'Premium jewelry bust presentation.' : 'Minimalist product placement.',
      prompt: isJewelry
        ? `${globalDirective} ${context} The necklace displayed elegantly on a professional black velvet jewelry bust stand. Sleek studio background, dramatic lighting.`
        : `${globalDirective} ${context} The product placed elegantly on a minimalist geometric block in a professional studio. Soft professional shadows.`
    },
    {
      type: 'lifestyle_scene',
      label: 'Lifestyle Scene',
      description: 'Product in a premium environment.',
      prompt: `${globalDirective} ${context} An elegant lifestyle photo of the product. Placed in a high-end, minimalist modern setting with soft natural daylight. Selective focus on the product.`
    }
  ];

  return variations;
}
