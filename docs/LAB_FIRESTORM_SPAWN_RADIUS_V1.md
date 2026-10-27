# Tempête de flammes — portée juste aux trois niveaux (16 octobre 2026)

## Constat reproduit

- Capacité active : `cap_fire_atk_6` / « Tempête de flammes ».
- Progression **inchangée** : `short` à 1 activation ; `medium` à 2 ; `long` à 3 (réactivation `reinforce`, `radiusGrowthSteps:1`, maximum 3).
- La projection de l'ellipse de portée pour `short/medium` est issue du nœud DOM existant : largeur CSS d'origine × `displayScale(1.2)` × `displayScaleX` × `persistentZoneRadiusScale` (1 / 1.45). Combat Rules lit exactement ces bounds, et le contour tactique recopie la même transformation. Un champ long reste par contrat toute l'arène.
- Ancienne valeur auteur `displayScaleX:2.5` : dans la scène de non-régression de départ (arena 720 × 405, largeur native zone 144, source au point x200, modèle adverse à partir de x440), le rayon horizontal du palier 2 est 313,2 px. L'ennemi immobile se trouvait donc **dans** la zone ; le moteur lui infligeait légitimement des dégâts selon la zone affichée, mais en contradiction avec le gameplay demandé.

## Correction minimale

**Une seule donnée du preset de Tempête de flammes est modifiée : `presentation.visual.aura.displayScaleX` passe de `2.5` à `1.6`.** Tous les autres champs utilisateur (sprite, opacité, audio, dégâts, ticks, charges, largeur verticale, timing, durée, équipes, IA) restent exactement identiques. La zone devient donc moins étirée horizontalement sur les niveaux courts et moyens, tout en gardant le même moteur et le même contour.

Pour la scène de référence : rayon court = 138,24 px, rayon moyen = 200,448 px ; la frontière du modèle immobile se trouve à 240 px du centre de la zone. Les niveaux 1 et 2 ne le touchent pas. Une créature qui **se rapproche** peut entrer et subir les dégâts dès le niveau 2. À 3 activations, `long` garde sa sémantique existante : **tout le champ de bataille**, donc le point de départ adverse est atteint.

## Limites / validation

- Aucun plafonnement d'effet invisible et aucune deuxième géométrie ne sont ajoutés ; le contour reste exactement sur les bounds que le Runtime échantillonne.
- Le repère de test simule une distance initiale représentative, il ne prouve pas toutes les tailles d'écrans ou compositions d'équipes. La vraie validation visuelle sur smartphone paysage de l'auteur reste attendue.
- Le test `tests/integration/firestorm-spawn-safe-radius-v1.test.mjs` utilise le vrai renderer, le contrat spatial et le propriétaire natif de dégâts. Les tests Chromium Firestorm existants préservent joueur / IA / 1v1 / 2v2, expiration, charge, renforcement ; CI 3 jobs obligatoire au SHA final avant GREEN.
