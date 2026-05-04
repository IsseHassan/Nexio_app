import type { QuickAnalysis } from './services/analyzeService';

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
  { id: 'General', label: 'Other Products', icon: 'Package' },
];

export function getVariationsForCategory(
  category: CategoryType,
  analysis?: QuickAnalysis,
): Omit<AdVariation, 'id' | 'status' | 'imageUrl'>[] {
  const isJewelry  = category === 'Jewelry';
  const isApparel  = category === 'Apparel';
  const isSketch   = analysis?.media_type === 'sketch' || analysis?.media_type === 'illustration';

  const productType   = analysis?.product_type  || 'product';
  const color         = analysis?.color         || '';
  const material      = analysis?.material      || '';
  const style         = analysis?.style         || '';
  const target        = analysis?.target        || '';

  const productDesc = [color, material, productType].filter(Boolean).join(' ');
  const styleNote   = style   ? ` Style: ${style}.` : '';
  const targetNote  = target  ? ` Target audience: ${target}.` : '';

  // For sketches/illustrations, the AI should INTERPRET the design and render it realistically.
  // For real photos, it should use the image as reference.
  const refInstruction = isSketch
    ? `The reference image is a design sketch/illustration. Use it to understand the design, silhouette, details, and aesthetic — then generate a fully photorealistic commercial image of the actual ${productDesc} as if it were real.${styleNote}${targetNote}`
    : `Use the reference image to understand the exact design, colors, and details of the ${productDesc}. Generate a new, professionally lit commercial image — do NOT simply re-render the original photo.${styleNote}${targetNote}`;

  if (isApparel) {
    const garment = productDesc || 'garment';
    const modelGender = target?.toLowerCase().includes('men') ? 'male' : 'female';
    const fashionStyle = style || 'high-fashion editorial';

    return [
      {
        type: 'main_shot',
        label: 'Full Length Model',
        description: 'Elegant full-length model shot.',
        prompt: `${refInstruction} Generate a full-length professional fashion photograph of a ${modelGender} model wearing this exact ${garment}. Clean white or light studio background. Perfect body posture, confident expression. Sharp commercial fashion photography. The garment's design, silhouette, and details must be faithfully reproduced.`,
      },
      {
        type: 'editorial',
        label: 'Editorial Shot',
        description: 'Magazine-quality editorial.',
        prompt: `${refInstruction} Generate a high-fashion editorial photograph of a ${modelGender} model wearing this ${garment}. Set in a beautiful, aspirational location — a luxury penthouse, marble foyer, or sun-drenched street. Magazine cover quality. Dramatic, artistic lighting. ${fashionStyle} aesthetic. The garment's design details must be clearly visible and accurate.`,
      },
      {
        type: 'detail_shot',
        label: 'Garment Detail',
        description: 'Macro detail of fabric and craftsmanship.',
        prompt: `${refInstruction} Generate a close-up macro photography shot of the ${garment}'s finest details: fabric texture, embroidery, seams, drape, or embellishments. Extremely shallow depth of field. Hyper-realistic textile photography. Clean neutral background. The material quality and craftsmanship should be the focal point.`,
      },
      {
        type: 'lifestyle',
        label: 'Lifestyle Scene',
        description: 'Model in a premium lifestyle setting.',
        prompt: `${refInstruction} Generate a lifestyle fashion photograph of a ${modelGender} model wearing this ${garment} in a natural, aspirational setting — a café, gallery, garden, or city street. Golden hour or soft natural light. Candid, effortless mood. The garment should look stunning in real-world context.`,
      },
      {
        type: 'flat_lay',
        label: 'Flat Lay',
        description: 'Styled overhead flat lay.',
        prompt: `${refInstruction} Generate a beautifully styled flat lay photograph of the ${garment} laid on a clean white or marble surface, seen from directly above. Pair with minimal complementary accessories (shoes, handbag, jewellery). Soft even lighting, no harsh shadows. Premium fashion catalogue style.`,
      },
      {
        type: 'mannequin',
        label: 'Mannequin Display',
        description: 'Professional mannequin or bust shot.',
        prompt: `${refInstruction} Generate a professional product shot of the ${garment} displayed on a sleek white or black mannequin against a clean studio background. The garment must be perfectly pressed, styled, and the design details clearly visible. Commercial boutique photography quality.`,
      },
    ];
  }

  if (isJewelry) {
    const piece = productDesc || 'jewelry piece';
    return [
      {
        type: 'main_shot',
        label: 'Hero Shot',
        description: 'Dramatic studio hero shot.',
        prompt: `${refInstruction} Generate a stunning hero product photograph of this ${piece} on a jet-black reflective surface. Dramatic single-source studio lighting creates brilliant reflections and highlights. Every gemstone and metal detail must be photorealistic and sharp. Luxury jewellery catalogue quality.`,
      },
      {
        type: 'worn',
        label: 'Worn on Model',
        description: 'Worn elegantly by a model.',
        prompt: `${refInstruction} Generate a close-up fashion photograph of an elegant female model wearing this ${piece}. Smooth skin, graceful neckline or wrist. Soft shallow depth of field, the jewellery is sharp and in perfect focus. Warm studio lighting. High-end jewellery advertisement quality.`,
      },
      {
        type: 'detail',
        label: 'Macro Detail',
        description: 'Hyper-close gemstone and metal detail.',
        prompt: `${refInstruction} Generate an extreme macro photograph of this ${piece} focusing on gemstone clarity, facets, and metal finish. Ultra-shallow depth of field. Diamond-sharp focus on the main stone or detail. Background is soft bokeh. Sotheby's-level jewellery photography.`,
      },
      {
        type: 'velvet_display',
        label: 'Velvet Display',
        description: 'Premium display stand.',
        prompt: `${refInstruction} Generate a premium jewellery display photograph: the ${piece} elegantly placed on a dark velvet jewellery bust or tray inside a luxury jewellery box. Dramatic overhead spot lighting. Deep shadows, brilliant highlights. High-end retail display.`,
      },
      {
        type: 'lifestyle',
        label: 'Lifestyle',
        description: 'Aspirational lifestyle context.',
        prompt: `${refInstruction} Generate a luxury lifestyle photograph of this ${piece} worn by a model at an upscale setting — a gala, rooftop, or champagne table. Bokeh background, warm ambient light, the jewellery glittering. Aspirational and editorial in mood.`,
      },
      {
        type: 'white_bg',
        label: 'Clean Catalogue',
        description: 'Clean white background catalogue shot.',
        prompt: `${refInstruction} Generate a clean, professional e-commerce catalogue photograph of the ${piece} on a pure white background. All edges sharp. Perfectly even lighting. Shadow directly beneath. Amazon/Etsy listing quality.`,
      },
    ];
  }

  // ── Furniture ────────────────────────────────────────────────────────────────
  if (category === 'Furniture') {
    const piece = productDesc || 'furniture piece';
    return [
      {
        type: 'main_shot',
        label: 'Studio Catalogue',
        description: 'Clean studio catalogue shot.',
        prompt: `${refInstruction} Generate a professional interior product photograph of this ${piece} on a clean, light-grey seamless studio background. Soft diffused lighting from both sides. Every material texture, stitch, and structural detail is perfectly visible. Commercial furniture catalogue quality.`,
      },
      {
        type: 'room_scene',
        label: 'Room Scene',
        description: 'Styled in a modern living space.',
        prompt: `${refInstruction} Generate an interior design photograph of this ${piece} placed in a beautifully styled modern living room. Natural daylight from large windows. Complementary décor (plants, cushions, art). Architectural Digest quality. The furniture is the clear hero of the composition.`,
      },
      {
        type: 'detail',
        label: 'Material Detail',
        description: 'Close-up of texture and craft.',
        prompt: `${refInstruction} Generate a macro close-up of the ${piece}'s material, texture, seam, leg joint, or fabric weave. Ultra-sharp focus, shallow depth of field. The craftsmanship and premium material quality should be immediately apparent.`,
      },
      {
        type: 'lifestyle',
        label: 'Lifestyle Scene',
        description: 'In a luxurious aspirational environment.',
        prompt: `${refInstruction} Generate a warm lifestyle photograph of this ${piece} in a cosy, aspirational home interior — a penthouse, loft, or design-forward apartment. Warm golden hour light, a cup of coffee nearby, a book. Inviting, premium mood.`,
      },
      {
        type: 'angle',
        label: '3/4 Angle View',
        description: 'Reveals form and depth.',
        prompt: `${refInstruction} Generate a professional product photograph of this ${piece} from a 45-degree 3/4 angle, revealing both front and side. Clean neutral background with soft shadows beneath. All proportions and design features clearly visible.`,
      },
      {
        type: 'top_down',
        label: 'Top-Down View',
        description: 'Bird\'s eye perspective.',
        prompt: `${refInstruction} Generate a top-down bird's eye product photograph of this ${piece} on a light stone or wooden floor. Perfectly centred composition. Soft even lighting. Clean and graphic.`,
      },
    ];
  }

  // ── Electronics ──────────────────────────────────────────────────────────────
  if (category === 'Electronics') {
    const device = productDesc || 'device';
    return [
      {
        type: 'main_shot',
        label: 'Hero Studio Shot',
        description: 'Clean studio hero shot.',
        prompt: `${refInstruction} Generate a sleek, professional tech product photograph of this ${device} on a pure white or light grey background. Even studio lighting, crisp reflections on the surface. Screen or interface clearly visible. Apple-style product photography quality.`,
      },
      {
        type: 'angle',
        label: '3/4 Angle',
        description: 'Three-quarter view showing depth.',
        prompt: `${refInstruction} Generate a 3/4 angle product photograph of this ${device}. Reveals the front, top, and side in a single composition. Clean gradient background. Sharp focus on every port, button, and surface detail.`,
      },
      {
        type: 'lifestyle',
        label: 'In Use Lifestyle',
        description: 'Person using the device.',
        prompt: `${refInstruction} Generate a lifestyle photograph of a person using this ${device} in a modern, aspirational setting — a minimalist desk, coffee shop, or creative studio. Natural ambient light. The technology enhances their life. Modern tech advertising aesthetic.`,
      },
      {
        type: 'detail',
        label: 'Detail Close-Up',
        description: 'Macro ports, buttons, surface.',
        prompt: `${refInstruction} Generate a macro close-up photograph of this ${device}'s most distinctive physical feature — a port array, button cluster, camera module, or premium surface finish. Ultra-sharp focus, bokeh background. Premium materials clearly visible.`,
      },
      {
        type: 'dark_bg',
        label: 'Dark Dramatic',
        description: 'High-contrast dark background.',
        prompt: `${refInstruction} Generate a dramatic product photograph of this ${device} on a pure black background with a single rim light creating glowing edges and deep shadows. Mysterious, premium tech aesthetic. High contrast.`,
      },
      {
        type: 'flat_lay',
        label: 'Flat Lay Ecosystem',
        description: 'Device with accessories flat lay.',
        prompt: `${refInstruction} Generate a styled flat lay of this ${device} surrounded by complementary accessories — cable, case, earbuds, notebook. Top-down view on a clean marble or wood desk surface. Intentional, editorial product composition.`,
      },
    ];
  }

  // ── General ──────────────────────────────────────────────────────────────────
  const item = productDesc || 'product';
  return [
    {
      type: 'main_shot',
      label: 'Hero Shot',
      description: 'Clean studio hero shot.',
      prompt: `${refInstruction} Generate a professional commercial product photograph of this ${item} against a clean white or light grey studio background. Perfect lighting, sharp focus on every detail. E-commerce hero image quality.`,
    },
    {
      type: 'angle',
      label: 'Angle View',
      description: '3/4 view showing depth and form.',
      prompt: `${refInstruction} Generate a professional 3/4 angle product photograph of this ${item}. Reveals depth, shape, and all design details. Clean neutral background, soft shadow.`,
    },
    {
      type: 'lifestyle',
      label: 'Lifestyle Scene',
      description: 'Product in real-world context.',
      prompt: `${refInstruction} Generate a lifestyle photograph of this ${item} in an aspirational, natural setting that matches the product's purpose. Warm ambient light. The product is the clear hero of the image.`,
    },
    {
      type: 'detail',
      label: 'Detail Close-Up',
      description: 'Macro focus on texture and craft.',
      prompt: `${refInstruction} Generate a macro close-up photograph of this ${item}'s most distinctive feature or finest detail. Hyper-sharp focus, shallow depth of field. Premium material quality clearly visible.`,
    },
    {
      type: 'dark_bg',
      label: 'Dark Dramatic',
      description: 'High-contrast dramatic presentation.',
      prompt: `${refInstruction} Generate a dramatic product photograph of this ${item} on a dark background with a single artistic light source creating depth and contrast. Sophisticated, premium aesthetic.`,
    },
    {
      type: 'flat_lay',
      label: 'Flat Lay',
      description: 'Styled overhead composition.',
      prompt: `${refInstruction} Generate a beautifully styled flat lay photograph of this ${item} on a clean surface, seen from directly above. Minimal complementary props. Soft even lighting. Clean editorial composition.`,
    },
  ];
}
