import {
  UtensilsCrossed,
  Cake,
  Scissors,
  Dumbbell,
  Building2,
  Shirt,
  Gem,
  ShoppingCart,
  Pill,
  Smartphone,
  Home,
  ShoppingBag,
  Sparkles,
  Coffee,
  Stethoscope,
  Laptop,
  Hotel,
  Car,
} from "lucide-react";
import type { ComponentType } from "react";

/**
 * Returns the matching Lucide Icon component based on business niche or category name.
 */
export function getNicheCategoryIcon(
  niche?: string | null,
  label?: string | null,
): ComponentType<{ className?: string }> {
  const combined = `${niche || ""} ${label || ""}`.toLowerCase().trim();

  if (
    combined.includes("bakery") ||
    combined.includes("cake") ||
    combined.includes("sweet") ||
    combined.includes("dessert")
  ) {
    return Cake;
  }
  if (combined.includes("cafe") || combined.includes("coffee") || combined.includes("tea")) {
    return Coffee;
  }
  if (
    combined.includes("restaurant") ||
    combined.includes("food") ||
    combined.includes("dining") ||
    combined.includes("kitchen") ||
    combined.includes("bistro") ||
    combined.includes("dhabha")
  ) {
    return UtensilsCrossed;
  }
  if (
    combined.includes("salon") ||
    combined.includes("barber") ||
    combined.includes("hair") ||
    combined.includes("beauty")
  ) {
    return Scissors;
  }
  if (combined.includes("spa") || combined.includes("massage") || combined.includes("wellness")) {
    return Sparkles;
  }
  if (
    combined.includes("gym") ||
    combined.includes("fitness") ||
    combined.includes("workout") ||
    combined.includes("trainer")
  ) {
    return Dumbbell;
  }
  if (
    combined.includes("hotel") ||
    combined.includes("resort") ||
    combined.includes("lodge") ||
    combined.includes("stay")
  ) {
    return Hotel;
  }
  if (
    combined.includes("boutique") ||
    combined.includes("textile") ||
    combined.includes("cloth") ||
    combined.includes("apparel") ||
    combined.includes("fashion") ||
    combined.includes("tailor")
  ) {
    return Shirt;
  }
  if (
    combined.includes("jewelry") ||
    combined.includes("jewel") ||
    combined.includes("gold") ||
    combined.includes("diamond")
  ) {
    return Gem;
  }
  if (
    combined.includes("grocery") ||
    combined.includes("supermarket") ||
    combined.includes("mart") ||
    combined.includes("store") ||
    combined.includes("provision")
  ) {
    return ShoppingCart;
  }
  if (
    combined.includes("medical") ||
    combined.includes("pharmacy") ||
    combined.includes("chemist") ||
    combined.includes("medicine")
  ) {
    return Pill;
  }
  if (
    combined.includes("clinic") ||
    combined.includes("doctor") ||
    combined.includes("hospital") ||
    combined.includes("health")
  ) {
    return Stethoscope;
  }
  if (
    combined.includes("electronic") ||
    combined.includes("mobile") ||
    combined.includes("gadget") ||
    combined.includes("phone")
  ) {
    return Smartphone;
  }
  if (combined.includes("computer") || combined.includes("laptop") || combined.includes("tech")) {
    return Laptop;
  }
  if (
    combined.includes("real estate") ||
    combined.includes("property") ||
    combined.includes("builder") ||
    combined.includes("housing")
  ) {
    return Home;
  }
  if (
    combined.includes("auto") ||
    combined.includes("car") ||
    combined.includes("garage") ||
    combined.includes("vehicle")
  ) {
    return Car;
  }

  return ShoppingBag;
}
