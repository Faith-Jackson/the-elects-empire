-- Unified Supabase Database Schema for The Elects Empire Archives
-- This schema synchronizes the database with application features and security requirements.

-- 0. Security Helpers
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  displayName TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  themePreference TEXT DEFAULT 'amoled',
  accentPreference TEXT DEFAULT 'default',
  fontSize TEXT DEFAULT 'text-[17px] md:text-[19px]',
  fontFamily TEXT DEFAULT 'font-serif',
  commentaryLayout TEXT DEFAULT 'inline',
  bibleTranslation TEXT DEFAULT 'KJV',
  lineSpacing TEXT DEFAULT 'relaxed',
  textAlignment TEXT DEFAULT 'left',
  bgOpacity INTEGER DEFAULT 40,
  streak INTEGER DEFAULT 0,
  totalChaptersRead INTEGER DEFAULT 0,
  lastReadDate DATE,
  isOnline BOOLEAN DEFAULT false,
  lastSeen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  avatarUrl TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile." ON profiles FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete any profile." ON profiles FOR DELETE USING (is_admin());

-- 2. Forum Categories
CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone." ON forum_categories FOR SELECT USING (true);
CREATE POLICY "Only admins can manage categories." ON forum_categories FOR ALL USING (is_admin());

-- 3. Commentaries
CREATE TABLE IF NOT EXISTS commentaries (
  id TEXT PRIMARY KEY, -- book_chapter_verse
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE commentaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Commentaries are viewable by everyone." ON commentaries FOR SELECT USING (true);
CREATE POLICY "Only admins can manage commentaries." ON commentaries FOR ALL USING (is_admin());

-- 4. Highlights
CREATE TABLE IF NOT EXISTS highlights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  verse_text TEXT,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, book, chapter, verse)
);

ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own highlights." ON highlights FOR ALL USING (auth.uid() = user_id);

-- 5. Notes
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  verse_text TEXT,
  content TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, book, chapter, verse)
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notes." ON notes FOR ALL USING (auth.uid() = user_id);

-- 6. Prayers
CREATE TABLE IF NOT EXISTS prayers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL CHECK (length(content) < 1000000),
  category TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'answered')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own prayers." ON prayers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public prayers are viewable by everyone." ON prayers FOR SELECT USING (true);

-- 7. Prophetic Words
CREATE TABLE IF NOT EXISTS prophetic_words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  prayer_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE prophetic_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prophetic words are viewable by everyone." ON prophetic_words FOR SELECT USING (true);
CREATE POLICY "Admins can manage all prophetic words." ON prophetic_words FOR ALL USING (is_admin());
CREATE POLICY "Logged in users can update prayer count only." ON prophetic_words FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create their own prophetic words." ON prophetic_words FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Devotionals
CREATE TABLE IF NOT EXISTS devotionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL CHECK (length(content) < 1000000),
  verse TEXT,
  reflection TEXT,
  date DATE,
  publish_date DATE,
  author_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE devotionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Devotionals are viewable by everyone." ON devotionals FOR SELECT USING (true);
CREATE POLICY "Only admins can manage devotionals." ON devotionals FOR ALL USING (is_admin());

-- 9. Articles
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT NOT NULL CHECK (length(content) < 1000000),
  category TEXT,
  author TEXT,
  author_id UUID REFERENCES profiles(id),
  read_time TEXT,
  image_url TEXT,
  related_verses JSONB DEFAULT '[]', -- Stores array of {book, chapter, verse}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Articles are viewable by everyone." ON articles FOR SELECT USING (true);
CREATE POLICY "Only admins can manage articles." ON articles FOR ALL USING (is_admin());

-- 10. Sermons
CREATE TABLE IF NOT EXISTS sermons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  preacher TEXT NOT NULL,
  series TEXT,
  embed_id TEXT NOT NULL,
  platform TEXT DEFAULT 'spotify', -- 'spotify', 'youtube', 'apple', 'soundcloud', 'audio'
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE sermons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sermons are viewable by everyone." ON sermons FOR SELECT USING (true);
CREATE POLICY "Only admins can manage sermons." ON sermons FOR ALL USING (is_admin());

