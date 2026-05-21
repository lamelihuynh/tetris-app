#!/usr/bin/env bash
set -euo pipefail

# MẸO: Đảm bảo SONAR_HOST trong Jenkins được cấu hình là http://docker.internal
echo "============================================================"
echo "                   SAST SCAN — SonarQube"
echo "  SonarQube host : ${SONAR_HOST}"
echo "  Project key    : devsecops-factory"
echo "============================================================"

TOOL_BASE_DIR="${WORKSPACE}/security/sast"
TOOL_HOME="${TOOL_BASE_DIR}/sonar-scanner"

# Tự động tải bản ARM64 (aarch64) dành cho Mac M1 chạy Docker Linux
if [ ! -f "${TOOL_HOME}/bin/sonar-scanner" ]; then
    echo "[*] Sonar Scanner not found. Downloading ARM64 version..."
    
    # Xóa tàn dư của bản x86_64 lỗi trước đó
    rm -rf "${TOOL_HOME}" "${TOOL_BASE_DIR}/sonar-scanner-5.0.1.3006-linux-aarch64"
    mkdir -p "${TOOL_BASE_DIR}"
    
    # Tải bản chạy native trên ARM64
    curl -sSLo /tmp/sonar-scanner.zip https://sonarsource.com
    unzip -o -q /tmp/sonar-scanner.zip -d "${TOOL_BASE_DIR}/"
    
    mv "${TOOL_BASE_DIR}/sonar-scanner-5.0.1.3006-linux-aarch64" "${TOOL_HOME}"
    rm -f /tmp/sonar-scanner.zip
fi

echo "[*] Running scan..."
# Gọi lệnh quét với các tham số bạn đã truyền vào script
"${TOOL_HOME}/bin/sonar-scanner" \
  -Dsonar.host.url="${SONAR_HOST}" \
  "$@"
