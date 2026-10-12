# Monster Capture — Concept futur : Dernier sursaut / Esprit combatif

**Date de la demande :** 12 octobre 2026  
**Statut :** idée produit à conserver au backlog, **NON IMPLÉMENTÉE**.  
**Portée :** créatures de Monster Capture ; réflexion gameplay, progression et persistance à mener dans un chantier futur distinct. Cette note ne vaut pas autorisation de modifier le dépôt principal.

## Intention de jeu — esprit manga

Offrir à une créature mise **K.O.** la possibilité exceptionnelle de **se relever et poursuivre le combat**, grâce à sa volonté / son esprit combatif. Le moment doit être spectaculaire et propre à l'identité du monstre : « il se relève alors que tout semblait perdu ».

Le relèvement constitue une **mécanique distincte** de la guérison ordinaire, du remplacement de créature et de la résurrection après mort définitive.

## Principes exprimés et retenus

1. **K.O. puis sursaut :** une créature peut reprendre le combat malgré un K.O. initial, selon les conditions de la mécanique future.
2. **Bonus différenciés par créature :** le fait de se relever confère un bonus propre à chaque monstre (par exemple offensif, défensif, vitesse ou capacité), **sans imposer ici de liste ni de chiffres**.
3. **Évolution possible par paliers :** une même créature pourrait progresser sur plusieurs niveaux d'esprit combatif, avec des effets différents à chaque palier. Le nombre de niveaux est à définir.
4. **Prix du dépassement :** **utiliser ce mécanisme expose la créature à un risque de mort définitive**. Le K.O. normal n'est **pas** automatiquement une mort définitive.
5. **Compensation en cas de mort définitive liée à la mécanique :** le propriétaire reçoit une **pierre d'expérience**, utilisable pour transmettre à **une nouvelle créature 50 % de l'expérience que possédait la créature disparue**. La pierre est une compensation, non une résurrection de la créature d'origine.

Ces cinq intentions forment le cœur de la proposition. Il ne faut pas retirer le risque de mort sans décision de conception, ni transformer la pierre en récupération intégrale d'XP.

## Pistes d'expérience utilisateur (non décidées)

- Mettre en scène le passage K.O. → « dernier sursaut » : brève animation, aura et signal clair du bonus/rang, sans bloquer le vrai moteur combat.
- Rendre le risque de mort explicite au créateur et au joueur avant la prise de risque ; éviter une mort définitive masquée ou incompréhensible.
- Dans l'éditeur, pouvoir différencier les profils de sursaut des créatures et, le cas échéant, leurs paliers.
- Identifier visuellement le statut « combat malgré K.O. » et le risque associé. L'activation (automatique, décision du joueur ou autre) n'est pas fixée.
- La mécanique pourrait être activable/désactivable **dans les règles du monde/jeu**, après décision produit. Rien n'est imposé à Survie, Dungeon ou PvP.

## Raccords et responsabilités à prévoir

- **Combat Rules / Combat State :** transition K.O., éventuel sursaut, résolution des bonus, statut et événement de mort. Un seul résultat autoritaire ; aucune seconde gestion du K.O. dans la Demo UI ou FX.
- **Définition de créature :** profil paramétrable de « dernier sursaut », paliers et bonus, sans valeurs cachées en dur.
- **Progression / inventaire / persistance du jeu Capture :** confirmation de mort définitive, retrait cohérent de la créature, création d'une pierre unique, et transfert d'XP à une nouvelle créature.
- **Présentation :** animation et FX consommant les événements du moteur, sans décider des probabilités ni de la progression.
- **Sauvegardes/imports/exports :** conserver l'état de la créature et empêcher la duplication de la pierre, des récompenses ou des effets après reprise.
- **Frontières inter-dépôts :** le labo Combat peut prototyper les règles derrière un contrat ; les règles définitives de la campagne et de la progression devront être intégrées plus tard par le dépôt GenSrpG, sur chantier explicitement autorisé.

## Questions laissées volontairement ouvertes

- Le sursaut est-il activé par le joueur, déclenché automatiquement, conditionnel à une jauge, à un trait ou à un événement ?
- Combien de relèvements sont possibles et à quel moment exact du cycle K.O. / changement de combattant ?
- Quels bonus par créature ? Sont-ils temporaires ? Comment évoluent-ils selon les paliers ?
- **Quel est le risque de mort définitive ?** Probabilité, conditions, accumulation des relèvements et éventuel délai sont à décider ; aucun pourcentage inventé.
- Quand le risque est-il résolu : dès le sursaut, au prochain K.O., à la fin du combat ou autrement ?
- Pour la pierre : « XP possédée » signifie-t-il XP **cumulée totale** ou une autre valeur de progression ? Préciser cette base avant de coder le transfert de **50 %** ; définir les arrondis, plafonds, et les règles d'attribution à une *nouvelle* créature.
- Où cette mécanique est-elle autorisée ou désactivée selon les modes et profils de parties ?

## Critères de préparation d'un futur chantier

Définir d'abord la règle et son contrat data-driven ; préserver le comportement du K.O. normal ; tester vrai chemin KO → décision/sursaut → bonus → issue → récompense pierre → application de 50 % d'XP → sauvegarde/reprise ; inclure les cas de double déclenchement et de duplication ; faire valider la lisibilité et le niveau de risque.

**Rien n'est développé par cette note.** Aucun K.O., inventaire, XP, média ou runtime existant n'est modifié.
