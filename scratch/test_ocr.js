const sampleText = `
MENU
Chicken Starters
• Chicken - 65 240/-
• Chicken Manchuria 240/-
• Chicken Majestic 240/-
• Chilly Chicken 240/-
• Ginger Chicken 240/-
• Schezwan Chicken 250/-
• Lolly Pops 240/-
• Pepper Chicken 240/-
• Chicken Drum Sticks 240/-
• Lemon Chicken 240/-
• Chicken Thai Fry 240/-

Sea Foods
• Appolo Fish 280/-
• Chilly Fish 280/-
• Fish Manchuria 280/-
• Prawns Manchuria 280/-
• Chilly Prawns 280/-
• Loose Fry Prawns 280/-
• Fish Curry 280/-
• Prawns Curry 280/-

Veg Noodles
• Veg. soft Noodles 130/-
• Veg. Schezwan Noodles 140/-
• Veg. Hakka Noodles 140/-
• Chilly Garlic Noodles 140/-
• Egg. Soft Noodles 140/-

Chicken Noodles
• Chicken Soft Noodles 150/-
• Chicken Schezwan Noodles 160/-
• Chicken Hakka Noodles 160/-
• Chicken Garlic Noodles 160/-
`;

function parseMenuText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const items = [];
  let currentCategory = "General";

  for (const line of lines) {
    if (line.toUpperCase() === 'MENU' || line.startsWith('***')) continue;
    if (!line.match(/\d+/) && line.length < 35 && !line.includes('/-')) {
      currentCategory = line.replace(/[^a-zA-Z0-9\s]/g, '').trim() || currentCategory;
      continue;
    }

    const priceMatch = line.match(/(.*?)\s+(\d{2,4})\s*(?:\/|-|rs|inr|\.|$)/i);
    if (priceMatch) {
      let rawName = priceMatch[1].replace(/^[•*\-\s]+/, '').trim();
      const price = parseInt(priceMatch[2], 10);
      if (rawName.length > 2 && price > 0) {
        items.push({
          name: rawName,
          description: "",
          price,
          category: currentCategory
        });
      }
    }
  }

  return items;
}

console.log(JSON.stringify(parseMenuText(sampleText), null, 2));
