import "server-only";
import type { ImageRequest } from "../schema";
import type { GeneratedImage, ImageProvider } from "./types";

/** Replicate-hosted image models (default: FLUX schnell). */
export class ReplicateImageProvider implements ImageProvider {
  readonly id = "replicate" as const;
  readonly label = "Replicate";
  constructor(private token: string, private model = process.env.REPLICATE_IMAGE_MODEL || "black-forest-labs/flux-schnell") {}

  async generate(req: ImageRequest, fullPrompt: string): Promise<GeneratedImage[]> {
    if (!/^[\w.-]+\/[\w.-]+$/.test(this.model)) throw new Error("Invalid REPLICATE_IMAGE_MODEL");
    const res = await fetch(`https://api.replicate.com/v1/models/${this.model}/predictions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json", Prefer: "wait=60" },
      body: JSON.stringify({ input: { prompt: fullPrompt, aspect_ratio: req.aspect, num_outputs: req.count, output_format: "png" } }),
      signal: AbortSignal.timeout(180_000),
    });
    if (!res.ok) throw new Error(`Replicate error ${res.status}`);
    let pred = await res.json();
    const trusted = (u: string) => {
      try {
        const h = new URL(u).hostname;
        return h === "api.replicate.com" || h.endsWith(".replicate.delivery") || h === "replicate.delivery";
      } catch {
        return false;
      }
    };
    const started = Date.now();
    while (pred.status && !["succeeded", "failed", "canceled"].includes(pred.status) && Date.now() - started < 150_000) {
      await new Promise((r) => setTimeout(r, 1500));
      if (!trusted(pred.urls?.get)) throw new Error("Unexpected polling URL");
      const poll = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${this.token}` } });
      pred = await poll.json();
    }
    if (pred.status !== "succeeded") throw new Error(`Image generation ${pred.status ?? "failed"}`);
    const urls: string[] = Array.isArray(pred.output) ? pred.output : [pred.output];
    return Promise.all(
      urls.filter(trusted).map(async (u) => {
        const r = await fetch(u);
        const buf = Buffer.from(await r.arrayBuffer());
        return { dataUrl: `data:${r.headers.get("content-type") ?? "image/png"};base64,${buf.toString("base64")}` };
      }),
    );
  }
}
