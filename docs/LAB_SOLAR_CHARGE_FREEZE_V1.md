# Labo Combat — Charge solaire : blocage visuel après lancement (18 octobre 2026)

## Gouvernance

- Retour utilisateur sur `gh-pages@eb59160cd19eb3dc3a3834de1fdd100854cc4c4e` : le combat paraît se figer après activation de Charge solaire. Le signal utilisateur prime sur le GREEN technique précédent.
- Checkpoint de départ : `checkpoint/lab-start-solar-charge-freeze-v1-2026-10-18`. Branche unique : `work/lab-solar-charge-freeze-v1-2026-10-18`.
- Aucune nouvelle pièce jointe n'accompagnait « Replace ceci » au tour du 18/10 : les trois derniers exports déjà intégrés sont conservés tels quels. Aucune substitution de JSON n'est inventée.
- Branches / fichiers exclus : `main`, Zombicide, Exploration, autres laboratoires, moteur de miroir, moteurs de dégâts et de statuts, exports sources auteur, catalogue des 37 capacités, assets.

## Diagnostic RED

- `cap_light_atk_3` est une compétence purement bénéfique, mais conserve les attributs auteur `category=offensive`, `form=contact`, `approachMode=ground`, `travelMs=0`, sans aucun effet de dégâts : elle applique trois statuts +50% (cible alliée, soi, réserves alliées), 30 s.
- L'ancienne présentation exécutait `playApproachFor(actor, "ground", target)` même pour `actor===target` et vers un allié. Le Presenter envoyait une animation de collision du lanceur avec lui-même de **1 ms** (enveloppe visuelle artificielle). Cette approche déclenchait le surveillant de collision `watchVisibleModelContact` sans attaque hostile. La suite de test de réserve précédente n'avait jamais lancé le vrai Presenter.
- Sentinelles RED `tests/integration/capture-solar-charge-real-presentation-v1.test.mjs` : test self et test allié refusent ces deux mouvements parasites sur l'export auteur inchangé ; hostiles contact conservés.
- Il s'agit d'une anomalie de présentation démontrée et compatible avec le gel décrit ; la cause exclusive de tout éventuel gel sur appareil utilisateur ne peut être affirmée sans nouveau retour Android.

## Modification minimale

- Seul le propriétaire visuel `src/adapters/renderer/combat-resolution-presenter.js` examine si la compétence a exclusivement des effets bénéfiques vers `self/ally`, sans dégâts.
- Pour ce cas précis, aucun trajet de contact ni observateur de collision n'est créé. Le feedback visuel non-mouvement / FX existant reste disponible ; les véritables attaques de contact avec approche continuent à utiliser le même chemin natif.
- Aucun changement au JSON `Charge solaire`, buffs +50%, horloge 30 s, puissance calculée, Roster Session, statut des réserves, coûts, cooldowns, animations FX enregistrées et miroir.

## Vérifications réelles

- Test d'intégration : Charge solaire sur soi et sur allié ne déclenche plus d'approche ; vraie attaque hostile `ground` continue d'approcher ; Runtime natif `0 ms` et Roster natif appliquent le statut puis une attaque suivante reste lançable.
- Test sous vrai Chromium et **vrai éditeur `capture-editor-v2.html`** : choisir Lumilo, mettre Charge solaire dans un slot, cliquer « Tester en combat », cliquer Charge solaire, vérifier le retour de l'action dans un état non bloqué puis cliquer **Rayon lumineux** comme deuxième capacité. Résultat `ok:solar:next-skill:unfrozen`. Le test garde la vraie IA et les propriétaires natifs, sans injection de dégâts ni de statuts à partir du test.
- `Laboratory CI` exécution `39094223704` sur `a319b242352f65002a9c66e04994c3a48fef81da` : **Foundation et 4 navigateurs SUCCESS (5/5)**. Les tests de zone, vague 2v2 et créatures restent verts.
- Le test Android physique de l'auteur reste distinct ; aucune validation utilisateur revendiquée.

## Fermeture / publication

- Avant diffusion, ajouter rapport et journal ; exiger CI 5/5 sur SHA final de documentation ; créer checkpoint GREEN technique de même SHA ; promouvoir `gh-pages` par fast-forward sous lease depuis `eb59160cd19eb3dc3a3834de1fdd100854cc4c4e` ; vérifier `pages build and deployment` SUCCESS.
- Si le combat se fige encore sur smartphone, récupérer le comportement exact (après quel bouton, soi ou allié actif, 1v1/2v2, si la barre de charge s'arrête ou si tout l'écran est bloqué), puis ouvrir un nouveau lot sur le dernier GREEN sans rustine.
