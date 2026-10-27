# Zone à statuts natifs V1 — lot 2/4 (Monster Capture)

Date de préparation : 2026-10-10. Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Demande et périmètre

Le créateur doit pouvoir produire « Voile brumeux » (bonus de Défense tant que dans une bulle), une zone empoisonnée (statut déclenché lorsqu'un ennemi entre dans le rayon) et, déjà au niveau statut, un effet de renvoi. Le lot 1 avait créé `damage_reflection` ; le présent lot 2 réutilise **les propriétaires natifs** pour que `persistent_zone.tickEffect` accepte aussi `apply_status`, sans remplacer les zones de dégâts existantes. Aucune source de données auteur n'est modifiée par le lot.

## Contrat

- `SkillEffectV1.persistent_zone.tickEffect.kind` : `damage` (legacy inchangé) ou `apply_status` (nouveau).
- `statusBehavior: while_inside|on_enter` uniquement pour `apply_status`. Valeur par défaut : `while_inside`. Les zones de dégâts précédentes n'acquièrent pas ce champ.
- `while_inside` : un statut natif isolé par ID de zone est appliqué à chaque occupant autorisé, tant qu'il y reste ; sortie du rayon, expiration ou suppression de la zone : suppression **uniquement** du statut attaché à cette zone. Les éventuels statuts indépendants portant le même nom/ID d'auteur sont conservés. Pas de stacks répétés par frame ni régénération automatique des boucliers consommés.
- `on_enter` : le statut s'applique une fois par entrée, sous ses durées, protections et règles d'empilement natifs ; il peut persister après sortie de la zone, comme le Poison. Une présence continue, même après expiration de ce statut, ne provoque pas un nouveau déclenchement. Réentrée = nouvelle application.
- `occupiedActorIds` est stocké **dans l'instance existante** `CombatState.persistentZones` ; ce n'est pas un second owner. La géométrie de présence reste décidée par `persistent-zone-runtime-v1` à partir de son contexte spatial authentique (ellipse de zone + modèle, sinon fallback gameplay existant).
- Les effets DoT/HoT, immunités et buffs sont appliqués par `Status Runtime`. Le nettoyage des effets `while_inside` a lieu **avant** les ticks natifs du statut, évitant les dégâts de poison après une sortie détectée. Les attaques et éventuels renvois continuent d'utiliser `Combat Damage Application` et les crédits KO existants.
- Au remplacement d'un membre, la zone du lanceur est supprimée selon la règle héritée du laboratoire. Les statuts `while_inside` disparaissent aussi des alliés et les vieux snapshots de réserve sont nettoyés lorsqu'un ancien membre revient. Les DoT `on_enter`, eux, restent sous leur durée native.

## UI et export

Dans le Human Editor, créer un effet « Zone persistante », puis définir « Effet de zone : Bonus / Malus / Statut ». Les champs proposent type de statut, ID, polarité, durée, stacking, tags, et paramètres de Défense/stat, Poison/DoT, HoT, renvoi, bouclier, trajet ou immunité ; sélectionner le comportement « uniquement dans la zone » ou « à l'entrée ». Le contrat normalisé, sauvegardé et exporté passe par l'éditeur existant. Le sprite de zone utilise son raccord visuel déjà présent ; pas de nouveau média, catalogue, état UI ou FX gameplay. La source des statuts reste `StatusEffectV1`.

### Exemples vérifiables

- `Voile brumeux` : `targetScope:all_allies`, `radius:short` (ou autre), `tickEffect:{kind:apply_status,status:{kind:stat_modifier,statId:defense,deltaPoints:25,...}}`, `statusBehavior:while_inside`. L'effet devient réel selon la définition de stat du monde (ex. 25 points pour 25% de réduction si le monde choisit 1%/point).
- `Zone empoisonnée` : `targetScope:all_enemies`, `tickEffect:{kind:apply_status,status:{kind:damage_over_time,amount:5,channel:poison,tickIntervalMs:1000,durationMs:2000,...}}`, `statusBehavior:on_enter`. Le poison continue 2 secondes selon l'horloge statuts, même après avoir quitté la zone.
- Un statut `damage_reflection` peut être utilisé dans `while_inside` pour renvoyer les dégâts reçus par les alliés présents **tant que le lanceur maintient sa zone active**. Il ne survit pas encore au rappel.

## Tests réalisés (preuve source)

Commit fonctionnel `bb389d2e11e5d2fc8036e34d473bca39e2892b7a`, Laboratory CI `37998951321` **SUCCESS** : **1360/1360 Node PASS** ; vrais navigateurs Chromium `creature-library-browser` et `firestorm-zone-growth-browser` SUCCESS. Test natif des zones 1v1/2v2, stat Défense et modificateur réel du calcul de dégâts, poison à l'entrée, immunité via Status Runtime, chevauchement avec un statut indépendant identique, expiration, suppression lors du remplacement de slot, absence de retour d'un buff depuis le snapshot rappelé, ellipse visible : entrée/sortie et absence de tick DoT après sortie. Parcours réel de l'éditeur : deux zones créées (Défense +25 et Poison 4/tick) dans une fiche existante et export JSON réel ; 103 créatures et ancienne compétence de soin conservées. Firestorm hérité inchangé et navigateur GREEN.

Le RED initial `6981a75293ad1e29b170a8bdaf3d409d98f4ceaa` a échoué comme attendu. Deux sentinelles UI legacy de libellés ont été restaurées ; le GREEN retenu est exclusivement celui du commit source final, aucun échec intermédiaire ne constitue un jalon livré.

## Limites et lots restants

- **Lot 3** à réaliser : persistance **optionnelle** des zones après rappel/changement de créature. Le lancer ne conserve pas encore `Voile brumeux` après un switch ; l'actuel `Roster Session` détruit la zone au rappel.
- **Lot 4** à réaliser : effet de réaction / riposte autonome attaché à une zone, triggers et présentation spécifique « Miroir destructeur », y compris après changement de créature lorsque la nouvelle propriété de zone sera définie. Actuellement une zone appliquant `damage_reflection` fonctionne seulement sur l'occupant affecté et tant que sa zone existe.
- Aucun nouveau sprite de bulle ou brume n'a été généré et aucun contenu utilisateur n'a été retouché.
- Prochaine validation tactile sur Android physique par Sylvain ; la CI utilise de vrais navigateurs automatisés, pas un smartphone physique.

## Gouvernance

Base source publiée initiale `1d44b86ce667e1e61245dfbc407c86a6068ce424`. Travail isolé `work/lab-zone-status-effects-v1-2026-10-10`, checkpoint départ `checkpoint/lab-start-zone-status-effects-v1-2026-10-10`. Domaine modifié : contrats de zone, propriétaire d'effets de zone, seul orchestrateur Combat Session, vue d'éditeur et aide, tests et documentation ; `main`, `global-assets`, `Zombicide-40k`, Exploration et catalogues/presets auteur intacts. Checkpoint GREEN, preview, promotion publique et CI Pages à relever après la revue finale et les tests documentaires, sans déclarer ces étapes anticipées.
