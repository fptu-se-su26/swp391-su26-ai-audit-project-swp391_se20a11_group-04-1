$auditPath = "d:\FPTU\semeter_5\DevTrackAI\swp391-su26-ai-audit-project-swp391_se20a11_group-04-1\Pham_Duy_Hung\AI_AUDIT_LOG.md"
$promptsPath = "d:\FPTU\semeter_5\DevTrackAI\swp391-su26-ai-audit-project-swp391_se20a11_group-04-1\Pham_Duy_Hung\PROMPTS.md"

function Replace-Content {
    param([string]$Path, [string]$Pattern, [string]$Replacement)
    $content = Get-Content -Path $Path -Raw -Encoding UTF8
    $newContent = [System.Text.RegularExpressions.Regex]::Replace($content, $Pattern, $Replacement, [System.Text.RegularExpressions.RegexOptions]::Singleline)
    Set-Content -Path $Path -Value $newContent -Encoding UTF8
}

# AI_AUDIT_LOG.md
# Lần 1
$lan1_pattern = '### Lần sử dụng AI số 1\s+\|\s*Nội dung\s*\|\s*Thông tin\s*\|\s*\|---\|---\|\s*\|\s*Ngày sử dụng\s*\|\s*\|\s*\|\s*Công cụ AI\s*\|\s*ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / Antigravity / Khác\s*\|\s*\|\s*Mục đích sử dụng\s*\|\s*\|\s*\|\s*Phần việc liên quan\s*\|\s*Requirement / Design / Database / Frontend / Backend / Testing / Debug / Report / Presentation / Other\s*\|\s*\|\s*Mức độ sử dụng\s*\|\s*Hỗ trợ ý tưởng / Hỗ trợ một phần / Hỗ trợ nhiều / Sinh chính nội dung\s*\|'

$lan1_repl = @"
### Lần sử dụng AI số 1

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | DD/MM/YYYY |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Thiết kế kiến trúc Real-time cho CDP Screencast qua Websocket |
| Phần việc liên quan | Backend / Frontend / Design |
| Mức độ sử dụng | Hỗ trợ nhiều |
"@
Replace-Content $auditPath $lan1_pattern $lan1_repl

# Lần 2
$lan2_pattern = '### Lần sử dụng AI số 2\s+\|\s*Nội dung\s*\|\s*Thông tin\s*\|\s*\|---\|---\|\s*\|\s*Ngày sử dụng\s*\|\s*\|\s*\|\s*Công cụ AI\s*\|\s*ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / Antigravity / Khác\s*\|\s*\|\s*Mục đích sử dụng\s*\|\s*\|\s*\|\s*Phần việc liên quan\s*\|\s*Requirement / Design / Database / Frontend / Backend / Testing / Debug / Report / Presentation / Other\s*\|\s*\|\s*Mức độ sử dụng\s*\|\s*Hỗ trợ ý tưởng / Hỗ trợ một phần / Hỗ trợ nhiều / Sinh chính nội dung\s*\|'

$lan2_repl = @"
### Lần sử dụng AI số 2

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | DD/MM/YYYY |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Chuyển đổi kiến trúc từ Đồng bộ (Sync) sang Bất đồng bộ (Async) |
| Phần việc liên quan | Backend / Design |
| Mức độ sử dụng | Hỗ trợ ý tưởng |
"@
Replace-Content $auditPath $lan2_pattern $lan2_repl

# Lần 3
$lan3_pattern = '### Lần sử dụng AI số 3\s+\|\s*Nội dung\s*\|\s*Thông tin\s*\|\s*\|---\|---\|\s*\|\s*Ngày sử dụng\s*\|\s*\|\s*\|\s*Công cụ AI\s*\|\s*ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / Antigravity / Khác\s*\|\s*\|\s*Mục đích sử dụng\s*\|\s*\|\s*\|\s*Phần việc liên quan\s*\|\s*Requirement / Design / Database / Frontend / Backend / Testing / Debug / Report / Presentation / Other\s*\|\s*\|\s*Mức độ sử dụng\s*\|\s*Hỗ trợ ý tưởng / Hỗ trợ một phần / Hỗ trợ nhiều / Sinh chính nội dung\s*\|'

