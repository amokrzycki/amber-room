"""Original deterministic PCM synthesis, seed 20261104, C major motifs."""
import math,random,wave,struct
from pathlib import Path
random.seed(20261104);out=Path('src/assets/audio');sr=22050
spec={'press':.075,'reels':.8,'stop-a':.12,'stop-b':.13,'stop-c':.14,'payout-tick':.07,'payout-end':.32,'win-small':.65,'win-big':1.8,'win-jackpot':3.3,'salon-ambience':2.,'salon-cheer':1.25,'salon-toast':.5}
notes=[523.251,659.255,783.991,1046.502,1318.51,1567.98]
for name,duration in spec.items():
 data=[];n=int(sr*duration)
 for i in range(n):
  t=i/sr;edge=min(1,t/.008,(duration-t)/.025);noise=random.uniform(-1,1)
  if name=='reels':value=.085*(math.sin(2*math.pi*70*t)+.25*noise)*(.65+.35*math.sin(2*math.pi*25*t)**2)
  elif name=='salon-ambience':value=.025*(math.sin(2*math.pi*110*t)+.3*math.sin(2*math.pi*165*t)+.15*noise)
  elif name=='press' or name.startswith('stop'):value=(.22*noise+.35*math.sin(2*math.pi*(180-80*t)*t))*math.exp(-35*t)
  elif name=='salon-cheer':
   # Original wordless chorus-like rising resonances; no sampled human recording.
   value=.07*sum(math.sin(2*math.pi*f*t+2*math.sin(2*math.pi*3*t)) for f in [261.6,329.6,392])*math.sin(math.pi*t/duration)**2
  else:
   speed=.13 if name.startswith('win') else .09
   k=min(5,int(t/speed));f=notes[k];a=t%speed
   value=.22*(math.sin(2*math.pi*f*t)+.25*math.sin(2*math.pi*2*f*t))*math.exp(-a*14)
   if name=='payout-tick':value*=math.exp(-35*t)
  data.append(max(-.8,min(.8,value*max(0,edge))))
 with wave.open(str(out/f'{name}.wav'),'wb') as w:w.setparams((1,2,sr,0,'NONE','not compressed'));w.writeframes(struct.pack('<'+'h'*n,*[int(x*32767) for x in data]))
print('created',len(spec),'original WAVs; peaks below -1.9dBFS')
