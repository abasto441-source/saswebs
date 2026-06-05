-- Migration: Create templates table for SaaS global blueprints
-- Implementing logical multi-tenancy administration

CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    preview_image TEXT,
    industry TEXT,
    is_premium BOOLEAN DEFAULT false,
    required_modules JSONB DEFAULT '[]'::jsonb,
    blocks_included JSONB DEFAULT '[]'::jsonb,
    version TEXT DEFAULT '1.0.0',
    structure_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: Anyone can read templates (for browsing in the visual catalog)
CREATE POLICY "Anyone can view templates" ON templates
    FOR SELECT USING (true);

-- 2. Modify Policy: Only Super Admins can insert/update/delete global templates
CREATE POLICY "Super admin can manage templates" ON templates
    FOR ALL USING (
        get_user_role() = 'super_admin'
    );
