import "server-only";
import { AnthropicTextProvider } from "./providers/anthropic";
import { LocalTextProvider } from "./providers/local";
import { OpenAIImageProvider, OpenAITextProvider } from "./providers/openai";
import { ReplicateImageProvider } from "./providers/replicate";
import { ProviderNotConfiguredError, type ImageProvider, type TextProvider } from "./providers/types";

/**
 * Provider registry. Selection is driven purely by server environment
 * variables, so switching providers needs no code changes.
 */
export function getTextProvider(): TextProvider {
  const pref = (process.env.AI_TEXT_PROVIDER || "").toLowerCase();
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (pref === "local") return new LocalTextProvider();
  if ((pref === "anthropic" || !pref) && anthropicKey) return new AnthropicTextProvider(anthropicKey);
  if ((pref === "openai" || !pref) && openaiKey) return new OpenAITextProvider(openaiKey);
  return new LocalTextProvider();
}

export function getImageProvider(): ImageProvider {
  const pref = (process.env.AI_IMAGE_PROVIDER || "").toLowerCase();
  const openaiKey = process.env.OPENAI_API_KEY;
  const replicate = process.env.REPLICATE_API_TOKEN;
  if ((pref === "openai" || !pref) && openaiKey) return new OpenAIImageProvider(openaiKey);
  if ((pref === "replicate" || !pref) && replicate) return new ReplicateImageProvider(replicate);
  throw new ProviderNotConfiguredError(
    "AI image generation is not configured.",
    "Set OPENAI_API_KEY (gpt-image-1) or REPLICATE_API_TOKEN (FLUX) in your server environment, then restart the server.",
  );
}

export function aiStatus() {
  const text = getTextProvider();
  let image: { configured: boolean; label: string | null } = { configured: false, label: null };
  try {
    image = { configured: true, label: getImageProvider().label };
  } catch {
    /* not configured */
  }
  return {
    text: { id: text.id, label: text.label, isAI: text.isAI },
    image,
    removeBg: { configured: Boolean(process.env.REMOVE_BG_API_KEY) },
    photos: { provider: process.env.UNSPLASH_ACCESS_KEY ? "unsplash" : "openverse" },
  };
}
