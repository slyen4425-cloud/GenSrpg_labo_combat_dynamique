# Raiiven — quatre compétences : lot de préparation (20 novembre 2026)

## Gouvernance
Base unique : Combat main `2c3aa91c25002e48af6516b478a190535aba5931` ; checkpoint START : `checkpoint/lab-start-raiiven-four-skills-20261120` ;
branche éphémère : `work/lab-raiiven-four-skills-20261120`. Pas de développement `gh-pages`, pas d'import PWA, pas de copie d'assets.
L'ultime « Cavalcade des damnés » et ses 3×40 / 2v2 / KO restent inchangés.
Ne modifier ni les animations maîtres, ni `global-assets`, ni les autres créatures.

## Identité, niveaux et réglages

| Niveau | Compétence | Règle auteur | Règles provisoires héritées |
|---|---|---|---|
| 1 | Fer maudit | 12 dégâts Ombre ; empreinte 6 s ; à la prochaine compétence **offensive** de la cible : 8 dégâts Ombre une seule fois. | 2 énergie, recharge 7 s. |
| 5 | Dédale des silhouettes | 2 leurres pendant **20 s** ; attaque sur mauvais leurre : le leurre disparaît et inflige **10 dégâts Ombre** à l'attaquant ; pas de protection automatique contre les zones. | 5 énergie, recharge 32 s. |
| 10 | Vol de foulées | Dégâts Ombre = **5 + 5 × charges maximales** d'esquive de la cible ; vole **une charge disponible** (jamais une charge épuisée), crédite Raiiven sans dépasser son maximum. | 5 énergie, recharge 25 s. Un ennemi sans esquive n'accorde pas de vol. |
| 15 | Rémanence interdite | Copie la dernière compétence **non ultime** utilisée par la cible, y compris attaque/soin/support. Même effet spectral pour projectile, zone ou soin centré sur Raiiven ; dégâts convertis au canal Ombre ; les soins restent des soins sur Raiiven. | 7 énergie, recharge 40 s ; coefficient de dégâts/soins **60 % provisoire, non validé**. |

## Travaux natifs nécessaires (aucun effet factice)
1. **Fer maudit** : l'horloge Statuts existante conserve la marque ; déclencheur natif sur démarrage effectif (payé) d'une compétence offensive et consommation unique ; dégâts attribués à la source de la marque. Test des délais, immunités, boucliers et remplacement de créatures.
2. **Dédale** : créer une entité leurre cible **choisissable** dans les cibles de combat, et distinguer la collision réelle du modèle du leurre. Deux corps supplémentaires visuels ne doivent pas être deux combattants/hitboxes cachés. Une frappe sur leurre produit une riposte Ombre de 10 via Combat Rules, consomme un leurre ; en 2v2, chaque adversaire reste ciblable. Attaques de zone atteignent le vrai sujet.
3. **Vol de foulées** : lire `defensiveReaction.maxCharges` (ou politique défensive canonique du combattant) pour calculer les dégâts ; transfert transactionnel d'une charge disponible par `rechargeableActions` en respectant source, quotas et minuterie existants. Jamais de jauge d'esquive parallèle.
4. **Rémanence** : journaliser la dernière compétence réelle par acteur/membre (séparer les slots de réserve), exclure les ultimes, transformer sa définition via l'adaptateur de copie native puis exécuter **ses mécaniques** par la même chaîne Start→Runtime→Resolver ; capacité copiée attribuée à Raiiven, dégâts convertis en Ombre, soins sur Raiiven, FX générique selon la forme ; refuser explicitement les comportements impossibles sans les remplacer par une attaque de secours.

## Étapes et portes
- Palier A : Fer maudit natif avec test RED puis GREEN.
- Palier B : Vol de foulées et les vrais quotas d'esquive.
- Palier C : entités de leurre, sélection manuelle et IA, riposte.
- Palier D : écho universel, règles de support / réserves / zone, FX Ombre.
- Palier E : 4 transferts Capture valides, loadout Raiiven 1/5/10/15/20, CI complète, browser 1v1 et 2v2, mobile paysage, source HTTPS au SHA exact.

**État de ce lot : validation sur branche temporaire.** Fer maudit, Dédale, Vol de foulées et Rémanence disposent de tests intégration et du contrôle navigateur Chromium 1v1/2v2. Rémanence copie les effets de réserve globaux via l'unique RosterSession et prend en charge les capacités de cible réserve explicite via une sélection native de membre (source de compétence = dernier lancement réel du slot, y compris réserve temporisée, jamais un effet provisoire). Les remplacements réels effacent la mémoire, pas les simples règlements tactiques. Les mécaniques relai/changement forcé restent régies par le Roster, sans double autorité. **60 % reste une valeur d'essai provisoire** pour dégâts et soins : à ajuster après retour auteur, ne pas la présenter comme un équilibrage définitif. CI complète du SHA exact, contrôle écran paysage et déploiement HTTPS main indispensables avant checkpoint final.
