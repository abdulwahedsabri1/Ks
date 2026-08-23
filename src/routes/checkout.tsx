import { createFileRoute } from '@tanstack/react-router'
import { CheckoutPage } from '@/sections/checkout/CheckoutPage'

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      plan: search.plan as string || 'Basic',
      price: search.price as number || 99,
      period: search.period as string || '/7 days',
    }
  },
})
