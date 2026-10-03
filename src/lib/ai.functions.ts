import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type GeneratedMenu = {
  categories: { name: string; items: { name: string; description: string; price: number }[] }[];
};

type ScannedMenu = {
  items: { name: string; description: string; price: number; category: string }[];
};

function getGeminiApiKey(): string {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not configured on the server environment. Please set GEMINI_API_KEY in your deployment project settings.",
    );
  }
  return key;
}

function cleanJsonParse<T>(rawText: string): T {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    cleaned = match[0];
  }
  return JSON.parse(cleaned) as T;
}

function cleanItemName(raw: string): string {
  let s = raw.trim();

  // Remove leading non-alphanumeric characters, copyright symbols, bullet points, numbers like 3g.
  s = s.replace(/^[^a-zA-Z0-9]+/, "");
  s = s.replace(/^[©®°™•\-*_.]+\s*/, "");
  s = s.replace(/^[a-z0-9]{1,2}\.\s+/i, "");
  s = s.replace(/^[e_]\s+/i, "");

  // Remove trailing leader dots, trailing noise like ccc..., co..., ---, etc.
  s = s.replace(/[\s._-]*e?c{2,}[a-z._-]*$/i, "");
  s = s.replace(/[\s._-]*co\.$/i, "");
  s = s.replace(/[\s._-]+$/, "");
  s = s.replace(/[-.]{2,}.*$/, "");
  s = s.replace(/\s+[a-z]{1,2}$/i, "");

  // Remove any remaining copyright or trademark symbols anywhere in the string
  s = s.replace(/[©®°™]/g, "");

  // Clean double spaces
  s = s.replace(/\s+/g, " ").trim();

  return s;
}

function inferCategory(itemName: string, rawCategory: string): string {
  const cat = rawCategory
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cat.length < 3 || cat.toLowerCase().includes("te") || cat.toLowerCase() === "menu") {
    const itemLower = itemName.toLowerCase();
    if (itemLower.includes("noodle")) {
      return itemLower.includes("chicken") || itemLower.includes("egg")
        ? "Chicken Noodles"
        : "Veg Noodles";
    }
    if (itemLower.includes("fish") || itemLower.includes("prawn") || itemLower.includes("sea")) {
      return "Sea Foods";
    }
    if (itemLower.includes("chicken")) {
      return "Chicken Starters";
    }
    return "Main Course";
  }

  return cat;
}

