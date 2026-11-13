# Vyrâme — esprit à carapace, combo sur soi (12 novembre 2026)

## Source et règles de publication
- START `main@a31ac035cd85722e07ec7cd04b46ad8e033dc1ad`, checkpoint `checkpoint/lab-start-vyrame-combo-selachombre-speed-2026-11-12`, branche `work/lab-vyrame-combo-selachombre-speed-2026-11-12`.
- Une seule fiche gameplay `crea_vyrame` et cinq transferts capacités officiels ; aucun moteur, catalogue parallèle, identifiant saisi par l'utilisateur, import GenSRPG ou double fichier media.
- Images de la bête quadrupède pourpre approuvées sur `global-assets@297f3c4cf2fa11890ced75205c55fb5df4bcceb3` (face, dos, icône ronde). Métadonnées originales conservées ; vues `pack:capture:creature-pourpre-*-01`.
- Les effets Cast/Impact + icônes appartiennent à la même bibliothèque canonique déjà publiée.

## Caractéristiques (standard 100 points)
- PV 200 (40 points), vitesse 12, physique 8, défense 18, Esprit 22 : **100 points**.
- Défense active : `type:defense`, 2 charges, recharge 45 s, fenêtre 0,5 s, 55% de réduction. **Aucune esquive**.
- Profil massif ; joueur 1,50 Y 0, adversaire 1,10 Y +30 ; ancrage 88%.

## Kit (paliers 1 / 5 / 10 / 15 / 20)
| Niveau | Pouvoir | Base | Bonus si exactement 3 Combo sur Vyrâme |
|---|---|---|---|
| 1 | Griffe d'âme | 12 Esprit + 1 Combo sur soi | 3 charges maximum, 32 s ; aucun bonus et aucune consommation |
| 5 | Crocs du voile | 20 Esprit au contact | consomme 3 Combo, rend 20 PV |
| 10 | Rugissement des limbes | 16 Esprit de zone, -15% dégâts ennemis 7 s | consomme 3 Combo, rend 4 énergie |
| 15 | Carapace des âmes | +75 défense pendant 12 s | consomme 3 Combo, rend 30 PV |
| 20 | Déferlante spectrale | 55 Esprit de zone, immobilise 2 s ; 1/combat | consomme 3 Combo, rend 25 PV et donne +35% de dégâts pendant 10 s |

L'unique autorité du système est le `Capture Marker` et son effet natif `consume_marker` : `targetScope:self`, `minimum:3`, `count:3`. Les bonus natifs s'appliquent à **Vyrâme uniquement** et sont définis comme soins/énergie/buffs : aucune attaque spéciale ne redirige par erreur un effet offensif sur le lanceur. Les dégâts de base sont indépendants. Aucun bonus n'est déclenché à 1 ou 2 Combo. Le marqueur personnel expire après 32 s s'il n'est pas utilisé.
- La compétence de niveau 1 applique Combo à l'impact, pas à un projectile complètement annulé ou à une attaque rejetée.

## Correction associée Sélachombre
- `Morsure d'écume` (attaque de base niveau 1) approche au sol `travelMs 300 → 900`, soit déplacement **3× plus lent**, avec réduction native d'approche -12% inchangée ; une arrivée effective de 264 → 792 ms avant le multiplicateur de vitesse de combat.
- Ne change ni préparation, ni recharge, ni autres attaques, ni vitesse globale de combat.

## Gate
- Tests natifs : `tests/unit/capture-vyrame-combo-2026-11-12.test.mjs` et test existant de Sélachombre.
- CI complète, Chromium PC/mobile, Pages sur SHA exact et checkpoint GREEN avant validation ; test visuel manuel de l'auteur reste à faire.

## Ajustements auteur — 13 novembre 2026
- Export auteur reçu `gensrpg-capture-creature-crea_vyrame.json` : seules les dimensions/positions contrôlées ont été fusionnées avec la présentation canonique **V9** (pas de rétrogradation en V2), vue joueur 1,75 Y0 et adversaire 1,10 Y+50 ; médias originaux, stats, skills IDs et sockets conservés.
- L1 Griffe d'âme : retirer uniquement le **cast visuel**, garder l'impact et le marqueur sur soi ; approche 650→1300 ms (vitesse de déplacement divisée par deux). Autres temps et vitesse de combat inchangés.
- L5 Crocs du voile : 20 Esprit de base, **+10 Esprit sur la cible à 3 Combo** à la place du soin.
- L10 Rugissement des limbes : base 16 Esprit de zone conservée ; remplace l'affaiblissement par **stun de 5 s sur la cible sélectionnée** (vraie interruption moteur) ; à 3 Combo : **+20 Esprit sur la cible** plutôt que +4 énergie.
- L15 Carapace des âmes : base **+100 Défense 12 s**, puis à 3 Combo second buff natif indépendant **+100 Défense 12 s** soit +200 tant que les deux durées sont actives, sans soin.
- Le propriétaire natif `src/core/combat/immediate-tactical-effects-v1.js` conserve la cible ennemie originale lorsque le lanceur consomme un marqueur personnel et applique un bonus `targetScope:target`. Cela empêche les dégâts sur le lanceur et ne change pas le ciblage des consommateurs historiques sur l'ennemi.
- Coloration : l'éditeur possède déjà une option de teinte pour **les statuts**. Pour les sprites d'attaque Cast/Impact/Projectile, un contrôle commun de teinte/saturation sans recopier les PNG est techniquement faisable ; fonctionnalité non intégrée dans ce lot de correctifs de gameplay.
