-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    email TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    category TEXT NOT NULL,
    business_address TEXT,
    website TEXT,
    screenshot_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (since users might not be logged in when purchasing)
CREATE POLICY "Allow anonymous inserts on payments" 
ON public.payments FOR INSERT 
TO public
WITH CHECK (true);

-- Allow authenticated users (Admins) to select and update
CREATE POLICY "Allow authenticated to select payments" 
ON public.payments FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated to update payments" 
ON public.payments FOR UPDATE 
TO authenticated 
USING (true);

-- Create storage bucket for payment_proofs if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment_proofs', 'payment_proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment_proofs
CREATE POLICY "Allow public uploads to payment_proofs"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'payment_proofs');

CREATE POLICY "Allow public select on payment_proofs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment_proofs');

CREATE POLICY "Allow authenticated to delete payment_proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'payment_proofs');
