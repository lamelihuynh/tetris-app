#!/bin/bash
# Secrets embedded here (detectable by Gitleaks / TruffleHog):
#   Case 1 – GitHub Personal Access Token hardcoded
#   Case 2 – Docker Registry password in plaintext
#   Case 3 – SSH private key path with password in script
#   Case 4 – Kubernetes cluster token embedded

set -e

# CASE 1 — GitHub Personal Access Token
# Gitleaks rule: github-pat
# TruffleHog detector: GitHub
# OWASP: A02 – Cryptographic Failures
# VULN: GH PAT hardcoded — anyone with repo access can impersonate this identity
GH_TOKEN="ghp_1234567890abcdefghijklmnopqrstuvwxyz01"

git config --global url."https://${GH_TOKEN}@github.com/".insteadOf "https://github.com/"
git clone https://github.com/lamelihuynh/devsecops-factory.git /tmp/repo


# CASE 2 — Docker Registry Password in Plaintext
# Gitleaks rule: docker-registry
# OWASP: A02 – Cryptographic Failures
# VULN: Docker Hub credentials stored in plain text in shell script
DOCKER_USERNAME="chatapp_deploy"
DOCKER_PASSWORD="DockerP@ssw0rd2024!"          # VULN: plaintext password

echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USERNAME" --password-stdin
docker pull chatapp_deploy/chatapp:latest


# CASE 3 — SSH Key Passphrase in Script
# Gitleaks rule: ssh-private-key, generic-api-key
# OWASP: A02 – Cryptographic Failures
# VULN: SSH passphrase exposed in script — allows decrypting private key
SSH_PASSPHRASE="MySSHKeyPassphrase_2024!"       # VULN: passphrase in cleartext
SSH_KEY_PATH="/home/deploy/.ssh/id_rsa"

sshpass -p "$SSH_PASSPHRASE" ssh-add "$SSH_KEY_PATH"
ssh -i "$SSH_KEY_PATH" deploy@prod.chatapp.internal "systemctl restart chatapp"


# CASE 4 — Kubernetes Service Account Token
# Gitleaks rule: kubernetes-secret / generic-api-key
# OWASP: A02 – Cryptographic Failures
# VULN: K8s cluster token hardcoded — grants full cluster API access
K8S_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJkZWZhdWx0In0.EXAMPLE_TOKEN_DO_NOT_USE"
K8S_API="https://k8s-api.internal:6443"

kubectl --server="$K8S_API" \
        --token="$K8S_TOKEN" \
        --insecure-skip-tls-verify \    # VULN: TLS verification disabled
        apply -f /tmp/repo/kubernetes/chatapp-deployment.yaml

echo "Deployment complete!"
