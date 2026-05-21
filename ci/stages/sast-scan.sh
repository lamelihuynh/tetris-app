#!/usr/bin/env bash
set -euo pipefail

echo "============================================================"
echo "  SAST SCAN — SonarQube"
echo "  SonarQube host : ${SONAR_HOST}"
echo "  Project key    : devsecops-factory"
echo "============================================================"

TOOL_BASE_DIR="${WORKSPACE}/security/sast"
TOOL_HOME="${TOOL_BASE_DIR}/sonar-scanner"
rm -rf "${TOOL_BASE_DIR}"

mkdir -p "${TOOL_BASE_DIR}"



if [ ! -f "${TOOL_HOME}/bin/sonar-scanner" ]; then
    echo "[*] Sonar Scanner not found. Downloading..."
    # ĐỔI LINK: Bỏ chữ -linux đi để dùng bản OS-Independent
    curl -sSLo /tmp/sonar-scanner.zip https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006.zip
    unzip -o -q /tmp/sonar-scanner.zip -d "${TOOL_BASE_DIR}/"

    # Đổi tên thư mục giải nén (cũng bỏ chữ -linux)
    mv "${TOOL_BASE_DIR}/sonar-scanner-5.0.1.3006" "${TOOL_HOME}"
fi

chmod +x "${TOOL_HOME}/bin/sonar-scanner"
# ĐÃ XOÁ: chmod +x "${TOOL_HOME}/jre/bin/java" (Vì bản này không có thư mục jre)

echo "[*] Running scan..."

# Cưỡng chế quét vào thư mục target-repo (nơi chứa code chatapp ní vừa clone về)
# Nếu không thấy thư mục này, nó sẽ quay về quét thư mục hiện tại (.)
SCAN_TARGET="target-repo"
if [ ! -d "$SCAN_TARGET" ]; then
    SCAN_TARGET="."
fi

echo "[*] Scanning $SCAN_TARGET"

"${TOOL_HOME}/bin/sonar-scanner" \
  -Dsonar.projectKey="devsecops-factory" \
  -Dsonar.sources="$SCAN_TARGET" \
  -Dsonar.host.url="${SONAR_HOST}" \
  -Dsonar.login="${SONAR_TOKEN}" \
  -Dsonar.projectVersion="${IMAGE_TAG:-latest}" \
  -Dsonar.scm.disabled=true \
  -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info