# Krakenor — kit de combat expérimental (9 novembre 2026)

## Gouvernance et état
- Créature du catalogue historique : `crea_mer_3` — Krakenor (Eau), profil offensif et faible à l'Électricité. Aucun remplacement silencieux des compétences historiques de `crea_mer_3`.
- Source unique : Labo Combat `main`. Point de départ : `4f62760a7ef41dca573b86fe2245ef1451f70f0d` ; checkpoint `checkpoint/lab-start-krakenor-skill-kit-2026-11-09`.
- **Statut : PROTOTYPE NON GREEN, non activé dans le catalogue Showcase et non assigné à la créature.** Les cinq exports sont importables séparément pour des tests manuels. Ne pas les annoncer visibles ou validés sur le site avant raccord réel, CI et validation utilisateur.
- Visuels FACE / DOS, sprites de capacités et positions de tentacules : **en attente des images fournies par l'auteur**. Les assetIds existants du Labo sont réutilisés provisoirement dans les exports pour permettre l'édition, sans nouvelle bibliothèque média ni fausse intégration. Les contrôles de parité téléphone/PC et les deux vues restent obligatoires.
- Nouvelle mécanique **de composition**, pas de nouveau propriétaire moteur : jetons `krakenor-pression` et `krakenor-encre`, seuil, délai et consommation sont des contrats déjà natifs. Pas de faux aveuglement, projection d'étourdissement ou déplacement forcé inventé.

## Capacités et budgets de départ

| Niveau | ID | Nom | Coût | CD | Effet |
|---|---|---|---:|---:|---|
| 1 | `krakenor-perle-pression` | Perle de pression | 3 | 15 s | Projectile 10 Eau et +1 Pression |
| 5 | `krakenor-etau-tentaculaire` | Étau tentaculaire | 5 | 23 s | Contact 15 Eau + immobilisation 1,4 s +1 Pression |
| 10 | `krakenor-voile-encre` | Voile d'encre | 6 | 30 s | 8 Eau à chaque ennemi actif, -20 % dégâts sortants pendant 7 s |
| 15 | `krakenor-bulle-implosion` | Bulle d'implosion | 7 | 34 s | Après 2,2 s : 18 Eau, -2 énergie, +1 Pression à la cible |
| 20 | `krakenor-abysse-huit-bras` | Abysse aux huit bras | 10 | 1/combat | 27 Eau à tous ennemis actifs ; +6 Eau par Pression consommée, au plus 3, contre la cible ; si 2+ charges, immobilise 1,4 s |

## Jetons / équilibre
- **Pression abyssale** : max 3 charges, 20 s. La troisième charge déclenche automatiquement +8 Eau et 1,1 s d'immobilisation sur la cible, puis remet le compteur à zéro.
- **Encre abyssale** : max 1 charge, 8,5 s. À l'application, -20 % de dégâts sortants pendant 7 s, sans cumul. **Ne réduit pas la précision : le moteur ne possède pas d'effet de précision exploitable ici.**
- Comparaison de calibration : Goutte vive (niveau 1) = 10 dégâts / 3 énergie / 15 s ; Morsure de marée (niveau 5) = 20 dégâts +3 énergie drainée / 5 énergie / 20 s ; Jet pressurisé (niveau 10) = 25 dégâts / 6 énergie / 30 s. Krakenor sacrifie des dégâts instantanés pour la combinaison et le contrôle.
- Respecter esquive, immunité, dommages réels, état souterrain, KO, rappels, 1v1 et 2v2. Tester notamment : trois charges, expiration, consommation à zéro, réserve, changement de cible, bulle après rappel, zone multi-cibles, dégâts sous réduction et ralentissement à -20 %.
- Le graphisme de `ground_mine` est un signal de gameplay natif provisoire ; remplacer par une bulle d'implosion dédiée une fois l'animation approuvée.

## Conditions d'activation (à venir, après visuels utilisateur)
1. Valider les faces/dos et les FX en prévisualisation animée, ainsi que les ancrages de tentacules.
2. Enregistrer une seule fois les médias dans le catalogue canonique, et relier les jetons au HUD avec des icônes propres.
3. Enregistrer les cinq IDs dans **la liste existante** `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1` et créer/valider le transfert auteur de `crea_mer_3` avec les 5 slots. Ne pas créer de second bestiaire.
4. Tests d'import/round-trip, de simulation réelle (1v1 et 2v2), CI SHA exact, navigateur et publication Pages `main`, puis validation mobile par l'auteur.

