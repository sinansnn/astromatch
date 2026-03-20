-- ============================================================
-- AstroMatch - Full Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search

-- ============================================================
-- USERS (auth is handled by Supabase Auth)
-- ============================================================
CREATE TABLE public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name      TEXT NOT NULL,
  birth_date        DATE NOT NULL,
  birth_time        TIME,
  birth_city        TEXT,
  birth_country     TEXT,
  birth_lat         FLOAT,
  birth_lng         FLOAT,
  -- Calculated astro fields
  sun_sign          TEXT NOT NULL,
  moon_sign         TEXT,
  rising_sign       TEXT,
  element           TEXT, -- Fire, Earth, Air, Water
  -- Profile info
  bio               TEXT CHECK (char_length(bio) <= 300),
  purpose           TEXT DEFAULT 'both' CHECK (purpose IN ('romantic', 'friendship', 'both')),
  gender            TEXT,
  looking_for       TEXT[], -- array: ['male','female','non-binary',...]
  photos            TEXT[], -- Cloudinary URLs, max 6
  -- Location
  current_lat       FLOAT,
  current_lng       FLOAT,
  location_city     TEXT,
  location_country  TEXT,
  travel_mode       BOOLEAN DEFAULT FALSE,
  travel_city       TEXT,
  travel_lat        FLOAT,
  travel_lng        FLOAT,
  show_location     BOOLEAN DEFAULT TRUE,
  search_radius_km  INT DEFAULT 100,
  -- Settings
  language          TEXT DEFAULT 'en',
  notifications_on  BOOLEAN DEFAULT TRUE,
  is_verified       BOOLEAN DEFAULT FALSE,
  is_premium        BOOLEAN DEFAULT FALSE,
  is_banned         BOOLEAN DEFAULT FALSE,
  profile_complete  BOOLEAN DEFAULT FALSE,
  -- Timestamps
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  last_active       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BIRTH CHARTS (detailed ephemeris data)
-- ============================================================
CREATE TABLE public.birth_charts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Main planets
  sun_sign      TEXT, sun_degree FLOAT, sun_house INT,
  moon_sign     TEXT, moon_degree FLOAT, moon_house INT,
  rising_sign   TEXT, rising_degree FLOAT,
  mercury_sign  TEXT, mercury_degree FLOAT, mercury_house INT,
  venus_sign    TEXT, venus_degree FLOAT, venus_house INT,
  mars_sign     TEXT, mars_degree FLOAT, mars_house INT,
  jupiter_sign  TEXT, jupiter_degree FLOAT, jupiter_house INT,
  saturn_sign   TEXT, saturn_degree FLOAT, saturn_house INT,
  -- Raw data for calculations
  chart_data    JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMPATIBILITY CACHE (pre-calculated scores)
-- ============================================================
CREATE TABLE public.compatibility (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_a        UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b        UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  overall_score INT CHECK (overall_score BETWEEN 0 AND 100),
  element_score INT,
  sun_score     INT,
  moon_score    INT,
  venus_score   INT,
  mars_score    INT,
  rising_score  INT,
  details       JSONB, -- detailed breakdown
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_a, user_b)
);

-- ============================================================
-- SWIPES & MATCHES
-- ============================================================
CREATE TABLE public.swipes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action        TEXT NOT NULL CHECK (action IN ('like', 'super_like', 'pass')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user, to_user)
);

CREATE TABLE public.matches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_a          UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b          UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  compat_score    INT,
  is_active       BOOLEAN DEFAULT TRUE,
  matched_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_a, user_b)
);

-- ============================================================
-- MESSAGING
-- ============================================================
CREATE TABLE public.conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id        UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  last_message    TEXT,
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  type            TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'gif', 'ai_suggestion')),
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ANONYMOUS QUESTIONS (unique feature!)
-- ============================================================
CREATE TABLE public.anon_questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  question        TEXT NOT NULL CHECK (char_length(question) <= 200),
  answer          TEXT CHECK (char_length(answer) <= 300),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'ignored')),
  -- If both liked each other after interaction → convert to match
  converted_to_match UUID REFERENCES public.matches(id),
  sender_revealed BOOLEAN DEFAULT FALSE, -- sender can choose to reveal after answer
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  answered_at     TIMESTAMPTZ
);

-- ============================================================
-- DAILY CONTENT
-- ============================================================
CREATE TABLE public.daily_horoscopes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sign          TEXT NOT NULL,
  date          DATE NOT NULL,
  language      TEXT DEFAULT 'en',
  -- Content sections
  general       TEXT,
  love          TEXT,
  energy        TEXT,
  do_today      TEXT[], -- array of "do" items
  dont_today    TEXT[], -- array of "don't" items
  lucky_number  INT,
  lucky_color   TEXT,
  mood          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sign, date, language)
);

