"""
Script sinh file INSERT SQL cho project_id = 1
Cần: pip install psycopg2-binary
Chạy: python gen_insert.py
Output: seed_project_1.sql
"""

import psycopg2
import psycopg2.extras
import json
import sys
from datetime import date, datetime

PROJECT_ID = 1
OUTPUT_FILE = "seed_project_1.sql"

DB = {
    "host": "localhost",
    "port": 5432,
    "dbname": "dev_track_ai",
    "user": "postgres",
    "password": "123",
    "options": "-c client_encoding=UTF8"
}

def q(val):
    """Quote a value for SQL"""
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, (date, datetime)):
        return f"'{val}'"
    if isinstance(val, dict) or isinstance(val, list):
        return f"'{json.dumps(val, ensure_ascii=False).replace(chr(39), chr(39)*2)}'::jsonb"
    # string
    s = str(val).replace("'", "''")
    return f"'{s}'"

def rows_to_inserts(table, rows, cols, conflict="DO NOTHING"):
    lines = []
    for row in rows:
        vals = ", ".join(q(row[c]) for c in cols)
        col_list = ", ".join(cols)
        lines.append(f"INSERT INTO {table} ({col_list}) VALUES ({vals}) ON CONFLICT {conflict};")
    return lines

conn = psycopg2.connect(**DB)
conn.set_client_encoding('UTF8')
cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

out = []
out.append("-- ================================================================")
out.append("-- SEED DATA: Project 1 (DevTrack Alpha Test)")
out.append("-- Generated automatically - chỉ cần chạy file này trên máy mới")
out.append("-- REQUIRED: các bảng đã được tạo bởi Flyway migration trước")
out.append("-- ================================================================\n")
out.append("SET session_replication_role = replica; -- tắt FK check tạm thời\n")

# ------------------------------------------------------------------ users cần thiết
out.append("-- ================================================================")
out.append("-- [0] USER ACCOUNTS (chỉ những user liên quan project 1)")
out.append("-- ================================================================")
cur.execute("""
    SELECT DISTINCT ua.id, ua.username, ua.email, ua.password_hash,
           ua.system_role_id, ua.is_active, ua.created_at, ua.updated_at
    FROM user_accounts ua
    WHERE ua.id IN (
        SELECT created_by FROM projects WHERE id = %s
        UNION SELECT user_id FROM project_members WHERE project_id = %s
        UNION SELECT owner_id FROM requirements WHERE project_id = %s AND owner_id IS NOT NULL
        UNION SELECT created_by FROM requirements WHERE project_id = %s
        UNION SELECT created_by FROM use_cases WHERE project_id = %s AND is_deleted = FALSE
        UNION SELECT uploaded_by FROM evidence WHERE project_id = %s
    )
    ORDER BY ua.id
""", (PROJECT_ID,)*6)
users = cur.fetchall()
cols = ["id","username","email","password_hash","system_role_id","is_active","created_at","updated_at"]
out += rows_to_inserts("user_accounts", users, cols, "(id) DO UPDATE SET updated_at = EXCLUDED.updated_at")

out.append("")
out.append("-- USER PROFILES")
cur.execute("""
    SELECT up.id, up.user_id, up.full_name, up.avatar_url, up.bio, up.phone, up.updated_at
    FROM user_profiles up
    WHERE up.user_id = ANY(%s)
""", ([u["id"] for u in users],))
profiles = cur.fetchall()
cols = ["id","user_id","full_name","avatar_url","bio","phone","updated_at"]
out += rows_to_inserts("user_profiles", profiles, cols, "(user_id) DO UPDATE SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url")

# ------------------------------------------------------------------ project
out.append("\n-- ================================================================")
out.append("-- [1] PROJECT")
out.append("-- ================================================================")
cur.execute("""
    SELECT id, name, description, type::text AS type, academic_context_id,
           start_date, deadline, status::text AS status, color, avatar_url,
           created_by, created_at, updated_at
    FROM projects WHERE id = %s
""", (PROJECT_ID,))
projects = cur.fetchall()
cols = ["id","name","description","type","academic_context_id","start_date","deadline","status","color","avatar_url","created_by","created_at","updated_at"]