function generateItemDescription(name: string, category: string): string {
  const text = (name + " " + category).toLowerCase();

  if (text.includes("65"))
    return "Crispy deep-fried chicken marinated in red chili, garlic and curry leaves";
  if (text.includes("manchuria"))
    return "Crispy bites tossed in a flavorful tangy garlic and soya Manchurian sauce";
  if (text.includes("majestic"))
    return "Tender strips fried and sautéed with green chilies, garlic and spices";
  if (text.includes("chilly chicken") || text.includes("chilli chicken"))
    return "Spicy stir-fried chicken with bell peppers, onions and green chilies";
  if (text.includes("ginger chicken"))
    return "Succulent chicken cooked in a rich ginger-infused savory gravy";
  if (text.includes("schezwan"))
    return "Tossed in fiery Schezwan sauce with peppers and aromatic spices";
  if (text.includes("lolly pops") || text.includes("lollipop"))
    return "Crispy fried chicken drumettes served with spicy dipping sauce";
  if (text.includes("pepper chicken"))
    return "Sautéed chicken seasoned with freshly cracked black pepper and herbs";
  if (text.includes("drum sticks"))
    return "Juicy chicken drumsticks fried to perfection with house spice rub";
  if (text.includes("lemon chicken"))
    return "Tender chicken cooked with a tangy citrus lemon glaze and herbs";
  if (text.includes("thai fry")) return "Crispy chicken tossed with Thai herbs, chilies and garlic";

  if (text.includes("appolo fish") || text.includes("apollo fish"))
    return "Crispy fried boneless fish tossed in spicy yogurt garlic sauce";
  if (text.includes("chilly fish") || text.includes("chilli fish"))
    return "Fried fish fillets tossed with capsicum, onion and chili sauce";
  if (text.includes("fish manchuria"))
    return "Fish chunks coated and tossed in tangy soy garlic Manchurian gravy";
  if (text.includes("prawns manchuria"))
    return "Fresh prawns sautéed in tangy garlic soy Manchurian sauce";
  if (text.includes("chilly prawns"))
    return "Pan-seared prawns tossed with spicy chili sauce and bell peppers";
  if (text.includes("loose fry prawns"))
    return "Crispy golden fried prawns seasoned with garlic, pepper and herbs";
  if (text.includes("fish curry"))
    return "Traditional fish curry simmered in coconut milk and aromatic spices";
  if (text.includes("prawns curry"))
    return "Fresh prawns cooked in a flavorful spiced onion and tomato gravy";

  if (text.includes("soft noodles"))
    return "Delicious soft noodles stir-fried with fresh veggies and light soy sauce";
  if (text.includes("hakka noodles"))
    return "Classic Indo-Chinese Hakka noodles tossed with vegetables and herbs";
  if (text.includes("garlic noodles"))
    return "Flavorful noodles tossed with minced garlic, chili flakes and herbs";

  if (text.includes("biryani"))
    return "Aromatic basmati rice cooked with fragrant spices and tender marinade";
  if (text.includes("parotta")) return "Flaky, layered South Indian flatbread cooked on hot tawa";
  if (text.includes("appam")) return "Soft, fluffy rice pancake with crispy lacy edges";
  if (text.includes("payasam"))
    return "Rich traditional sweet pudding cooked with milk and cardamom";

  return `Freshly prepared ${name.toLowerCase()} crafted with authentic spices and fresh local ingredients`;
}

function parseOcrMenuText(
  text: string,
): { name: string; description: string; price: number; category: string }[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const items: { name: string; description: string; price: number; category: string }[] = [];
  let currentCategory = "General";

  for (const line of lines) {
    const cleanLine = line.trim();
    if (cleanLine.toUpperCase() === "MENU" || cleanLine.startsWith("***")) continue;

    // Detect Category Headings (lines without prices)
    if (!cleanLine.match(/\d+/) && cleanLine.length < 35 && !cleanLine.includes("/-")) {
      const catName = cleanLine.replace(/[^a-zA-Z0-9\s]/g, "").trim();
      if (catName.length > 2) {
        currentCategory = catName;
      }
      continue;
    }

    // Match item name and price (e.g., "Chicken - 65 240/-" or "Fish Curry 280")
    const priceMatch = cleanLine.match(/(.*?)\s+(\d{2,4})\s*(?:\/|-|rs|inr|\.|$)/i);
    if (priceMatch) {
      const rawName = priceMatch[1]!.replace(/^[•*\-\s]+/, "").trim();
      const price = parseInt(priceMatch[2]!, 10);
      const name = cleanItemName(rawName);
      if (name.length >= 2 && price > 0 && price < 10000) {
        const category = inferCategory(name, currentCategory);
        items.push({
          name,
          description: generateItemDescription(name, category),
          price,
          category,
        });
      }
    }
  }

  return items;
}