CREATE TABLE public.daily_user_content (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Personalized content
  morning_msg   TEXT,
  transit_note  TEXT,
  featured_match UUID REFERENCES public.profiles(id), -- "today's featured match"
  energy_level  INT CHECK (energy_level BETWEEN 1 AND 10),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================================
-- SUBSCRIPTIONS & COINS
-- ============================================================
CREATE TABLE public.subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan            TEXT CHECK (plan IN ('cosmic', 'oracle', 'lifetime')),
  stripe_sub_id   TEXT,
  stripe_cust_id  TEXT,
  status          TEXT CHECK (status IN ('active', 'cancelled', 'expired', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.coins (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance       INT DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.coin_transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount        INT NOT NULL, -- positive = earned, negative = spent
  type          TEXT, -- 'purchase', 'boost', 'super_like', 'report_download'
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REPORTS & BLOCKS
-- ============================================================
CREATE TABLE public.reports (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason        TEXT NOT NULL,
  details       TEXT,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.blocks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type          TEXT NOT NULL, -- 'match', 'message', 'anon_question', 'anon_answer', 'daily'
  title         TEXT,
  body          TEXT,
  data          JSONB,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES (performance)
-- ============================================================
CREATE INDEX idx_profiles_sun_sign ON public.profiles(sun_sign);
CREATE INDEX idx_profiles_element ON public.profiles(element);
CREATE INDEX idx_profiles_location ON public.profiles(current_lat, current_lng);
CREATE INDEX idx_profiles_last_active ON public.profiles(last_active DESC);
CREATE INDEX idx_swipes_from_user ON public.swipes(from_user);
CREATE INDEX idx_swipes_to_user ON public.swipes(to_user);
CREATE INDEX idx_matches_user_a ON public.matches(user_a);
CREATE INDEX idx_matches_user_b ON public.matches(user_b);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_anon_questions_receiver ON public.anon_questions(receiver_id, status);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read_at);
CREATE INDEX idx_daily_horoscopes_sign_date ON public.daily_horoscopes(sign, date);

-- ============================================================
-- ROW LEVEL SECURITY (users can only see their own data)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.birth_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anon_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Profiles: public read (for discovery), own write
CREATE POLICY "Profiles are publicly readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Birth charts: public read
CREATE POLICY "Charts are publicly readable" ON public.birth_charts FOR SELECT USING (true);
CREATE POLICY "Users can insert own chart" ON public.birth_charts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chart" ON public.birth_charts FOR UPDATE USING (auth.uid() = user_id);

-- Swipes: only own swipes
CREATE POLICY "Users see own swipes" ON public.swipes FOR SELECT USING (auth.uid() = from_user);
CREATE POLICY "Users can swipe" ON public.swipes FOR INSERT WITH CHECK (auth.uid() = from_user);

-- Matches: see matches you're part of
CREATE POLICY "Users see own matches" ON public.matches FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Conversations: see conversations from your matches
CREATE POLICY "Users see own conversations" ON public.conversations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
  ));

-- Messages: see messages in your conversations
CREATE POLICY "Users see own messages" ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.matches m ON m.id = c.match_id
    WHERE c.id = conversation_id AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
  ));
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Anon questions: sender and receiver can see
CREATE POLICY "Question participants can view" ON public.anon_questions FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send questions" ON public.anon_questions FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receiver can answer" ON public.anon_questions FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Notifications: own only
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

-- Subscriptions, coins: own only
CREATE POLICY "Users see own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users see own coins" ON public.coins FOR SELECT USING (auth.uid() = user_id);

-- Blocks: own only
CREATE POLICY "Users manage own blocks" ON public.blocks FOR ALL USING (auth.uid() = blocker_id);

-- Daily horoscopes: public
ALTER TABLE public.daily_horoscopes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Horoscopes are public" ON public.daily_horoscopes FOR SELECT USING (true);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile after signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.coins (user_id, balance) VALUES (NEW.id, 50); -- 50 free coins on signup
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check for mutual like → create match
CREATE OR REPLACE FUNCTION check_mutual_like()
RETURNS TRIGGER AS $$
DECLARE
  mutual_swipe public.swipes%ROWTYPE;
  new_match_id UUID;
  compat INT;
BEGIN
  IF NEW.action IN ('like', 'super_like') THEN
    SELECT * INTO mutual_swipe FROM public.swipes
    WHERE from_user = NEW.to_user AND to_user = NEW.from_user
    AND action IN ('like', 'super_like');

    IF FOUND THEN
      -- Get compatibility score
      SELECT overall_score INTO compat FROM public.compatibility
      WHERE (user_a = NEW.from_user AND user_b = NEW.to_user)
         OR (user_a = NEW.to_user AND user_b = NEW.from_user);

      -- Create match
      INSERT INTO public.matches (user_a, user_b, compat_score)
      VALUES (NEW.from_user, NEW.to_user, COALESCE(compat, 70))
      ON CONFLICT DO NOTHING
      RETURNING id INTO new_match_id;

      IF new_match_id IS NOT NULL THEN
        -- Create conversation
        INSERT INTO public.conversations (match_id) VALUES (new_match_id);

        -- Notify both users
        INSERT INTO public.notifications (user_id, type, title, body, data)
        VALUES
          (NEW.from_user, 'match', 'Yeni Eşleşme! ✨', 'Yıldızlar sizi bir araya getirdi!', jsonb_build_object('match_id', new_match_id)),
          (NEW.to_user, 'match', 'Yeni Eşleşme! ✨', 'Yıldızlar sizi bir araya getirdi!', jsonb_build_object('match_id', new_match_id));
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_swipe_check_match AFTER INSERT ON public.swipes
  FOR EACH ROW EXECUTE FUNCTION check_mutual_like();

-- Update last_message on conversations
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message = NEW.content, last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_message AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Notify on anon question answer
CREATE OR REPLACE FUNCTION notify_anon_answer()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'answered' THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (NEW.sender_id, 'anon_answer', 'Sorun Yanıtlandı! 🔮',
      'Biri anonim sorunuzu yanıtladı', jsonb_build_object('question_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_anon_answer AFTER UPDATE ON public.anon_questions
  FOR EACH ROW EXECUTE FUNCTION notify_anon_answer();
