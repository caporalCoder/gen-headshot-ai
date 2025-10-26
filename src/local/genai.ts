import { GoogleGenAI } from '@google/genai';
import type { HeadshotStyle } from '../prompts';

function getApiKey(): string {
  // Prefer Vite env var; fallback to localStorage for quick local testing
  const fromEnv = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
  const fromStorage = typeof window !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') || undefined : undefined;
  const apiKey = fromEnv || fromStorage;
  if (!apiKey) {
    throw new Error('Missing Gemini API key. Set VITE_GEMINI_API_KEY or store it in localStorage under GEMINI_API_KEY.');
  }
  return apiKey;
}

export async function generateHeadshotsWithGemini(
  imageBase64: string,
  style: HeadshotStyle,
  prompt: string
): Promise<string[]> {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  // Clean base64 (strip data URL prefix if present)
  const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  const mimeType = mimeMatch?.[1] || 'image/jpeg';
  const base64Image = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  const generatedImages: string[] = [];

  // Same variation instructions as the server code
  const variations = [
    `\n\n=== VARIATION 1 SPECIFIC INSTRUCTIONS ===
Camera Angle: Positioned at exact eye level, creating a direct, equal connection with the viewer.
Face Centering: CRITICAL - The subject's face must be horizontally centered in the frame with their nose aligned to the vertical center line. Eyes positioned one-third from the top. Keep headroom minimal (8-10% of frame height) for this tighter composition.
Expression: PRESERVE THE SUBJECT'S NATURAL EXPRESSION from the original photo. If they're smiling in the original, show a warm, genuine smile with natural warmth in the eyes. If they're neutral or serious in the original, maintain that authentic demeanor. DO NOT add a smile if the original doesn't show teeth or isn't smiling - respect their natural expression. The key is enhancing their authentic energy, not changing it.
Lighting: Bright, even illumination with a slightly stronger key light creating gentle dimension. Shadows are soft and flattering.
Framing: Slightly tighter composition - the face fills more of the frame with less headroom above, creating intimacy and engagement. Ensure the entire head including top of hair is visible - no cropping.
Head Position: Subject's head is turned very subtly (approximately 5-8 degrees) to their left, creating gentle asymmetry while maintaining centered face positioning.
Mood: Approachable, warm, and engaging with bright, optimistic energy.`,

    `\n\n=== VARIATION 2 SPECIFIC INSTRUCTIONS ===
Camera Angle: Positioned slightly above eye level (12-15 degrees), creating a universally flattering downward angle that enhances facial structure.
Face Centering: CRITICAL - Perfect horizontal centering with the subject's nose aligned exactly to the vertical center line of the frame. Eyes positioned precisely one-third down from the top edge. Standard professional headroom (10-12% of frame height).
Expression: MATCH AND HONOR the subject's authentic expression from the original photo. If they're showing warmth or happiness in the original, capture confident, professional warmth - perhaps a more subtle or refined version (closed-mouth if appropriate). If they're serious or contemplative in the original, enhance that with composed confidence and direct engagement. Never force an expression that contradicts their natural energy. Their eyes should be engaged and full of presence.
Lighting: More dramatic contrast with the key light stronger and fill light softer, creating defined but gentle shadows that sculpt the face beautifully. The interplay of light and shadow adds sophistication.
Framing: Classic, balanced professional composition with proper headroom - the gold standard of portrait framing. Full head visible with no cropping at edges.
Head Position: Subject faces directly toward the camera, head perfectly straight and aligned with the frame's center - strong, confident, direct.
Mood: Polished, confident, and sophisticated with professional gravitas.`,

    `\n\n=== VARIATION 3 SPECIFIC INSTRUCTIONS ===
Camera Angle: Positioned slightly below eye level (8-12 degrees), creating a powerful, commanding perspective that conveys authority and presence.
Face Centering: CRITICAL - Subject's face horizontally centered in the frame with nose on the vertical center line. Eyes positioned one-third from top. More generous headroom (12-15% of frame height) to accommodate the wider composition.
Expression: COMPLETELY RESPECT the subject's original expression and energy. If the original shows reserved, serious, or contemplative qualities, amplify that with composed, thoughtful intensity - professional and authoritative without coldness. If the original shows any warmth, maintain subtle warmth in the eyes while keeping the overall demeanor more composed and serious. The expression should feel authentic to who they are, just elevated to editorial quality. Never artificially impose seriousness if it contradicts their natural energy.
Lighting: Softer overall with beautiful wraparound quality - the light seems to envelop the subject gently. Shadows are present but very soft, creating dimension without drama.
Framing: Slightly wider composition showing more of the shoulders and upper body, creating a sense of presence and groundedness. Entire head and hair fully visible within frame.
Head Position: Subject's head is turned very subtly (approximately 5-8 degrees) to their right, creating asymmetry that mirrors Variation 1 but from the opposite direction, while face remains centered.
Mood: Powerful, thoughtful, and substantial with quiet confidence and depth.`,
  ];

  for (let i = 0; i < 3; i++) {
    // Append variation-specific instructions to the prompt
    const variationPrompt = prompt + variations[i];
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        {
          parts: [
            { inlineData: { mimeType, data: base64Image } },
            { text: variationPrompt },
          ],
        },
      ],
      config: {
        responseModalities: ['Image'],
        imageConfig: { aspectRatio: '1:1' },
      },
    });

    const first = response.candidates?.[0]?.content?.parts;
    if (!first) continue;
    let imageData: string | null = null;
    for (const p of first) {
      if ((p as any).inlineData?.data) {
        imageData = (p as any).inlineData.data as string;
        break;
      }
    }
    if (imageData) {
      generatedImages.push(`data:image/png;base64,${imageData}`);
    }
  }

  if (generatedImages.length === 0) {
    throw new Error('Failed to generate any images.');
  }

  return generatedImages;
}