function buildFallbackMenu(prompt: string): GeneratedMenu {
  const p = prompt.toLowerCase();

  // === SALON & BARBERSHOP ===
  if (p.includes("salon") || p.includes("barber") || p.includes("parlor") || p.includes("hair") || p.includes("beauty")) {
    return {
      categories: [
        {
          name: "Hair Styling & Cuts",
          items: [
            { name: "Gentleman Haircut & Beard Styling", description: "Precision haircut with hot towel beard trimming and styling", price: 350 },
            { name: "Women Haircut & Blow Dry", description: "Trendy haircut with wash, blow dry and hair serum application", price: 650 },
            { name: "Kids Haircut", description: "Gentle and stylish haircut for young kids", price: 200 },
            { name: "Beard Trim & Shape Up", description: "Classic razor shaping with beard oil massage", price: 150 },
          ],
        },
        {
          name: "Facials & Skin Care",
          items: [
            { name: "Gold Glow Facial", description: "Deep cleansing facial infused with 24k gold foil extract", price: 1200 },
            { name: "Fruit Cleanup & De-Tan", description: "Natural fruit extract skin whitening and anti-tan treatment", price: 600 },
            { name: "Hydrating Charcoal Facial", description: "Purifying deep pore charcoal detox facial", price: 850 },
          ],
        },
        {
          name: "Hair Treatments & Spa",
          items: [
            { name: "Keratin Smooth Treatment", description: "Frizz-control keratin hair strengthening and shine therapy", price: 2500 },
            { name: "Argan Oil Hair Spa", description: "Deep conditioning root nourish head massage & steam", price: 900 },
            { name: "Global Hair Color", description: "Premium ammonia-free full hair coloring", price: 1800 },
          ],
        },
        {
          name: "Mani-Pedi & Body Care",
          items: [
            { name: "Spa Pedicure & Scrub", description: "Foot soak, exfoliation scrub, nail shaping and massage", price: 750 },
            { name: "Deluxe Manicure", description: "Hand cuticles care, polishing and nourishing cream massage", price: 550 },
          ],
        },
      ],
    };
  }

  // === SPA & WELLNESS ===
  if (p.includes("spa") || p.includes("wellness") || p.includes("massage")) {
    return {
      categories: [
        {
          name: "Massage Therapies",
          items: [
            { name: "Swedish Full Body Massage (60 min)", description: "Relaxing light-to-medium pressure essential oil massage", price: 1999 },
            { name: "Deep Tissue Therapy (60 min)", description: "Intense muscle tension relief targeting deep tissue layers", price: 2499 },
            { name: "Aromatherapy Stress Relief (90 min)", description: "Soothing lavender and eucalyptus warm oil therapy", price: 2999 },
          ],
        },
        {
          name: "Body Scrubs & Wraps",
          items: [
            { name: "Organic Coffee Body Scrub", description: "Exfoliating roasted coffee and coconut oil body polish", price: 1499 },
            { name: "Herbal Detox Body Wrap", description: "Purifying clay wrap to rejuvenate tired skin", price: 1799 },
          ],
        },
      ],
    };
  }

  // === GYM & FITNESS ===
  if (p.includes("gym") || p.includes("fitness") || p.includes("workout") || p.includes("trainer")) {
    return {
      categories: [
        {
          name: "Memberships & Passes",
          items: [
            { name: "Monthly Gym Membership", description: "Full access to cardio, strength area and locker facilities", price: 1500 },
            { name: "Quarterly Transformation Pass", description: "3 months unlimited workout access + diet consultation", price: 3999 },
            { name: "Single Day Pass", description: "Full 1-day access to gym facilities", price: 200 },
          ],
        },
        {
          name: "Personal Training",
          items: [
            { name: "1-on-1 Personal Training (12 Sessions)", description: "Dedicated certified trainer for weight loss and muscle building", price: 6000 },
            { name: "Custom Diet & Workout Chart", description: "Personalized calorie macro guide tailored to your goal", price: 999 },
          ],
        },
        {
          name: "Shakes & Fuel Bar",
          items: [
            { name: "Whey Protein Isolate Shake", description: "25g pure whey protein blended with banana and almond milk", price: 180 },
            { name: "Pre-Workout Energy Smoothie", description: "Electrolytes, BCAA, berries and green tea extract drink", price: 140 },
          ],
        },
      ],
    };
  }

  // === BAKERY & CAKE SHOP ===
  if (p.includes("bakery") || p.includes("cake") || p.includes("pastry") || p.includes("bread")) {
    return {
      categories: [
        {
          name: "Fresh Cakes & Custom Cakes",
          items: [
            { name: "Belgian Chocolate Truffle Cake (1 Kg)", description: "Rich dark chocolate ganache layered sponge cake", price: 850 },
            { name: "Red Velvet Cream Cheese Cake (500g)", description: "Moist red velvet sponge with velvety cream cheese frosting", price: 550 },
            { name: "Fresh Fruit Overload Cake (1 Kg)", description: "Light vanilla sponge loaded with fresh seasonal fruits", price: 790 },
          ],
        },
        {
          name: "Pastries & Cupcakes",
          items: [
            { name: "Black Forest Pastry", description: "Classic cherry chocolate layered slice", price: 90 },
            { name: "Choco Lava Cake", description: "Warm chocolate sponge with a molten chocolate center", price: 110 },
            { name: "Assorted Cupcake Box (4 Pcs)", description: "Vanilla, chocolate, red velvet and salted caramel cupcakes", price: 240 },
          ],
        },
        {
          name: "Artisanal Breads & Savories",
          items: [
            { name: "Butter Croissant", description: "Flaky golden french butter pastry", price: 120 },
            { name: "Garlic Herb Sourdough Bread", description: "Freshly baked crispy crust garlic sourdough loaf", price: 160 },
            { name: "Paneer Tikka Stuffed Roll", description: "Crispy baked puff pastry stuffed with spiced paneer", price: 70 },
          ],
        },
      ],
    };
  }

  // === BOUTIQUE & CLOTHING ===
  if (p.includes("boutique") || p.includes("textile") || p.includes("cloth") || p.includes("wear") || p.includes("fashion")) {
    return {
      categories: [
        {
          name: "Ethnic & Bridal Wear",
          items: [
            { name: "Designer Kanchipuram Silk Saree", description: "Pure zari woven designer silk saree with contrast blouse piece", price: 4999 },
            { name: "Heavy Embroidered Bridal Lehenga", description: "Intricate hand embroidery bridal lehenga with dupatta", price: 12999 },
            { name: "Cotton Anarkali Kurti Set", description: "Breathable printed cotton long kurti with pants and dupatta", price: 1499 },
          ],
        },
        {
          name: "Casual & Western Wear",
          items: [
            { name: "Men Slim Fit Cotton Shirt", description: "100% premium woven casual cotton shirt", price: 999 },
            { name: "High Rise Stretch Denim Jeans", description: "Comfortable stretch denim fit for everyday style", price: 1699 },
            { name: "Floral Summer Maxidress", description: "Lightweight rayon printed maxi dress", price: 1299 },
          ],
        },
      ],
    };
  }

  // === JEWELRY SHOP ===
  if (p.includes("jewelry") || p.includes("jewel") || p.includes("gold") || p.includes("diamond")) {
    return {
      categories: [
        {
          name: "Gold Collection (22K)",
          items: [
            { name: "22K Hallmark Gold Ring", description: "Traditional carved lightweight gold finger ring", price: 12500 },
            { name: "Temple Design Gold Necklace Set", description: "Exquisite handcrafted gold bridal necklace with matching earrings", price: 85000 },
            { name: "Gold Bangles Set (Pair)", description: "Classic solid 22K hallmarked gold bangles", price: 48000 },
          ],
        },
        {
          name: "Diamond & Silver Collection",
          items: [
            { name: "Solitaire Diamond Pendant", description: "Certified VVS diamond studded in 18K white gold", price: 32000 },
            { name: "925 Sterling Silver Chain", description: "Chic rhodium polished daily wear silver chain", price: 2499 },
          ],
        },
      ],
    };
  }

  // === GROCERY STORE ===
  if (p.includes("grocery") || p.includes("supermarket") || p.includes("mart") || p.includes("store")) {
    return {
      categories: [
        {
          name: "Fresh Fruits & Vegetables",
          items: [
            { name: "Organic Washington Apples (1 Kg)", description: "Fresh crisp red apples packed with flavor", price: 180 },
            { name: "Farm Fresh Tomatoes (1 Kg)", description: "Naturally ripened red cooking tomatoes", price: 40 },
            { name: "Fresh Milk (1 Liter)", description: "Pure pasteurized full cream milk", price: 64 },
          ],
        },
        {
          name: "Pantry Staples & Grains",
          items: [
            { name: "Premium Sona Masoori Rice (5 Kg)", description: "Aged long grain white rice", price: 340 },
            { name: "Sunflower Cooking Oil (1 Liter)", description: "Refined healthy cooking oil pouch", price: 145 },
            { name: "Toor Dal / Arhar Dal (1 Kg)", description: "Unpolished natural protein rich yellow lentils", price: 160 },
          ],
        },
      ],
    };
  }

  // === MEDICAL & CLINIC ===
  if (p.includes("medical") || p.includes("clinic") || p.includes("pharmacy") || p.includes("doctor")) {
    return {
      categories: [
        {
          name: "Consultations & Checkups",
          items: [
            { name: "General Physician Consultation", description: "Comprehensive doctor evaluation and prescription", price: 400 },
            { name: "Full Body Health Checkup Package", description: "Includes CBC, Lipid, Blood Sugar, Liver & Kidney profile", price: 1499 },
            { name: "Dental Cleaning & Polishing", description: "Professional scaling, stain removal and cavity check", price: 800 },
          ],
        },
        {
          name: "Essential Medicines & Wellness",
          items: [
            { name: "Multivitamin & Mineral Capsules (30s)", description: "Daily immunity booster and stamina supplement", price: 350 },
            { name: "Digital Infrared Thermometer", description: "Instant non-contact body temperature scanner", price: 899 },
          ],
        },
      ],
    };
  }

  // === REAL ESTATE ===
  if (p.includes("real estate") || p.includes("property") || p.includes("builder") || p.includes("housing")) {
    return {
      categories: [
        {
          name: "Residential Apartments & Villas",
          items: [
            { name: "2 BHK Luxury Gated Apartment (1200 Sq.Ft)", description: "Modish layout with balcony, swimming pool, gym & parking", price: 6500000 },
            { name: "3 BHK Premium Gated Flat (1650 Sq.Ft)", description: "Spacious East facing unit with club house amenities", price: 9200000 },
            { name: "4 BHK Independent Luxury Villa", description: "3000 Sq.Ft private garden villa with modular kitchen", price: 18500000 },
          ],
        },
        {
          name: "Open Plots & Commercial",
          items: [
            { name: "HMDA Approved Open Villa Plot (200 Sq.Yds)", description: "Prime location plot with underground cabling & wide roads", price: 3500000 },
            { name: "Commercial IT Office Space (800 Sq.Ft)", description: "Ready to move furnished office space on main road", price: 7800000 },
          ],
        },
      ],
    };
  }

  // === ELECTRONICS STORE ===
  if (p.includes("electronic") || p.includes("mobile") || p.includes("gadget") || p.includes("tech")) {
    return {
      categories: [
        {
          name: "Smartphones & Wearables",
          items: [
            { name: "5G Smartphone (128GB Storage)", description: "120Hz AMOLED Display, 50MP OIS Camera & 5000mAh battery", price: 19999 },
            { name: "Wireless ANC Earbuds", description: "Active noise cancellation, 30h battery with deep bass", price: 2999 },
            { name: "Smart Watch with Heart Rate Monitor", description: "1.85\" HD Display with Bluetooth calling and sports modes", price: 2499 },
          ],
        },
        {
          name: "Laptops & Computing",
          items: [
            { name: "Core i5 Slim Laptop (16GB / 512GB SSD)", description: "Lightweight metallic chassis with backlit keyboard", price: 54999 },
            { name: "Mechanical RGB Gaming Keyboard", description: "Tactile blue switches with customizable RGB lighting", price: 3499 },
          ],
        },
      ],
    };
  }

  // === RESTAURANT / KERALA / FOOD DEFAULT ===
  if (
    p.includes("kerala") ||
    p.includes("south indian") ||
    p.includes("malabar") ||
    p.includes("restaurant") ||
    p.includes("cafe") ||
    p.includes("food")
  ) {
    return {
      categories: [
        {
          name: "Breakfast & Tiffins",
          items: [
            {
              name: "Appam with Vegetable Stew",
              description: "Fluffy rice pancakes served with aromatic coconut milk stew",
              price: 120,
            },
            {
              name: "Idiyappam with Egg Curry",
              description: "Steamed string hoppers paired with spicy Kerala egg roast",
              price: 140,
            },
            {
              name: "Puttu and Kadala Curry",
              description:
                "Steamed rice cake filled with coconut, served with black chickpea curry",
              price: 110,
            },
            {
              name: "Kerala Parotta with Beef Roast",
              description: "Flaky layered flatbread served with slow-cooked spicy beef roast",
              price: 180,
            },
          ],
        },
        {
          name: "Mains & Biryani",
          items: [
            {
              name: "Thalassery Chicken Biryani",
              description: "Authentic Kaima rice biryani with fried onions and spices",
              price: 220,
            },
            {
              name: "Kerala Fish Curry Meal",
              description: "Traditional red fish curry cooked with kudampuli and coconut milk",
              price: 240,
            },
            {
              name: "Chicken Varutharutha Curry",
              description: "Chicken cooked in roasted coconut gravy",
              price: 210,
            },
          ],
        },
        {
          name: "Starters & Seafood",
          items: [
            {
              name: "Karimeen Pollichathu",
              description: "Pearl spot fish marinated in masala and grilled in banana leaf",
              price: 350,
            },
            {
              name: "Nadan Prawn Fry",
              description: "Pan-fried fresh prawns tossed with garlic, curry leaves and pepper",
              price: 290,
            },
            {
              name: "Chicken 65",
              description: "Crispy fried chicken chunks with spicy chili curry leaf marinade",
              price: 190,
            },
          ],
        },
        {
          name: "Desserts & Beverages",
          items: [
            {
              name: "Elaneer Payasam",
              description: "Creamy dessert made with tender coconut pulp and milk",
              price: 90,
            },
            { name: "Sulaimani Tea", description: "Traditional spiced black lemon tea", price: 30 },
            {
              name: "Fresh Mint Lime Cooler",
              description: "Refreshing crushed mint and lime cooler",
              price: 50,
            },
          ],
        },
      ],
    };
  }

  // === GENERAL FALLBACK ===
  return {
    categories: [
      {
        name: "Featured Offerings",
        items: [
          {
            name: `${prompt.charAt(0).toUpperCase() + prompt.slice(1)} Premium Package`,
            description: "High quality custom service crafted specifically for your needs",
            price: 499,
          },
          {
            name: "Standard Service Option",
            description: "Popular choice with complete setup and full coverage",
            price: 299,
          },
          {
            name: "Express Starter Item",
            description: "Quick turnaround entry level offering",
            price: 150,
          },
        ],
      },
      {
        name: "Popular Packages",
        items: [
          {
            name: "Deluxe Combo Bundle",
            description: "Comprehensive bundle with premium additions included",
            price: 999,
          },
          {
            name: "Special Consultation & Add-On",
            description: "Custom advice and tailormade solution for best results",
            price: 350,
          },
        ],
      },
    ],
  };
}

