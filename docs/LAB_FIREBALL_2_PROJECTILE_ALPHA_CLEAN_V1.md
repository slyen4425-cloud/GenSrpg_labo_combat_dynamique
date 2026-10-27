# LAB — Fireball 2 Projectile Alpha Clean V1

## Statut

GREEN technique. Validation visuelle utilisateur requise avant tout merge vers main.

## Retour utilisateur

Le projectile « Boule de feu 2 » affichait en combat une grande forme semi-transparente derrière le noyau, perçue comme un sous-calque / triangle parasite.

## Diagnostic

Le défaut provenait du média projectile V1, pas du moteur.

La génération initiale combinait une nappe de queue alpha très large et un glow diffus. La sentinelle ajoutée sur les vrais pixels PNG reproduit le problème : l'ancienne frame 01 occupait 47,1 % de la surface 512×512 en alpha non nul.

Aucun changement n'était nécessaire dans Combat Runtime, Combat Rules, collision/contact, Animation Core, FX Core, Render Adapter, timings, dégâts, énergie ou cooldown.

## Correctif

Seuls les médias de fireball_2 projectile ont été régénérés : 12 PNG RGBA 512×512, même nommage, même assetId, même chemin catalogue, même atlas runtime 6144×512, traînées de feu étroites et indépendantes, suppression de la nappe alpha commune et glow resserré.

Cast et Impact sont inchangés.

## TDD

RED :
- commit sentinelle : c4c7092d035a31fbe981ef96e0149ad67fc423b0 ;
- CI : 37316248547 — FAILURE attendu ;
- 204 tests existants PASS, 1 nouveau FAIL ;
- erreur : projectile frame 01 alpha coverage too broad: 0.471.

GREEN assets :
- commit média : 97c5b8932138db0a88fd75a418cb1d9b0d112ce6 ;
- workflow génération : 37316438128 — SUCCESS ;
- sentinelle par frame : couverture alpha < 15 %, part de pixels faiblement alpha < 35 %, dimensions 512×512 RGBA ;
- outillage one-shot retiré après génération ;
- global-assets publié sur 97c5b8932138db0a88fd75a418cb1d9b0d112ce6.

GREEN fonctionnel :
- cache-buster : 2026-10-05-v13-fireball-2-projectile-alpha-clean-v1 ;
- source : 8ed5a1f0d2d0141a689ae3b4dd5f4023cb9612ba ;
- CI : 37316813227 — SUCCESS ;
- structure/indépendance : OK ;
- tests : 1035/1035 PASS.

## Architecture

Chaîne inchangée : assetId -> catalogue global -> global-assets -> SkillPresentationBinding -> renderer existant.

Aucune nouvelle autorité, aucun second loader, aucune branche gameplay par nom de compétence.

## Validation utilisateur

Tester dans capture-editor-v2.html avec Cast = Boule de feu 2 — cast, Projectile = Boule de feu 2 — projectile, Impact = Boule de feu 2 — impact.

Vérifier en combat : disparition du triangle / sous-calque, projectile net, traînée lisible, aucun fond ou voile parasite, comportement collision/impact inchangé.
