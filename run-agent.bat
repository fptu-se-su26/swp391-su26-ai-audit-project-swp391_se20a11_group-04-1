@echo off
REM Script khởi chạy DevTrack Local Agent bằng mã nguồn mới nhất (đã fix) trong thư mục code\devtrack-agent

set TOKEN=dta_34_4e7e75200f6a4f0bac7e19f054971342

echo =======================================================
echo KHOI CHAY DEVTRACK AGENT TU SOURCE CODE LOCAL (v1.0.18+)
echo =======================================================
node code\devtrack-agent\index.js --token=%TOKEN%
pause
