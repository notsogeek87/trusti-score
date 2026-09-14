#!/usr/bin/env bash
# Script de (re)déploiement de TrustiScore sur le VPS.
# À lancer depuis le dossier du dépôt sur le serveur, ex: /var/www/trustiscore
#
# Usage : ./deploy/deploy.sh

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

echo "==> Récupération de la dernière version (branche: $(git rev-parse --abbrev-ref HEAD))"
git pull --ff-only

if [ ! -f backend/.env ]; then
    echo "!! backend/.env est introuvable. Copiez backend/.env.example vers backend/.env et remplissez-le avant de continuer." >&2
    exit 1
fi

echo "==> Build et redémarrage du conteneur backend"
docker compose up -d --build backend

echo "==> Vérification nginx"
sudo nginx -t
sudo systemctl reload nginx

BACKEND_PORT="$(grep -E '^BACKEND_PORT=' .env 2>/dev/null | cut -d= -f2)"
BACKEND_PORT="${BACKEND_PORT:-3001}"

echo "==> Test de santé de l'API (port $BACKEND_PORT)"
sleep 2
curl -fsS "http://127.0.0.1:${BACKEND_PORT}/api/health" && echo || echo "!! L'API ne répond pas encore, vérifiez: docker compose logs -f backend"

echo "==> Déploiement terminé."
