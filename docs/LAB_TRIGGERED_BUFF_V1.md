# Buffs à déclenchement sur dégâts V1 — Monster Capture

Date : 14 octobre 2026.

## Ce que l'auteur peut créer

Une capacité de type Buff / Debuff ciblant **Soi-même** applique un statut **« Buff à déclenchement (sur dégâts infligés) »**, polarité bénéfique, avec durée configurable en secondes (par ex. 60) et réactivation « Rafraîchir la durée » ou « Remplacer ».

Sous ce statut, le Human Editor propose **« À chaque dégât réellement infligé pendant le buff »**, puis une liste d'effets paramétrables :

- Appliquer un statut (par ex. **Brûlure** `damage_over_time` de 3 secondes, 2 dégâts par tick, intervalle 1 seconde, élément feu) sur **Victime** ;
- Soigner **Porteur du buff** de 12 PV ;
- De manière générique, ajouter dégâts, restauration/drain énergie, nettoyage/dissipation et d'autres statuts existants compatibles, pour **Victime** ou **Soi**.

**Quand la durée du buff se termine, plus aucun nouvel effet ne se déclenche.** Les brûlures déjà appliquées gardent leur propre expiration. Chaque statut conserve sa propre identité et ses propres règles d'immunité.

## Contrat natif

- `StatusEffectV1.kind = "triggered_buff"` ; `polarity="beneficial"` ; `durationModel="time_ms"` ; `stacking="refresh"|"replace"` ; `onDamageDealt: {effects:[SkillEffectV1, ...]}` avec 1–12 effets. Cibles `target` ou `self` exclusivement.
- `ActionResolver.resolveSkillCompletion` examine **uniquement les événements de coup d'origine** sur la véritable perte de PV (`appliedDamage>0`), avec acteur et victime exacts. Les dégâts directs hérités du Skill et les effets tactiques immédiats de `damage` sont inclus. Les attaques esquivées, bloquées sans perte de PV, le renvoi, les ripostes, les DoT/HoT et les effets des buffs ne génèrent **pas** de nouveau déclenchement.
- Une fois les dégâts de l'attaque d'origine résolus, l'ActionResolver réutilise **`applyImmediateTacticalEffectsV1`** pour les effets configurés du buff ; seuls les événements d'attaque initiaux sont lus, jamais les événements engendrés par des effets déclenchés : protection native contre les boucles infinies. Pas de deuxième moteur, intervalle ou minuteur.
- Le statut est lu sur l'horloge canonique `CombatState.elapsedMs` à l'instant d'impact. Il ne se déclenche pas en préparation ni après expiration. Les fenêtres du Runtime, clashes rayon/projectiles, Esquive manuelle/auto, IA et tous les autres statuts restent propriétaires et inchangés.
- Comportement **par victime blessée** dans le chemin de résolution des capacités ciblées. La 2v2 sépare précisément les buffs, alliés et victimes ; les dégâts indirects par zones persistantes ou DoT restent hors V1.

## Tests

Sentinelle `tests/unit/capture-triggered-buff-v1.test.mjs` :
- contrat borné, validation de durée/polarité et cibles ;
- vrai `CombatSession` : auto-buff, attaque 20 PV, brûlure sur victime et soin de 12 PV au porteur ;
- minute de buff puis fin, brûlure déjà infligée préservée ;
- aucun déclenchement après esquive, et bouclier 100 PV absorbant le coup ;
- les dégâts tactiques originaux génèrent un seul proc de dégâts secondaires, **sans boucle** ;
- plusieurs acteurs 2v2 sans effet sur un tiers ;
- Human Editor construit la définition avec durée de 60 secondes et effets imbriqués, export/import complet `CaptureSkillTransfer` intact.

Contrôles d'intégration : `npm run ci` (Foundation), vrai smoke Firestorm Chromium et bibliothèque créatures Chromium. Attendre l'ensemble **SUCCESS sur le SHA documentaire final** avant checkpoint GREEN/publish, puis vérifier CI + Pages après publication. Test de rendu et ergonomie sur smartphone Android paysage par l'auteur lors de son test groupé.

## Limites explicites

- Il s'agit **d'une V1** de déclenchement sur les attaques de compétences qui font perdre réellement des PV. Ce n'est pas encore un moteur de déclencheurs universels : les attaques de zone persistante, ticks DoT/HoT, renvois, autre type d'événement (esquive/KO/soin/dégâts reçus) et passifs permanents sont différés.
- Les statuts `triggered_buff` ne peuvent pas s'imbriquer via un effet `apply_status` du même déclencheur, empêchant l'auto-cascade. Cumul indépendant `stack` interdit V1. Les vitesses, FX, dégâts et données auteur existants n'ont pas été modifiés.
- Aucune capacité `ultime` d'exemple n'est injectée dans les fiches existantes. Le créateur la compose dans l'éditeur, avec les compétences, icônes et sons qu'il choisit librement.

## Source et gouvernance
Développement isolé à partir de `gh-pages@32f675c9a32ac96fc8835f0cc6fc4188c2f59449`, branche `work/lab-triggered-buff-v1-2026-10-14` ; checkpoint de départ `checkpoint/lab-start-triggered-buff-v1-2026-10-14`. Les données auteur, assets `global-assets`, `main`, dépôt principal et Exploration sont protégés.
