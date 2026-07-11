-- ============================================
-- Foru Meme Gallery — Database Schema
-- Run this against your Neon PostgreSQL database
-- ============================================

-- Users table: identified by device_id (anonymous auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memes table: stores metadata for uploaded meme files
CREATE TABLE IF NOT EXISTS memes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    cloudinary_public_id VARCHAR(255),
    media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image', 'gif', 'video')),
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    like_count INTEGER DEFAULT 0,
    dislike_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reactions table: one reaction per user per meme (like or dislike)
CREATE TABLE IF NOT EXISTS reactions (
    meme_id UUID REFERENCES memes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_like BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (meme_id, user_id)
);

-- Comments table: anonymous comments on memes (no user_id)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meme_id UUID REFERENCES memes(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) <= 2000),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for query performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_memes_created_at ON memes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memes_media_type ON memes(media_type);
CREATE INDEX IF NOT EXISTS idx_reactions_meme_id ON reactions(meme_id);
CREATE INDEX IF NOT EXISTS idx_comments_meme_id ON comments(meme_id);
