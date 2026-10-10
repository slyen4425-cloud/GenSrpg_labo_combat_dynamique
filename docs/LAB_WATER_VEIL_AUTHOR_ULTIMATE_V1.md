# Voile aqueux — ultime auteur et durée du bonus de zone

Date : 2026-10-10 ; dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Source et invariants auteur

Transfert source : `gensrpg-capture-skill-cap_water_special_2.json`, SHA-256 octets `aec01c4df6299e29964f2ffd6920e8945cc20c47bb39fd15353943530e550a19`. Inscription unique dans `data/capture/showcase/cap_water_special_2.capture-skill-transfer-v1.json` et catalogue existant. Aucun second registre des compétences, pas de mutation des créatures ni de loadout automatique.

Identité : `cap_water_special_2` — `Voile aqueux` — élément Eau — `loadoutSlot:ultimate`, niveau requis **20** ; texte de description hérité « disponible au niveau 28 » conservé mot pour mot malgré cette contradiction. `targetScope:self`, zone 60 s, +100 Défense, statut 10 s authoré, `statusBehavior:while_inside`, persistance après rappel true. Icône `core:icon-skill-barrier-dome-01` et aura `pack:capture:sprite-status-energy-shield-01` inchangées. Pas de nouveaux binaires ni médias.

## Autorités et affichage

`Persistent Zone Runtime` lie déjà le statut de mode `while_inside` à l'instance de zone : son expiration effective est au moins celle de la zone, avec révocation immédiate à la sortie ou à sa disparition. Le réglage 10 secondes n'interrompt donc pas le bonus après 10 s lorsqu'on reste dans la zone. L'éditeur masque désormais **uniquement la saisie** de cette durée en mode « Actif uniquement dans la zone », affiche l'explication, et la révèle pour « À l'entrée ». Le champ et les données originales sont conservés pour la réversibilité des modes et l'export exact.

Le HUD d'états existant lit `status.sourceSkillId` et `presentationForSkill(...).icon` : un statut de zone doit donc reprendre l'icône de la capacité, sous la créature affectée. Le test du vrai chemin créé par le présent lot vérifie ce raccord et sa disparition après expiration. Aucun nouveau renderer concurrent.

## Ultime

La bibliothèque des capacités recharge ses entrées sur `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1` et les transferts canoniques. Le sélecteur « slot ultime » lit uniquement `configuredSkills` où `draft.definition.loadoutSlot=ultimate`. L'ajout du transfert auteur au catalogue vitrine rétablit l'offre de cet ultime, y compris après un redémarrage. Aucun équipement automatique n'est effectué sur les créatures existantes.

## Vérifications et limites

Tests TDD : conservation octet pour octet de l'export, ID/slot/propriétés, import/export, Combat Session -> statut de zone -> HUD icône source -> sortie/expiration, et Human Editor mode durée; bibliothèque 103 créatures, tests Firestorm sur Chromium. Le validateur de chaque capacité dépend du registre de statistiques du monde: si `defense` n'y est pas déclaré, la zone refuse correctement de lui appliquer le bonus plutôt que de créer une stat fictive.

La validation tactile sur un appareil physique reste distincte ; aucune valeur du fichier n'est modifiée silencieusement. Le dossier source de l'auteur n'est pas une nouvelle capacité codée en dur.
