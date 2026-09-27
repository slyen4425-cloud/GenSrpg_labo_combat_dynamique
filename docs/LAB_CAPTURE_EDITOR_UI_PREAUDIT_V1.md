# Pré-audit — UI éditeur Capture du laboratoire V1 — 2026-09-27

## Base

Checkpoint GREEN :

`checkpoint/lab-capture-editor-exporter-v1-green-2026-09-27`

SHA :

`41c05bd0fa2e7029e3bdaae8174fe584a055f802`

## Objectif

Déterminer où et comment exposer une première UI de laboratoire capable d'éditer les nouveaux brouillons Capture puis de produire un `CaptureCombatExportV1`, sans donner à l'UI une autorité gameplay.

## Décision de propriété

Le nouvel éditeur ne sera pas ajouté à :

- `src/ui/combat-test-ui.js` ;
- `src/ui/combat-2v2-test-ui.js` ;
- `src/ui/demo-app.js`.

Ces modules restent propriétaires de leurs démonstrations de combat/visuel.

Nouveau propriétaire UI dédié :

`src/ui/capture-editor-test-ui.js`

Page autonome :

`examples/dom-demo/capture-editor.html`

Boot de démo :

`examples/dom-demo/capture-editor.js`

Styles spécifiques :

`examples/dom-demo/capture-editor.css`

## Frontière autorisée

Chaîne UI :

`form DOM`
-> valeurs primitives explicites
-> `CaptureCreatureEditorDraftV1 / CaptureSkillEditorDraftV1`
-> `Capture Editor Exporter V1`
-> JSON de prévisualisation.

L'UI ne produit jamais directement :

- FighterConfig ;
- SkillDefinition non validé ;
- Combat State ;
- Combat Runtime ;
- effets visuels ;
- dégâts ;
- timings cachés ;
- chemins d'assets physiques.

## Responsabilités UI V1

Autorisé :

- lire des champs de formulaire ;
- convertir uniquement les types de formulaire (string -> number / checkbox -> boolean) ;
- appeler les normalizers existants ;
- appeler l'exporter existant ;
- afficher erreurs de validation ;
- afficher les brouillons normalisés ;
- afficher l'export JSON final ;
- fournir des valeurs de démonstration explicites ;
- listeners locaux avec `dispose()`.

Interdit :

- inventer maxHp/maxEnergy depuis les stats RPG ;
- déduire forme/catégorie/élément depuis un nom ;
- corriger silencieusement une donnée invalide ;
- sauvegarder dans localStorage/IndexedDB ;
- lire GenSrpG ;
- appeler CombatSession ;
- muter les contrats ;
- charger un `captureFix*` ;
- monkey-patch global ;
- polling/timer/observer.

## Premier lot UI recommandé

Le premier lot ne doit pas tenter de recréer tout l'ancien éditeur.

Il doit démontrer le vrai chemin avec :

### Créature

Champs structurés minimum :

- id ;
- nom ;
- description ;
- niveau ;
- six stats éditoriales ;
- éléments ;
- résistances ;
- capturable / captureRate ;
- spawnChance / tags ;
- évolution ;
- combat explicite ;
- skillIds ;
- presentationId.

### Capacité

Pour éviter de créer prématurément des dizaines de contrôles visuels concurrents, le premier lot utilise :

- id ;
- description ;
- niveau requis ;
- scopes ;
- un bloc JSON éditable `definition` validé par le vrai SkillDefinition ;
- un bloc JSON optionnel `presentation` validé par SkillPresentationBindingV1.

Le lot suivant pourra convertir progressivement les dimensions fréquentes de SkillDefinition en vrais contrôles de formulaire, sans modifier le contrat.

## Export de démonstration

Le premier lot utilise un format 1v1 local explicite fourni par la page :

- équipe locale ;
- équipe adverse ;
- deux acteurs ;
- la créature éditée peut être utilisée pour le joueur ;
- une fixture adverse fixe du laboratoire est fournie comme second brouillon/export explicite ;
- aucun CombatSession lancé dans la page éditeur.

Le résultat doit passer par `exportCaptureEditorDraftsV1` puis `normalizeCaptureCombatExportV1`.

## Tests

Avant implémentation :

1. test RED sur module UI absent ;
2. sentinelle : pas de CombatSession/Runtime/captureFix/storage ;
3. test fake-DOM minimal ou test des helpers exportés si nécessaire ;
4. vrai chemin de soumission vers les contrats/exporter ;
5. erreur de validation affichée, jamais masquée ;
6. `dispose()` retire les listeners ;
7. CI globale.

Après implémentation :

- publication preview dédiée ;
- validation smartphone obligatoire avant checkpoint GREEN final car ce lot concerne l'UI.

## Risques

1. Recréer dans l'UI les règles des contrats.
   Réponse : l'UI se contente de convertir les types HTML puis délègue.

2. Faire grossir `demo.css`.
   Réponse : stylesheet séparée `capture-editor.css`.

3. Coupler l'éditeur au 2v2.
   Réponse : aucun import de `combat-2v2-test-ui.js`; l'éditeur produit seulement un export portable.

4. Réintroduire l'ancien stockage Capture.
   Réponse : aucune persistance V1.

## Critère de fermeture du pré-audit

- architecture et fichiers cibles documentés ;
- aucun runtime modifié ;
- CI documentaire GREEN ;
- checkpoint exact avant le premier lot UI.
