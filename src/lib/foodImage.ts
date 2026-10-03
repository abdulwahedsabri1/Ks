/**
 * Returns a high-resolution Unsplash image URL matching the item name, category name, or niche.
 * Supports Restaurants, Cafes, Bakeries, Salons, Spas, Gyms, Hotels, Boutiques, Jewelry, Grocery, Medical, Real Estate, and Electronics.
 */
export function getFoodImageUrl(itemName: string, categoryName = ""): string {
  const text = (itemName + " " + categoryName).toLowerCase().trim();

  // === SALON & BARBERSHOP ===
  if (text.includes("haircut") || text.includes("hair cut") || text.includes("trim") || text.includes("styling") || text.includes("blowdry") || text.includes("hair style")) {
    return "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("facial") || text.includes("skin") || text.includes("cleansing") || text.includes("bleach") || text.includes("detox")) {
    return "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("hair spa") || text.includes("hair color") || text.includes("highlights") || text.includes("keratin") || text.includes("smoothening") || text.includes("rebonding")) {
    return "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("beard") || text.includes("shave") || text.includes("mustache") || text.includes("grooming")) {
    return "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("pedicure") || text.includes("manicure") || text.includes("nail") || text.includes("foot spa")) {
    return "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("salon") || text.includes("makeup") || text.includes("bridal") || text.includes("threading") || text.includes("waxing")) {
    return "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&auto=format&fit=crop&q=80";
  }

  // === SPA & WELLNESS ===
  if (text.includes("massage") || text.includes("aromatherapy") || text.includes("deep tissue") || text.includes("thai massage") || text.includes("ayurvedic")) {
    return "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("spa") || text.includes("sauna") || text.includes("scrub") || text.includes("steam") || text.includes("hot stone")) {
    return "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80";
  }

  // === GYM & FITNESS ===
  if (text.includes("gym") || text.includes("fitness") || text.includes("workout") || text.includes("personal train") || text.includes("membership") || text.includes("cardio") || text.includes("weight")) {
    return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("protein") || text.includes("shake") || text.includes("creatine") || text.includes("pre workout") || text.includes("supplement")) {
    return "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("yoga") || text.includes("pilates") || text.includes("zumba") || text.includes("crossfit")) {
    return "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&auto=format&fit=crop&q=80";
  }

  // === BAKERY & SWEETS ===
  if (text.includes("cake") || text.includes("pastry") || text.includes("cupcake") || text.includes("black forest") || text.includes("red velvet") || text.includes("cheesecake")) {
    return "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("cookie") || text.includes("biscuit") || text.includes("brownie") || text.includes("macaron") || text.includes("donut") || text.includes("doughnut")) {
    return "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("bread") || text.includes("croissant") || text.includes("bun") || text.includes("bakery") || text.includes("baguette")) {
    return "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("sweet") || text.includes("mithai") || text.includes("jamun") || text.includes("laddu") || text.includes("halwa") || text.includes("barfi")) {
    return "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80";
  }

  // === HOTEL & RESORT ===
  if (text.includes("deluxe") || text.includes("suite") || text.includes("room") || text.includes("villa") || text.includes("resort") || text.includes("stay") || text.includes("hotel")) {
    return "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&auto=format&fit=crop&q=80";
  }

  // === BOUTIQUE & CLOTHING ===
  if (text.includes("saree") || text.includes("kurti") || text.includes("lehenga") || text.includes("suit") || text.includes("dress") || text.includes("ethnic") || text.includes("boutique")) {
    return "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("shirt") || text.includes("t-shirt") || text.includes("jeans") || text.includes("jacket") || text.includes("trouser") || text.includes("textile")) {
    return "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80";
  }

  // === JEWELRY ===
  if (text.includes("gold") || text.includes("diamond") || text.includes("ring") || text.includes("necklace") || text.includes("bangle") || text.includes("earring") || text.includes("jewelry") || text.includes("silver")) {
    return "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop&q=80";
  }

  // === GROCERY ===
  if (text.includes("fruit") || text.includes("apple") || text.includes("banana") || text.includes("vegetable") || text.includes("grocery") || text.includes("milk") || text.includes("rice") || text.includes("oil")) {
    return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80";
  }

  // === MEDICAL & CLINIC ===
  if (text.includes("medicine") || text.includes("pharma") || text.includes("tablet") || text.includes("syrup") || text.includes("health") || text.includes("vitamin")) {
    return "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80";
  }
  if (text.includes("doctor") || text.includes("consultation") || text.includes("checkup") || text.includes("clinic") || text.includes("test") || text.includes("blood")) {
    return "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80";
  }

  // === REAL ESTATE ===
  if (text.includes("flat") || text.includes("apartment") || text.includes("house") || text.includes("property") || text.includes("plot") || text.includes("bhk") || text.includes("real estate")) {
    return "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=80";
  }

  // === ELECTRONICS ===
  if (text.includes("phone") || text.includes("mobile") || text.includes("laptop") || text.includes("headphone") || text.includes("smartwatch") || text.includes("tv") || text.includes("electronic")) {
    return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80";
  }

  // === RESTAURANT / FOOD (Default Food categories) ===
  if (
    text.includes("biryani") ||
    text.includes("kaima") ||
    text.includes("pulao") ||
    text.includes("fried rice")
  ) {
    return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80";
  }
  if (
    text.includes("appam") ||
    text.includes("dosa") ||
    text.includes("idli") ||
    text.includes("puttu") ||
    text.includes("tiffin") ||
    text.includes("idiyappam")
  ) {
    return "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80";
  }
  if (
    text.includes("parotta") ||
    text.includes("naan") ||
    text.includes("roti") ||
    text.includes("paratha")
  ) {
    return "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80";
  }
  if (
    text.includes("fish") ||
    text.includes("karimeen") ||
    text.includes("prawn") ||
    text.includes("seafood") ||
    text.includes("crab") ||
    text.includes("squid")
  ) {
    return "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80";
  }
  if (
    text.includes("chicken 65") ||
    text.includes("fried chicken") ||
    text.includes("wings") ||
    text.includes("nuggets") ||
    text.includes("tikka")
  ) {
    return "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&auto=format&fit=crop&q=80";
  }
  if (
    text.includes("chicken") ||
    text.includes("duck") ||
    text.includes("poultry")
  ) {
    return "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80";
  }
  if (
    text.includes("beef") ||
    text.includes("mutton") ||
    text.includes("steak") ||
    text.includes("meat") ||
    text.includes("kebab")
  ) {
    return "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80";
  }
  if (
    text.includes("curry") ||
    text.includes("stew") ||
    text.includes("gravy") ||
    text.includes("masala") ||
    text.includes("dal")
  ) {
    return "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80";
  }
  if (
    text.includes("burger") ||
    text.includes("sandwich") ||
    text.includes("wrap")
  ) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80";
  }
  if (
    text.includes("pizza") ||
    text.includes("slice") ||
    text.includes("margherita")
  ) {
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80";
  }
  if (
    text.includes("pasta") ||
    text.includes("noodle") ||
    text.includes("ramen")
  ) {
    return "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80";
  }
  if (
    text.includes("coffee") ||
    text.includes("cappuccino") ||
    text.includes("latte") ||
    text.includes("espresso")
  ) {
    return "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80";
  }
  if (
    text.includes("tea") ||
    text.includes("chai") ||
    text.includes("sulaimani")
  ) {
    return "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80";
  }
  if (
    text.includes("shake") ||
    text.includes("smoothie") ||
    text.includes("juice") ||
    text.includes("lime") ||
    text.includes("drink")
  ) {
    return "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80";
  }

  // Generic neutral photo matching general store item
  return "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80";
}
