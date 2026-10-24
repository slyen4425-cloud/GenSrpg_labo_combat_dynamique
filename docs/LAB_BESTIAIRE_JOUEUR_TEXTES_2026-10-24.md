# Bestiaire — formulation naturelle des capacités (24 octobre 2026)

## Diagnostic
- PR #87 GREEN introduit un explicateur fidèle aux données, mais ses rubriques détaillées montrent les paramètres moteur : trajet, récupération, portée/onde, ciblage et des répétitions de labels.
- Demande auteur : une description **destinée au joueur**, courte, lisible, regroupant les effets et les valeurs/durées utiles en phrases naturelles. Exemple souhaité Vent arrière.
- IMPORTANT, effet réel constaté dans `lib_tailwind` : **+30 points en Vitesse, +150 % de vitesse de recharge, +100 % de régénération d'énergie et -100 points de Défense pendant 15 s**. **Aucun buff de dégâts**. La sortie suit les données du jeu, pas l'exemple illustratif.
- `ignoreResistancePct=100` donne « ignore la résistance », un pourcentage inférieur « ignore X % de la résistance ». Idem réduction de dégâts. Aucun jargon maladroit « ignore 100 % de résistance de dégâts ».

## Contrat et périmètre
- Base gh-pages SHA `8331769493eb8976ce5706e6ad08f515d07bafb7`, START `checkpoint/lab-start-bestiary-player-text-2026-10-24`, branche `work/lab-bestiary-player-text-2026-10-24`.
- Propriétaire inchangé : `src/ui/capture-skill-explanation-v1.js`, normalise l'unique `SkillDefinition` existant, émet une projection immuable `sentences` en français naturel. Pas de double moteur/clone de texte persistant.
- Grouper les modificateurs de statuts qui ont **même cible, même durée/modèle**, distinguer bonus et malus, ne jamais mélanger des durées différentes ; joindre par virgule et « et », opposition « mais ». Conserver toutes les informations d'effets réellement utiles (DoT/HoT, durée, piles, seuils, zone, déclencheur, conditions, ciblage réserve, immunités, charge, K.O.).
- Écran : supprimer les rubriques « Cibles et portée », « Déroulement », et les méta pastilles du Bestiaire. Une à quelques phrases, toujours dans la fiche de compétence existante, sans toucher aux icônes et aux cartes statistiques.
- Domaines protégés : gameplay, contrats, éditeur, visuels assets, statistiques, personnages, application GenSrpG principale. Fichiers autorisés : unique formateur `src/ui/capture-skill-explanation-v1.js`, lecture de la projection `examples/dom-demo/bestiary.js`, CSS ciblé, sentinelles unitaires et Chromium, documentation.
- Sentinelles : Vent arrière regroupé exactement; Surcharge pas de simplification erronée, Sangsue tick, Vague incendiaire DoT et ignore résistance, Kitsune zones/KO, Nid de frelon et réserve ; all Showcase skills ; cinq emplacements et icônes préservés. CI 5 jobs et checkpoint GREEN sur SHA exact avant fusion.
