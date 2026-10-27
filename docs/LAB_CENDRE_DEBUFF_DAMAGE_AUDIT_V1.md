# Cendre aveuglante — audit des dégâts après débuff (2026-10-08)

## Données réellement auditées
Source auteur : `data/capture/showcase/cap_fire_special_1.capture-skill-transfer-v1.json`, compétence `cap_fire_special_1`, *Cendre aveuglante*.

Ses deux statuts durent 20 s : `speed` -50 points et `physical` -50 points. Le registre actuel `monster-capture-stat-registry.v1.json` associe `physical` à **la puissance des attaques physiques ET à la résistance physique**, pas aux résistances élémentaires ni à `defense` (réduction globale).

## Vérification réelle
Test `tests/unit/cendre-aveuglante-damage-regression-v1.test.mjs` charge le vrai fichier JSON Showcase, applique ses deux statuts avec `applyStatusEffectV1`, puis utilise l'unique calculateur `computeCombatDamageV1`.

- Exemple 100 dégâts physiques, résistance physique initiale 20 % : cible non affectée reçoit 80 ; affectée reçoit **130** (20 - 50 = -30% de résistance), donc **davantage**, jamais moins.
- Exemple 100 dégâts de Feu, résistance feu 40 % : cible reçoit 60 **avant et après**, Cendre ne modifiant pas Feu.
- Les dégâts physiques **infligés par** la cible passent de 100 à 50 : le même malus `physical` réduit sa puissance d'attaque physique. Cette diminution sortante peut prêter à confusion avec les dégâts subis.
- Malus `speed` : -50 points de réduction du temps de charge (compétences ralenties) ; effets expirés à 20 s.

## Conclusion
Aucune inversion du calcul physique démontrée dans ce scénario. **Le preset actuellement livré n'est pas un affaiblissement général de toutes les résistances** ; l'étendre nécessiterait une modification d'équilibrage explicitement validée par l'auteur, pas une correction moteur supposée. Aucune valeur auteur modifiée.

Test CI de la branche : https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/actions/runs/37777719908 (foundation et navigateur Chromium 103 créatures SUCCESS).

## Protection
`main`, `gh-pages`, données Showcase, moteur unique, durée d'esquive et bibliothèque restent inchangés pour cet audit. Un essai Android comparatif reste utile pour confirmer que les animations/chiffres à l'écran correspondent au calcul.