-- 11. Music
CREATE TABLE IF NOT EXISTS music (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  embed_id TEXT NOT NULL,
  embed_type TEXT DEFAULT 'track', -- 'track', 'album', 'playlist'
  platform TEXT DEFAULT 'spotify', -- 'spotify', 'youtube', 'soundcloud', 'audiomack'
  cover_url TEXT,
  genre TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE music ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Music is viewable by everyone." ON music FOR SELECT USING (true);
CREATE POLICY "Only admins can manage music." ON music FOR ALL USING (is_admin());

-- 12. Book Introductions
CREATE TABLE IF NOT EXISTS book_intros (
  id TEXT PRIMARY KEY, -- book name
  book TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE book_intros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Intros are viewable by everyone." ON book_intros FOR SELECT USING (true);
CREATE POLICY "Only admins can manage intros." ON book_intros FOR ALL USING (is_admin());

-- 13. Chapter Summaries
CREATE TABLE IF NOT EXISTS chapter_summaries (
  id TEXT PRIMARY KEY, -- book_chapter
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  content TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(book, chapter)
);

ALTER TABLE chapter_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Summaries are viewable by everyone." ON chapter_summaries FOR SELECT USING (true);
CREATE POLICY "Only admins can manage summaries." ON chapter_summaries FOR ALL USING (is_admin());

-- 14. Reading Plans
CREATE TABLE IF NOT EXISTS reading_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  readings JSONB DEFAULT '[]',
  color TEXT,
  is_ai BOOLEAN DEFAULT FALSE,
  creator_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE reading_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are viewable by everyone." ON reading_plans FOR SELECT USING (true);
CREATE POLICY "Only admins can manage plans." ON reading_plans FOR ALL USING (is_admin());

-- 15. Ebooks
CREATE TABLE IF NOT EXISTS ebooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_url TEXT,
  author_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ebooks are viewable by everyone." ON ebooks FOR SELECT USING (true);
CREATE POLICY "Only admins can manage ebooks." ON ebooks FOR ALL USING (is_admin());

-- 16. Ebook Chapters
CREATE TABLE IF NOT EXISTS ebook_chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  chapter_order INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE ebook_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chapters are viewable by everyone." ON ebook_chapters FOR SELECT USING (true);
CREATE POLICY "Only admins can manage chapters." ON ebook_chapters FOR ALL USING (is_admin());

-- 17. Study Guides
CREATE TABLE IF NOT EXISTS study_guides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  category TEXT,
  read_time TEXT,
  difficulty TEXT DEFAULT 'Introductory',
  rating NUMERIC DEFAULT 5.0,
  image_url TEXT,
  ebook_id UUID REFERENCES ebooks(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE study_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guides are viewable by everyone." ON study_guides FOR SELECT USING (true);
CREATE POLICY "Only admins can manage guides." ON study_guides FOR ALL USING (is_admin());

-- 18. Videos
CREATE TABLE IF NOT EXISTS videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Videos are viewable by everyone." ON videos FOR SELECT USING (true);
CREATE POLICY "Only admins can manage videos." ON videos FOR ALL USING (is_admin());

-- 19. Collections (Playlists and Series)
CREATE TABLE IF NOT EXISTS collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('playlist', 'series')),
  content_type TEXT NOT NULL CHECK (content_type IN ('sermon', 'article', 'music', 'video', 'mixed')),
  image_url TEXT,
  creator_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Collections are viewable by everyone." ON collections FOR SELECT USING (true);
CREATE POLICY "Only admins can manage collections." ON collections FOR ALL USING (is_admin());

CREATE TABLE IF NOT EXISTS collection_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('sermon', 'article', 'music', 'video')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Collection items are viewable by everyone." ON collection_items FOR SELECT USING (true);
CREATE POLICY "Only admins can manage collection items." ON collection_items FOR ALL USING (is_admin());

-- 20. Events
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TEXT,
  location TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are viewable by everyone." ON events FOR SELECT USING (true);
CREATE POLICY "Only admins can manage events." ON events FOR ALL USING (is_admin());

-- 20. Drafts
CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY, -- unique string ID
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own drafts." ON drafts FOR ALL USING (auth.uid() = user_id);

-- 21. AI Chats
CREATE TABLE IF NOT EXISTS ai_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  messages JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own chats." ON ai_chats FOR ALL USING (auth.uid() = user_id);

-- 22. Manna History
CREATE TABLE IF NOT EXISTS manna_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  verse TEXT NOT NULL,
  rhema TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, day)
);

