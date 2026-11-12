# Sélachombre — requin cristallin des abysses (12 novembre 2026)

## Source unique et sécurité
- START `main@1dbec5218fa7c766a1c1d5e27c6abf48a83656da` ; checkpoint `checkpoint/lab-start-selachombre-2026-11-12`.
- Branche temporaire de validation : `work/lab-selachombre-2026-11-12` ; autorité fonctionnelle finale : Labo Combat `main`.
- Nouvelle espèce `crea_selachombre` distincte de Maraileron / Krakenor / Sylvorne : aucune modification des espèces historiques, du moteur ou du site GenSRPG.
- Modèles originaux existants et approuvés du requin cristallin dans `global-assets` : `pack:capture:creature-requin-opponent-01`, `pack:capture:creature-requin-player-01`, `pack:capture:creature-requin-icon-01`. Aucun fichier binaire ajouté et pas de copie de la bibliothèque.
- Seuls les transferts `capture-creature-transfer-v1` / `capture-skill-transfer-v1` et leurs registres officiels sont utilisés.

## Fiche
Sélachombre — Eau/Glace. 170 PV, Vitesse 20, Physique 16, Défense 8, Eau 14, Glace 8. Résistance Eau +30 %, Glace +20 %, Électricité -40 %. Esquive : 2 charges, recharge 45 s, fenêtre 0,5 s. Capture 22 %, rencontre 5 %.

## Kit natif
| Niveau | Compétence | Coût | Recharge | Mécanique |
|---|---|---:|---:|---|
| 1 | Morsure d'écume | 3 | 10 s | 12 Eau +1 Traque (18 s, 3 max) |
| 5 | Aileron fantôme | 4 | 18 s | approche téléportée 14 Glace, +8 si Traque, immobilise 1 s si 2 |
| 10 | Nage circulaire | 5 | 24 s | zone 10 Eau, -20 % dégâts sortants 7 s et +1 Traque à chaque adversaire actif |
| 15 | Frénésie carnassière | 1+2/tic | 32 s | canalisation 3×(7 Physique +3 Glace si Traque), interruptible |
| 20 | Abysse déchaînée | 10 | 1/combat | 50 Eau à tous, +15 Glace par Traque consommée (95 max avant stats), immobilisation 3 s / drain 4 énergie conditionnels |

## Visuels
3 vrais médias du requin reliés dans le contrat `presentation.visual` v9. Pas d'animation requin inventée. Icônes et effets sélectionnés dans le catalogue officiel, réutilisation sans duplication. Paramètres de taille basés sur les métadonnées approuvées du requin (joueur 1,45 / adversaire 1,25, sol 87 %).

## Validation
Test natif ciblé : `tests/unit/capture-selachombre-shark-2026-11-12.test.mjs`. Étapes de sortie : CI complète sur SHA exact, tests navigateur réel, preuve HTTPS de la publication `main` ; aucun GREEN déclaré sans ces étapes.

## Correctifs suite au test auteur du 12 novembre 2026
- Le moteur du bestiaire reste unique. Le générateur partagé d'explications réinjecte les noms de marqueurs dans les canalisations ; le texte dit « Traque sanglante », plus le slug « selachombre-traque ». Les contrats restent inchangés.
- Ultime renforcé : 50 dégâts Eau à tous, +15 dégâts Glace par Traque consommée sur la cible principale (0/1/2/3 charges : 50/65/80/95 dégâts avant résistances/statistiques), immobilisation 3 s à 2 charges et drain 4 énergie à 3 charges, une fois par combat.
- Gabarit requin agrandi d'environ 32 % côté joueur et 39 % côté adversaire, maintien du centre de support au sol à 87 %, images originales inchangées.
- Équilibrage auteur standard : un seul calcul partagé `src/contracts/capture-creature-stat-budget-v1.js` lit le registre de statistiques du Labo Combat ; 100 points au niveau 1, PV/5 et chaque point des autres statistiques = 1 point. Sélachombre : 170/5 +20 Vitesse+16 Physique+8 Défense+14 Eau+8 Glace=100.
- Le barème est pour les **nouvelles créations standards** uniquement ; le bestiaire historique ne reçoit aucune baisse rétroactive. Les barèmes épique/légendaire sont envisagés mais non activés, en attente d'une décision auteur. Les résistances et les capacités font l'objet d'un second examen qualitatif (aucune prétention qu'un total de stats suffit à tout équilibrer).

## Ajustement auteur — taille en combat (+20 % supplémentaire)
- Source : `main@4e2a25e7d67d5af1299047fb39c97e67401ec3bc`, checkpoint `checkpoint/lab-start-selachombre-combat-scale20-2026-11-12`, branche `work/lab-selachombre-combat-scale20-2026-11-12`.
- Visuel joueur (dos) : facteur 1,45 → **1,74** (+20 % exact).
- Visuel adversaire (face) : facteur 1,25 → **1,50** (+20 % exact).
- Seulement `presentation.viewOverrides` : taille générique 1,15 inchangée, icône et images officielles inchangées, point d'appui au sol `87 %` conservé.
- Les compétences, stats, budgets et autres créatures ne sont pas modifiés. Tests CI et Pages à valider sur la publication finale.

## Ajustement pendant la PR #304 — adversaire plus petit et plus bas
- Demande auteur prioritaire : adversaire (face) de **1,50 à 1,20** (-20 % sur la précédente proposition) et position Y de **0 à +45** (vers le bas, même convention que le Loup volcanique).
- Joueur (dos) reste à **1,74** ; portrait/éditeur/icône et échelle générique restent inchangés. Ancrage originel 50 % / 87 % conservé.
- Le précédent +20 % n'est donc maintenu que côté joueur ; l'adversaire est finalement un peu plus petit que la version 1,25 avant la PR.

## Réglage complémentaire demandé — Sélachombre adversaire encore -20 %
- Vue adversaire : facteur **1,20 → 0,96** (−20 % supplémentaire, calcul relatif à la version publiée `e7c9269e`).
- Décalage adversaire **Y +45** conservé, facteur joueur **1,74** et Y 0 inchangés.
- Conservation intégrale des images, des compétences, des statistiques, du budget et des autres créatures ; correction associée au décalage Y de Sylvorne, branche `work/lab-sylvorne-opponent-y-2026-11-12`.
