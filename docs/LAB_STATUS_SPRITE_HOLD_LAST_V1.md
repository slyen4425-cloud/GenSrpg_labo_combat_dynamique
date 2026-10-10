# Labo Combat — Statut : animer une fois et conserver la dernière frame

**10 octobre 2026 — Status Sprite Hold Last V1**

## Attendu utilisateur

Une capacité comme **Armure de pierre / Carapace minérale** peut déclencher un statut positif de durée variable. Le sprite de formation de l'armure doit :
1. jouer normalement toute sa séquence de frames, **une fois**, à son tempo natif `frameMs` ;
2. se **figer sur la dernière image réelle** (pas sur la première, ni blanc, ni en boucle) ;
3. rester sur la créature jusqu'à disparition du statut autoritaire (expiration, dispel, cleanse, KO, etc.) ;
4. disparaître du DOM quand le statut n'est plus présent.

Le mode `stretch` (étaler toutes les frames sur la durée totale) ne répond pas à cet effet ; le mode `loop` fait tourner indéfiniment l'armure. Les modes historiques doivent continuer à fonctionner.

## Contrat et propriétaire

- Le réglage `hold-last` est une nouvelle valeur du champ **déjà existant** `SkillPresentationBindingV3.statusVisuals[statusId].sprite.playbackMode`. Il ne modifie aucune valeur gameplay ni le `StatusEffectV1`.
- **Human Editor** : dans `Animation du statut`, le mode apparaît sous « Jouer une fois puis garder la dernière image (jusqu’à la fin du statut) ». Les autres sélecteurs de cast/impact/zone demeurent inchangés ; pas de sélecteur ou d'ID supplémentaire. L'export/import Capture conserve le choix.
- **Presentation Assets** : `resolvedStatusPresentation` conserve le `playbackMode` et les métadonnées de l'asset `frameCount/frameMs/frames`.
- **Shared Sprite Renderer** : `applySpriteVisual` traite `hold-last` à vitesse native.
  - Sprite atlas (image strip horizontale) : même animation CSS `skill-fx-strip`, une itération, `steps(frameCount-1,end)`, `fill:forwards` : l'état 100 % sélectionne la dernière case et la conserve.
  - Sprite multipage `frames[]` : réutilisation du renderer d'images superposées préexistant (auparavant réservé aux boucles), avec itération **unique** et `fill:both`. La dernière image reste opaque au dernier keyframe, sans interpolation non fiable de la propriété CSS `backgroundImage`.
- **Dom Status FX** reste propriétaire de la création du nœud, de son maintien lors des `sync` et refresh du statut, et de sa destruction lors de sa disparition. La durée de l'animation n'est jamais étendue à `expiresAtMs` pour `hold-last`. Aucun setTimeout, nouvelle horloge, instance de statut parallèle ou animation dupliquée.

## Compatibilité / non-régression

- Les sprites `once`, `loop`, `stretch` précédents ne changent pas de valeur, de contrat ni de cycle de vie. Le nouveau mode n'est proposé que pour les sprites de statuts ; autres formes de FX sont protégées.
- Les fichiers de compétences et de créatures auteur, assets graphiques, HUD des buffs, 103 créatures, stats, calcul de défense, dégâts, cooldown, zone et combat restent inchangés.
- Aucun fallback graphique non fondé n'est introduit si le dernier frame de **l'asset lui-même** est vide : la correction garantit l'affichage exact de la dernière frame, pas le contenu artistique d'un asset non fourni.

## Vérification

- Base publique CI + Pages green : `c8603fca6ed4e054bbf0c16d188dfb33db25fbe5`.
- Checkpoint de départ : `checkpoint/lab-start-status-sprite-hold-last-v1-2026-10-10`.
- Test RED avant implementation : `tests/unit/status-sprite-hold-last-v1.test.mjs`, prouve roundtrip JSON, validation du mode, atlas 8 frames / 90 ms, non redémarrage sur refresh, suppression native, frame images WAAPI empilées, options de l'éditeur.
- Test RED initial fut ajusté pour utiliser une véritable capacité `buff_debuff` et un statut natif `stat_modifier`, sans changer la production.
- Tests de non-régression : Foundation, Chromium bibliothèque 103 créatures, Chromium Firestorm 1v1 / 2v2.
- Dernier test auditif/visuel physique smartphone à valider par l'utilisateur.

Le correctif reste indépendant de `main`, du projet GenSrpG central, de l'Exploration et de `global-assets`.
