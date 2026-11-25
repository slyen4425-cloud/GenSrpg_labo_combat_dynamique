import {createCaptureUniverseDatabaseStoreV1} from '../../../contracts/capture-universe-database-store-v1.js';
import {normalizeCaptureCreatureTransferV1,CAPTURE_CREATURE_TRANSFER_V1_SCHEMA} from '../../../contracts/capture-creature-transfer-v1.js';
import {normalizeCaptureSkillTransferV1,CAPTURE_SKILL_TRANSFER_V1_SCHEMA} from '../../../contracts/capture-skill-transfer-v1.js';

// The currently selected project's database owns both its species and its rules.
// Each consumer receives exactly the transfer shapes used by native encounters.
export function readCaptureUniverseEncounterSourceV1({storage,universeId}={}){
  const project=createCaptureUniverseDatabaseStoreV1({storage}).load(universeId);
  if(!project)throw new Error('Catalogue de cet univers absent du Labo Combat');
  const {creatures,skills,statRegistry,progressionRules}=project.database;
  const creatureTransfers=creatures.map(record=>normalizeCaptureCreatureTransferV1({
    schema:CAPTURE_CREATURE_TRANSFER_V1_SCHEMA,version:1,...record
  },statRegistry));
  const skillTransfers=skills.map(draft=>normalizeCaptureSkillTransferV1({
    schema:CAPTURE_SKILL_TRANSFER_V1_SCHEMA,version:1,draft
  }));
  return Object.freeze({statRegistry,progressionRules,
    ...(project.database.metadata?.combatHudLayoutV1===undefined?{}:{hudLayout:project.database.metadata.combatHudLayoutV1}),
    creatureTransfers:Object.freeze(creatureTransfers),skillTransfers:Object.freeze(skillTransfers)});
}
