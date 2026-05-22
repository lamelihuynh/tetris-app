#!/usr/bin/env bash
set -euo pipefail

echo "============================================================"
echo "  IaC SCAN — Checkov (Optimized & Non-blocking)"
echo "============================================================"

# Lấy thư mục từ tham số truyền vào (mặc định là ./target-repo nếu không truyền)
TARGET_DIR=${1:-"./target-repo"}

echo "[*] Target directory: ${TARGET_DIR}"
echo "[*] Scanning for Dockerfile, Kubernetes, Terraform, Helm, etc..."

# Tạo thư mục chứa report nếu chưa có
mkdir -p scan-reports

# TỐI ƯU HÓA:
# 1. Dùng '-v $(pwd):/work' để mount trực tiếp code vào container (nhanh gấp nhiều lần docker cp).
# 2. Dùng '--soft-fail' để KHÔNG bẻ gãy pipeline (Exit code luôn là 0).
# 3. Xuất ra 2 định dạng cùng lúc (cli cho console, json cho artifact).
docker run --rm \
    -v "$(pwd):/work" \
    -w /work \
    bridgecrew/checkov:latest \
    --directory "${TARGET_DIR}" \
    --soft-fail \
    --output cli \
    --output json \
    --output-file-path console,scan-reports/checkov_report.json

echo "[*] Scan complete. Output saved to scan-reports/checkov_report.json"

# Kiểm tra xem file report có được tạo ra thành công không
if [ -s scan-reports/checkov_report.json ]; then
    echo "============================================================"
    echo "[+] Report Summary:"
    grep -E "\"passed\"|\"failed\"|\"resource_count\"" scan-reports/checkov_report.json | head -n 5 || true
    echo "============================================================"
else
    echo "[!] Warning: Report JSON file was not generated."
fi