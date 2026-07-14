-- Add cover image URL and theme color to projects table for Project Settings customization
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(1000);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS theme_color VARCHAR(7);
