-- Drive Fusion Schema
-- This file documents all tables, columns, indexes, foreign keys, and RLS policies.

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS (managed by Supabase Auth, but we reference user_id)
-- ============================================================

-- ============================================================
-- GOOGLE ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS google_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_email TEXT NOT NULL,
  google_name TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  expires_at TIMESTAMPTZ,
  total_storage BIGINT NOT NULL DEFAULT 0,
  used_storage BIGINT NOT NULL DEFAULT 0,
  available_storage BIGINT NOT NULL DEFAULT 0,
  connected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_google_accounts_user_id ON google_accounts(user_id);

ALTER TABLE google_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own google accounts" ON google_accounts;
CREATE POLICY "Users can only access their own google accounts" ON google_accounts
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FILES
-- ============================================================
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_account_id UUID NOT NULL REFERENCES google_accounts(id) ON DELETE CASCADE,
  drive_file_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT DEFAULT 'application/octet-stream',
  size BIGINT NOT NULL DEFAULT 0,
  virtual_folder_id UUID REFERENCES virtual_folders(id) ON DELETE SET NULL,
  ai_summary TEXT,
  starred BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_google_account_id ON files(google_account_id);
CREATE INDEX IF NOT EXISTS idx_files_starred ON files(user_id, starred) WHERE starred = true;
CREATE INDEX IF NOT EXISTS idx_files_deleted ON files(user_id, deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_files_not_deleted ON files(user_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_files_virtual_folder ON files(virtual_folder_id);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own files" ON files;
CREATE POLICY "Users can only access their own files" ON files
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- VIRTUAL FOLDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS virtual_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES virtual_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_virtual_folders_user_id ON virtual_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_folders_parent ON virtual_folders(parent_id);

ALTER TABLE virtual_folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own folders" ON virtual_folders;
CREATE POLICY "Users can only access their own folders" ON virtual_folders
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- AI TAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  tag TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_tags_file_id ON ai_tags(file_id);
CREATE INDEX IF NOT EXISTS idx_ai_tags_tag ON ai_tags(tag);

ALTER TABLE ai_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access their own tags" ON ai_tags;
CREATE POLICY "Users can only access their own tags" ON ai_tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM files WHERE files.id = ai_tags.file_id AND files.user_id = auth.uid())
  );

-- ============================================================
-- AVATARS STORAGE BUCKET (create in Supabase dashboard)
-- Bucket name: avatars
-- Public bucket: true
-- RLS: Allow authenticated users to INSERT/UPDATE own folder
-- ============================================================
-- SQL to run in Supabase dashboard:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- CREATE POLICY "Users can upload their own avatars" ON storage.objects
--   FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
-- CREATE POLICY "Anyone can view avatars" ON storage.objects
--   FOR SELECT USING (bucket_id = 'avatars');
