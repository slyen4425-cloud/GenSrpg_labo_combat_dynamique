from pathlib import Path
import argparse
import hashlib
import json
from io import BytesIO
from PIL import Image, ImageDraw
import numpy as np

SOURCE_SHA256 = '8a1b0ded3ed0604bd54ee01c9ea50ca5974da28b1ce1692159de481bfbed11e0'
SOURCE_FILE = 'assets/library/capture/sprites/source/impact_elemental_source_01.png'
FAMILIES = [
    ('blade', 'lame', 0, 176, (0, 0, 249, 55)),
    ('physical', 'coup', 218, 398, (0, 218, 342, 270)),
    ('electric', 'electrique', 436, 619, (0, 436, 184, 485)),
    ('water', 'eau', 655, 817, (0, 655, 103, 702)),
    ('nature', 'plante', 855, 983, (0, 855, 239, 902)),
]

def partition_seams(alpha, family):
    height, width = alpha.shape
    paths = []
    for boundary in range(192, width, 192):
        xs = np.arange(boundary-88, boundary+89)
        energy = (alpha[:,xs].astype(float)/255)**2*100
        energy += ((xs-boundary)/88)**2*.002
        # The third electric flash's centre is near the right of its nominal
        # cell. Keep that observed centre in frame 3, rather than assigning it
        # to the adjacent low-energy corridor.
        if family == 'electric' and boundary == 576:
            energy[110:170,xs < 596] = np.inf
        cost=energy[0].copy()
        history=np.zeros((height,len(xs)),dtype=np.int16)
        for y in range(1,height):
            choices=[]
            for shift in range(-3,4):
                prev=np.full(len(xs),np.inf)
                for k in range(len(xs)):
                    if 0 <= k+shift < len(xs):
                        prev[k]=cost[k+shift]+abs(shift)*.005
                choices.append(prev)
            choices=np.array(choices)
            pick=np.argmin(choices,axis=0)
            history[y]=pick-3
            cost=energy[y]+choices[pick,np.arange(len(xs))]
        k=int(np.argmin(cost))
        path=[int(xs[k])]
        for y in range(height-1,0,-1):
            k+=int(history[y,k]);path.append(int(xs[k]))
        paths.append(path[::-1])
    return np.array(paths,dtype=int)

def extract(source, root):
    source = Path(source)
    root = Path(root)
    if hashlib.sha256(source.read_bytes()).hexdigest() != SOURCE_SHA256:
        raise ValueError('Unexpected artistic source; review the extraction grid first')
    image = Image.open(source)
    if image.size != (1536, 1024) or image.mode != 'RGBA':
        raise ValueError('Expected original 1536 x 1024 RGBA source')
    source_target = root / SOURCE_FILE
    source_target.parent.mkdir(parents=True, exist_ok=True)
    source_target.write_bytes(source.read_bytes())
    manifest = {
        'version': 1,
        'role': 'source-extraction-provenance-only',
        'source': {'file': SOURCE_FILE, 'sha256': SOURCE_SHA256, 'width': 1536, 'height': 1024, 'mode': 'RGBA'},
        'frameSize': [400, 400],
        'pixelPolicy': 'Copy original RGBA pixels without resampling or color removal. Captions and overlaid title rectangles excluded; seven alpha-minimum seams preserve diagonal artwork crossing the nominal columns.',
        'knownSourceLimits': 'The original sheet overlays headings on a few cells; covered artwork is unavailable and is not invented. Cell boundaries are those of the supplied eight-column sheet.',
        'families': [],
    }
    for name, source_name, top, bottom, title in FAMILIES:
        folder = Path('assets/library/capture/sprites/impacts') / name
        frames_path = root / folder / 'frames'
        atlas_path = root / folder / 'atlases' / f'sprite_impact_{name}_atlas_01.webp'
        frames_path.mkdir(parents=True, exist_ok=True)
        atlas_path.parent.mkdir(parents=True, exist_ok=True)
        atlas = Image.new('RGBA', (3200, 400), (0, 0, 0, 0))
        row=image.crop((0,top,1536,bottom))
        x0,y0,x1,y1=title
        ImageDraw.Draw(row).rectangle((x0,y0-top,x1-1,y1-top-1),fill=(0,0,0,0))
        pixels=np.array(row)
        seams=partition_seams(pixels[:,:,3],name)
        family = {'assetId': f'pack:capture:sprite-impact-{name}-01', 'sourceLabel': source_name,
                  'sourceRow': [top, bottom], 'excludedTitle': list(title), 'frameMs': 45,
                  'atlas': atlas_path.relative_to(root).as_posix(), 'seams': seams.tolist(), 'frames': []}
        for index in range(8):
            frame_pixels=np.zeros((400,400,4),dtype=np.uint8)
            origin=index*192-104
            y_offset=272-row.height
            for y in range(row.height):
                left=0 if index==0 else int(seams[index-1,y])
                right=1536 if index==7 else int(seams[index,y])
                if not (0 <= left-origin < right-origin <= 400):
                    raise ValueError('Insufficient frame padding')
                frame_pixels[y+y_offset,left-origin:right-origin]=pixels[y,left:right]
            frame=Image.fromarray(frame_pixels,'RGBA')
            file = frames_path / f'sprite_impact_{name}_{index+1:02d}.png'
            frame.save(file, optimize=True)
            # paste rather than alpha-composite preserves original straight alpha
            atlas.paste(frame, (index * 400, 0))
            family['frames'].append({'index': index+1, 'file': file.relative_to(root).as_posix(),
                                      'sourceOrigin': [origin,top], 'offset': [0,y_offset],
                                      'sha256': hashlib.sha256(file.read_bytes()).hexdigest()})
        encoded = BytesIO()
        atlas.save(encoded, 'WEBP', lossless=True, exact=True, method=6)
        atlas_path.write_bytes(encoded.getvalue())
        family['atlasSha256'] = hashlib.sha256(atlas_path.read_bytes()).hexdigest()
        manifest['families'].append(family)
    path = root / 'assets/library/capture/sprites/source/impact_elemental_extraction_v1.json'
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
    return manifest

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source')
    parser.add_argument('root')
    args = parser.parse_args()
    result = extract(args.source, args.root)
    print(json.dumps({'families': len(result['families']), 'pngFrames': 40, 'webpAtlases': 5, 'sourcePng': 1}))
