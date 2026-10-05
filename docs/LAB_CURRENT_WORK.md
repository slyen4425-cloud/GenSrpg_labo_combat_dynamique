## Chantier actif — 2026-10-06 — Bibliothèque créateur / import visuel UX V1

Branche : `work/lab-capture-asset-library-ux-v1-2026-10-06`

Checkpoint de départ :
`checkpoint/lab-start-capture-asset-library-ux-v1-2026-10-06`

SHA de base :
`5cd2ced3a7917de366fafa033386511cc1306ef2`

### Objectif

Clarifier l’UX assets du Human Editor sans créer de nouvel importer ni de nouveau renderer :

- distinguer explicitement `Bibliothèque GenSrpG` et `Mes assets` dans les sélecteurs visuels ;
- conserver l’import PNG / WebP / JPEG existant, propriétaire unique `createCreatorVisualAssetSessionV1` ;
- vérifier que l’import produit un `assetId user:` et rejoint les mêmes sélecteurs / bindings / renderer ;
- conserver `Pack FX GenSrpG` comme preset non destructif distinct d’un asset brut ;
- corriger le socket bouche du Loup volcanique d’après le metadata du visuel réparé, sans toucher au moteur de sockets.

### Propriétaires concernés

- Asset Input : `creator-visual-asset-session-v1` / `image-source-manager` ;
- catalogue actif de l’éditeur : `hydrateAssetCatalog` ;
- présentation : `SkillPresentationBinding` existant ;
- socket créature : données exportées de la fiche `crea-loup`, aucune nouvelle autorité.

### Fichiers autorisés

- `src/ui/capture-editor-human-v2.js`
- `examples/dom-demo/capture-editor-v2.html`
- `data/capture/showcase/crea-loup.capture-creature-transfer-v1.json`
- tests unitaires dédiés
- documentation du chantier

### Protégé / interdit

Ne pas modifier :
- traînée projectile validée ;
- fumée validée ;
- audio clash validé ;
- collision / dégâts / Combat Runtime / Session ;
- particules Cast ;
- renderer FX sauf faute nouvellement démontrée ;
- architecture `assetId -> binding -> renderer`.

### Diagnostic pré-audit

- l’import visuel existe déjà et crée des assets `source.scope = user` avec ID `user:<uuid>` ;
- le preview combat résout ces assets par le même `SkillPresentationBinding` et le même renderer ;
- le défaut UX vient du mélange de tous les assets dans les mêmes listes sans provenance lisible ;
- les imports sont actuellement limités à la session du laboratoire, conformément à la roadmap ; aucune seconde persistance ne sera inventée ici ;
- le Loup vitrine garde des coordonnées de socket bouche antérieures au visuel réparé :
  - front/opponent actuel ~ `0.244 / 0.610`, metadata = `0.15 / 0.53` ;
  - back/player actuel ~ `0.824 / 0.624`, metadata = `0.82 / 0.52` ;
- l’icône du Loup reste `pack:capture:creature-loup-volcanique-icon-01` et doit être protégée.

### TDD prévu

RED avant implémentation :
1. groupement des choix visuels par provenance ;
2. import utilisateur toujours réinjecté dans les sélecteurs canoniques ;
3. aucune seconde invocation `importImage` ;
4. sentinelle Loup : icône inchangée + socket bouche aligné sur le metadata réparé ;
5. texte UX distinguant bibliothèque, assets personnels et import.

### Risques

- perdre une valeur déjà sélectionnée lors du repeuplement d’un select ;
- masquer un asset hors catalogue déjà référencé ;
- casser les rôles `travel/status/icon` ;
- confondre Pack FX et bibliothèque de sprites ;
- déplacer les sockets ailleurs que dans la donnée créature.

### Critère de fin

- RED démontré ;
- implémentation minimale ;
- tests ciblés + CI complète verts ;
- aucun fichier gameplay runtime modifié ;
- checkpoint GREEN technique ;
- preview exacte ;
- validation smartphone utilisateur encore requise pour GREEN utilisateur.

---

