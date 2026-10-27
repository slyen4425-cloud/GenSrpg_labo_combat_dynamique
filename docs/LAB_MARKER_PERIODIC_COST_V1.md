# GenSrpG — Marqueurs périodiques et coût d'activation V1

Date : 17 octobre 2026. Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Motivation / usage dans l'éditeur

Deux usages différents (sans seconde source d'autorité) :

1. **Bibliothèque de marqueurs → Effet périodique par charge** : cocher « Activer un effet répété », choisir Dégâts ou Soin, une valeur **par charge**, une période en secondes ; pour les dégâts, mode fixe ou calcul combat et canal élémentaire. Exemple **Venin** = dégâts fixes 5 par charge, 5 secondes, durée totale 20 secondes. 3 charges à l'instant du tick ⇒ 15 dégâts. Le retrait de charges modifie immédiatement la valeur du prochain tick, sans relancer une deuxième minuterie. Une capacité qui pose des marqueurs distincte peut être consommée par d'autres.
2. **Capacités → Coût en marqueurs** : activer cette option, choisir le type précis de marqueur existant, « sur le lanceur » ou « sur la cible », quantité fixe entre 1 et 99. Si la quantité manque : retour `insufficient_markers`, ni perte d'énergie, ni démarrage cooldown/usage. Si elle est présente : consommation atomique **au début de l'attaque** (comme le coût énergétique), puis le skill lance normalement ses dégâts/soins/statuts et autres effets. Si l'attaque échoue plus tard ou est esquivée, le coût a déjà été payé.

**Attention à la double consommation** : une capacité utilisant `markerCost` n'a pas besoin d'un deuxième `consume_marker` sur les mêmes marqueurs. `consume_marker` existant reste un effet tactique au moment de résolution, avec ses propres sous-effets.

## Contrats et propriétaires

- `CaptureMarkerV1.periodic` est facultatif : `{kind:"damage"|"heal",amount,intervalMs,damageMode?,channel?}`. Toutes les unités temporelles du contrat sont des millisecondes.
- Le `StatusEffectV1` natif `stack_counter` est le **seul** propriétaire du compteur et de la durée ; `periodic` n'est accepté que pour un marqueur partagé identifié par son tag canonique. Les anciens statuts sont inchangés.
- L'instance native `StatusEffectRuntimeInstanceV1.nextTickAtMs` reçoit la première échéance. `advanceStatusEffectsV1` applique `amount × stacks` à chaque tick depuis l'horloge de combat, avec `applyCombatDamageV1` (dégâts fixes) ou `computeCombatDamageV1` (calcul combat), et `withFighterHp` (soin). Boucliers, immunités et attribution de K.O. restent propriétaires ; pas de timer DOM ou propriétaire parallèle.
- `SkillDefinition.markerCost` est facultatif : `{markerId,count,source:"self"|"target"}`. `ActionResolver.resolveSkillStart` contrôle et paie après les autres gardes de lancement et avant le commit énergétique. `consumeCaptureMarkerStacksV1` est le propriétaire unique du retrait ; les statuts et stacks non-marqueurs ne sont pas consommés.
- Coût applicable aux **capacités actives** dans le moteur ActionResolver. Les réactions rechargeables, réserves et coûts répartis sur plusieurs cibles ne sont pas étendus dans ce lot. Le ciblage « sur la cible » suit le ciblage effectif (notamment provocations) au lancement.
- Définition et coût traversent normalement l'export et le rechargement des capacités ; l'éditeur ne garde pas d'état de gameplay indépendant. Aucun changement de `main`, `Zombicide-40k`, Exploration, `global-assets`, créatures historiques, ni catalogue d'effets existant.

## Validation

- Tests : `tests/integration/capture-marker-periodic-cost-v1.test.mjs` (contrat strict, tick à 5s, empilement entre deux skills, retrait intermédiaire, expiration, coût insuffisant sans dépense, coût payé au départ, protection des vieux statuts, boucliers et immunités, soin périodique).
- Vrai éditeur Chromium : sentinelle `tests/browser/capture-creature-library-smoke.mjs` avec les 103 créatures, bibliothèque Venin périodique, sélection du coût cible 2 charges, sauvegarde/rechargement, pose, consommation et export en combat.
- Publier seulement après Foundation + 4 navigateurs SUCCESS au SHA final, checkpoint GREEN exact et GitHub Pages SUCCESS. Vérification ergonomique tactile Android encore à faire par le créateur.
