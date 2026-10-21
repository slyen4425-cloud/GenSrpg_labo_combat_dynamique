# Labo Capture — Deux animations de déplacement FACE / DOS
Date : 21 octobre 2026

## Diagnostic démontré
L'éditeur avait un sélecteur unique `data-creature-movement-visual` alors qu'il possédait déjà des tailles séparées FACE/DOS. Le contrat v8 n'acceptait que `visual.movement` et le rendu utilisait `movementFxByView` pour choisir l'image adaptée à chaque camp ; sans seconde référence de média, il réutilisait le même asset partout. L'auteur a deux animations de course pour le Loup volcanique (dos côté joueur, face côté adversaire) et doit pouvoir les choisir sans modifier les autres créatures.

## Solution — V9 additive, propriétaire unique
Le contrat `CreaturePresentationBinding` introduit v9 et `visual.movementBack` facultatif. L'ancien `visual.movement` continue de représenter la vue FACE (adversaire). La validation passe par `normalizeCreaturePresentationBindingV4` déjà propriétaire des sprites, sans forker le schéma ou le moteur. `normalizeCreaturePresentationBindingV8` reste intact ; la V9 est dispatchée par le point d'entrée canonique.

L'éditeur propose DEUX menus existants `data-asset-role="movement"` : FACE (adversaire) et DOS (joueur). Ils lisent tous deux l'unique bibliothèque de médias actuelle et conservent les IDs originaux ; aucune saisie d'ID. Les réglages communs (mode, nombre de frames, rotation, transition, playback) et les tailles déjà spécifiques au joueur/adversaire sont préservés. Renseigner uniquement le DOS est autorisé; la FACE garde son apparence normale. Ne pas remplir automatiquement l'une des sélections par une autre en modifiant les données.

L'adaptateur unique `adaptCaptureExportToNativeVisualSourceV1` résout le bon `assetId` depuis le catalogue, puis produit `movementFxByView.player` depuis le dos si disponible ; sinon depuis l'ancien sprite. `movementFxByView.opponent` utilise l'ancien champ face. Le moteur de mouvement, les collisions, les ombres et Animation Core ne changent pas. Les anciennes fiches V1–V8 restent compatibles et une fiche sans `movementBack` continue à afficher le même sprite des deux côtés.

## Contrôles
- Versionnement V4/V8/V9, validation du sprite DOS avec le schéma de mouvement V4 ; rejet des références mal formées.
- Deux menus utilisant le filtre mouvement et le catalogue existant, sélection face/dos, remise à zéro, chargement des champs.
- Contrat auteur, restauration JSON et projection jusqu'au véritable `creatureMovementAppearanceForViewV1` pour joueur/adversaire, échelles et lecture conservées.
- Ancienne créature avec un sprite, et créature avec uniquement dos, sans nouveau propriétaire ni régression d'attaque.
- CI cinq jobs + test démarrage éditeur navigateur. Seule la validation artistique sur les vrais sprites du Loup et sur Android reste à l'auteur. Aucun asset de loup n'est modifié, déplacé ou prétendu inspecté par ce lot.
