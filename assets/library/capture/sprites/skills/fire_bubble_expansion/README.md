# Bulle de feu expansive — Sprite FX Capture

- **Asset ID** : `pack:capture:sprite-fire-bubble-expansion-01`.
- **Visuel** : bulle/sphère de flammes s’agrandissant autour du lanceur, puis se dissipant. À afficher autour de la créature ; aucune collision, aucun dégât et aucun ciblage ne sont codés dans ce pack.
- **Images** : 20 frames WebP transparentes 512×512, avec PNG RGBA haute fidélité correspondants ; une séquence horizontale WebP optimisée 20×384 = 7680×384.
- **Cadence indicative** : 80 ms/frame, `once`, soit 1,6 s, réglable dans l’éditeur et indépendante du moteur de règles.
- **Source** : 1402×1122, 5×4 cases ≈ 280 pixels ; les frames 512 sont **redimensionnées**, pas générées nativement en 512.
- **Classification** : `capture / sprites / skills`; la capacité de toucher une cible au sol ou en l’air doit être réglée par les règles de combat, jamais déduite du visuel.
- **Compatibilité** : format identique aux packs Capture existants (atlas horizontal WebP + manifest JSON), pas de modification du code de combat.