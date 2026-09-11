import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Review = {
  id: string;
  shop_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  rating: number;
  review_comment: string | null;
  feedback_comment: string | null;
  review_type: "positive" | "negative";
  redirected_to_google: boolean;
  created_at: string;
  // joined
  shop_name?: string;
};

export async function submitReview(review: {
  shop_id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  rating: number;
  review_comment?: string | null;
  feedback_comment?: string | null;
  review_type: "positive" | "negative";
  redirected_to_google?: boolean | null;
}) {
  const { error } = await (supabase as any).from("reviews").insert({
    ...review,
    redirected_to_google: review.redirected_to_google ?? false,
  });
  if (error) throw error;
}

export function useAllReviews(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-reviews"],
    enabled,
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await (supabase as any)
        .from("reviews")
        .select("*, shops(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown[]).map((r: unknown) => ({
        ...(r as Review),

        shop_name: (r as any).shops?.name ?? "Unknown",
      })) as Review[];
    },
  });
}

export function useShopReviews(shopId?: string) {
  return useQuery({
    queryKey: ["shop-reviews", shopId],
    enabled: !!shopId,
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await (supabase as any)
        .from("reviews")
        .select("*")
        .eq("shop_id", shopId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });
}

export function useReviewStats(reviews: Review[]) {
  const total = reviews.length;
  const avgRating = total === 0 ? 0 : reviews.reduce((s, r) => s + r.rating, 0) / total;
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const positive = reviews.filter((r) => r.review_type === "positive").length;
  const negative = reviews.filter((r) => r.review_type === "negative").length;
  const redirected = reviews.filter((r) => r.redirected_to_google).length;

  // Monthly trend: last 6 months
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = d.toLocaleString("default", { month: "short" });
    const year = d.getFullYear();
    const count = reviews.filter((r) => {
      const rd = new Date(r.created_at);
      return rd.getMonth() === d.getMonth() && rd.getFullYear() === year;
    }).length;
    return { month, count };
  });

  return { total, avgRating, counts, positive, negative, redirected, monthlyTrend };
}