# Cần cast enum manually
for p in projects:
    t = p["type"]; s = p["status"]
    out.append(
        f"INSERT INTO projects (id, name, description, type, academic_context_id, start_date, deadline, status, color, avatar_url, created_by, created_at, updated_at) VALUES ("
        f"{q(p['id'])}, {q(p['name'])}, {q(p['description'])}, {q(t)}::project_type_enum, "
        f"{q(p['academic_context_id'])}, {q(p['start_date'])}, {q(p['deadline'])}, {q(s)}::project_status_enum, "
        f"{q(p['color'])}, {q(p['avatar_url'])}, {q(p['created_by'])}, {q(p['created_at'])}, {q(p['updated_at'])}"
        f") ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at;"
    )

# ------------------------------------------------------------------ project members
out.append("\n-- ================================================================")
out.append("-- [2] PROJECT MEMBERS")
out.append("-- ================================================================")
cur.execute("""
    SELECT id, project_id, user_id, project_role_id, joined_at, invited_by
    FROM project_members WHERE project_id = %s
""", (PROJECT_ID,))
members = cur.fetchall()
cols = ["id","project_id","user_id","project_role_id","joined_at","invited_by"]
out += rows_to_inserts("project_members", members, cols, "(project_id, user_id) DO NOTHING")

# ------------------------------------------------------------------ requirements
out.append("\n-- ================================================================")
out.append("-- [3] REQUIREMENTS")
out.append("-- ================================================================")
cur.execute("""
    SELECT id, project_id, title, description, type::text AS type, priority::text AS priority,
           acceptance_criteria, owner_id, status::text AS status, evidence_required,
           req_order, req_code, project_sub_id, is_deleted, ai_generated,
           created_by, created_at, updated_at
    FROM requirements
    WHERE project_id = %s AND is_deleted = FALSE
    ORDER BY project_sub_id NULLS LAST, id
""", (PROJECT_ID,))
reqs = cur.fetchall()
for r in reqs:
    out.append(
        f"INSERT INTO requirements (id, project_id, title, description, type, priority, acceptance_criteria, "
        f"owner_id, status, evidence_required, req_order, req_code, project_sub_id, is_deleted, ai_generated, "
        f"created_by, created_at, updated_at) VALUES ("
        f"{q(r['id'])}, {q(r['project_id'])}, {q(r['title'])}, {q(r['description'])}, "
        f"{q(r['type'])}::requirement_type_enum, {q(r['priority'])}::priority_enum, "
        f"{q(r['acceptance_criteria'])}, "
        f"{q(r['owner_id'])}, {q(r['status'])}::requirement_status_enum, "
        f"{q(r['evidence_required'])}, {q(r['req_order'])}, {q(r['req_code'])}, "
        f"{q(r['project_sub_id'])}, {q(r['is_deleted'])}, {q(r['ai_generated'])}, "
        f"{q(r['created_by'])}, {q(r['created_at'])}, {q(r['updated_at'])}"
        f") ON CONFLICT (id) DO NOTHING;"
    )

req_ids = [r["id"] for r in reqs]

# requirement tags
out.append("\n-- REQUIREMENT TAGS")
if req_ids:
    cur.execute("SELECT id, requirement_id, tag FROM requirement_tags WHERE requirement_id = ANY(%s)", (req_ids,))
    tags = cur.fetchall()
    cols = ["id","requirement_id","tag"]
    out += rows_to_inserts("requirement_tags", tags, cols, "(requirement_id, tag) DO NOTHING")

