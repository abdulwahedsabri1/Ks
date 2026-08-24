/** Returns a high-resolution Unsplash food image URL matching the item name and category. */
export function getFoodImageUrl(itemName: string, categoryName = ""): string {
  const text = (itemName + " " + categoryName).toLowerCase().trim();

  if (text.includes("biryani") || text.includes("kaima") || text.includes("pulao") || text.includes("fried rice")) {
    return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("appam") || text.includes("dosa") || text.includes("idli") || text.includes("puttu") || text.includes("tiffin") || text.includes("idiyappam")) {
    return "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("parotta") || text.includes("naan") || text.includes("roti") || text.includes("bread") || text.includes("paratha")) {
    return "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("fish") || text.includes("karimeen") || text.includes("prawn") || text.includes("seafood") || text.includes("crab") || text.includes("squid")) {
    return "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("chicken 65") || text.includes("fried chicken") || text.includes("wings") || text.includes("nuggets") || text.includes("tikka")) {
    return "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("chicken") || text.includes("duck") || text.includes("poultry") || text.includes("turkey")) {
    return "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("beef") || text.includes("mutton") || text.includes("steak") || text.includes("meat") || text.includes("roast") || text.includes("kebab")) {
    return "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("curry") || text.includes("stew") || text.includes("gravy") || text.includes("masala") || text.includes("korma") || text.includes("dal")) {
    return "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("burger") || text.includes("slider") || text.includes("sandwich") || text.includes("wrap")) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("pizza") || text.includes("slice") || text.includes("margherita") || text.includes("calzone")) {
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("pasta") || text.includes("spaghetti") || text.includes("noodle") || text.includes("macaroni") || text.includes("ramen")) {
    return "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("coffee") || text.includes("cappuccino") || text.includes("latte") || text.includes("espresso") || text.includes("kaapi") || text.includes("mocha")) {
    return "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("tea") || text.includes("chai") || text.includes("sulaimani") || text.includes("green tea") || text.includes("lemon tea")) {
    return "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("shake") || text.includes("smoothie") || text.includes("juice") || text.includes("lime") || text.includes("drink") || text.includes("cooler") || text.includes("mojito")) {
    return "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("payasam") || text.includes("cake") || text.includes("dessert") || text.includes("brownie") || text.includes("sweet") || text.includes("ice cream") || text.includes("pastry")) {
    return "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80";
  }

  // Default food image
  return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80";
}
