import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type GeneratedMenu = {
  categories: { name: string; items: { name: string; description: string; price: number }[] }[];
};

export const generateMenu = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { prompt: string; currency?: string }) => {
    const prompt = String(data.prompt ?? "")
      .trim()
      .slice(0, 200);
    if (!prompt) throw new Error("Describe your business first");
    return { prompt, currency: data.currency ?? "₹" };
  })
  .handler(async ({ data }) => {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You generate digital menus/catalogs for local businesses. Return 4-6 categories, each with 4-8 realistic items. Prices are plain numbers in the shop's local currency (Indian rupees unless obvious otherwise). Descriptions are max 90 characters.",
          },
          { role: "user", content: `Business: ${data.prompt}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_menu",
              description: "Return the generated menu",
              parameters: {
                type: "object",
                properties: {
                  categories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        items: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              description: { type: "string" },
                              price: { type: "number" },
                            },
                            required: ["name", "description", "price"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["name", "items"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["categories"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_menu" } },
      }),
    });

    if (res.status === 429) throw new Error("AI is busy right now, please retry in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
    if (!res.ok) throw new Error("Could not generate the menu. Please try again.");

    const json = (await res.json()) as {
      choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
    };
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("AI returned an empty menu.");
    return JSON.parse(args) as GeneratedMenu;
  });

type ScannedMenu = {
  items: { name: string; description: string; price: number; category: string }[];
};

export const scanMenuPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { image: string }) => {
    const image = String(data.image ?? "");
    if (!image.startsWith("data:image/")) throw new Error("Upload a valid image");
    if (image.length > 8_000_000) throw new Error("Image is too large (max ~5MB)");
    return { image };
  })
  .handler(async ({ data }) => {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You read photos of printed menus, price lists and product catalogs. Extract every readable item with its price. Price must be a plain number. If a category heading is visible use it, otherwise use 'General'. Description max 90 chars; leave empty if none printed.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all items and prices from this menu photo." },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_items",
              description: "Return the extracted menu items",
              parameters: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        price: { type: "number" },
                        category: { type: "string" },
                      },
                      required: ["name", "description", "price", "category"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["items"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_items" } },
      }),
    });

    if (res.status === 429) throw new Error("AI is busy right now, try again in a moment");
    if (res.status === 402) throw new Error("AI credits exhausted");
    if (!res.ok) throw new Error("Could not read that photo");

    const json = (await res.json()) as {
      choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
    };
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("No items found in that photo");
    return JSON.parse(args) as ScannedMenu;
  });

/** Generates a shop logo or cover image with AI and stores it in shop media. */
export const generateShopImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { shopId: string; kind: "logo" | "cover"; prompt: string }) => {
    const shopId = String(data.shopId ?? "");
    const prompt = String(data.prompt ?? "")
      .trim()
      .slice(0, 300);
    if (!shopId) throw new Error("Missing shop");
    if (!prompt) throw new Error("Describe the image you want");
    return { shopId, kind: data.kind === "cover" ? ("cover" as const) : ("logo" as const), prompt };
  })
  .handler(async ({ data, context }) => {
    const { data: shop, error: shopErr } = await context.supabase
      .from("shops")
      .select("id")
      .eq("id", data.shopId)
      .maybeSingle();
    if (shopErr || !shop) throw new Error("You cannot edit this shop");

    const size = data.kind === "cover" ? "1536x1024" : "1024x1024";
    const styled =
      data.kind === "cover"
        ? `Wide premium banner photo for a local business. ${data.prompt}. Clean, well-lit, no text, no watermark.`
        : `Minimal modern circular brand logo mark. ${data.prompt}. Flat vector style, solid background, no text.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-image-2",
        prompt: styled,
        quality: "low",
        size,
        n: 1,
      }),
    });

    if (res.status === 429) throw new Error("AI is busy right now, try again in a moment");
    if (res.status === 402) throw new Error("AI credits exhausted");
    if (!res.ok) throw new Error("Could not generate that image");

    const json = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
    const first = json.data?.[0];
    let bytes: Uint8Array;
    if (first?.b64_json) {
      const bin = atob(first.b64_json);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    } else if (first?.url) {
      bytes = new Uint8Array(await (await fetch(first.url)).arrayBuffer());
    } else {
      throw new Error("AI returned no image");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${data.shopId}/${data.kind}-${crypto.randomUUID()}.png`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("shop-media")
      .upload(path, bytes, { contentType: "image/png", upsert: true });
    if (upErr) throw new Error(upErr.message);
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("shop-media")
      .createSignedUrl(path, 60 * 60 * 24 * 3650);
    if (signErr || !signed) throw new Error("Could not publish the generated image");
    return { url: signed.signedUrl };
  });
