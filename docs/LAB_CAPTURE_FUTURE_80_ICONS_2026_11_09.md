# Capture — 80 icônes de futures compétences (2 séries de 40)

Les 80 illustrations des deux séries ont été validées par l'auteur le 8 novembre 2026. Les deux ZIP maîtres sont déjà présents dans la seule bibliothèque canonique, global-assets. Ce lot n'ajoute aucune compétence jouable et n'affecte aucun visuel aux compétences existantes.

**Sources archivées, vérifiées octet-à-octet et conservées intactes** :
- assets/library/capture/icons/skills/Monster_Capture_40_icones_futures_capacites.zip (SHA-256 2921d374bbe3f782f12115d4200f6c20623b563d4c1af5eb098297b20c3bf110)
- assets/library/capture/icons/skills/Monster_Capture_Serie_2_40_icones.zip (SHA-256 891dea383160d05424f569046e7414baf4a6638740f8dbbab473e55fd4460351)

**BASE** global-assets@453a6c6a8a666bbf80008fc1b3be1960dc4072fe. START checkpoint/lab-start-future-skill-icons-80-2026-11-09. WORK work/lab-future-skill-icons-80-2026-11-09.

L'importeur scripts/import_future_80_capture_icons_2026_11_09.py lit les ZIP existants, vérifie CRC/empreintes/IDs/dimensions puis crée uniquement les 80 WebP 128x128 au chemin canonique assets/library/capture/icons/skills/icon_skill_*.webp et 80 entrées dans data/assets/catalog/global-visual-assets.v1.json. Pas de duplication PNG des sources (elles sont déjà dans les ZIP), pas de remplacement d'anciennes images. Le manifeste de provenance capture_future_80_icons_2026_11_09.provenance.json renseigne les 80 SHA256/Git blobs et leurs noms/éléments.

**Tests** : sentinelle tests/unit/capture-future-80-icons-2026-11-09.test.mjs, CI complète sur fichiers réels, checkpoint GREEN, livraison fast-forward sous lease. Test navigateur et validation Android restent distincts.

**Autorité** : seule global-assets conserve les médias et le catalogue ; main garde l'éditeur, les règles et les pages. Aucune retouche de gh-pages, aucune attribution implicite par nom, aucune capacité ou statistique modifiée. Ne jamais déclarer le rendu en jeu validé sans vérification réelle.