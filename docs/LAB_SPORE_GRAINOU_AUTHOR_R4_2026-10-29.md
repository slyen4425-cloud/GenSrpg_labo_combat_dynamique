# Labo Combat — Spore soporifique r2 et Grainou r4 (29 octobre 2026)

## Périmètre / origine
Remplacement strict des **deux** transferts auteur de ce tour sur les mêmes entrées canoniques du showcase, sans nouvelle compétence ni nouvel ID. Archives exactes et non modifiables :
- `gensrpg-capture-skill-Spore_soporifique(1).json` : 3271 octets, SHA-256 `45deeb29b981dd33d54b378b09a619d9efeb7ef8d9804b72a8a45550594b0a63`, conservé sous `data/capture/source-exports/gensrpg-capture-skill-Spore_soporifique-2026-10-29-r2.json`.
- `gensrpg-capture-creature-crea_nat_1(3).json` : 4839 octets, SHA-256 `56af0e17f4aad906429bb25ed86330ef75c5b576dda1a367d739e4840e23fa9e`, conservé sous `data/capture/source-exports/gensrpg-capture-creature-crea_nat_1-2026-10-29-r4.json`.
- Base gh-pages `4c98f881939a6ec66922370bd380d0d21109dd30`, global-assets `2bdc782aa256271f5dc4675a4f6da65faf74073b` protégé inchangé.
- START `checkpoint/lab-start-spore-grainou-author-r4-2026-10-29` ; WORK `work/lab-spore-grainou-author-r4-2026-10-29`.

## Différences reconnues et exclusivement demandées
- La capacité `Spore_soporifique` conserve son attaque projectile à vague expansive (3 → 65 %, épaisseur 6 %), son statut **stun time_ms 10000 ms** et son visuel Z de sommeil. Le sprite projectile change de `pack:capture:sprite-fire-bubble-expansion-01` vers le visuel source `pack:capture:sprite-spores-expansives-projectile-sphere-02` (sphère expansive naturelle), déjà présent dans global-assets.
- Grainou `crea_nat_1` conserve capacités, slots et paramètres, Spore reste en slot 3. Sa défense devient **5 charges** (contre 2 sur la version r3) et `presentation.visual.dodge` désigne le sprite `pack:capture:sprite-fleur-defense-01` à scale 1,5, durée 1800 ms, offsets 0/0. Le `presentation.version` devient 3 comme dans l'export auteur.
- Source skill et fiche creature importés **tels quels**, non normalisés à l'écriture. Les anciennes archives `Spore 2026-10-28` et `Grainou r3` restent byte-exact. Le registre skill/creature existant et les assets globaux restent inchangés (une seule autorité active par ID).
- Le Sommeil permanent jusqu'à réception d'un dégât n'est **pas** inclus dans ces exports : le fichier auteur configure explicitement `stun time_ms 10000`. Ne pas modifier cette intention ni l'annoncer comme livrée.

## Tests et livraison
- Sentinelle TDD RED (branche, commit `46839704`) sur absence des archives r2/r4, nouveaux médias et défense.
- Nouveau test d'import vrai / SHA256 / fichier actif intégralement identique / unicité / préservation des archives historiques.
- Adaptation des tests historiques à leur provenance, sans effacer leurs assertions ; sentinelle Chromium réelle sur l'éditeur, charges et visuel/durée de défense.
- CI Foundation + Chromium sur SHA exact avant GREEN ; checkpoint de fin, publication PR vers gh-pages et Pages SUCCESS ; vérification tactile Android distincte.
