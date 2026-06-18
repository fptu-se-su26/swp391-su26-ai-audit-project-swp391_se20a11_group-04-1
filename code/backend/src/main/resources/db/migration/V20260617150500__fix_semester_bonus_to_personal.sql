-- Fix the enum string from BONUS to PERSONAL to match the Java Enum AcademicSeason
UPDATE academic_contexts SET semester = 'PERSONAL' WHERE semester = 'BONUS';
