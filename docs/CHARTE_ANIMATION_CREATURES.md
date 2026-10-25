# CHARTE ANIMATION — CRÉATURES MONSTER CAPTURE
Version de travail — 2026-10-25. Complément à `docs/LAB_CHARTE.md`, sans modifier le moteur.

## Priorité et livrables
Fidélité au modèle > biomécanique et lisibilité du mouvement > continuité > qualité technique > intégration. Première pose conforme au modèle sauf validation contraire. Même vue, anatomie, palette, motifs, proportions et ancrage. Une pose est redessinée anatomiquement, jamais simulée par simple translation/rotation/déformation de l'image entière.

Livrer des frames PNG RGBA réellement transparentes, 512 × 512 sauf demande contraire, marges suffisantes, aucune coupe, aucun chevauchement, aucun damier peint, aucun numéro ni interface dans les sprites. Le nombre de frames dépend du mouvement : 8 peuvent suffire pour une course stylisée lisible, 12 ou plus si la complexité le demande. Produire planche ordonnée, vraie preview GIF/WebP obtenue à partir des frames finales, vérifier la transition dernière → première. Ne jamais confondre une bande de vignettes avec une preview animée. Découpe/ZIP/atlas seulement après validation artistique. En correction ciblée, ne pas régénérer les poses déjà approuvées.

## Méthode anatomique obligatoire
1. Identifier membres, articulations, appuis, centre de masse, direction, vue et appendices.
2. Choisir la locomotion selon morphologie, vitesse et terrain.
3. Dessiner les poses de contact, charge/compression, propulsion, suspension si elle existe, réception, récupération.
4. Positionner les pieds selon les contacts au sol : un pied en appui ne glisse pas arbitrairement. Éviter membres inversés, pattes qui traversent le corps, membres qui apparaissent/disparaissent.
5. Dessiner les intermédiaires en respectant les trajectoires d'arcs et la conservation des volumes.
6. Animer les appendices avec retard (follow-through) : queue, oreilles, ailes, antennes, crinière.
7. Contrôler l'ordre des appuis et la silhouette à vitesse réelle, puis image par image et au raccord.

## Quadrupède
**Marche :** succession des appuis décalés, généralement sans phase de suspension; bassin et épaules oscillent légèrement, pieds d'appui stables. **Trot :** alternance des paires diagonales (avant gauche + arrière droit, puis inverse), rebond modéré. **Galop :** appuis arrière et avant non simultanés, extension/compression du dos et une ou deux suspensions selon le type. Pour les carnivores, un galop rotatoire peut comporter deux suspensions. **Bond stylisé :** arrière-train se comprime → pattes arrière propulsent → corps s'étend → suspension → antérieurs réceptionnent → compression. Ne pas appliquer le même ordre d'appui à toutes les espèces.

**Exemple GenSrpG — course magique bondissante validée en intention (8 poses) :**
1 appui/équilibre ; 2 compression et regroupement ; 3 poussée arrière ; 4 extension et décollage ; 5 suspension ; 6 antérieurs avancés ; 7 réception et amorti ; 8 récupération avant nouveau cycle. La queue massive suit avec un léger retard, sans téléportation. La preview du 25 octobre a reçu une validation de mouvement, mais **le nettoyage des artefacts et la validation technique restent en attente**.

## Bipède humanoïde
**Marche :** contact → abaissement/absorption du poids (down) → passage de la jambe libre (passing) → point haut (up), puis miroir de l'autre jambe. Bassin pivote/oscille subtilement, bras en opposition naturelle, tête relativement stable. **Course :** appui/impact → amorti → poussée → phase aérienne → réception opposée; foulée plus ample, inclinaison et rebond adaptés. Ne jamais laisser les deux pieds collés au sol durant une course sautée, ni faire glisser le pied d'appui.

## Bipède animal / dinosaure théropode
Même logique de contacts alternés, mais anatomie différente : hanche dominante, membre postérieur propulseur, cheville/métatarse et posture digitigrade selon modèle; tronc incliné, tête stabilisée, longue queue contrebalance la masse et les variations de tangage. Ne pas copier une marche humaine ni traîner automatiquement la queue. Un dinosaure quadrupède (sauropode, cératopsien) relève du profil quadrupède massif, avec inertie et appuis adaptés.

