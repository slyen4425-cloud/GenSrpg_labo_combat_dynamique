# Sélachombre — requin cristallin des abysses (12 novembre 2026)

## Source unique et sécurité
- START `main@1dbec5218fa7c766a1c1d5e27c6abf48a83656da` ; checkpoint `checkpoint/lab-start-selachombre-2026-11-12`.
- Branche temporaire de validation : `work/lab-selachombre-2026-11-12` ; autorité fonctionnelle finale : Labo Combat `main`.
- Nouvelle espèce `crea_selachombre` distincte de Maraileron / Krakenor / Sylvorne : aucune modification des espèces historiques, du moteur ou du site GenSRPG.
- Modèles originaux existants et approuvés du requin cristallin dans `global-assets` : `pack:capture:creature-requin-opponent-01`, `pack:capture:creature-requin-player-01`, `pack:capture:creature-requin-icon-01`. Aucun fichier binaire ajouté et pas de copie de la bibliothèque.
- Seuls les transferts `capture-creature-transfer-v1` / `capture-skill-transfer-v1` et leurs registres officiels sont utilisés.

## Fiche
Sélachombre — Eau/Glace. 185 PV, Vitesse 24, Physique 26, Défense 10, Eau 18, Glace 14. Résistance Eau +30 %, Glace +20 %, Électricité -40 %. Esquive : 2 charges, recharge 45 s, fenêtre 0,5 s. Capture 22 %, rencontre 5 %.

## Kit natif
| Niveau | Compétence | Coût | Recharge | Mécanique |
|---|---|---:|---:|---|
| 1 | Morsure d'écume | 3 | 10 s | 12 Eau +1 Traque (18 s, 3 max) |
| 5 | Aileron fantôme | 4 | 18 s | approche téléportée 14 Glace, +8 si Traque, immobilise 1 s si 2 |
| 10 | Nage circulaire | 5 | 24 s | zone 10 Eau, -20 % dégâts sortants 7 s et +1 Traque à chaque adversaire actif |
| 15 | Frénésie carnassière | 1+2/tic | 32 s | canalisation 3×(7 Physique +3 Glace si Traque), interruptible |
| 20 | Abysse déchaînée | 10 | 1/combat | 26 Eau à tous, +8 Glace/Traque consommée sur la cible, contrôle/énergie selon charges |

## Visuels
3 vrais médias du requin reliés dans le contrat `presentation.visual` v9. Pas d'animation requin inventée. Icônes et effets sélectionnés dans le catalogue officiel, réutilisation sans duplication. Paramètres de taille basés sur les métadonnées approuvées du requin (joueur 1,1 / adversaire 0,9, sol 87 %).

## Validation
Test natif ciblé : `tests/unit/capture-selachombre-shark-2026-11-12.test.mjs`. Étapes de sortie : CI complète sur SHA exact, tests navigateur réel, preuve HTTPS de la publication `main` ; aucun GREEN déclaré sans ces étapes.
