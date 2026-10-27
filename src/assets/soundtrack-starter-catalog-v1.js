// Public metadata only. Source MP3s remain in the PRIVATE GenSrpG_audio_prive archive.
// Never embed a private URL or binary in the published combat laboratory.
export const SOUNDTRACK_STARTER_BATTLE_IDS_V1 = Object.freeze(
  Array.from({length:6},(_,i)=>`gensrpg:music:combat:battle-${String(i+1).padStart(2,"0")}`)
);
export const SOUNDTRACK_STARTER_EXPLORATION_IDS_V1 = Object.freeze(
  Array.from({length:4},(_,i)=>`gensrpg:music:exploration:${String(i+1).padStart(2,"0")}`)
);
export const SOUNDTRACK_STARTER_CATALOG_V1 = Object.freeze({
  schema:"gensrpg-soundtrack-catalog-v1",
  version:1,
  assets:Object.freeze([
    ...SOUNDTRACK_STARTER_BATTLE_IDS_V1.map((assetId,i)=>Object.freeze({
      assetId,kind:"music",origin:"app",title:`Battle_${i+1}`,
      licenseRef:"author-declared-suno-paid-rights-2026-10-22"
    })),
    ...SOUNDTRACK_STARTER_EXPLORATION_IDS_V1.map((assetId,i)=>Object.freeze({
      assetId,kind:"music",origin:"app",title:`Exploration_${i+1}`
    }))
  ])
});
export const SOUNDTRACK_STARTER_CAPTURE_PROJECT_V1 = Object.freeze({
  schema:"gensrpg-soundtrack-project-v1",
  version:1,
  projectId:"capture-demo",
  scenes:Object.freeze({
    "capture:combat:normal":Object.freeze({
      music:Object.freeze({
        tracks:SOUNDTRACK_STARTER_BATTLE_IDS_V1,
        order:"shuffle",volume:0.65,fadeMs:700,repeat:true
      }),
      ambience:null
    })
  })
});
