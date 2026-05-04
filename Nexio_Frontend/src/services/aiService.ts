export async function generateAdImage(
  base64Image: string,
  mimeType: string,
  prompt: string,
): Promise<string> {
  const res = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64: base64Image, mimeType, prompt }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Image generation failed (${res.status})`);
  }
  const { imageUrl } = await res.json();
  return imageUrl;
}
