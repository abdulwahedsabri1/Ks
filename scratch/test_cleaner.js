function cleanItemName(raw) {
  let s = raw.trim();

  // Remove leading non-alphanumeric characters, copyright symbols, bullet points, numbers like 3g. 
  s = s.replace(/^[^a-zA-Z0-9]+/, "");
  s = s.replace(/^[©®°™•\-*_.]+\s*/, "");
  s = s.replace(/^[a-z0-9]{1,2}\.\s+/i, ""); 
  s = s.replace(/^[e_]\s+/i, "");

  // Remove trailing leader dots, trailing noise like ccc..., co..., ---, etc.
  s = s.replace(/[\s\.\-_]*e?c{2,}[a-z\.\-_]*$/i, "");
  s = s.replace(/[\s\.\-_]*co\.$/i, "");
  s = s.replace(/[\s\.\-_]+$/, "");
  s = s.replace(/[-.]{2,}.*$/, "");
  s = s.replace(/\s+[a-z]{1,2}$/i, "");

  // Remove any remaining copyright or trademark symbols anywhere in the string
  s = s.replace(/[©®°™]/g, "");

  // Clean double spaces
  s = s.replace(/\s+/g, " ").trim();

  return s;
}

function inferCategory(itemName, rawCategory) {
  let cat = rawCategory.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, " ").trim();
  
  if (cat.length < 3 || cat.toLowerCase().includes("te") || cat.toLowerCase() === "menu") {
    const itemLower = itemName.toLowerCase();
    if (itemLower.includes("noodle")) {
      return itemLower.includes("chicken") || itemLower.includes("egg") ? "Chicken Noodles" : "Veg Noodles";
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

const testItems = [
  { rawName: "© Veg. Hakka Noodles co.", cat: "a TE" },
  { rawName: "e Chilly Garlic Noodles ccc.", cat: "a TE" },
  { rawName: "_ ® Egg. Soft Noodles ccc...", cat: "a TE" },
  { rawName: "© Chicken Soft Noodles -.........cccc.ccccoccc..", cat: "a TE" },
  { rawName: "© Chicken Schezwan Noodles --..-.....", cat: "a TE" },
  { rawName: "© Chicken Hakka Noodles ecco...", cat: "a TE" },
  { rawName: "3g. Chicken Garlic Noodles ---ccccoccc......", cat: "a TE" },
];

for (const t of testItems) {
  const cleanedName = cleanItemName(t.rawName);
  const cleanedCat = inferCategory(cleanedName, t.cat);
  console.log(`ORIGINAL: "${t.rawName}" | CAT: "${t.cat}"`);
  console.log(`CLEANED : "${cleanedName}" | CAT: "${cleanedCat}"\n`);
}
