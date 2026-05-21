#!/usr/bin/env bash
set -euo pipefail

echo "============================================================"
echo "  SAST SCAN — SonarQube"
echo "  SonarQube host : ${SONAR_HOST}"
echo "  Project key    : devsecops-factory"
echo "============================================================"

TOOL_BASE_DIR="${WORKSPACE}/security/sast"
TOOL_HOME="${TOOL_BASE_DIR}/sonar-scanner"
mkdir -p "${TOOL_BASE_DIR}"

# 1. --- CÀI ĐẶT SONAR SCANNER ---
if [ ! -f "${TOOL_HOME}/bin/sonar-scanner" ]; then
    echo "[*] Sonar Scanner not found. Downloading..."
    curl -sSLo /tmp/sonar-scanner.zip https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006.zip
    unzip -o -q /tmp/sonar-scanner.zip -d "${TOOL_BASE_DIR}/"
    mv "${TOOL_BASE_DIR}/sonar-scanner-5.0.1.3006" "${TOOL_HOME}"
fi
chmod +x "${TOOL_HOME}/bin/sonar-scanner"

# 2. --- CÀI ĐẶT NODE.JS (ARM64) CHO JENKINS ---
NODE_DIR="${TOOL_BASE_DIR}/nodejs"
if [ ! -x "${NODE_DIR}/bin/node" ]; then
    echo "[*] Node.js not found. Downloading Node.js for ARM64..."
    curl -sSLo /tmp/nodejs.tar.gz https://nodejs.org/dist/v20.11.1/node-v20.11.1-linux-arm64.tar.gz
    mkdir -p "${NODE_DIR}"
    tar -xzf /tmp/nodejs.tar.gz -C "${NODE_DIR}" --strip-components=1
fi

# Thêm Node.js vào biến môi trường PATH để Sonar Scanner có thể gọi được
export PATH="${NODE_DIR}/bin:$PATH"

echo "[*] Node.js version:"
node -v

# 3. --- CHẠY SCAN ---
echo "[*] Running scan..."

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