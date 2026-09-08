import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

async function getUserRoleRedirectPath(userId: string): Promise<string> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    const role = profile?.role ?? "owner";
    if (role === "admin") return "/admin";
    if (role === "staff") return "/staff";
    return "/dashboard";
  } catch {
    return "/dashboard";
  }
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }

    // Role-based redirect: if admin or staff land on /dashboard, send them to the right place
    const path = location.pathname;
    if (path === "/dashboard") {
      const correctPath = await getUserRoleRedirectPath(data.user.id);
      if (correctPath !== "/dashboard") {
        throw redirect({ to: correctPath });
      }
    }

    return { user: data.user };
  },
  component: () => <Outlet />,
});
