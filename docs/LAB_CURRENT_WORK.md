# Point de reprise courant — 2026-10-07

## Lot actif

Goutte Projectile Power Regression V1

Branche :
`work/lab-goutte-projectile-power-regression-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-goutte-projectile-power-regression-v1-2026-10-07`

Base exacte :
`ffdb2533bfa28446a2bea22afa36c5093c4d8cce`

## Retour utilisateur

En combat :
- Goutte vive observée avec puissance projectile 0 ;
- projectile adverse observé avec puissance 1 ;
- les deux se croisent sans clash.

## Contrat existant confirmé

`projectileClash.power = 0` signifie explicitement :
**hors système de clash projectile**.

Les puissances positives participent au clash :
- plus forte : survit ;
- égales : annulation mutuelle.

L'export auteur intégré de `cap_water_atk_1` contient pourtant :
`projectileClash.power = 1`.

La donnée auteur ne doit donc pas être modifiée à l'aveugle.

## Objectif

Reproduire le vrai chemin :
`Author Transfer -> configuredSkills -> Combat Export -> Native Adapter -> Combat Runtime`

et identifier l'endroit exact où la valeur 1 devient éventuellement 0.

## Owners

- SkillDefinition / ProjectilePowerV1 : contrat de puissance ;
- Combat Rules / projectile-clash : résolution de clash ;
- configuredSkills : owner de la compétence active ;
- aucun calcul de puissance dans l'UI ou le renderer.

## Domaines protégés

Ne pas modifier sans preuve :
- fichier auteur Goutte vive ;
- logique élémentaire ;
- Animation / FX ;
- collision DOM ;
- Roster ;
- audio ;
- créatures ;
- main ;
- Zombicide-40k ;
- Exploration.

## TDD

1. test vrai chemin Goutte vive jusqu'au Runtime ;
2. vérifier puissance native ;
3. vérifier 1 vs 1 => mutual_cancel ;
4. si RED : corriger uniquement le premier owner fautif ;
5. si GREEN : chercher le chemin UI qui réécrit la compétence avant export ;
6. CI complète.

## Deuxième correctif séparé

La suppression de l'encadré/toggle paysage sera traitée après ce lot, sans mélanger gameplay et UI produit.