ALTER TABLE manna_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own manna history." ON manna_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add own manna history." ON manna_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 23. Threads & Posts
CREATE TABLE IF NOT EXISTS threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  post_count INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Threads are viewable by everyone." ON threads FOR SELECT USING (true);
CREATE POLICY "Logged in users can create threads." ON threads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creators and admins can manage threads." ON threads FOR ALL USING (auth.uid() = creator_id OR is_admin());

CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are viewable by everyone." ON posts FOR SELECT USING (true);
CREATE POLICY "Logged in users can create posts." ON posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creators and admins can manage posts." ON posts FOR ALL USING (auth.uid() = user_id OR is_admin());

-- 24. Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL,
  item_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, item_id, item_type)
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own bookmarks." ON bookmarks FOR ALL USING (auth.uid() = user_id);

-- 25. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications." ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications." ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- 26. Journals
CREATE TABLE IF NOT EXISTS journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  ai_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own journals." ON journals FOR ALL USING (auth.uid() = user_id);

-- 27. User Reading Progress
CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, book, chapter)
);

ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reading progress." ON reading_progress FOR ALL USING (auth.uid() = user_id);

-- 28. User Plans
CREATE TABLE IF NOT EXISTS user_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES reading_plans(id) ON DELETE CASCADE,
  completed_days INTEGER[] DEFAULT '{}',
  current_day INTEGER DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, plan_id)
);

ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own plan enrollments." ON user_plans FOR ALL USING (auth.uid() = user_id);

-- 29. Study Groups
CREATE TABLE IF NOT EXISTS study_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Groups are viewable by everyone." ON study_groups FOR SELECT USING (true);
CREATE POLICY "Logged in users can create groups." ON study_groups FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators and admins can manage groups." ON study_groups FOR ALL USING (auth.uid() = creator_id OR is_admin());

-- 30. Study Group Memberships
CREATE TABLE IF NOT EXISTS study_group_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(group_id, user_id)
);

ALTER TABLE study_group_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Memberships are viewable by everyone." ON study_group_memberships FOR SELECT USING (true);
CREATE POLICY "Users can join groups." ON study_group_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups." ON study_group_memberships FOR DELETE USING (auth.uid() = user_id);

-- 31. Study Group Discussions
CREATE TABLE IF NOT EXISTS study_group_discussions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE study_group_discussions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view discussions." ON study_group_discussions FOR SELECT USING (
  EXISTS (SELECT 1 FROM study_group_memberships WHERE group_id = study_group_discussions.group_id AND user_id = auth.uid()) OR is_admin()
);
CREATE POLICY "Members can post discussions." ON study_group_discussions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM study_group_memberships WHERE group_id = group_id AND user_id = auth.uid())
);

-- 32. Notebook Folders
CREATE TABLE IF NOT EXISTS notebook_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES notebook_folders(id) ON DELETE CASCADE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE notebook_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own folders." ON notebook_folders FOR ALL USING (auth.uid() = user_id);

-- 33. Notebook Notes
CREATE TABLE IF NOT EXISTS notebook_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES notebook_folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE notebook_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notebook notes." ON notebook_notes FOR ALL USING (auth.uid() = user_id);

-- 34. Likes
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('sermon', 'article', 'music', 'video')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, item_id, item_type)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes are viewable by everyone." ON likes FOR SELECT USING (true);
CREATE POLICY "Users can manage own likes." ON likes FOR ALL USING (auth.uid() = user_id);
