// ====================================================
// Jenkins File - DevSecOps Full Pipeline
// ====================================================
// 12-stage pipeline:
// 1. Checkout source from GitHub -
// 2. Prepare metadata (Git commit tag, build number) - 
// 3. Secrets scan (Gitleaks, TruffleHog) - 
// 4. SCA scan (OWASP Dependency-Check) - 
// 5. SAST scan (SonarQube) - 
// 6. Build Docker image - 
// 7. Container scan (Trivy) - 
// 8. IaC scan (Checkov on K8s manifests) - 
// 9. Push image to AWS ECR
// 10. Summary & reporting
// 11. 
// 12. DAST 
// 13. Deploy 
// ====================================================

def     IMAGE_TAG = ""
def     IMAGE_URI = ""
def     GIT_COMMIT_SHORT = ""
def     STAGING_URL = "http://tetris-staging.example.com:30080"
def     PROD_URL = "http://tetris.example.com:30080"

pipeline {
  agent any

  environment{
    AWS_REGION= 'ap-southeast-1'
    AWS_ACCOUNT_ID = '997961584240'
    ECR_REPO = 'devsecops/ecr'
    // REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    REGISTRY = "localhost:5001"
    REPO_NAME = "devsecops/tetris"
    IMAGE_NAME = "${REGISTRY}/${REPO_NAME}"
    // IMAGE_NAME = "${REGISTRY}/${ECR_REPO}"
    SONAR_HOST = "${SONAR_HOST}"
    DEFECTDOJO_URL = "${DEFECTDOJO_URL}"

    SCAN_REPORT_DIR = "${WORKSPACE}/scan-reports"


    KUBECONFIG = "/home/jenkins/.kube/config"
  }


  options{
    // timestamps()
    timeout(time: 2, unit: 'HOURS')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  stages{
    stage('1. Checkout') {
      steps {
        script {
          def scmVars = checkout([
            $class: 'GitSCM', 
            branches: [[name: "*/main"]], 
            userRemoteConfigs: [[
              url: 'https://github.com/lamelihuynh/tetris-app',
            ]]
          ])
          
          if (scmVars != null && scmVars.GIT_COMMIT != null) {
            env.GIT_COMMIT_SHORT = scmVars.GIT_COMMIT.toString().substring(0, 7)
          } else {
            env.GIT_COMMIT_SHORT = "build-${env.BUILD_NUMBER}"
          }
          
          echo "TAG IMMAGE : ${env.GIT_COMMIT_SHORT}"
        }
      }
    }
    



    stage('2. Prepare Metadata'){
      steps{
        script{
          sh "mkdir -p ${env.SCAN_REPORT_DIR}"
          env.IMAGE_TAG = env.GIT_COMMIT_SHORT
          env.IMAGE_URI = "${env.IMAGE_NAME}:${env.IMAGE_TAG}"
          echo "Image TAG: ${env.IMAGE_TAG}"
          echo "Image URI: ${env.IMAGE_URI}"
          echo "Report directory: ${env.SCAN_REPORT_DIR}" 
        }
      }
    }

    stage('3. Secrets Scan'){
      when {
        expression { fileExists('app/src')} 
      }
      steps {
        script{
          echo ' ===== Running secrets scan (Gitleaks).... ==== ' 
          def scanStatus = sh (
            script: '''

              if ! command -v gitleaks &> /dev/null; then
                echo [-] Gitleaks has not installed. The process will installe automated...
                curl -sSL https://github.com/gitleaks/gitleaks/releases/download/v8.18.2/gitleaks_8.18.2_linux_x64.tar.gz | tar -xz 
                chmod +x gitleaks
                export PATH=$PATH:$(pwd)
              fi
              ./gitleaks protect detect --source . --report-path ${SCAN_REPORT_DIR}/gitleaks-report.json --report-format json

            ''',
            returnStatus: true
          )

          if (scanStatus == 1)  {
            error("\033[31m [CRITICAL]: Hardcoded secrets detected by Gitleaks! Pipeline aborted. Please check file report for detail.")
          }
          else if (scanStatus != 0){
            error("\033[33m [SYSTEM ERROR]: Cannot run Gitleaks (Exit code: ${scanStatus}). Pipeline aborted.")
          }
          else {
            echo "\033[32m [PASS]: No secrets found. Code looks clean!"
          }
        }
      }
      post{
        always{
          archiveArtifacts artifacts: "${SCAN_REPORT_DIR}/gitleaks-report.json", allowEmptyArchive: true
        }
      }
    }

    stage('4. SCA Scan'){
      when {
        expression {fileExists('app/package.json')}
      }

      steps{
        script{
          echo " ==== Running SCA scan (OWASP Dependency - Check) ===="
          sh '''
          #!/usr/bin/env bash
# =============================================================================
# ci/stages/sca-scan.sh
# Owner : Team 2 — My
# Purpose: SCA (Software Composition Analysis) using OWASP Dependency-Check
# =============================================================================

set -euo pipefail

FAIL_CVSS="${SCA_FAIL_CVSS:-7}"
DC_VERSION="${DC_VERSION:-9.0.9}"

SCA_TOOL_DIR="${WORKSPACE}/security/sca"
DC_HOME="${SCA_TOOL_DIR}/dependency-check"
DC_BIN="${DC_HOME}/bin/dependency-check.sh"
DC_DATA_DIR="${SCA_TOOL_DIR}/data"  # <--- Nơi chứa Database NVD

# Đường dẫn quét và báo cáo
SCAN_DIR="${SCAN_DIR:-${WORKSPACE}/app}"
REPORT_DIR="${SCAN_REPORT_DIR:-${WORKSPACE}/scan-reports}"
REPORT_JSON="${REPORT_DIR}/sca-dependency-check-report.json"
REPORT_HTML="${REPORT_DIR}/sca-dependency-check-report.html"
NVD_API_KEY="${NVD_API_KEY:-}"
mkdir -p "${REPORT_DIR}"
mkdir -p "${DC_DATA_DIR}"
mkdir -p "${SCA_TOOL_DIR}"

echo "============================================================"
echo "  SCA SCAN — OWASP Dependency-Check"
echo "  Scan target : ${SCAN_DIR}"
echo "  Tool Home   : ${DC_HOME}"
echo "  Data Dir    : ${DC_DATA_DIR}"
echo "============================================================"
install_dependency_check() {
  echo "[*] Installing OWASP Dependency-Check v${DC_VERSION}..."
  local ZIP="dependency-check-${DC_VERSION}-release.zip"
  local URL="https://github.com/jeremylong/DependencyCheck/releases/download/v${DC_VERSION}/${ZIP}"

  curl -sSL "${URL}" -o "/tmp/${ZIP}"
  # Giải nén vào folder security/sca
  unzip -qo "/tmp/${ZIP}" -d "${SCA_TOOL_DIR}"
  chmod +x "${DC_BIN}"
  rm -f "/tmp/${ZIP}"
  echo "[+] Dependency-Check installed at ${DC_HOME}"
}

if [[ ! -x "${DC_BIN}" ]]; then
  install_dependency_check
fi
DC_ARGS=(
  --project "devsecops-factory"
  --scan    "${SCAN_DIR}"
  --out     "${REPORT_DIR}"
  --data    "${DC_DATA_DIR}"  
  --format  "JSON"
  --format  "HTML"
  --failOnCVSS "${FAIL_CVSS}"
  --enableRetired
  --enableExperimental
  --nodeAuditSkipDevDependencies
  --log "${REPORT_DIR}/sca-dc.log"

  --nvdApiDelay 10000            # Chờ 10 giây giữa các lần gọi API
  --nvdMaxRetryCount 10          # Thử lại tối đa 10 lần nếu bị NVD từ chối

)

if [[ -n "${NVD_API_KEY}" ]]; then
  DC_ARGS+=(--nvdApiKey "${NVD_API_KEY}")
fi

echo "[*] Starting OWASP Dependency-Check scan..."
set +e
"${DC_BIN}" "${DC_ARGS[@]}"
DC_EXIT=$?
set -e

# Đổi tên file report
[[ -f "${REPORT_DIR}/dependency-check-report.json" ]] && \
  mv "${REPORT_DIR}/dependency-check-report.json" "${REPORT_JSON}"
[[ -f "${REPORT_DIR}/dependency-check-report.html" ]] && \
  mv "${REPORT_DIR}/dependency-check-report.html" "${REPORT_HTML}"
print_summary() {
  if command -v jq &>/dev/null && [[ -f "${REPORT_JSON}" ]]; then
    local total critical high medium low
    total=$(jq '[.dependencies[].vulnerabilities // [] | length] | add // 0' "${REPORT_JSON}")
    critical=$(jq '[.dependencies[].vulnerabilities // [] | .[] | select(.severity=="CRITICAL")] | length' "${REPORT_JSON}")
    high=$(jq     '[.dependencies[].vulnerabilities // [] | .[] | select(.severity=="HIGH")]     | length' "${REPORT_JSON}")
    medium=$(jq   '[.dependencies[].vulnerabilities // [] | .[] | select(.severity=="MEDIUM")]   | length' "${REPORT_JSON}")
    low=$(jq      '[.dependencies[].vulnerabilities // [] | .[] | select(.severity=="LOW")]      | length' "${REPORT_JSON}")

    echo ""
    echo "┌──────────────────────────────────────────┐"
    echo "│         SCA Scan Results Summary          │"
    echo "├──────────────────────────────────────────┤"
    printf "│  %-10s %28s  │\n" "CRITICAL:"  "${critical}"
    printf "│  %-10s %28s  │\n" "HIGH:"      "${high}"
    printf "│  %-10s %28s  │\n" "MEDIUM:"    "${medium}"
    printf "│  %-10s %28s  │\n" "LOW:"       "${low}"
    printf "│  %-10s %28s  │\n" "TOTAL:"     "${total}"
    echo "└──────────────────────────────────────────┘"
  fi
}

print_summary
if [[ "${DC_EXIT}" -eq 1 ]]; then
  echo "[CRITICAL] SCA SCAN FAILED — CVSS >= ${FAIL_CVSS} detected."
  exit 1
elif [[ "${DC_EXIT}" -ne 0 ]]; then
  echo "[ERROR] Dependency-Check exited with code ${DC_EXIT}."
  exit "${DC_EXIT}"
fi

echo "[PASS] SCA scan completed."
          '''
        }
      }
    }
    stage('5. SAST Scan'){
      when {
        expression { fileExists('app/src')}
      }
      steps {
        script{
          echo " ==== Running SAST scan ==== "

          sh '''
          '''
        }
      }
    }


    stage('6. Build Docker Image'){
      steps{
        script {
          echo '==== Building Docker Image ==== ' 
          sh """
          set -e 
          docker build -t ${env.IMAGE_NAME}:${env.IMAGE_TAG} -t ${env.IMAGE_NAME}:latest -f ./app/Dockerfile ./app
          echo "Build image ${env.IMAGE_NAME}:${env.IMAGE_TAG}"
          """
        }
      }
    }


    stage('7. Container Scan'){
      steps{
        script{
          echo '==== Running container scan ===='
          sh '''

          '''
        }
      }

      post {
        always{
          archiveArtifacts artifacts: "${SCAN_REPORT_DIR}/trivy-report.json", allowEmptyArchive:true
        }
      }
    }


     stage('8. Iac (Infrastructure as Code) Scan'){
      steps{
        script{
          echo '==== Running IaC scan ===='
          sh '''
          
          '''
        }
      }

      post {
        always{
          archiveArtifacts artifacts: "${SCAN_REPORT_DIR}/checkov-report.json", allowEmptyArchive:true
        }
      }
    }


    stage('9. Push to ECR'){
      steps {
        withCredentials([
          string(credentialsId: 'aws-access-key-id', variable:'AWS_ACCESS_KEY_ID'),
          string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
        ]){
          script{
            echo " ==== Pushing image to local registry ===="
            sh """
            docker push ${env.IMAGE_NAME}:${env.IMAGE_TAG}
            docker push ${env.IMAGE_NAME}:latest

            echo "\\033[32m[Success] - Pushed to : ${env.IMAGE_NAME}:${env.IMAGE_TAG}"
            echo "\\033[32m[Success] - Also tagged as : ${env.IMAGE_NAME}:latest"           
            """
          }
        }

      }
    }

    stage ('10. Summary & Report'){
      steps{
        script{
          echo """
          ╔══════════════════════════════════════════════════════════════════════════════════════╗
          ║           DevSecOps Pipeline Summary                                                 ║
          ╠══════════════════════════════════════════════════════════════════════════════════════╣
          ║ Build Number     : ${env.BUILD_NUMBER}                                               ║
          ║ Git Commit       : ${env.GIT_COMMIT_SHORT}                                           ║
          ║ Image URI        : ${env.IMAGE_URI}                                                  ║
          ║ Registry         : ${env.REGISTRY}                                                   ║
          ║ ECR Repo         : ${env.ECR_REPO}                                                   ║
          ║ Report Directory : ${env.SCAN_REPORT_DIR}                                            ║
          ╠══════════════════════════════════════════════════════════════════════════════════════╣
          ║ Stages Completed:                                                                    ║
          ║   ✓ Source checkout                                                                  ║
          ║   ✓ Secrets scan                                                                     ║
          ║   ✓ SCA (Dependencies)                                                               ║
          ║   ✓ SAST (Code analysis)                                                             ║
          ║   ✓ Docker build                                                                     ║
          ║   ✓ Container scan                                                                   ║
          ║   ✓ IaC scan                                                                         ║
          ║   ✓ ECR push                                                                         ║  
          ╚══════════════════════════════════════════════════════════════════════════════════════╝
          """
          sh 'ls -lah ${SCAN_REPORT_DIR}/ || echo "No scan reports generated"'

        }
      }
    }
  

  stage('11. Deploy Staging (GitOps)'){
    when {
      expression {
        env.GIT_BRANCH ==~ /origin\/main|main/ 
      }
    }
    steps{
      withCredentials([
        string(credentialsId: 'github-token', variable: 'GIT_TOKEN')
      ]){
        script{
          sh '''

          rm -rf temp-infra-repo 

          echo "Cloning Infra Repository..."
          git clone https://${GIT_TOKEN}@github.com/lamelihuynh/tetris-infra.git temp-infra-repo

          cd temp-infra-repo
          
          git config user.email "jenkins@localhost"
          git config user.name "Jenkins CI"

          cd kubernetes/overlays/staging

          # Update version of the application 
          echo "[*] Updating staging kustomization..."
          kustomize edit set image tetris-devsecops=${IMAGE_URI}

          cd ../../../
          
          git add kubernetes/overlays/staging/kustomization.yaml
          git commit -m "Auto-deploy Staging: Update image to ${IMAGE_TAG}" || echo "No changes"
          git push origin main || echo "Nothing to push"
          echo "Staging kustomization updated successfully in tetris-infra"
          echo "Waiting for ArgoCD to sync..."
          sleep 5
          '''
        }
      }
    }
  }


  stage ('12. Verify Staging'){
    steps{
      script{
        echo "Waiting for staging pods to be ready..."
        sh '''
        kubectl get pods -n staging
        kubectl rollout status deployment/tetris -n staging --timeout=5m
        echo "Staging deployment ready"
        '''
      }
    }
  }


  stage('12. DAST Scan'){
      steps{
        script{
          echo '==== Running DAST scan ===='
          sh '''

          '''
        }
      }

      post {
        always{
          archiveArtifacts artifacts: "${SCAN_REPORT_DIR}/trivy-report.json", allowEmptyArchive:true
        }
      }
    }



      stage('13. Verify Production'){
      steps{
        script{
          echo '==== Running DAST scan ===='
          sh '''
          echo "Production state:"
          kubectl get pods -n production 
          kubectl rollout status deployment/tetris -n production --timeout=5m
          '''
        }
      }

      post {
        always{
          archiveArtifacts artifacts: "${SCAN_REPORT_DIR}/trivy-report.json", allowEmptyArchive:true
        }
      }
    }
  }
}





