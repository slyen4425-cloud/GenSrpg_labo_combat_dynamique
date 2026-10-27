# Capture — Choc venimeux, retrait des marqueurs et dégâts par charge (V1)

Date : 17 octobre 2026. Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Retour auteur et source du problème

Le fichier auteur `gensrpg-capture-skill-choc_venin.json` décrit **Choc venimeux** (niveau requis 5, électricité, coût énergie 4, projectile) avec un unique `consume_marker` visant `venin-static`, `count:"all"`, `minimum:1`, puis un enfant `damage.amount:10`. La description précise « 10 dégât par marqueur ». Pourtant le moteur consommait bien les charges mais traitait le sous-effet dégâts comme un montant global de 10, **indépendant du nombre réellement retiré**.

`Dard static` (`lib_paralyze`) pose ce même marqueur avec effet électrique périodique et K.O. à 20 charges. Son export du jour contient également son icône de compétence. L'identité du marqueur reste unique entre les deux compétences.

## Correction minimale et compatibilité

- Contrat autoritaire : `SkillEffectV1.consume_marker.perCharge` facultatif, booléen strict. Il n'est enregistré que lorsque `true`. Une définition plus ancienne qui n'a pas ce champ conserve ses effets **fixes** (10 reste 10 même si 5 charges sont consommées).
- Éditeur auteur : sous « Consommer des marqueurs », case **« Multiplier dégâts, soins et énergie par charge réellement retirée »**, qui se sauvegarde et se réexporte dans le même `SkillEffectV1`. Il n'existe pas de deuxième compteur/option cachée.
- `immediate-tactical-effects-v1.js` obtient `consumed.consumed` du propriétaire natif `consumeCaptureMarkerStacksV1`. Si `perCharge:true`, chaque sous-effet **numérique** dégâts, soin, restauration/drain d'énergie reçoit `amount × consumed.consumed`. Un effet de statut, K.O., nettoyage ou dissipation n'est pas répété. Les dégâts regroupés passent **une seule fois** par `computeCombatDamageV1` puis `applyCombatDamageV1` : résistances, boucliers, immunités, éléments et attribution de K.O. gardent leurs propriétaires natifs.
- Nouveau preset actif `choc_venin` : **identique à l'export auteur sauf `perCharge:true`**, demandé expressément par le descriptif « par marqueur » et ce retour. L'export auteur original est archivé inchangé en `data/capture/source-exports/gensrpg-capture-skill-choc_venin-2026-10-17.json` (SHA-256 `98dd680fc2ed374b5d319321bd83f4d16d5ac1c8e3b5b7b7636d8aa2832fe8ac`). Aucune modification implicite du coût, du type, de l'élément, de l'image, de la durée, des cibles ni du minimum.
- `lib_paralyze` a été remplacé sous **son ID existant**, depuis le nouvel export auteur (SHA-256 `6771adb3fc61790ba5d86c5f607e7d62669d02be44b8a8ccd222c606dac6f522`) : l'icône `pack:capture:icon-skill-dard-electrique-01` est restaurée, la définition du marqueur `venin-static` et toutes les autres propriétés restent identiques.
- Seuil : `minimum:1` sur le fichier fourni signifie que Choc peut retirer de 1 à N charges. **Ce n'est pas un minimum de 5**. Avec 5 charges il en retire 5 et demande 50 dégâts de base ; avec 3 charges, 30 ; avec 0, aucun. Si l'auteur souhaite que la compétence **ne fonctionne qu'à partir de 5**, le champ « Charges nécessaires pour activer l'effet » devra passer à 5, ce qui est une autre décision auteur.
- Les 30 presets de compétences Capture sont chargés par le **catalogue canonique** sans chargement parallèle, duplication de Dard ni ajout à un loadout de créature.

## Tests et publication

- Reproduction RED dans `tests/integration/capture-marker-consume-per-charge-v1.test.mjs` ; cas 0/1/3/5 charges, vrai compteur retiré, consommation maximale/partielle, minimum atomique, montant fixe sans opt-in, calcul une seule fois et bouclier/immunité. Archivage source octet pour octet et import/export canonique.
- Test de non-régression du nouveau fichier Dard et son hash, 30 enregistrements catalogue sans duplication ; vrai Chromium `capture-creature-library-smoke.mjs` recharge Choc, vérifie la case cochée et intercepte le vrai export de capacité pour lire `perCharge:true`. Conserve les 103 créatures et le chemin Dard/marqueurs.
- Run Laboratory CI de code `39036667364`, SHA `519d0d2ba6d9bf0baee2fd4543a42b3200ae7153` : **cinq jobs SUCCESS** (Foundation + quatre tests navigateurs). Pour clôturer : refaire CI sur le SHA documentaire final, créer checkpoint GREEN exact et promouvoir vers `gh-pages` par fast-forward sous lease ; vérifier le déploiement GitHub Pages. Les essais de rendu tactile Android relèvent de la validation auteur.

## Périmètre protégé

Aucun changement d'Animation Core, FX Core, moteur de présence, collision, statuts périodiques, seuil K.O. de Venin, statistiques, icônes/assets binaires, autres modes, `main`, `global-assets` ou `Zombicide-40k`.
