# Veuve jaune — cinq capacités auteur (15/11/2026)

Checkpoint: checkpoint/lab-start-veuve-jaune-skills-20261115 @ f12d97448896bf4a7f70f9dfd79efe17d00c194c.
Branche isolée: work/lab-veuve-jaune-skills-20261115. Les modifications complètent la PR #324 d'import et d'ID, qui doit précéder le lot présent. Aucune modification énergie de la créature, aucun changement des autres créatures, pas de copie de médias.

- L1 **Fil foudroyant** (veuve-jaune-fil-foudroyant) : Fil électrique : 12 dégâts, puis approche ennemie ralentie de 30 % pendant 3 s. Coût 3, cooldown 7s, cast 700ms.
- L5 **Toile paralysante** (veuve-jaune-toile-paralysante) : Obstacle destructible pendant 20 s : 3 PV par point Électricité, intercepte projectiles/rayons/contact. Au contact adverse, 6 dégâts électriques par seconde et immobilisation 1,5 s (retour possible après 6 s). Coût 6, cooldown 70s, cast 1000ms.
- L10 **Morsure neuroélectrique** (veuve-jaune-morsure-neuroelectrique) : Morsure : 16 dégâts électriques, puis trois décharges de 4 dégâts à 1, 2 et 3 s. Coût 5, cooldown 18s, cast 800ms.
- L15 **Emprise de soie** (veuve-jaune-emprise-de-soie) : 18 dégâts Nature et cocon de soie : interdit rappel et échange volontaires pendant 20 s, sans empêcher les attaques. Verrouillage non destructible. Coût 7, cooldown 35s, cast 1100ms.
- L20 **Domaine de la Veuve** (veuve-jaune-domaine-de-la-veuve) : Ultime utilisable après 30 s, une seule fois par combat : 40 dégâts électriques, 3 vagues de 7 dégâts et +40 si la cible est déjà ralentie ou immobilisée. Coût 10, cooldown 0s, cast 2000ms.

Le mur dérive de la mécanique CombatEntity native et du capteur de collision. L'Emprise crée un statut réglementaire RosterSession, sans verrou UI concurrent. Les trois vagues utilisent ScheduledEffect; l'ultime utilise activationRequirements/combat_elapsed_ms et l'effet conditionnel natif étendu à un OU de deux statuts.

Art temporaire: visuels élémentaires existants (électricité/nature) et icônes canoniques, sans faux sprite de toile. Produire/valider ensuite un ensemble spécifique de sprites tissage, cocon et toile, sans écraser des originaux.

Gates de sortie: tests contrats/statuts, murs et cooldowns, vrais combats Chromium, CI, puis publication main et contrôle HTTPS SHA exact. La source du présent lot ne doit pas être fusionnée avant #324.
