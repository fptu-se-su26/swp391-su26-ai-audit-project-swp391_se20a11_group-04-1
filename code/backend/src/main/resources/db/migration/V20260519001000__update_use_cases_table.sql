-- Migration: `V20260519001000__update_use_cases_table.sql`
-- Date: 2026-05-19
-- Author: Antigravity
-- Description: Add code, status, version, and completeness_score to use_cases table for UI matching

ALTER TABLE use_cases
ADD COLUMN code VARCHAR(20) UNIQUE,
ADD COLUMN status VARCHAR(50) DEFAULT 'DRAFT',
ADD COLUMN version VARCHAR(20) DEFAULT 'v1.0',
ADD COLUMN completeness_score INT DEFAULT 0;
