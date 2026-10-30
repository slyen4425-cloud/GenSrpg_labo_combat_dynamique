# Bestiaire — échange forcé de réserve ennemie (30-10-2026)

Signalement : Grainou → Ultime Liane venimeuse affichait « Effet non encore décrit : force_reserve_switch ».

Cause racine : le moteur de combat et le contrat reconnaissaient déjà cet effet. Le projecteur unique des descriptions pour joueurs, `src/ui/capture-skill-explanation-v1.js`, ignorait encore ce cas et affichait son nom interne.

Correction : la description générique explique qu'une créature ennemie ciblée dans la réserve entre en combat à la place de son allié actif **uniquement si l'attaque touche**. Les 2 charges Graine sansue et les 2 charges Poison restent détaillées par les mécanismes existants, sans changer leurs règles.

Propriétaires protégés : `src/contracts/skill-definition.js`, `src/contracts/skill-effect-v1.js`, `src/core/combat/roster-session.js`, données auteur, médias, main et autres laboratoires. Aucune copie des règles dans le Bestiaire.

Test RED puis GREEN : `tests/unit/capture-bestiary-reserve-switch-prose-2026-10-30.test.mjs` (vraie compétence et vrai loadout de Grainou), `tests/browser/capture-bestiary-smoke.mjs` (clic réel Grainou puis ultime, présence icône Ronce et marqueurs, régression Venombre), tests natifs de rappel forcé existants.

Base `gh-pages@5bb179a7096443a2c18b3e5e33fe36c13e11a287`.
START `checkpoint/lab-start-bestiary-force-reserve-prose-2026-10-30`.
WORK `work/lab-bestiary-reserve-text-20261030`.
GREEN conditionnel aux tests Foundation + 4 Chromium, puis PR et Pages sur SHA fusionné ; test utilisateur Android distinct.
