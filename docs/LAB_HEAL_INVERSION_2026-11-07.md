# Labo Combat — Statut générique « Soin inversé » (candidat 7 novembre 2026)

## Autorité et portée
Le contrat canonique est `StatusEffectV1` (`heal_inversion`, `polarity: detrimental`, `percent` 0–100, durée et empilement natifs). Une compétence applique ce statut par `SkillEffectV1.apply_status`. `applyCombatHealV1` dans Combat Damage Application traite les soins directs, périodiques et le vol de vie ; toute perte de PV passe par `applyCombatDamageV1`. Aucun second calcul de PV, de timer ou d'éditeur.

## Configuration dans l'éditeur
Créer une capacité de type Buff / Debuff. Ajouter un effet **Buff / Debuff / Statut**, choisir la portée puis dans **Type de statut** choisir **Soin inversé — convertir les soins en dégâts**. Configurer **Part des soins convertie en dégâts (%)** (de 0 à 100, défaut 100), **Durée**, **Stacking** et éventuellement le visuel. La polarité négative est fixée automatiquement. Enregistrer la capacité. Le même statut est disponible dans les effets de zone.

## Règles V1
- Exemple : une cible à 100/300 PV tente de se soigner de 40 PV. À 25 % : 10 dégâts puis 30 PV rendus, net +20. À 50 % : 20 dégâts puis 20 PV, net 0. À 100 % : 40 dégâts, aucun soin, net −40.
- Les bonus/malus des soins reçus ajustent d'abord la quantité, puis la conversion intervient **avant** le plafond de PV. Même une tentative de soin à PV max peut déclencher des dégâts.
- Taux des statuts actifs additionnés puis plafonnés à 100 %, avec stacking natif ; dernière malédiction active créditée pour les dégâts. Durée et purification utilisent les autorités existantes.
- Les dégâts convertis passent par boucliers, immunités, malus de dégâts reçus et règles KO. Aucune réflexion récursive, aucune fausse attaque projectile. Un KO causé par la conversion ne peut être relevé par la portion de soin restante du même événement.
- Résultat `convertedRequested`, `convertedDamage`, `absorbedByShield`, `immuneDamage`, `applied` (soin effectif) et `netHpDelta`. Un soin direct ou du drain de vie émet `heal-converted` si conversion ; le soin positif éventuel émet `heal`. Les HoT utilisent l'horloge native.

## Validation et restrictions
Nouveau test Core et test Chromium réel sur l'éditeur (PC/paysage mobile). Un lot/une branche/un checkpoint ; une seule CI complète après vérification du diff, aucun média copié et aucune modification de GenSrpg/Exploration. Publication de main et du site distincte après GREEN et preuve HTTPS, validation smartphone auteur séparée.
