# Capture — Bibliothèque créateur / Import visuel UX V1

Date : 2026-10-06

## Base et gouvernance

Base exacte :

`5cd2ced3a7917de366fafa033386511cc1306ef2`

Checkpoint de départ :

`checkpoint/lab-start-capture-asset-library-ux-v1-2026-10-06`

Branche :

`work/lab-capture-asset-library-ux-v1-2026-10-06`

PR de contrôle / CI :

`#16` — draft, base = `work/lab-capture-fx-particles-v1-2026-10-05`.

Le lot ne crée ni second catalogue, ni second importer, ni second renderer.

## Audit de l'import créateur existant

Le système était déjà présent.

Propriétaire unique :

`src/assets/creator-visual-asset-session-v1.js`

Il réutilise :

`src/assets/image-source-manager.js`

Un import image :

- accepte PNG / WebP / JPEG via l'Asset Input existant ;
- crée un identifiant `user:<id généré>` ;
- publie une Asset Definition avec `source.scope = "user"` ;
- rejoint le catalogue actif de l'éditeur ;
- est ensuite résolu par le même `SkillPresentationBinding` et le même renderer que les assets GenSrpG.

La preview combat ajoute les assets de `creatorVisualAssets.list()` au même catalogue transmis au chemin visuel natif.

La persistance longue durée n'est pas inventée dans ce lot : dans le laboratoire, ces imports restent liés à la session. La persistance projet/utilisateur reste un futur lot explicite de raccord GenSrpG.

## Cause UX réelle

Les sélecteurs `data-asset-role` utilisaient déjà le catalogue unique, mais affichaient les assets dans une liste plate.

Conséquence : pour un créateur, un asset `core/pack` fourni par GenSrpG et un asset `user` importé personnellement semblaient appartenir à la même liste sans provenance claire.

Le `Pack FX GenSrpG` était également voisin de cette liste, ce qui pouvait le faire comprendre comme une autre bibliothèque alors qu'il s'agit d'un preset non destructif de présentation.

## Correction UX

`populateSelect` continue à lire le même tableau d'assets et à utiliser les mêmes `assetId`.

Il groupe maintenant les options visibles en :

- `Bibliothèque GenSrpG` — assets non utilisateur, notamment `core` et `pack` ;
- `Mes assets` — assets dont `source.scope = "user"`.

Aucune copie de l'asset n'est créée.

L'import reste le même bouton et le même appel `creatorVisualAssets.importImage(...)`.

L'UX Compétence explique maintenant explicitement :

- Bibliothèque GenSrpG ;
- Mes assets ;
- Importer un sprite ;
- Pack FX GenSrpG = réglage prêt à l'emploi, pas une seconde bibliothèque.

Les anciennes références hors catalogue restent conservées par le fallback déjà existant.

## Correctif ciblé Loup volcanique / socket

Le visuel Loup réparé est documenté dans le metadata global :

`assets/library/capture/creatures/loup_volcanique/loup_volcanique.meta.json`

Révision :

`validated-front-back-opponent-fix-2026-09-27`

Le preset vitrine utilisait encore des coordonnées de bouche provenant de l'ancien cadrage :

- front / opponent : ~ `0.244 / 0.610` ;
- back / player : ~ `0.824 / 0.624`.

Le metadata du visuel réparé définit :

- opponent mouth : `0.15 / 0.53` ;
- player mouth : `0.82 / 0.52`.

Correction appliquée uniquement dans :

`data/capture/showcase/crea-loup.capture-creature-transfer-v1.json`

Sentinelles conservées :

- icône : `pack:capture:creature-loup-volcanique-icon-01` ;
- face : `pack:capture:creature-loup-volcanique-opponent-01` ;
- dos : `pack:capture:creature-loup-volcanique-player-01`.

Aucun changement du moteur de sockets.

## TDD

Test dédié :

`tests/unit/capture-asset-library-ux-v1.test.mjs`

### RED

Run :

`37389249151`

Résultat attendu :

- 3 échecs ;
- absence des groupes de provenance ;
- absence du texte UX ;
- coordonnées Loup encore anciennes.

### Première passe après implémentation

Run :

`37389358690`

Un seul échec subsistait dans la nouvelle sentinelle : elle comptait le contrôle de capacité `typeof creatorVisualAssets.importImage` comme un second import.

Le produit n'avait pas deux chemins d'import.

La sentinelle a été corrigée pour compter uniquement l'invocation réelle :

`const asset = creatorVisualAssets.importImage(...)`

### GREEN fonctionnel observé

Run :

`37389457117`

Résultat :

- 1095 tests ;
- 1095 PASS ;
- 0 FAIL.

Une sentinelle directe de provenance a ensuite été ajoutée pour imposer :

- `core -> gensrpg` ;
- `pack -> gensrpg` ;
- `user -> user`.

La CI du HEAD final doit rester verte avant création du checkpoint GREEN.

## Fichiers fonctionnels modifiés

- `src/ui/capture-editor-human-v2.js`
- `examples/dom-demo/capture-editor-v2.html`
- `data/capture/showcase/crea-loup.capture-creature-transfer-v1.json`
- `tests/unit/capture-asset-library-ux-v1.test.mjs`

Documentation :

- `docs/LAB_CURRENT_WORK.md`
- ce document.

## Invariants protégés

Aucune modification dans :

- `src/core/combat/` ;
- Combat Runtime ;
- Session ;
- collision ;
- dégâts ;
- projectile clash rules ;
- renderer de traînée ;
- renderer de fumée ;
- Cast particles ;
- audio clash ;
- contrats FX déjà validés.

Le `Pack FX GenSrpG` reste non destructif pour les médias auteur existants.

## Validation utilisateur

Le lot peut être déclaré GREEN technique seulement après CI finale + checkpoint + preview.

La validation smartphone utilisateur reste obligatoire avant GREEN utilisateur.

À tester dans la preview :

1. ouvrir `Capacités` puis `Effets visuels` ;
2. vérifier que le Pack FX est clairement présenté comme un preset ;
3. ouvrir les réglages visuels et vérifier les groupes `Bibliothèque GenSrpG` / `Mes assets` ;
4. importer un PNG/WebP/JPEG comme Cast, Projectile, Impact, Zone, Statut ou Icône ;
5. vérifier que l'asset apparaît sous `Mes assets`, est sélectionné, puis fonctionne en combat ;
6. charger le Loup volcanique et vérifier visuellement que le projectile part de la bouche sur les deux vues ;
7. vérifier qu'aucune régression n'apparaît sur traînée, fumée, Cast particles ou son d'impact projectile/projectile.
