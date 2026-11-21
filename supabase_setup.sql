-- =========================================================================
-- IPL Ticket Booking - Complete Setup Script (Matches Class Requirements)
-- =========================================================================

-- 1. Drop existing tables to start fresh (avoids 'relation matches already exists' error)
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;

-- 2. Create 'matches' table
CREATE TABLE public.matches (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  team1 text NOT NULL,
  team2 text NOT NULL,
  date text NOT NULL,
  venue text NOT NULL,
  price int NOT NULL,
  available_seats int NOT NULL
);

-- 3. Create 'bookings' table
CREATE TABLE public.bookings (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  match_id bigint REFERENCES public.matches(id) ON DELETE CASCADE,
  tickets int NOT NULL,
  total_price int NOT NULL,
  user_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Insert the sample IPL matches from class
INSERT INTO public.matches (team1, team2, date, venue, price, available_seats) VALUES
('CSK', 'MI', 'April 14', 'Mumbai', 1500, 45),
('RCB', 'KKR', 'April 16', 'Bengaluru', 1800, 30),
('GT', 'RR', 'April 18', 'Ahmedabad', 1200, 60),
('SRH', 'DC', 'April 20', 'Hyderabad', 1000, 25),
('LSG', 'PBKS', 'April 22', 'Lucknow', 1100, 40);

-- 5. Grant table and sequence permissions to anon (publishable key) & authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.matches TO anon, authenticated;
GRANT ALL ON TABLE public.bookings TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 6. Configure Row Level Security (RLS) policies so the React frontend can read & write
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read matches" ON public.matches;
CREATE POLICY "Allow public read matches" 
  ON public.matches FOR SELECT TO anon, authenticated 
  USING (true);

DROP POLICY IF EXISTS "Allow public update matches" ON public.matches;
CREATE POLICY "Allow public update matches" 
  ON public.matches FOR UPDATE TO anon, authenticated 
  USING (true) WITH CHECK (true);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read bookings" ON public.bookings;
CREATE POLICY "Allow public read bookings" 
  ON public.bookings FOR SELECT TO anon, authenticated 
  USING (true);

DROP POLICY IF EXISTS "Allow public insert bookings" ON public.bookings;
CREATE POLICY "Allow public insert bookings" 
  ON public.bookings FOR INSERT TO anon, authenticated 
  WITH CHECK (true);
