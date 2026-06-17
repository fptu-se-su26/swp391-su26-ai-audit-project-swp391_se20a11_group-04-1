-- Migration: V20260602213000__add_source_generation_id_to_requirements.sql
-- Date: 2026-06-02
-- Author: AI Assistant
-- Description: Add source_generation_id to requirements table to trace back to AI generation staging

ALTER TABLE requirements ADD COLUMN source_generation_id UUID;