## Rampant, serpent, limace, chenille
**Serpent :** une onde de courbure se propage du tronc vers la queue; contacts et poussées cohérents avec le sol. Variantes : ondulation latérale, progression rectiligne, concertina (ancrage/repli/extension), déplacement latéral sidewinding. **Limace :** onde de contractions sous le pied ventral, tête plus stable. **Chenille :** alternance ancrage arrière/avant et contraction-élongation des segments. Pas de translation d'une silhouette inchangée présentée comme une reptation.

## Insecte à six pattes / arachnide
**Insecte rapide :** démarche en deux trépieds alternés : (avant gauche + milieu droit + arrière gauche) puis (avant droit + milieu gauche + arrière droit). **Lent :** séquence métachronale, une patte après l'autre ou groupes décalés; à vitesse intermédiaire démarche tétrapode possible. Conserver six membres lisibles, ordre d'occlusion stable, antennes et abdomen en retard. **Arachnide :** huit pattes, ne pas appliquer mécaniquement le trépied des hexapodes; construire une séquence d'appuis adaptée à l'espèce et à la vue.

## Oiseau / créature ailée
**Vol battu :** aile déployée au battement descendant (production de portance et, selon l'espèce, propulsion), remontée avec configuration adaptée (souvent flexion partielle), transitions aux extrêmes; ailes gauche/droite coordonnées, plumes suivent avec retard. Corps et queue stabilisent l'assiette; amplitude de tête limitée. **Vol plané :** ailes maintenues avec corrections subtiles, pas de battement inventé. **Décollage :** préparation, impulsion des pattes, battements amples, prise d'altitude. **Course au sol :** profil bipède avien et ailes secondaires. Ne pas substituer un simple déplacement vertical de la créature à un vrai vol.

## Poisson / dauphin / créature aquatique
**Poisson :** ondulation latérale croissante vers la nageoire caudale, tête relativement stable, nageoires pectorales stabilisatrices. **Dauphin/cétacé :** battement vertical de la queue avec flexion corporelle cohérente, non une ondulation latérale de poisson. **Serpent marin :** onde latérale propagée; distinguer les morphologies. Préserver le volume, les appendices et la continuité du raccord.

## Créature massive, golem, volante sans ailes
**Massif :** anticipation plus longue, compression limitée par matériau, appuis lourds et amortis, inertie des appendices. **Flottant :** dérive verticale lente et contrôlée, appendices en déphasage, sans fausse course de pattes. Un golem quadrupède garde les contacts d'un quadrupède mais avec timing plus lourd.

## Attaque pour toutes morphologies
Pose modèle → anticipation → propulsion/offensive → impact lisible → récupération → retour exact à la posture normale. Éviter que l'attaque modifie le nombre de membres, les motifs ou l'orientation imposée. Respecter appuis et transfert de masse.

## Nettoyage et tests de livraison
- Examiner chaque frame sur fonds noir, blanc et damier d'éditeur (jamais intégré au PNG).
- Supprimer particules errantes, bavures, halos carrés, résidus de numéros et UI, pixels isolés, duplications de pattes; préserver les lueurs voulues de la créature.
- Vérifier alpha réel, cadrage, marges, tailles identiques, centre d'ancrage, intégrité du corps.
- Jouer la preview à vitesse cible puis au ralenti, vérifier que les appuis, queue, oreilles et dernière→première sont continus.
- Ne pas qualifier de « nettoyé » un simple masquage global qui rogne des détails.
- Validation artistique distincte de validation technique et de publication GitHub.

## Références consultées (25 octobre 2026)
- Quadrupèdes, différents galops et séquences d'appuis : https://www.animatornotebook.com/learn/quadrupeds-gaits
- Bipède, poses contact/down/passing/high : https://www.linkedin.com/learning/2d-animation-walk-cycles-basics/the-poses-contact-down-passing-and-high-point
- Insectes, démarche trépied : https://genent.cals.ncsu.edu/bug-bytes/thorax/locomotion/
- Étude locomotion hexapode : https://pmc.ncbi.nlm.nih.gov/articles/PMC12187426/
- Modes de locomotion des serpents : https://pubmed.ncbi.nlm.nih.gov/32271916/
- Smithsonian, mouvements des serpents : https://www.nationalzoo.si.edu/news/news/how-do-snakes-move-without-legs

**Statut :** document de référence ajouté sur branche de travail; ne vaut pas validation GREEN ni publication sur main.
