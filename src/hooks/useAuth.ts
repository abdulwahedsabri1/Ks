import { useEffect, useState, useCallback } from "react";
import { type Session, type User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { type Tables } from "@/integrations/supabase/types";

export type UserProfile = Tables<"profiles">;
export type UserRole = "admin" | "owner" | "staff";

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isStaff: boolean;
  onboardingCompleted: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    role: null,
    isLoading: true,
    isAdmin: false,
    isOwner: false,
    isStaff: false,
    onboardingCompleted: false,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profile) {
        const role = (profile.role ?? "owner") as UserRole;
        setState((prev) => ({
          ...prev,
          profile,
          role,
          isAdmin: role === "admin",
          isOwner: role === "owner",
          isStaff: role === "staff",
          onboardingCompleted: profile.onboarding_completed ?? false,
        }));
      }
    } catch {
      // Profile may not exist yet for brand-new OAuth users
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((prev) => ({
        ...prev,
        user: session?.user ?? null,
        session,
        isLoading: false,
      }));
      if (session?.user) {
        void fetchProfile(session.user.id);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setState((prev) => ({
        ...prev,
        user: session?.user ?? null,
        session,
        isLoading: false,
        // Reset profile state when logged out
        profile: session ? prev.profile : null,
        role: session ? prev.role : null,
        isAdmin: session ? prev.isAdmin : false,
        isOwner: session ? prev.isOwner : false,
        isStaff: session ? prev.isStaff : false,
        onboardingCompleted: session ? prev.onboardingCompleted : false,
      }));

      if (session?.user) {
        await fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      session: null,
      profile: null,
      role: null,
      isLoading: false,
      isAdmin: false,
      isOwner: false,
      isStaff: false,
      onboardingCompleted: false,
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (state.user) {
      await fetchProfile(state.user.id);
    }
  }, [state.user, fetchProfile]);

  /** Returns the dashboard path based on user role */
  const getDashboardPath = useCallback((): string => {
    switch (state.role) {
      case "admin":
        return "/admin";
      case "staff":
        return "/staff";
      default:
        return "/dashboard";
    }
  }, [state.role]);

  // Legacy compat: expose loading as top-level alias
  const loading = state.isLoading;
  const user: User | null = state.user;
  const session: Session | null = state.session;

  return {
    ...state,
    user,
    session,
    loading,
    logout,
    refreshProfile,
    getDashboardPath,
  };
}
