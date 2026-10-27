# Labo Combat — animation d'attaque face et dos (19/10/2026)

Base: gh-pages@552f4020d767a6b10848da755d6a1ebb9ce1b5ea.
Branche isolée: work/lab-creature-attack-face-back-2026-10-19.
Départ: checkpoint/lab-start-creature-attack-face-back-2026-10-19.

## Décision

Le joueur voit le **dos**, l'adversaire voit la **face**. L'éditeur
propose deux listes indépendantes de sprites de créature pour l'attaque
à distance. Les deux utilisent la bibliothèque existante `attack` et
les mêmes réglages de mode, frames, échelle, rotation et transition.

- V5 `visual.rangedAttack` reste le sprite **face / historique**.
- V6 ajoute `visual.rangedAttackBack` **facultatif**.
- Le renderer utilise `rangedAttackBack` pour player si présent,
  sinon `rangedAttack`, et `rangedAttack` pour opponent.
- En absence de sprite sélectionné pour une vue, animation native normale.
- Les contrats V1-V5, les exports existants et les fiches créature sont
  conservés ; pas de mutation de donnée lors du chargement.
- Les effets de capacités (cast, projectile, beam, impact), le timing du
  Runtime, la collision et le calcul de dégâts sont strictement protégés.
- Les assets réels sont déjà fournis par la bibliothèque externe :
  aucune nouvelle image n'est produite ni modifiée.

## Vérifications

Sentinelles : V6 optionnel et invalides, V5 inchangé, sauvegarde
éditoriale, identité des stats, export vers Native Visual Source et
sélection de la vraie vue player/opponent, validation des listes
d'assets, maintien des tests d'animation antérieurs, CI 5/5 et déploiement
sur SHA identique avant annonce d'une publication GREEN.
Le contrôle des animations face/dos sur smartphone appartient à l'auteur.
