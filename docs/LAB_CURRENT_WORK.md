# Micro-lot actif — Dodge Vanish Visual V1 — 2026-10-07

Branche : `work/lab-dodge-vanish-visual-v1-2026-10-07`

Checkpoint de départ : `checkpoint/lab-start-dodge-vanish-visual-v1-2026-10-07`
Base exacte : `e87a6acc4c5a2262cb466d2001d698aeb7e9bbd5`

## Besoin utilisateur

Quand l'Esquive proactive est activée, la créature doit :
- disparaître visuellement pendant la fenêtre active ;
- avoir un petit effet de disparition/réapparition ;
- revenir exactement à son état visuel normal à la fin ;
- ne modifier aucune règle gameplay d'esquive.

Évolution souhaitée ensuite :
- permettre un sprite/FX personnel de disparition via la bibliothèque visuelle créateur.

## Diagnostic

Le Runtime possède déjà l'autorité unique :
- activation proactive ;
- charges ;
- recharge ;
- `activeWindowMs` ;
- résolution réelle `evaded`.

Le contrat `CombatVisualEvent` contient déjà `dodge`, mais `planAnimation` ne possède actuellement aucun cas `dodge`.
Le bouton Esquive n'envoie actuellement aucun événement visuel.

## Propriétaires

- durée gameplay : Combat Runtime existant ;
- événement visuel : CombatVisualEvent existant ;
- séquencement visuel : Animation Core ;
- application DOM : DomActorRenderer existant ;
- déclenchement : Combat 2v2 UI, projection uniquement.

## Périmètre V1

- plan d'animation `dodge` générique ;
- durée fournie par `activeWindowMs` du Runtime/UI, aucune seconde horloge gameplay ;
- disparition + courte transition entrée/sortie ;
- ombre suit la même opacité via le renderer existant ;
- raccord du bouton Esquive au vrai `visuals.playEventFor(..., "dodge")` ;
- tests du vrai chemin.

## Hors périmètre de ce micro-lot

- persistance assets projet ;
- import d'arènes ;
- raccord World Builder ;
- nouveau moteur FX ;
- modification des règles Dodge ;
- sprite personnel Dodge : traité dans le micro-lot suivant via le système Asset/Presentation existant, sans coder un chemin spécial utilisateur ici.

## Protégé

Aucun changement de :
- Combat Rules / résolution `evaded` ;
- Rechargeable Action ;
- Damage / Status ;
- collision / projectile ;
- SkillPresentation ;
- Showcase ;
- audio ;
- roster ;
- main ;
- dépôt GenSrpG principal ;
- dépôt Exploration.

## TDD

1. RED : `planAnimation(dodge)` absent ;
2. RED : bouton Dodge n'appelle pas le visuel ;
3. GREEN : durée totale strictement égale à `activeWindowMs` ;
4. GREEN : opacité atteint 0 pendant la fenêtre et revient à 1 ;
5. GREEN : aucune minuterie gameplay ajoutée ;
6. CI complète ;
7. checkpoint GREEN + preview.

## Critère de fin

Une activation Dodge réussie déclenche exactement une animation visuelle possédée par Animation Core, synchronisée sur la durée active, sans modifier le comportement gameplay existant.
