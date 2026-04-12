CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  active BOOLEAN DEFAULT true,
  name TEXT NOT NULL,
  description TEXT,
  stripe_product_id TEXT UNIQUE,
  price NUMERIC
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public products are viewable by everyone." ON public.products FOR SELECT USING (true);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  status TEXT,
  amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own orders." ON public.orders FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT UNIQUE;
