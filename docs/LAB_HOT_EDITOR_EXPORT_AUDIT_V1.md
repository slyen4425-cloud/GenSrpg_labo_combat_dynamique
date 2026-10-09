# Audit — Onde régénérante, soin périodique absent de l'export

Date : 2026-10-09. Laboratoire autonome : `GenSrpg_labo_combat_dynamique`.

## Retour utilisateur

L'utilisateur signale avoir configuré un soin périodique (HoT), alors que le fichier joint `gensrpg-capture-skill-lib_aqua_heal(1).json`, installé comme preset Showcase dans le lot précédent, contient exactement `definition.effect.heal=0`, `definition.effects=[]`, `presentation=null`.

Ces valeurs prouvent ce que le fichier contient ; **elles ne permettent pas d'inférer que l'utilisateur n'a jamais configuré le soin**. Le transfert auteur doit rester exact. Le preset déjà publié `lib_aqua_heal` n'a pas été modifié dans ce lot.

## Base, périmètre, frontières

- Base publiée : `c631699d5d4e0de5a3fee27d59cb0576c10bc0ec`.
- Checkpoint de départ : `checkpoint/lab-start-hot-editor-export-audit-v1-2026-10-09`.
- Branche isolée : `work/lab-hot-editor-export-audit-v1-2026-10-09`.
- Périmètre effectif : `src/ui/capture-editor-human-v2.js` (retour d'export UI seulement), `tests/unit/capture-heal-export-warning-v1.test.mjs`, `tests/browser/capture-creature-library-smoke.mjs`, documentation.
- Propriétaires inchangés : champs `readHumanSkillEffectsV1` + `buildHumanSkillDraftV1` pour la saisie, `exportCaptureSkillTransferJsonV1` pour le transfert, `Combat Session` pour le soin réel. Aucun moteur de soins supplémentaire, aucune adaptation par ID, aucune modification des créatures, presets, cooldowns, UX de ciblage, assets ou sons.

## Audit causal

1. L'éditeur construit un effet de soin périodique depuis une ligne `kind=apply_status`, `status.kind=heal_over_time`, `status.amount`, `status.tickIntervalMs`, `status.durationMs`.
2. Son bouton `Exporter cette capacité` reconstruit la fiche **directement depuis les champs DOM courants**, avant de la sérialiser par le contrat canonique. Si les lignes sont présentes, leur contenu doit figurer sous `definition.effects`.
3. Test Chromium réel ajouté : sur la fiche `lib_aqua_heal`, ajout d'un effet `heal_over_time` de 7 PV toutes les 1,5 secondes pendant 6 secondes, puis clic `Mettre à jour` et clic `Exporter cette capacité` ; capture du vrai Blob JSON. **Résultat : valeurs 7, 1500 ms, 6000 ms, portée self et ID stable conservés**. Donc ce parcours ne reproduit pas de perte.
4. L'éditeur instancie `configuredSkills = new Map()` au montage ; cette bibliothèque active n'est pas un stockage persistant garanti à travers un rafraîchissement. La sauvegarde de session et l'export JSON ont des responsabilités distinctes. Il est donc possible de perdre un brouillon au changement de contexte/rechargement ; le parcours précis de l'utilisateur n'est pas connu.
5. **Cause historique non établie** : le fichier vide pourrait provenir d'une saisie avant les effets, d'une fiche rechargée/réinitialisée ou d'une autre action UI. Il est interdit de prétendre qu'un bug d'export des HoT a été reproduit.

## Correctif préventif vérifié

Lorsque la catégorie d'une fiche est `heal` mais qu'aucune récupération positive de PV n'existe dans `effect.heal`, `effects[].heal`, `effects[].apply_status(status.kind=heal_over_time)` ou `scheduled_effect` imbriqué, le bouton d'export affiche un avertissement explicite : `le fichier exporté ne restaurera aucun PV`.

- Le JSON **reste téléchargeable tel quel** : l'éditeur ne refuse pas un brouillon incomplet.
- L'avertissement ne calcule aucun soin, ne modifie aucun champ et n'introduit pas de deuxième propriétaire gameplay.
- Test navigateur : la fiche vide affiche bien l'avertissement ; après saisie et sauvegarde du HoT, l'export conserve les effets. Le précédent faux message de réussite sans avertissement est corrigé.

## Preuves TDD et sécurité

- Test de navigateur sur le trajet complet (ajout + update + export) : CI `37918935392` SUCCESS.
- Nouveau test RED sur avertissement : CI `37919156484` FAILURE attendu, export sans sentinelle de soin.
- Code UI + test Chromium amélioré : CI `37919247696` SUCCESS — **1312 / 1312 Node PASS, 0 FAIL** ; Chromium réel PASS, 103 créatures, `lib_aqua_heal` présent une fois, Jet pressurisé préservé, host présentation bloqué/suspendu testé.
- Aucun fichier média ajouté, aucun preset auteur modifié, aucun loadout changé, aucun effet inventé.
- Les commits de documentation finale, checkpoint GREEN et Pages sont validés séparément avant diffusion.

## À faire côté test utilisateur

Vérifier, sur une capacité choisie dans l'éditeur, qu'une ligne `Effets tactiques` contient `Buff / Debuff / Statut` avec `Soin périodique` et un montant/timing positif **juste avant d'exporter**. Si le fichier actuel est le seul export disponible, il ne contient pas les valeurs HoT d'origine et il n'est pas possible de retrouver leur montant/durée exacts dans ce fichier. La configuration peut être ressaisie, enregistrée et réexportée ; l'avertissement aidera à repérer une omission future.
