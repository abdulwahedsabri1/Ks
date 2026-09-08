import { createFileRoute, redirect } from "@tanstack/react-router";

// Checkout page removed — payments are now handled directly on /pricing via Razorpay modal
export const Route = createFileRoute("/checkout")({
  beforeLoad: () => {
    throw redirect({ to: "/pricing", replace: true });
  },
  component: () => null,
});
