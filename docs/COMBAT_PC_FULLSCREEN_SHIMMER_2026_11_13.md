# Diagnostic — scintillement plein écran sur PC (13 novembre 2026)

START : `main@076d77ad0e6c60acd02c9f5b5ddccdbfbc9f7b9f`.
Checkpoint : `checkpoint/combat-start-pc-fullscreen-shimmer-20261113`.
Branche : `work/combat-pc-fullscreen-pixel-snap-20261113`.

## Symptôme confirmé par le créateur
- PC en plein écran : scintillement sur tout le champ de bataille et qualité visuelle dégradée.
- Hors plein écran, pas de scintillement comparable.
- Le flash d'opacité **de la créature touchée** est voulu et ne doit pas être supprimé.

## Hypothèse technique, non établie
Les secousses de caméra `translate3d(...px)` sont calculées sur des pixels CSS
fractionnaires : le compositeur GPU peut rééchantillonner des textures lorsque
le viewport plein écran a un ratio de pixels physiques non entier.

## Candidat isolé
Le renderer natif `dom-camera-fx` aligne les déplacements sur un pixel physique
uniquement si la page est en **vrai plein écran**, avec grand écran et pointeur
fin. Hors de ce cas : animation et timing historiques strictement inchangés.
Ne touche pas aux visuels de dégâts, aux sprites, au gameplay, aux coordonnées,
aux sauvegardes ni au rendu mobile.

Tests automatiques : activation conditionnelle, timeline et cadences conservées,
intégration renderer. **Ne pas déclarer le bug plein écran résolu** avant reproduction
comparée sur PC (même combat, mêmes capacités, fenêtre normale vs plein écran),
et vérification des animations CSS composites hors secousses.

Cette PR ne modifie ni Exploration ni GenSRPG publisher. Pas de double autorité.