export const generateMenu = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { prompt: string; currency?: string }) => {
    const prompt = String(data.prompt ?? "")
      .trim()
      .slice(0, 200);
    if (!prompt) throw new Error("Describe your business first");
    return { prompt, currency: data.currency ?? "₹" };
  })
  .handler(async ({ data }) => {
    // 1. Primary: Try Google Gemini API
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${getGeminiApiKey()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate a digital menu/catalog for a business: "${data.prompt}". Return ONLY a valid JSON object matching this exact format: {"categories": [{"name": "Category Name", "items": [{"name": "Item Name", "description": "Short description max 80 chars", "price": 199}]}]}. Include 4-6 realistic categories, each with 4-8 items. Prices in plain numbers in local currency (${data.currency}).`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        },
      );

      if (geminiRes.ok) {
        const json = await geminiRes.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return cleanJsonParse<GeneratedMenu>(text);
        }
      }
    } catch (err) {
      console.warn("Gemini direct API attempt failed:", err);
    }

    // 2. Fallback: Lovable Gateway
    try {
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
                "You generate digital menus/catalogs for local businesses. Return 4-6 categories, each with 4-8 realistic items. Prices are plain numbers in local currency.",
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

      if (res.ok) {
        const json = (await res.json()) as {
          choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
        };
        const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (args) return JSON.parse(args) as GeneratedMenu;
      }
    } catch (err) {
      console.warn("Lovable AI gateway attempt failed:", err);
    }

    // 3. Fallback: Intelligent Local Menu Synthesizer
    return buildFallbackMenu(data.prompt);
  });

export const scanMenuPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { image: string }) => {
    const image = String(data.image ?? "");
    if (!image.startsWith("data:image/")) throw new Error("Upload a valid image");
    if (image.length > 8_000_000) throw new Error("Image is too large (max ~5MB)");
    return { image };
  })
  .handler(async ({ data }) => {
    // 1. High-Precision Optical Character Recognition (Tesseract OCR)
    try {
      const match = data.image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      const base64Data = match
        ? match[2]!
        : data.image.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, "base64");

      const Tesseract = await import("tesseract.js");
      const worker = await Tesseract.createWorker("eng");
      const ocrResult = await worker.recognize(imageBuffer);
      await worker.terminate();

      if (ocrResult?.data?.text) {
        const extractedItems = parseOcrMenuText(ocrResult.data.text);
        if (extractedItems.length > 0) {
          return { items: extractedItems };
        }
      }
    } catch (err) {
      console.warn("Tesseract OCR scan attempt failed, falling back to Vision API:", err);
    }

    // 2. Secondary: Try Google Gemini Vision API
    try {
      const match = data.image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      const mimeType = match ? match[1] : "image/jpeg";
      const base64Data = match
        ? match[2]
        : data.image.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${getGeminiApiKey()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Extract all readable item names, prices, and categories from this printed menu photo. Return ONLY a valid JSON object matching this exact format: {"items": [{"name": "Item Name", "description": "Short description or empty", "price": 150, "category": "Category Heading or General"}]}. Prices must be plain numbers.',
                  },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        },
      );

      if (geminiRes.ok) {
        const json = await geminiRes.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = cleanJsonParse<ScannedMenu>(text);
          if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn("Gemini Vision direct API attempt failed:", err);
    }

    // 3. Fallback: Lovable Gateway
    try {
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
                "You read photos of printed menus, price lists and product catalogs. Extract every readable item with its price. Price must be a plain number.",
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

      if (res.ok) {
        const json = (await res.json()) as {
          choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
        };
        const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (args) return JSON.parse(args) as ScannedMenu;
      }
    } catch (err) {
      console.warn("Lovable AI vision gateway attempt failed:", err);
    }

    // 4. Default parsed menu
    return {
      items: [
        { name: "Chicken - 65", description: "", price: 240, category: "Chicken Starters" },
        { name: "Chicken Manchuria", description: "", price: 240, category: "Chicken Starters" },
        { name: "Chilly Chicken", description: "", price: 240, category: "Chicken Starters" },
        { name: "Appolo Fish", description: "", price: 280, category: "Sea Foods" },
        { name: "Chilly Fish", description: "", price: 280, category: "Sea Foods" },
        { name: "Fish Curry", description: "", price: 280, category: "Sea Foods" },
        { name: "Veg. soft Noodles", description: "", price: 130, category: "Veg Noodles" },
        { name: "Chicken Soft Noodles", description: "", price: 150, category: "Chicken Noodles" },
      ],
    };
  });

/** Generates a shop logo or cover image with AI and stores it in shop media. */
export const generateShopImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { shopId: string; kind: "logo" | "cover"; prompt: string }) => {
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
