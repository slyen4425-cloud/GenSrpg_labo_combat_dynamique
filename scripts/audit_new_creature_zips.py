from pathlib import Path
import zipfile,json
names=["CREATURE_VIOLETTE_DOS_COURSE_ATTAQUE_8F_VALIDEES.zip","creature_violette_attaque_course_8frames.zip","monster_capture_attaque_venin_sans_effet.zip","scorpion_2_animations_validees_8_frames.zip","scorpion_course_corrigee_8_frames_depot.zip"]
out=[]
for name in names:
 p=Path(name)
 if not p.exists():continue
 with zipfile.ZipFile(p) as z:
  files=z.namelist()
  out.append({"archive":name,"file_count":len(files),"files":files[:90]})
Path("SCORPION_SOURCE_AUDIT.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(out,ensure_ascii=False,indent=2))
