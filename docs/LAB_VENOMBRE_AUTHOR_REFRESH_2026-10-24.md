# Venombre — export auteur du 24 octobre 2026

## Périmètre de travail
- Demande : importer le transfert `gensrpg-capture-creature-crea_tox_2.json` fourni par l'auteur en préservant tous les autres réglages.
- Base : `gh-pages@eac4dd3977951a524a0788b7fa49114f94bcca73` ; checkpoint START : `checkpoint/lab-start-venombre-author-2026-10-24` ; branche `work/lab-venombre-author-2026-10-24`.
- Unique autorité active : `data/capture/showcase/crea_tox_2.capture-creature-transfer-v1.json` (`crea_tox_2`). Ancien export source-exports du 23 octobre conservé en provenance historique.
- Fichiers autorisés : transfert Showcase Venombre, nouvelle archive d'export datée dans source-exports (sans autorité runtime), tests unitaires sentinelles (import Showcase, rechargement des valeurs, source historique), journal et présent document. Aucun moteur / éditeur / compétence / asset / répertoire GenSrpG central modifié.
- Comparaison avec l'ancien : joueur `displayScale 1.6→1.4`, `position.y 40→10`; adversaire `displayScale 1→0.8`, `position.y 0→40`; compétences équipées `[cap_poison_atk_1,cap_poison_atk_2,cap_poison_atk_3,cap_poison_atk_4,null]` → `[cap_poison_atk_2,cap_poison_atk_3,cap_poison_special_2,cap_poison_atk_6,null]`.
- Intacts : ID, PV, statistiques, résistances, sprites et icône, socket bouche face/dos, profil `biped`, audio, combat dodge et progression. Les capacités référencées sont dans le catalogue natif Capture existant ; aucun nouvel ID ni duplication.
- Risques : le test historique du 23 octobre compare une source immuable à la version Showcase ; adapter la sentinelle pour comparer toutes les propriétés sauf les nouveaux réglages explicitement approuvés. Vérifier la lecture effective par le Transfer Import et le loadout.
- GREEN requis : import validé par le contrat, comparaison exacte à l'export auteur, 4 nouveaux emplacements conformes, source historique inchangée, vrais presets liés, CI 5 jobs GREEN, checkpoint GREEN sur SHA puis merge `gh-pages`.
