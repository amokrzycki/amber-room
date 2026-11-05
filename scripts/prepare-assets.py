"""Deterministic normalization and original numeral artwork; no generative substitutes."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
import shutil
root=Path('src/assets')
for path in list((root/'symbols').glob('*.png'))+list((root/'art').glob('*.png')):
    source=root/'sources'/path.name
    if not source.exists(): shutil.copyfile(path,source)
    im=Image.open(source).convert('RGBA')
    if path.parent.name=='symbols':
        bounds=im.getbbox(); obj=im.crop(bounds);obj.thumbnail((410,410),Image.Resampling.LANCZOS)
        out=Image.new('RGBA',(512,512));out.alpha_composite(obj,((512-obj.width)//2,(512-obj.height)//2));out.save(path)
    elif path.stem=='salon-base': im.convert('RGB').resize((1600,900),Image.Resampling.LANCZOS).save(path)
    else:
        im.thumbnail((800,800),Image.Resampling.LANCZOS);im.save(path)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
for name in ['seven','wild']:
    im=Image.new('RGBA',(512,512));d=ImageDraw.Draw(im)
    d.rounded_rectangle((65,50,447,462),45,fill='#421226',outline='#d8af55',width=9)
    f=ImageFont.truetype(font,340 if name=='seven' else 290)
    d.text((256,225 if name=='seven' else 200),'7',font=f,anchor='mm',fill='#f22d40',stroke_width=7,stroke_fill='#ffcf7a')
    if name=='wild':d.text((256,385),'WILD',font=ImageFont.truetype(font,65),anchor='mm',fill='#fff2cc',stroke_width=3,stroke_fill='#6d1628')
    im.save(root/'symbols'/f'{name}.png')
# Contact sheet at actual symbol scale on dark/light fields.
sheet=Image.new('RGB',(6*180,360),'#171214')
for i,name in enumerate(['cherry','lemon','plum','melon','seven','wild']):
    im=Image.open(root/'symbols'/f'{name}.png');im.thumbnail((156,156))
    sheet.paste(im,(i*180+12,12),im);ImageDraw.Draw(sheet).rectangle((i*180,180,i*180+180,360),fill='#fff2cc');sheet.paste(im,(i*180+12,192),im)
evidence=Path('docs/evidence')
evidence.mkdir(parents=True,exist_ok=True)
sheet.save(evidence/'asset-contact.png')
