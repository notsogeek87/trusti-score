#!/usr/bin/env bash
# Commande forcée SSH utilisée par le workflow GitHub Actions pour déclencher
# un déploiement, sans jamais laisser le client SSH exécuter une commande
# arbitraire sur le VPS.
#
# Installation (une seule fois, sur le VPS) :
#   sudo cp deploy/ci-deploy.sh /usr/local/bin/trustiscore-ci-deploy.sh
#   sudo chmod +x /usr/local/bin/trustiscore-ci-deploy.sh
#
# Puis dans ~deploy/.ssh/authorized_keys, faites précéder la clé publique
# GitHub Actions de (une seule ligne) :
#   command="/usr/local/bin/trustiscore-ci-deploy.sh",no-agent-forwarding,no-port-forwarding,no-pty,no-X11-forwarding ssh-ed25519 AAAA... github-actions-trustiscore-deploy
#
# Le client (l'Action GitHub) envoie "main" ou "staging" comme commande SSH ;
# OpenSSH ignore cette commande grâce à `command=` mais la met à disposition
# dans $SSH_ORIGINAL_COMMAND, qu'on valide ici avant d'exécuter quoi que ce
# soit. Adaptez les chemins si vos checkouts sont ailleurs.

set -euo pipefail

case "${SSH_ORIGINAL_COMMAND:-}" in
    main)
        exec /var/www/trustiscore/deploy/deploy.sh
        ;;
    staging)
        exec /var/www/trustiscore-staging/deploy/deploy.sh
        ;;
    *)
        echo "Cible de déploiement inconnue ou absente: '${SSH_ORIGINAL_COMMAND:-}' (attendu: main | staging)" >&2
        exit 1
        ;;
esac
