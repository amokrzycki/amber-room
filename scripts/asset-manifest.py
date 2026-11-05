from PIL import Image
from pathlib import Path
import json,hashlib,wave
root=Path('src/assets');assets=[]
for path in sorted([*(root/'symbols').glob('*.png'),*(root/'art').glob('*.png'),*(root/'audio').glob('*.wav')]):
 generated=path.suffix=='.png' and path.stem not in ['seven','wild']
 a={'id':path.stem,'kind':'image' if path.suffix=='.png' else 'audio','path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'status':'prepared','verified_in_game':False,'creator_or_tool':'OpenAI image_gen' if generated else 'Original artwork / deterministic Python synthesis by Codex','license_or_generation_record':'docs/asset-generation.md' if generated else 'CC0-1.0, original project assets','source':f'src/assets/sources/{path.name}' if generated else 'scripts/prepare-assets.py' if path.suffix=='.png' else 'scripts/make-audio.py','modifications':'alpha bounding-box normalization, Lanczos resize' if generated else 'original authored asset'}
 if path.suffix=='.png':
  im=Image.open(path);a.update(width=im.width,height=im.height,alpha=im.mode=='RGBA' and im.getextrema()[3][0]<255,pivot='center',filtering='linear')
  if path.parent.name=='symbols': assert im.size==(512,512) and a['alpha'];assert im.getbbox()[0]>=45
 else:
  with wave.open(str(path)) as w:a.update(duration=w.getnframes()/w.getframerate(),sample_rate=w.getframerate(),channels=w.getnchannels(),loop=path.stem in ['reels','salon-ambience'],mix_checked=False)
 assets.append(a)
(root/'manifest.json').write_text(json.dumps({'schema_version':1,'assets':assets,'code_art':{'slot-cabinet':'src/view/SlotScene.ts','upgrade-variants':'src/view/SalonScene.ts'},'auditory_review':'pending human headphones/speakers'},ensure_ascii=False,indent=2))
print(len(assets),'runtime assets checked')
