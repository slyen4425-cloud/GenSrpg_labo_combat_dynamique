# Golem moussu — Mouvement + attaque DOS, 12 frames (21 octobre 2026)

## Décision et validation auteur

- Le Golem moussu en vue joueur/dos est basé sur l'image officielle fournie par l'auteur.
- Après correction, **attaque DOS visuellement validée** le 21 octobre 2026 (buste relevé, pattes avant frappant le sol sans translation).
- **Mouvement DOS accepté pour essai en jeu seulement** ; auteur sceptique, une correction peut être demandée après le test. Ne pas attribuer de validation artistique définitive au mouvement.
- Les animations de face déjà publiées et les trois images `runtime/` restent inchangées.

## Source, vérifications et destination

- Source ZIP créée depuis la conversation : `GOLEM_MOUSSU_DOS_12_COURSE_ATTAQUE_PREVIEW.zip`.
- ZIP attendu dans la branche de lot sous `_incoming/GOLEM_MOUSSU_DOS_12_COURSE_ATTAQUE_PREVIEW.zip`.
- Empreinte SHA256 exacte : `e8045798cfaa6c8b1eb73b09687e8fb4792d8536387de407bf8c89fdc6433155`.
- Archive source réelle inspectée avant import : 36 entrées, CRC valide ; 24 PNG RGBA 512×512, 12 distincts par action, marges alpha d'au moins **70 px**.
- Mouvement : **12 frames, 90 ms / frame, boucle**.
- Attaque : **12 frames, 110 ms / frame, lecture unique**.
- Deux atlas WebP sprite-strip 4608×384 (12 cases 384×384), deux GIF previews, deux WebP animés transparents, deux planches de contrôle et deux manifestes.
- Destination canonique : `assets/library/capture/creatures/golem_moussu/animations/{movement,attack}/dos/`.
- Identifiants réservés :
  - `pack:capture:creature-golem-moussu-movement-dos-12-v1`
  - `pack:capture:creature-golem-moussu-attack-dos-12-v1`

## Gouvernance

- Propriétaire : bibliothèque visuelle globale / Asset Input ; **aucun changement de moteur ou de fiche combat**.
- Base officielle vérifiée avant chantier : `global-assets@73532470b2429222ec10a178146b8f941be7b648`.
- Checkpoint départ : `checkpoint/global-assets-start-golem-moussu-dos12-2026-10-21`.
- Branche isolée : `work/global-assets-golem-moussu-dos12-2026-10-21`.
- Import : `scripts/import_golem_moussu_dos12.py`.
- Tests générés après présence des médias : `tests/unit/golem-moussu-dos12-assets.test.mjs` depuis `scripts/golem-moussu-dos12.test.template.mjs`.
- Workflow : `.github/workflows/import-golem-moussu-dos12.yml`.
- Protections : `main`, `Zombicide-40k`, `assets/library/capture/creatures/golem_moussu/runtime/**`, versions face, autres créatures, moteur combat et éditeur.
- Autorisé : nouveaux médias `animations/{movement,attack}/dos/**`, catalogue unique, documents et fichiers propres à ce lot.

## Gates — ne pas déclarer GREEN sans preuve

1. ZIP réellement committé sur la branche de lot ; SHA256 source et CRC contrôlés.
2. Import des 24 PNG non remplacés, vérification des SHA et des marges, des deux atlases et des previews.
3. Catalogue unique sans doublons ; incréments précis : **199 → 201 assets**, **106 → 108 sprites**, **30 → 32 créatures** (si aucune autre mise à jour concurrente).
4. Vérification des nouveaux assets réels et de l'absence de modification des modèles de base.
5. Sentinelle et `npm run ci` sur le commit d'import, CI GitHub verte, revue finale du diff et de la branche.
6. Publication `global-assets` par fast-forward seulement si la branche est compatible et les contrôles verts.
7. Checkpoint GREEN **technique** distinct de la validation en jeu de la course.
8. Le catalogage seul ne prouve pas que la fiche combat est configurée pour jouer les animations automatiquement.

**État initial : transfert ZIP en attente**, workflow et outillage GitHub préparés sur branche distincte. La publication officielle doit être vérifiée après réception physique des médias.
