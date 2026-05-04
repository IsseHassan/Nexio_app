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
  { id: 'Apparel',    label: 'Fashion & Apparel',   icon: 'Shirt' },
  { id: 'Jewelry',   label: 'Jewelry',              icon: 'Gem' },
  { id: 'Beauty',    label: 'Beauty & Cosmetics',   icon: 'Sparkles' },
  { id: 'Electronics', label: 'Electronics',        icon: 'Smartphone' },
  { id: 'Furniture', label: 'Furniture',            icon: 'Sofa' },
  { id: 'HomeDecor', label: 'Home Decor',           icon: 'Lamp' },
  { id: 'Food',      label: 'Food & Beverage',      icon: 'Coffee' },
  { id: 'Pet',       label: 'Pet Products',         icon: 'Heart' },
  { id: 'Handmade',  label: 'Handmade & Craft',     icon: 'Palette' },
  { id: 'Sports',    label: 'Sports & Fitness',     icon: 'Dumbbell' },
  { id: 'Books',     label: 'Books & Media',        icon: 'BookOpen' },
  { id: 'Baby',      label: 'Baby & Kids',          icon: 'Gift' },
  { id: 'General',   label: 'Other Products',       icon: 'Package' },
];

export function getVariationsForCategory(
  category: CategoryType,
  analysis?: QuickAnalysis,
): Omit<AdVariation, 'id' | 'status' | 'imageUrl'>[] {
  const isSketch = analysis?.media_type === 'sketch' || analysis?.media_type === 'illustration';

  const productType      = analysis?.product_type     || 'product';
  const color            = analysis?.color            || '';
  const material         = analysis?.material         || '';
  const style            = analysis?.style            || '';
  const target           = analysis?.target           || '';
  const positioning      = analysis?.positioning      || '';
  const visualDirection  = analysis?.visual_direction || '';

  const productDesc = [color, material, productType].filter(Boolean).join(' ');
  const styleNote   = style          ? ` Style: ${style}.`                : '';
  const targetNote  = target         ? ` Target: ${target}.`              : '';
  const posNote     = positioning    ? ` Positioning: ${positioning}.`    : '';
  const vdNote      = visualDirection ? ` Visual mood: ${visualDirection}.` : '';
  const contextNote = `${styleNote}${targetNote}${posNote}${vdNote}`;

  const refInstruction = isSketch
    ? `The reference image is a design sketch/illustration. Use it to understand the design, silhouette, details, and aesthetic — then generate a fully photorealistic commercial image of the actual ${productDesc} as if it were real.${contextNote}`
    : `Use the reference image to understand the exact design, colors, and details of the ${productDesc}. Generate a new, professionally lit commercial image — do NOT simply re-render the original photo.${contextNote}`;

  // ── Apparel ──────────────────────────────────────────────────────────────────
  if (category === 'Apparel') {
    const garment = productDesc || 'garment';
    const modelGender = target?.toLowerCase().includes('men') ? 'male' : 'female';
    const fashionStyle = style || 'high-fashion editorial';
    return [
      {
        type: 'main_shot', label: 'Full Length Model', description: 'Elegant full-length model shot.',
        prompt: `${refInstruction} Generate a full-length professional fashion photograph of a ${modelGender} model wearing this exact ${garment}. Clean white or light studio background. Perfect body posture, confident expression. Sharp commercial fashion photography. The garment's design, silhouette, and details must be faithfully reproduced.`,
      },
      {
        type: 'editorial', label: 'Editorial Shot', description: 'Magazine-quality editorial.',
        prompt: `${refInstruction} Generate a high-fashion editorial photograph of a ${modelGender} model wearing this ${garment}. Set in a beautiful aspirational location — luxury penthouse, marble foyer, or sun-drenched street. Magazine cover quality. Dramatic artistic lighting. ${fashionStyle} aesthetic.`,
      },
      {
        type: 'detail_shot', label: 'Garment Detail', description: 'Macro detail of fabric and craftsmanship.',
        prompt: `${refInstruction} Generate a close-up macro photography shot of the ${garment}'s finest details: fabric texture, embroidery, seams, drape, or embellishments. Extremely shallow depth of field. Hyper-realistic textile photography. Clean neutral background.`,
      },
      {
        type: 'lifestyle', label: 'Lifestyle Scene', description: 'Model in a premium lifestyle setting.',
        prompt: `${refInstruction} Generate a lifestyle fashion photograph of a ${modelGender} model wearing this ${garment} in a natural aspirational setting — café, gallery, garden, or city street. Golden hour or soft natural light. Candid, effortless mood.`,
      },
      {
        type: 'flat_lay', label: 'Flat Lay', description: 'Styled overhead flat lay.',
        prompt: `${refInstruction} Generate a beautifully styled flat lay photograph of the ${garment} laid on a clean white or marble surface, seen from directly above. Pair with minimal complementary accessories. Soft even lighting, no harsh shadows. Premium fashion catalogue style.`,
      },
      {
        type: 'mannequin', label: 'Mannequin Display', description: 'Professional mannequin or bust shot.',
        prompt: `${refInstruction} Generate a professional product shot of the ${garment} displayed on a sleek white or black mannequin against a clean studio background. Perfectly pressed, styled, design details clearly visible. Commercial boutique photography quality.`,
      },
    ];
  }

  // ── Jewelry ──────────────────────────────────────────────────────────────────
  if (category === 'Jewelry') {
    const piece = productDesc || 'jewelry piece';
    return [
      {
        type: 'main_shot', label: 'Hero Shot', description: 'Dramatic studio hero shot.',
        prompt: `${refInstruction} Generate a stunning hero product photograph of this ${piece} on a jet-black reflective surface. Dramatic single-source studio lighting creates brilliant reflections and highlights. Every gemstone and metal detail photorealistic and sharp. Luxury jewellery catalogue quality.`,
      },
      {
        type: 'worn', label: 'Worn on Model', description: 'Worn elegantly by a model.',
        prompt: `${refInstruction} Generate a close-up fashion photograph of an elegant female model wearing this ${piece}. Smooth skin, graceful neckline or wrist. Soft shallow depth of field, jewellery sharp and in perfect focus. Warm studio lighting. High-end jewellery advertisement quality.`,
      },
      {
        type: 'detail', label: 'Macro Detail', description: 'Hyper-close gemstone and metal detail.',
        prompt: `${refInstruction} Generate an extreme macro photograph of this ${piece} focusing on gemstone clarity, facets, and metal finish. Ultra-shallow depth of field. Diamond-sharp focus on the main stone or detail. Background is soft bokeh. Sotheby's-level jewellery photography.`,
      },
      {
        type: 'velvet_display', label: 'Velvet Display', description: 'Premium display stand.',
        prompt: `${refInstruction} Generate a premium jewellery display photograph: the ${piece} elegantly placed on a dark velvet jewellery bust or tray inside a luxury jewellery box. Dramatic overhead spot lighting. Deep shadows, brilliant highlights. High-end retail display.`,
      },
      {
        type: 'lifestyle', label: 'Lifestyle', description: 'Aspirational lifestyle context.',
        prompt: `${refInstruction} Generate a luxury lifestyle photograph of this ${piece} worn by a model at an upscale setting — a gala, rooftop, or champagne table. Bokeh background, warm ambient light, jewellery glittering. Aspirational and editorial in mood.`,
      },
      {
        type: 'white_bg', label: 'Clean Catalogue', description: 'Clean white background catalogue shot.',
        prompt: `${refInstruction} Generate a clean professional e-commerce catalogue photograph of the ${piece} on a pure white background. All edges sharp. Perfectly even lighting. Soft shadow directly beneath. Amazon/Etsy listing quality.`,
      },
    ];
  }

  // ── Furniture ────────────────────────────────────────────────────────────────
  if (category === 'Furniture') {
    const piece = productDesc || 'furniture piece';
    return [
      {
        type: 'main_shot', label: 'Studio Catalogue', description: 'Clean studio catalogue shot.',
        prompt: `${refInstruction} Generate a professional interior product photograph of this ${piece} on a clean light-grey seamless studio background. Soft diffused lighting from both sides. Every material texture, stitch, and structural detail perfectly visible. Commercial furniture catalogue quality.`,
      },
      {
        type: 'room_scene', label: 'Room Scene', description: 'Styled in a modern living space.',
        prompt: `${refInstruction} Generate an interior design photograph of this ${piece} placed in a beautifully styled modern living room. Natural daylight from large windows. Complementary décor (plants, cushions, art). Architectural Digest quality. Furniture is the clear hero.`,
      },
      {
        type: 'detail', label: 'Material Detail', description: 'Close-up of texture and craft.',
        prompt: `${refInstruction} Generate a macro close-up of the ${piece}'s material, texture, seam, leg joint, or fabric weave. Ultra-sharp focus, shallow depth of field. Craftsmanship and premium material quality immediately apparent.`,
      },
      {
        type: 'lifestyle', label: 'Lifestyle Scene', description: 'In a luxurious aspirational environment.',
        prompt: `${refInstruction} Generate a warm lifestyle photograph of this ${piece} in a cosy aspirational home interior — penthouse, loft, or design-forward apartment. Warm golden hour light, a cup of coffee nearby, a book. Inviting, premium mood.`,
      },
      {
        type: 'angle', label: '3/4 Angle View', description: 'Reveals form and depth.',
        prompt: `${refInstruction} Generate a professional product photograph of this ${piece} from a 45-degree 3/4 angle, revealing both front and side. Clean neutral background with soft shadows beneath. All proportions and design features clearly visible.`,
      },
      {
        type: 'top_down', label: 'Top-Down View', description: "Bird's eye perspective.",
        prompt: `${refInstruction} Generate a top-down bird's eye product photograph of this ${piece} on a light stone or wooden floor. Perfectly centred composition. Soft even lighting. Clean and graphic.`,
      },
    ];
  }

  // ── Electronics ──────────────────────────────────────────────────────────────
  if (category === 'Electronics') {
    const device = productDesc || 'device';
    return [
      {
        type: 'main_shot', label: 'Hero Studio Shot', description: 'Clean studio hero shot.',
        prompt: `${refInstruction} Generate a sleek professional tech product photograph of this ${device} on a pure white or light grey background. Even studio lighting, crisp reflections on the surface. Screen or interface clearly visible. Apple-style product photography quality.`,
      },
      {
        type: 'angle', label: '3/4 Angle', description: 'Three-quarter view showing depth.',
        prompt: `${refInstruction} Generate a 3/4 angle product photograph of this ${device}. Reveals front, top, and side in a single composition. Clean gradient background. Sharp focus on every port, button, and surface detail.`,
      },
      {
        type: 'lifestyle', label: 'In Use Lifestyle', description: 'Person using the device.',
        prompt: `${refInstruction} Generate a lifestyle photograph of a person using this ${device} in a modern aspirational setting — minimalist desk, coffee shop, or creative studio. Natural ambient light. Technology enhances their life. Modern tech advertising aesthetic.`,
      },
      {
        type: 'detail', label: 'Detail Close-Up', description: 'Macro ports, buttons, surface.',
        prompt: `${refInstruction} Generate a macro close-up photograph of this ${device}'s most distinctive physical feature — port array, button cluster, camera module, or premium surface finish. Ultra-sharp focus, bokeh background. Premium materials clearly visible.`,
      },
      {
        type: 'dark_bg', label: 'Dark Dramatic', description: 'High-contrast dark background.',
        prompt: `${refInstruction} Generate a dramatic product photograph of this ${device} on a pure black background with a single rim light creating glowing edges and deep shadows. Mysterious, premium tech aesthetic. High contrast.`,
      },
      {
        type: 'flat_lay', label: 'Flat Lay Ecosystem', description: 'Device with accessories flat lay.',
        prompt: `${refInstruction} Generate a styled flat lay of this ${device} surrounded by complementary accessories — cable, case, earbuds, notebook. Top-down view on a clean marble or wood desk surface. Intentional editorial product composition.`,
      },
    ];
  }

  // ── Beauty & Cosmetics ───────────────────────────────────────────────────────
  if (category === 'Beauty') {
    const product = productDesc || 'beauty product';
    return [
      {
        type: 'main_shot', label: 'Clean Studio', description: 'Premium beauty studio shot.',
        prompt: `${refInstruction} Generate a premium beauty product photograph of this ${product} on a clean white marble or glossy white surface. Soft diffused studio lighting with perfect reflections. Every packaging detail and label is sharp and readable. High-end beauty brand catalogue quality.`,
      },
      {
        type: 'luxury_dark', label: 'Luxury Dark', description: 'Dark background, premium feel.',
        prompt: `${refInstruction} Generate a luxury beauty product photograph of this ${product} on a dark marble or black background. Dramatic single key light with rim lighting. Rich shadows and highlights emphasising the premium packaging. Chanel or La Mer advertising quality.`,
      },
      {
        type: 'flat_lay', label: 'Beauty Flatlay', description: 'Styled flat lay with props.',
        prompt: `${refInstruction} Generate a beautifully styled top-down flat lay of this ${product} surrounded by complementary beauty props — fresh flowers, marble chips, pearls, or botanical ingredients. Clean surface, soft even lighting. Instagram beauty aesthetic.`,
      },
      {
        type: 'lifestyle', label: 'Lifestyle Vanity', description: 'Product in vanity or bathroom setting.',
        prompt: `${refInstruction} Generate a lifestyle photograph of this ${product} in a beautiful minimalist bathroom or vanity setting. Soft morning light, clean surfaces, a few complementary products. Aspirational skincare routine aesthetic. Premium wellness brand feel.`,
      },
      {
        type: 'texture', label: 'Texture Close-Up', description: 'Macro of formula or product texture.',
        prompt: `${refInstruction} Generate an extreme macro close-up of this ${product}'s texture — cream, powder, liquid, or serum. Ultra-shallow depth of field capturing the richness of the formula. Luxurious, sensory, premium beauty photography.`,
      },
      {
        type: 'ingredient', label: 'Ingredient Story', description: 'Product with key ingredients.',
        prompt: `${refInstruction} Generate an editorial beauty photograph of this ${product} surrounded by its key natural ingredients — botanical extracts, flowers, or oils. Clean or marble background. Artful composition telling the ingredient story. Natural beauty brand aesthetic.`,
      },
    ];
  }

  // ── Food & Beverage ──────────────────────────────────────────────────────────
  if (category === 'Food') {
    const item = productDesc || 'food product';
    return [
      {
        type: 'main_shot', label: 'Appetizing Hero', description: 'Professional food hero shot.',
        prompt: `${refInstruction} Generate a professional appetizing hero photograph of this ${item}. Perfect food styling, fresh and vibrant. Clean backdrop that complements the food's colors. Soft natural or studio light highlighting texture and freshness. Food photography magazine quality.`,
      },
      {
        type: 'lifestyle', label: 'Kitchen & Café Context', description: 'Product in aspirational setting.',
        prompt: `${refInstruction} Generate a lifestyle food photograph of this ${item} in a beautiful aspirational kitchen or café setting. Warm natural light, rustic wood or marble surfaces. Complementary props (cutlery, cups, linen). Inviting and authentic artisan food aesthetic.`,
      },
      {
        type: 'flat_lay', label: 'Ingredient Flatlay', description: 'Product with fresh ingredients.',
        prompt: `${refInstruction} Generate a top-down flat lay of this ${item} surrounded by its fresh ingredients or complementary food items. Clean neutral surface, soft even overhead lighting. Abundant, fresh, and artful composition. Farm-to-table aesthetic.`,
      },
      {
        type: 'texture', label: 'Texture Close-Up', description: 'Macro of food texture and freshness.',
        prompt: `${refInstruction} Generate a close-up macro photograph of this ${item} emphasising texture, freshness, and appetite appeal. Very shallow depth of field. Captures steam, condensation, or the richness of the surface. Extremely appetizing.`,
      },
      {
        type: 'packaging', label: 'Premium Packaging', description: 'Focus on packaging and branding.',
        prompt: `${refInstruction} Generate a clean product photograph focusing on the ${item}'s packaging and branding. Styled on a premium surface with minimal props. Clean studio lighting. Gift-ready presentation. Premium artisan food brand quality.`,
      },
      {
        type: 'outdoor', label: 'Outdoor Picnic', description: 'Product in outdoor natural setting.',
        prompt: `${refInstruction} Generate a lifestyle photograph of this ${item} in a beautiful outdoor setting — picnic blanket, garden table, or farmer's market. Warm natural light, fresh greenery. Healthy, natural, outdoor lifestyle aesthetic.`,
      },
    ];
  }

  // ── Home Decor ───────────────────────────────────────────────────────────────
  if (category === 'HomeDecor') {
    const item = productDesc || 'home decor item';
    return [
      {
        type: 'interior', label: 'Interior Context', description: 'Styled in a beautiful room.',
        prompt: `${refInstruction} Generate an interior design photograph of this ${item} placed in a beautifully styled room. Complementary furniture and décor elements. Natural window light. The item is the clear focal point but the scene tells a cohesive design story. Architectural Digest quality.`,
      },
      {
        type: 'main_shot', label: 'White Studio', description: 'Clean studio catalogue shot.',
        prompt: `${refInstruction} Generate a clean professional product photograph of this ${item} on a pure white or light grey seamless background. Perfect even studio lighting revealing every detail, material, and texture. E-commerce hero image quality.`,
      },
      {
        type: 'natural_light', label: 'Natural Light', description: 'Soft window light, materials visible.',
        prompt: `${refInstruction} Generate a beautiful product photograph of this ${item} in soft directional natural light from a nearby window. Warm tones, materials and textures clearly visible. Cosy, authentic home atmosphere.`,
      },
      {
        type: 'lifestyle', label: 'Lifestyle Arrangement', description: 'Styled with complementary decor.',
        prompt: `${refInstruction} Generate a styled lifestyle arrangement photograph of this ${item} grouped with complementary home decor pieces — books, candles, plants, or ceramics. Artful, deliberate composition. Warm interior styling.`,
      },
      {
        type: 'detail', label: 'Material Detail', description: 'Macro of material and texture.',
        prompt: `${refInstruction} Generate a macro close-up photograph of the ${item}'s material, surface texture, or craftsmanship detail. Ultra-shallow depth of field. The quality and beauty of the material is immediately apparent.`,
      },
      {
        type: 'seasonal', label: 'Seasonal Styling', description: 'Seasonal contextual styling.',
        prompt: `${refInstruction} Generate a beautifully styled photograph of this ${item} in a seasonal context — warm autumnal tones with dried botanicals, or bright spring styling with fresh flowers. Aspirational seasonal home décor aesthetic.`,
      },
    ];
  }

  // ── Pet Products ─────────────────────────────────────────────────────────────
  if (category === 'Pet') {
    const item = productDesc || 'pet product';
    return [
      {
        type: 'in_use', label: 'Happy Pet', description: 'Pet enjoying the product.',
        prompt: `${refInstruction} Generate a heartwarming lifestyle photograph of a happy, healthy dog or cat using or playing with this ${item}. Bright, warm natural light. Joyful and playful mood. The pet's happiness and the product's quality are both clearly visible.`,
      },
      {
        type: 'main_shot', label: 'Studio Hero', description: 'Clean product studio shot.',
        prompt: `${refInstruction} Generate a clean professional product photograph of this ${item} on a white or light grey seamless background. Perfect studio lighting. Every feature and material detail clearly visible. E-commerce hero image quality.`,
      },
      {
        type: 'outdoor', label: 'Outdoor Lifestyle', description: 'Product in outdoor pet context.',
        prompt: `${refInstruction} Generate an outdoor lifestyle photograph of this ${item} in a natural setting — garden, park, or yard. Warm natural light. Shows the product in its intended outdoor environment. Fresh, active pet lifestyle aesthetic.`,
      },
      {
        type: 'cozy', label: 'Cozy Indoor', description: 'Product in warm home setting.',
        prompt: `${refInstruction} Generate a cosy indoor lifestyle photograph of this ${item} in a warm home setting. Soft ambient light, comfortable home atmosphere. Shows the product as part of a loving pet-friendly home. Warm and inviting mood.`,
      },
      {
        type: 'detail', label: 'Detail Close-Up', description: 'Macro of quality and features.',
        prompt: `${refInstruction} Generate a macro close-up photograph of this ${item}'s most distinctive features — stitching, materials, safety clasps, or texture. Ultra-sharp focus, shallow depth of field. Quality and durability clearly visible.`,
      },
      {
        type: 'gift', label: 'Gift Concept', description: 'Styled as a pet gift.',
        prompt: `${refInstruction} Generate a styled gift concept photograph of this ${item} presented with a ribbon, bow, or gift packaging. Clean warm background. Thoughtful and aspirational. Perfect for pet owners looking for a gift for their beloved companion.`,
      },
    ];
  }

  // ── Handmade & Craft ─────────────────────────────────────────────────────────
  if (category === 'Handmade') {
    const item = productDesc || 'handmade item';
    return [
      {
        type: 'maker_shot', label: 'Maker Studio', description: 'Artisan workshop context.',
        prompt: `${refInstruction} Generate a beautiful artisan maker photograph of this ${item} in a workshop or studio setting. Warm directional light, raw natural surfaces (wood, linen, stone). Tools or raw materials subtly in the background. Authentic handmade craft aesthetic.`,
      },
      {
        type: 'natural', label: 'Natural Materials', description: 'Product on natural surfaces.',
        prompt: `${refInstruction} Generate an editorial product photograph of this ${item} on beautiful natural surfaces — aged wood, linen cloth, or rough stone. Soft natural light. Every handmade detail and texture visible. Etsy premium listing quality.`,
      },
      {
        type: 'detail', label: 'Craft Detail', description: 'Macro of handmade details.',
        prompt: `${refInstruction} Generate an extreme close-up macro photograph of the ${item}'s finest handmade detail — stitching, weaving, carving, glaze, or texture. Ultra-shallow depth of field. The human craftsmanship and uniqueness is the focal point.`,
      },
      {
        type: 'gift', label: 'Gift Lifestyle', description: 'Product styled as a thoughtful gift.',
        prompt: `${refInstruction} Generate a warm lifestyle photograph of this ${item} styled as a thoughtful gift — on a wooden tray, wrapped in tissue paper, with a handwritten card. Soft natural light. Warm, personal, and premium gift-giving aesthetic.`,
      },
      {
        type: 'process', label: 'Process Story', description: 'Product with raw materials.',
        prompt: `${refInstruction} Generate an editorial flat lay of this ${item} alongside the raw materials used to create it — yarns, clay, wood shavings, or fabric swatches. Clean natural surface. Top-down composition. Tells the story of skilled craftsmanship.`,
      },
      {
        type: 'clean', label: 'Clean Presentation', description: 'Minimal clean product shot.',
        prompt: `${refInstruction} Generate a clean minimal product photograph of this ${item} on a white or cream background. Soft even lighting. Professional yet warm. Every detail of the handmade quality clearly visible. Online shop hero image quality.`,
      },
    ];
  }

  // ── Sports & Fitness ─────────────────────────────────────────────────────────
  if (category === 'Sports') {
    const item = productDesc || 'sports product';
    return [
      {
        type: 'action', label: 'Action In-Use', description: 'Person actively using the product.',
        prompt: `${refInstruction} Generate a dynamic action photograph of a fit, athletic person using this ${item} in an intense workout or athletic context. Motion blur optional. High energy. Premium sportswear or equipment advertising quality.`,
      },
      {
        type: 'main_shot', label: 'Studio Hero', description: 'Clean product shot on white.',
        prompt: `${refInstruction} Generate a clean professional product photograph of this ${item} on a white or light grey seamless background. Perfect studio lighting. Every technical feature, material, and design detail clearly visible. Sporting goods catalogue quality.`,
      },
      {
        type: 'outdoor', label: 'Outdoor Performance', description: 'Product in outdoor athletic context.',
        prompt: `${refInstruction} Generate an outdoor athletic lifestyle photograph of this ${item} in an inspiring outdoor setting — mountain trail, urban running track, or beach. Bright natural light. Premium performance and adventure aesthetic.`,
      },
      {
        type: 'detail', label: 'Technical Detail', description: 'Macro of features and materials.',
        prompt: `${refInstruction} Generate a macro close-up photograph of this ${item}'s most distinctive technical features — grip texture, sole pattern, breathable mesh, or reinforced stitching. Ultra-sharp focus. Engineering and quality are the focal point.`,
      },
      {
        type: 'dark_dramatic', label: 'Motivational Dark', description: 'Dramatic dark performance vibe.',
        prompt: `${refInstruction} Generate a dramatic, high-contrast motivational product photograph of this ${item} on a dark background. Single dramatic rim light. Bold and powerful. Premium performance brand aesthetic — Nike or Under Armour quality.`,
      },
      {
        type: 'flat_lay', label: 'Gear Flat Lay', description: 'Product with complementary fitness gear.',
        prompt: `${refInstruction} Generate a styled top-down flat lay of this ${item} arranged with complementary fitness equipment or accessories — water bottle, towel, earbuds, or resistance bands. Clean gym floor or wood surface. Athletic lifestyle editorial composition.`,
      },
    ];
  }

  // ── Books & Media ────────────────────────────────────────────────────────────
  if (category === 'Books') {
    const item = productDesc || 'book';
    return [
      {
        type: 'editorial_stack', label: 'Editorial Stack', description: 'Artfully stacked books.',
        prompt: `${refInstruction} Generate an editorial photograph of this ${item} in a beautifully styled book stack with complementary titles. Warm ambient library light. Bookstore or library aesthetic. Sophisticated literary atmosphere.`,
      },
      {
        type: 'reading_context', label: 'Reading Context', description: 'Cozy reading corner.',
        prompt: `${refInstruction} Generate a warm lifestyle photograph of this ${item} in a cosy reading corner — armchair, soft blanket, warm lamp light, a cup of tea nearby. Inviting, intellectual, and aspirational reading lifestyle aesthetic.`,
      },
      {
        type: 'main_shot', label: 'White Studio', description: 'Clean catalogue spine and cover shot.',
        prompt: `${refInstruction} Generate a clean professional catalogue photograph of this ${item} showing both the cover and spine clearly. White seamless background, perfectly even studio lighting. Every detail of the cover artwork and typography is sharp.`,
      },
      {
        type: 'flat_lay', label: 'Aesthetic Flatlay', description: 'Book with lifestyle props.',
        prompt: `${refInstruction} Generate a beautiful top-down flat lay of this ${item} surrounded by cosy lifestyle props — coffee cup, reading glasses, a flower, and a few autumn leaves or bookmarks. Clean surface, soft even lighting. Instagram-worthy aesthetic.`,
      },
      {
        type: 'desk_lifestyle', label: 'Author Desk', description: 'Product on a writer or reader desk.',
        prompt: `${refInstruction} Generate a lifestyle photograph of this ${item} on a beautiful writer or reader's desk — pen, notebook, candle, and plants nearby. Warm directional desk lamp light. Intellectual and creative atmosphere.`,
      },
      {
        type: 'gift', label: 'Gift Presentation', description: 'Book styled as a gift.',
        prompt: `${refInstruction} Generate a warm gift presentation photograph of this ${item} with a ribbon, a handwritten gift tag, or inside a kraft paper wrapping. Soft natural light. Thoughtful and personal. Perfect as a gift concept.`,
      },
    ];
  }

  // ── Baby & Kids ──────────────────────────────────────────────────────────────
  if (category === 'Baby') {
    const item = productDesc || 'baby product';
    return [
      {
        type: 'main_shot', label: 'Safe & Clean Studio', description: 'Pure clean studio shot.',
        prompt: `${refInstruction} Generate a soft, clean professional product photograph of this ${item} on a white or pastel seamless background. Gentle even lighting. Every safety feature and material detail clearly visible. Premium baby product catalogue quality.`,
      },
      {
        type: 'nursery', label: 'Nursery Context', description: 'Product in a styled nursery.',
        prompt: `${refInstruction} Generate a beautiful lifestyle photograph of this ${item} in a beautifully styled nursery — soft muted pastels, warm gentle light, complementary nursery items. Safe, loving, and aspirational parenting aesthetic.`,
      },
      {
        type: 'lifestyle', label: 'Parent & Child', description: 'Product in use with a child.',
        prompt: `${refInstruction} Generate a heartwarming lifestyle photograph of a parent and young child using or interacting with this ${item}. Soft natural light. Genuine, joyful, and loving moment. Premium parenting brand advertising quality.`,
      },
      {
        type: 'playful', label: 'Playful Color', description: 'Bright and cheerful composition.',
        prompt: `${refInstruction} Generate a bright, cheerful product photograph of this ${item} with playful color accents. Fun props like soft toys, wooden blocks, or colorful fabric. Bright natural light. Joyful, energetic, child-friendly aesthetic.`,
      },
      {
        type: 'detail', label: 'Safety Detail', description: 'Macro of safety features and materials.',
        prompt: `${refInstruction} Generate a reassuring macro close-up of this ${item}'s safety features — soft seams, rounded edges, non-toxic materials, or certified clasps. Ultra-sharp focus. Communicates safety, quality, and care for parents.`,
      },
      {
        type: 'gift', label: 'Gift Packaging', description: 'Product styled as a baby gift.',
        prompt: `${refInstruction} Generate a beautiful gift packaging photograph of this ${item} styled for a baby shower or birthday — soft tissue paper, a pastel ribbon, and a gift tag. Warm soft light. Thoughtful, premium, and celebratory.`,
      },
    ];
  }

  // ── General ──────────────────────────────────────────────────────────────────
  const item = productDesc || 'product';
  return [
    {
      type: 'main_shot', label: 'Hero Shot', description: 'Clean studio hero shot.',
      prompt: `${refInstruction} Generate a professional commercial product photograph of this ${item} against a clean white or light grey studio background. Perfect lighting, sharp focus on every detail. E-commerce hero image quality.`,
    },
    {
      type: 'angle', label: 'Angle View', description: '3/4 view showing depth and form.',
      prompt: `${refInstruction} Generate a professional 3/4 angle product photograph of this ${item}. Reveals depth, shape, and all design details. Clean neutral background, soft shadow.`,
    },
    {
      type: 'lifestyle', label: 'Lifestyle Scene', description: 'Product in real-world context.',
      prompt: `${refInstruction} Generate a lifestyle photograph of this ${item} in an aspirational natural setting that matches the product's purpose. Warm ambient light. Product is the clear hero.`,
    },
    {
      type: 'detail', label: 'Detail Close-Up', description: 'Macro focus on texture and craft.',
      prompt: `${refInstruction} Generate a macro close-up photograph of this ${item}'s most distinctive feature or finest detail. Hyper-sharp focus, shallow depth of field. Premium material quality clearly visible.`,
    },
    {
      type: 'dark_bg', label: 'Dark Dramatic', description: 'High-contrast dramatic presentation.',
      prompt: `${refInstruction} Generate a dramatic product photograph of this ${item} on a dark background with a single artistic light source creating depth and contrast. Sophisticated, premium aesthetic.`,
    },
    {
      type: 'flat_lay', label: 'Flat Lay', description: 'Styled overhead composition.',
      prompt: `${refInstruction} Generate a beautifully styled flat lay photograph of this ${item} on a clean surface, seen from directly above. Minimal complementary props. Soft even lighting. Clean editorial composition.`,
    },
  ];
}
