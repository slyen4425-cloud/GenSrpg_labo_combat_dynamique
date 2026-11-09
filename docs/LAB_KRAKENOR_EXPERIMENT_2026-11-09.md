## Correctif d'intégration — 9 novembre 2026
- Base `main@673956799cea61e5e24ce3f2f4bbac1d25244c04`, checkpoint `checkpoint/lab-start-krakenor-metadata-resolver-fix-2026-11-09`.
- Échec navigateur expliqué : la métadonnée du dossier approuvé `pieuvre.meta.json` ne déclare pas `displayScale.player` requis par l'ancien adaptateur facultatif `CAPTURE_CREATURE_VISUAL_BINDINGS_V1`. Ne pas inventer une échelle dans `global-assets`, ne pas créer de deuxième résolveur. Le transfert créature `crea_mer_3` référence déjà directement FACE/DOS/portrait via `presentation.visual` et ses propres `viewOverrides` normalisés : retrait **uniquement** du mapping additionnel inutile. Les trois images restent les mêmes et ne sont ni copiées ni modifiées.
- Test natif de batch : initialiser d'abord les espèces canoniques natives, car les transferts Showcase existants contiennent des évolutions vers des espèces non présentes dans un Map vide. Le vrai éditeur initialise ce registre avant les Showcase ; reproduire cet ordre dans la sentinelle.
- CI/Pages à revérifier SHA exact, puis essai graphique PC et Android requis.

## Correctif de régression CI — 9 novembre 2026
- Défaillances constatées sur `main@1b8cd7ba6294bc0cc3af059ec2d3e751d6fa279a` : deux tests anciens comptaient exactement 15 créatures (Krakenor est la 16e) ; un test nouveau invoquait `statRegistry` au lieu de `registry`. Les anciens contrôles sont prolongés à 16 sans retirer les sentinelles sur les 15 créatures historiques.
- En présence d'une erreur navigateur, le smoke affiche maintenant l'état d'erreur de l'éditeur (diagnostic seulement), sans masquer la cause ni augmenter les délais.
- Un test natif supplémentaire vérifie l'import des 5 capacités suivi du transfert Krakenor via `applyCaptureTransferBatchToEditorStateV1` sans deuxième autorité.
- START `main@1b8cd7ba6294bc0cc3af059ec2d3e751d6fa279a` ; checkpoint `checkpoint/lab-start-krakenor-ci-repair-2026-11-09` ; GREEN uniquement après CI/browser/Pages sur le SHA réparé.

# Krakenor — kit de combat expérimental (9 novembre 2026)

## Gouvernance et état
- Créature du catalogue historique : `crea_mer_3` — Krakenor (Eau), profil offensif et faible à l'Électricité. Aucun remplacement silencieux des compétences historiques de `crea_mer_3`.
- Source unique : Labo Combat `main`. Point de départ : `4f62760a7ef41dca573b86fe2245ef1451f70f0d` ; checkpoint `checkpoint/lab-start-krakenor-skill-kit-2026-11-09`.
- **Historique :** ces cinq transferts ont été enregistrés initialement comme prototypes inactifs. Leur activation est documentée ci-dessous. Ne pas assimiler l'enregistrement des fichiers à une validation de combat ou des médias finaux.
- Visuels FACE / DOS et portrait de la pieuvre validés et présents dans la bibliothèque. Les sprites de mouvement/attaque de la créature ne sont pas disponibles et ne sont pas nécessaires au raccord statique. Les FX des compétences restent provisoires.
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

## Ancienne liste de conditions du prototype — progression à vérifier
1. Vues FACE/DOS existantes validées et inspectées ; FX de compétences provisoires et ancrages à tester en combat.
2. Enregistrer une seule fois les médias dans le catalogue canonique, et relier les jetons au HUD avec des icônes propres.
3. Inscription des cinq IDs dans **la liste existante** `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1` et création du transfert auteur `crea_mer_3` avec les 5 slots, sans second bestiaire : réalisée dans le lot de raccord.
4. Tests d'import/round-trip, de simulation réelle (1v1 et 2v2), CI SHA exact, navigateur et publication Pages `main`, puis validation mobile par l'auteur.


---

## Mise à jour — 9 novembre 2026 : raccord statique à la bibliothèque

Le lot `krakenor-bind-pieuvre-icons` active dans le **catalogue Showcase canonique** les cinq compétences au format transfert et le transfert créature `crea_mer_3`. Les cinq compétences restent les mêmes que dans le prototype ; le lot remplace seulement les icônes et raccorde la fiche.
- Creature visuels **existants et inspectés** dans `global-assets` : `pack:capture:creature-pieuvre-opponent-01` (face), `pack:capture:creature-pieuvre-player-01` (dos), `pack:capture:creature-pieuvre-icon-01` (portrait), depuis `capture/creatures/pieuvre/runtime/`. La note « méduse » de l'utilisateur correspond aux médias rangés sous le nom **pieuvre**, vérifiés dans la bibliothèque. Aucun média copié dans `main`.
- **Pas d'animation créature ajoutée** : pas de `movement`, `movementBack`, `rangedAttack` ni `rangedAttackBack`. Animation de base du profil `serpentine` seulement et FX de compétence déjà existants, en attente des sprites auteurs.
- 5 icônes de compétences distinctes tirées des **80 nouveaux médias**, publiés le 9/11 et inutilisés par les autres capacités vitrine : `Cascade percutante`, `Harpon des marées`, `Brume du néant` (image d'encre uniquement, gameplay Eau), `Bulles captives` et `Spirale des abysses`.
- Les nouveaux jetons `krakenor-pression` et `krakenor-encre` réutilisent respectivement `Cascade percutante` et `Brume du néant` comme icône, aucun propriétaire marqueur bis. La mise à jour du token de cache du catalogue `global-assets` sur `main` évite l'ancien catalogue v60, sans dupliquer de fichiers.
- Pour l'équilibre de test : base `maxHp=180`, Défense 12, Eau 25, Vitesse 18 ; statistiques-source et résistances élémentaires historiques de `crea_mer_3` conservées (Eau, feu +35, eau +35, électricité -50). Elles pourront être rééquilibrées avec les essais 1v1/2v2.
- Point de départ `main@d539e43367a2c221bc183a5cb12c0a158524ad60` et checkpoint `checkpoint/lab-start-krakenor-bind-pieuvre-icons-2026-11-09`. Interdit de déclarer GREEN sans suite CI sur SHA exact et preuve de rendu réel mobile PC/Android. Unités et métadonnées sont des **tests techniques** et non une validation artistique des FX. GenSRPG n'est pas repinné par ce lot.