# ------------------------------------------------------------------ use cases
out.append("\n-- ================================================================")
out.append("-- [4] USE CASES")
out.append("-- ================================================================")
cur.execute("""
    SELECT id, project_id, requirement_id, code, project_sub_id, name, status, version,
           precondition, postcondition, main_flow, alternative_flow,
           includes_list, extends_list, completeness_score,
           show_in_diagram, added_from_diagram, ai_generated,
           req_version_hash, is_deleted, created_by, created_at, updated_at
    FROM use_cases
    WHERE project_id = %s AND is_deleted = FALSE
    ORDER BY project_sub_id NULLS LAST, id
""", (PROJECT_ID,))
ucs = cur.fetchall()
for uc in ucs:
    out.append(
        f"INSERT INTO use_cases (id, project_id, requirement_id, code, project_sub_id, name, status, version, "
        f"precondition, postcondition, main_flow, alternative_flow, includes_list, extends_list, "
        f"completeness_score, show_in_diagram, added_from_diagram, ai_generated, "
        f"req_version_hash, is_deleted, created_by, created_at, updated_at) VALUES ("
        f"{q(uc['id'])}, {q(uc['project_id'])}, {q(uc['requirement_id'])}, {q(uc['code'])}, "
        f"{q(uc['project_sub_id'])}, {q(uc['name'])}, {q(uc['status'])}, {q(uc['version'])}, "
        f"{q(uc['precondition'])}, {q(uc['postcondition'])}, "
        f"{q(uc['main_flow'])}, "
        f"{q(uc['alternative_flow'])}, "
        f"{q(uc['includes_list'])}, "
        f"{q(uc['extends_list'])}, "
        f"{q(uc['completeness_score'])}, {q(uc['show_in_diagram'])}, {q(uc['added_from_diagram'])}, "
        f"{q(uc['ai_generated'])}, {q(uc['req_version_hash'])}, {q(uc['is_deleted'])}, "
        f"{q(uc['created_by'])}, {q(uc['created_at'])}, {q(uc['updated_at'])}"
        f") ON CONFLICT (id) DO NOTHING;"
    )

uc_ids = [uc["id"] for uc in ucs]

# use_case_actors
out.append("\n-- USE CASE ACTORS")
if uc_ids:
    cur.execute("SELECT id, use_case_id, actor_name FROM use_case_actors WHERE use_case_id = ANY(%s)", (uc_ids,))
    uca = cur.fetchall()
    cols = ["id","use_case_id","actor_name"]
    out += rows_to_inserts("use_case_actors", uca, cols, "(id) DO NOTHING")

# ------------------------------------------------------------------ project actors (diagram)
out.append("\n-- ================================================================")
out.append("-- [5] PROJECT ACTORS (UC Diagram)")
out.append("-- ================================================================")
cur.execute("""
    SELECT id, project_id, name, description, is_deleted, created_at, updated_at
    FROM project_actors WHERE project_id = %s AND is_deleted = FALSE
""", (PROJECT_ID,))
pactors = cur.fetchall()
cols = ["id","project_id","name","description","is_deleted","created_at","updated_at"]
out += rows_to_inserts("project_actors", pactors, cols, "(id) DO NOTHING")

# ------------------------------------------------------------------ project diagram layout
out.append("\n-- ================================================================")
out.append("-- [6] PROJECT DIAGRAM (layout data, bỏ image_base64)")
out.append("-- ================================================================")
cur.execute("""
    SELECT id, project_id, layout_data, updated_at, created_at
    FROM project_diagrams WHERE project_id = %s
""", (PROJECT_ID,))
diagrams = cur.fetchall()
for d in diagrams:
    out.append(
        f"INSERT INTO project_diagrams (id, project_id, layout_data, updated_at, created_at) VALUES ("
        f"{q(d['id'])}, {q(d['project_id'])}, {q(d['layout_data'])}, "
        f"{q(d['updated_at'])}, {q(d['created_at'])}"
        f") ON CONFLICT (project_id) DO UPDATE SET layout_data = EXCLUDED.layout_data, updated_at = EXCLUDED.updated_at;"
    )

# ------------------------------------------------------------------ sequences reset
out.append("\n-- ================================================================")
out.append("-- [7] RESET SEQUENCES (chạy sau khi import xong)")
out.append("-- ================================================================")
for tbl, seq in [
    ("user_accounts", "user_accounts_id_seq"),
    ("projects", "projects_id_seq"),
    ("project_members", "project_members_id_seq"),
    ("requirements", "requirements_id_seq"),
    ("use_cases", "use_cases_id_seq"),
    ("use_case_actors", "use_case_actors_id_seq"),
    ("project_actors", "project_actors_id_seq"),
    ("project_diagrams", "project_diagrams_id_seq"),
]:
    out.append(f"SELECT setval('{seq}', COALESCE((SELECT MAX(id) FROM {tbl}), 1));")

out.append("\nSET session_replication_role = DEFAULT; -- bật lại FK check")
out.append("\n-- DONE! Import thành công.")

cur.close()
conn.close()

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write("\n".join(out))

print(f"✅ Done! File: {OUTPUT_FILE}")
print(f"   Users: {len(users)}")
print(f"   Requirements: {len(reqs)}")
print(f"   Use Cases: {len(ucs)}")
print(f"   Project Actors: {len(pactors)}")
print(f"   Diagrams: {len(diagrams)}")
