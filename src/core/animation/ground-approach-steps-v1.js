// Animation Core owns each grounded attack step; Creature Profile owns count and amplitude.
// Does not change CombatRuntime travelMs, contact time, distance or collision authority.
function number(value, field, {min=-Infinity,max=Infinity}={}) {
  if(typeof value!=="number"||!Number.isFinite(value)||value<min||value>max)
    throw new RangeError("groundApproach."+field+" must be finite in range");
  return value;
}
export function groundApproachLocomotionFromProfileV1(locomotion) {
  const config=locomotion?.groundApproach??null;
  if(!config)return locomotion;
  if(typeof config!=="object"||Array.isArray(config))
    throw new TypeError("groundApproach must be a profile object");
  const allowed=new Set(["steps","liftY","liftScaleX","liftScaleY","landScaleX",
    "landScaleY","rotateDeg","footfallIntensity","liftEasing","landEasing"]);
  for(const key of Object.keys(config))
    if(!allowed.has(key))throw new TypeError("unknown groundApproach field: "+key);
  const steps=number(config.steps,"steps",{min:1,max:12});
  if(!Number.isInteger(steps))throw new RangeError("groundApproach.steps must be an integer");
  const liftY=number(config.liftY,"liftY",{min:-100,max:0});
  const liftScaleX=number(config.liftScaleX,"liftScaleX",{min:0.5,max:1.5});
  const liftScaleY=number(config.liftScaleY,"liftScaleY",{min:0.5,max:1.5});
  const landScaleX=number(config.landScaleX,"landScaleX",{min:0.5,max:1.5});
  const landScaleY=number(config.landScaleY,"landScaleY",{min:0.5,max:1.5});
  const rotateDeg=number(config.rotateDeg,"rotateDeg",{min:0,max:20});
  const intensity=number(config.footfallIntensity,"footfallIntensity",{min:0.01,max:3});
  const liftEasing=config.liftEasing??"ease-out";
  const landEasing=config.landEasing??"ease-in";
  if(typeof liftEasing!=="string"||!liftEasing.trim()||typeof landEasing!=="string"||!landEasing.trim())
    throw new TypeError("groundApproach easing must be a nonempty string");
  const phases=[],contacts=[];
  for(let index=0;index<steps;index++){
    const liftAt=(index+0.5)/steps;
    const landAt=(index+1)/steps;
    phases.push(Object.freeze({
      label:"approach-step-"+(index+1)+"-lift",at:liftAt,translateY:liftY,
      rotateDeg:rotateDeg*(index%2===0?1:-1),
      scaleX:liftScaleX,scaleY:liftScaleY,easing:liftEasing
    }));
    phases.push(Object.freeze({
      label:"approach-step-"+(index+1)+"-land",at:landAt,translateY:0,
      rotateDeg:0,scaleX:landScaleX,scaleY:landScaleY,easing:landEasing
    }));
    contacts.push(Object.freeze({at:landAt,intensity}));
  }
  return Object.freeze({
    ...locomotion, phases:Object.freeze(phases),contacts:Object.freeze(contacts)
  });
}
