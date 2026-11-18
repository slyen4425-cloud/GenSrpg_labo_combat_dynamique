# Creature movement sounds — canonical Showcase composition (18 November 2026)

## Why the first audio PR cannot be merged
PR #342 directly changed seven author-exported Showcase JSON creature transfers. These transfers carry precise author history, and 17 real foundation regression tests guard their exact contents. The failures were not flaky; the PR is NOT GREEN and must remain unmerged.

## Author-approved sounds, existing catalog only
- Insect-wing flight (Éphémus and Foudrillon): `gensrpg:sound:effect-79dd62d8` — existing insect/moth flapping sound. Foudrillon's original looping configuration survives untouched.
- Broad winged flight (Veldra, Ailevent, Dracendre): `gensrpg:sound:genrpg-pack2-9320854b` — existing air-movement sound, *not* mislabeled as a genuine avian wing recording.
- Quadrupeds (Loup, Nat 1, Kitsune lunaire): `gensrpg:sound:sanctuary-367a77dd` — existing soft clothing/fur rustle selected by the author.
- Biped, massive, serpentine remain unchanged: aquatics, spirits, spiders and terrestrial animals are not interchangeable.

## Single authority
`src/catalogs/capture-showcase-creature-movement-audio-v1.js` is the sole **Showcase authoring preset** registry. It is invoked one time when the official Showcase creature transfers hydrate into the existing editor state; that state still owns `presentation.audio.movement`, the ONLY value read by both 1v1 and 2v2 combat. No runtime fallback, second sound engine, duplicate MP3, extra creature ID, or changes to custom-file imports. The 22 historical author exports are byte-identical, and a user can edit all six creature sound roles afterward as before.

## Risk gates
- Existing author-immutability tests must pass unmodified.
- New test verifies all 22 canonical IDs, eight approved assignments, exact preservation of Foudrillon, same seven reassigned without modifying other fields, three packaged sound IDs tagged for movement, real editor hydration linkage and same 1v1/2v2 runtime owner.
- Current start: `main@49bc9a4282d9b7978fe0d1dd09056fa94af9a3ed` (PR #341 merged). `checkpoint/lab-start-creature-audio-styles-publish-20261118`, temporary `work/lab-creature-audio-styles-publish-20261118`. PR #342 original remains as failed RED history; publication through new PR only after 5/5 CI and browser green on exact SHA, checkpoint, protected merge, then main CI/Pages exact SHA.

## Cache compatibility
HTML, entry and editor retain their preexisting one ESM revision, as required by five historical chain sentinels. The new audio preset module is served at its new unique URL. Check the live Pages served SHA rather than replacing legacy revision tokens piecemeal.
