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
  parameters {
        string(name: 'TARGET_REPO', defaultValue: 'https://github.com/lamelihuynh/tetris-app.git', description: 'GitHub URL of project to scan')
        string(name: 'TARGET_BRANCH', defaultValue: 'main', description: 'Branch to checkout')
  }

  environment{
    REGISTRY = "localhost:5001"
    REPO_NAME = "devsecops/tetris"
    IMAGE_NAME = "${REGISTRY}/${REPO_NAME}"
    SONAR_HOST = "http://sonarqube:9000" 
    TARGET_DIR = "${WORKSPACE}/target-repo"
    SCAN_REPORT_DIR = "${WORKSPACE}/scan-reports"
    KUBECONFIG = "/home/jenkins/.kube/config"
  }


  options{
    timeout(time: 2, unit: 'HOURS')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  stages{
    stage('1. Checkout Target Repo') {
            steps {
                script {
                    echo "==== CHECKING OUT TARGET PROJECT ===="
                    dir('target-repo') {
                        def scmVars = checkout([
                            $class: 'GitSCM', 
                            branches: [[name: "*/${params.TARGET_BRANCH}"]], 
                            userRemoteConfigs: [[ url: "${params.TARGET_REPO}" ]]
                        ])
                        
                        if (scmVars && scmVars.GIT_COMMIT) {
                            env.GIT_COMMIT_SHORT = scmVars.GIT_COMMIT.substring(0, 7)
                        } else {
                            env.GIT_COMMIT_SHORT = "build-${env.BUILD_NUMBER}"
                        }
                    }
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

    // stage('3. Secrets Scan'){
    //   when {
    //     expression { fileExists('app/src')} 
    //   }
    //   steps {
    //     script{
    //       echo ' ===== Running secrets scan (Gitleaks).... ==== ' 
    //       def scanStatus = sh (
    //         script: '''

    //           if ! command -v gitleaks &> /dev/null; then
    //             echo [-] Gitleaks has not installed. The process will installe automated...
    //             curl -sSL https://github.com/gitleaks/gitleaks/releases/download/v8.18.2/gitleaks_8.18.2_linux_x64.tar.gz | tar -xz 
    //             chmod +x gitleaks
    //             export PATH=$PATH:$(pwd)
    //           fi
    //           ./gitleaks protect detect --source . --report-path ${SCAN_REPORT_DIR}/gitleaks-report.json --report-format json

    //         ''',
    //         returnStatus: true
    //       )

    //       if (scanStatus == 1)  {
    //         error("\033[31m [CRITICAL]: Hardcoded secrets detected by Gitleaks! Pipeline aborted. Please check file report for detail.")
    //       }
    //       else if (scanStatus != 0){
    //         error("\033[33m [SYSTEM ERROR]: Cannot run Gitleaks (Exit code: ${scanStatus}). Pipeline aborted.")
    //       }
    //       else {
    //         echo "\033[32m [PASS]: No secrets found. Code looks clean!"
    //       }
    //     }
    //   }
    //   post{
    //     always{
    //       archiveArtifacts artifacts: "${SCAN_REPORT_DIR}/gitleaks-report.json", allowEmptyArchive: true
    //     }
    //   }
    // }

    // stage('4. SCA Scan'){
    //   when { expression { fileExists('target-repo') } }
    //   steps {
    //       script {
    //           echo "==== Starting SCA scan with Trivy ===="
    //           sh """
    //               chmod +x ci/stages/sca-scan.sh
    //               SCAN_DIR="${env.TARGET_DIR}" \
    //               SCAN_REPORT_DIR="${env.SCAN_REPORT_DIR}" \
    //               ./ci/stages/sca-scan.sh
    //           """
    //           echo "==== SCA scan finished ===="
    //       }
    //   }
    //   post { 
    //       always { 
    //           archiveArtifacts artifacts: "scan-reports/trivy-sca-report.*", allowEmptyArchive: true 
    //       } 
    //   }
    // }


    // stage('5. SAST Scan (SonarQube)') {
    //   steps {
    //       script {
    //           echo "==== Starting SAST scan (Static Analysis) ===="
    //           withEnv([
    //               "SONAR_HOST=${env.SONAR_HOST}",
    //               "SCAN_DIR=${env.TARGET_DIR}",
    //               "IMAGE_TAG=${env.IMAGE_TAG}"
    //           ]) {
    //               withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
    //                   sh 'chmod +x ci/stages/sast-scan.sh && ./ci/stages/sast-scan.sh -Dsonar.sources=target-repo -Dsonar.scm.disabled=true' 
    //               }
    //           }
    //       }
    //   }
    //   post {
    //       always {
    //         echo "SAST Scan completed. Please check SonarQube Dashboard for the report."          }
    //   }
    // }

    stage('9. IaC Scan (Checkov)') {
        steps {
            script {
                echo "==== Running Infrastructure-as-Code Scan ===="
                sh """
                    chmod +x ./ci/stages/iac-scan.sh
                    ./ci/stages/iac-scan.sh .
                """
            }
        }
        post {
            always {
                archiveArtifacts artifacts: "checkov_report.json", allowEmptyArchive: true
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

    stage('8. Container Scan (Trivy)') {
        steps {
            script {
                echo "==== Starting Container Security Scan ===="
                withEnv(["IMAGE_FULL_PATH=${env.IMAGE_URI}", "SCAN_REPORT_DIR=${env.SCAN_REPORT_DIR}"]) {
                    sh 'printenv'
                    sh 'chmod +x ./ci/stages/container-scan.sh && ./ci/stages/container-scan.sh'
                }
            }
        }
        post { 
            always { 
                archiveArtifacts artifacts: "scan-reports/container-scan-report.json", allowEmptyArchive: true 
            } 
        }
    }
    stage('7. Push to Local Registry'){
      steps {
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






    // stage('10. Run App for DAST') {
    //     steps {
    //         script {
    //             echo "==== CLEANING UP PREVIOUS CONTAINERS ===="
    //             sh "docker rm -f staging-app-local || true"
                
    //             echo "==== STARTING STAGING APPLICATION ===="
    //             sh "docker run -d --name staging-app-local -p 8081:3000 ${env.IMAGE_URI}"
                
    //             echo "Waiting for application to initialize..."
    //             sleep 15
    //         }
    //     }
    // }

    // stage('11. DAST Scan (ZAP)') {
    //     steps {
    //         script {
    //             echo "==== Starting DAST scan (Web Attack) ===="
    //             withEnv(["REPORT_DIR=${env.SCAN_REPORT_DIR}"]) {
    //                 sh 'chmod +x ci/stages/dast-scan.sh && ./ci/stages/dast-scan.sh'
    //             }
    //         }
    //     }
    //     post {
    //         always {
    //             archiveArtifacts artifacts: "scan-reports/zap-report.*", allowEmptyArchive: true
    //             sh "docker rm -f staging-app-local || true"
    //         }
    //     }
    // }

    stage('12. Final Summary') {
        steps {
            script {
                echo """
                ╔══════════════════════════════════════════════════════════════════════════╗
                ║            DEVSECOPS PIPELINE COMPLETED                                  ║
                ╠══════════════════════════════════════════════════════════════════════════╣
                ║ TARGET: ${params.TARGET_REPO}                                            ║
                ║ REPORTS: ${env.SCAN_REPORT_DIR}                                          ║
                ╚══════════════════════════════════════════════════════════════════════════╝
                """
            }
        }
    }
  

  stage('13. Deploy Staging (GitOps)'){
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


  stage ('14. Verify Staging'){
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

  stage('15. Verify Production'){
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