$lan3_repl = @"
### Lần sử dụng AI số 3

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | DD/MM/YYYY |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Thiết kế và chuẩn hóa luồng Database Migration (Flyway) |
| Phần việc liên quan | Database / Backend |
| Mức độ sử dụng | Hỗ trợ một phần |
"@
Replace-Content $auditPath $lan3_pattern $lan3_repl


# PROMPTS.md
# Prompt 1
$p1_pattern = '### Prompt số 1\s+\|\s*Nội dung\s*\|\s*Thông tin\s*\|\s*\|---\|---\|\s*\|\s*Ngày sử dụng\s*\|\s*\|\s*\|\s*Công cụ AI\s*\|\s*ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / Antigravity / Khác\s*\|\s*\|\s*Mục đích\s*\|\s*\|\s*\|\s*Phần việc liên quan\s*\|\s*Requirement / Design / Database / Coding / Testing / Debug / Report / Presentation / Other\s*\|\s*\|\s*Mức độ sử dụng\s*\|\s*Hỏi ý tưởng / Hỏi giải thích / Hỏi review / Hỏi debug / Hỏi sinh code / Hỏi tối ưu\s*\|'

$p1_repl = @"
### Prompt số 1

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | DD/MM/YYYY |
| Công cụ AI | Antigravity |
| Mục đích | Tìm giải pháp hiển thị ảnh thực thi Realtime (CDP Screencast) |
| Phần việc liên quan | Design / Coding / Testing |
| Mức độ sử dụng | Hỏi ý tưởng / Hỏi sinh code |
"@
Replace-Content $promptsPath $p1_pattern $p1_repl

# Prompt 2
$p2_pattern = '### Prompt số 2\s+\|\s*Nội dung\s*\|\s*Thông tin\s*\|\s*\|---\|---\|\s*\|\s*Ngày sử dụng\s*\|\s*\|\s*\|\s*Công cụ AI\s*\|\s*ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / Antigravity / Khác\s*\|\s*\|\s*Mục đích\s*\|\s*\|\s*\|\s*Phần việc liên quan\s*\|\s*Requirement / Design / Database / Coding / Testing / Debug / Report / Presentation / Other\s*\|\s*\|\s*Mức độ sử dụng\s*\|\s*Hỏi ý tưởng / Hỏi giải thích / Hỏi review / Hỏi debug / Hỏi sinh code / Hỏi tối ưu\s*\|'

$p2_repl = @"
### Prompt số 2

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | DD/MM/YYYY |
| Công cụ AI | Antigravity |
| Mục đích | Giải quyết Timeout và chuyển sang kiến trúc Async bằng Kafka |
| Phần việc liên quan | Design / Coding |
| Mức độ sử dụng | Hỏi ý tưởng / Hỏi tối ưu |
"@
Replace-Content $promptsPath $p2_pattern $p2_repl

# Prompt 3
$p3_pattern = '### Prompt số 3\s+\|\s*Nội dung\s*\|\s*Thông tin\s*\|\s*\|---\|---\|\s*\|\s*Ngày sử dụng\s*\|\s*\|\s*\|\s*Công cụ AI\s*\|\s*ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / Antigravity / Khác\s*\|\s*\|\s*Mục đích\s*\|\s*\|\s*\|\s*Phần việc liên quan\s*\|\s*Requirement / Design / Database / Coding / Testing / Debug / Report / Presentation / Other\s*\|\s*\|\s*Mức độ sử dụng\s*\|\s*Hỏi ý tưởng / Hỏi giải thích / Hỏi review / Hỏi debug / Hỏi sinh code / Hỏi tối ưu\s*\|'

$p3_repl = @"
### Prompt số 3

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | DD/MM/YYYY |
| Công cụ AI | Antigravity |
| Mục đích | Tạo script Database Migration chuẩn cho Flyway |
| Phần việc liên quan | Database |
| Mức độ sử dụng | Hỏi sinh code / Hỏi review |
"@
Replace-Content $promptsPath $p3_pattern $p3_repl

Write-Host "Updated tables in AI_AUDIT_LOG.md and PROMPTS.md"
