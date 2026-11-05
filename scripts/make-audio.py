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

# Phase 3: one damped wood/metal voice, without scales or casino fanfares.
mechanical = {'press': .075, 'reels': .8, 'stop-a': .12, 'stop-b': .13,
              'stop-c': .14, 'payout-tick': .07, 'payout-end': .22,
              'win-small': .4, 'win-big': .65, 'win-jackpot': .85}
for name, duration in mechanical.items():
    rng = random.Random(20261105 + sum(map(ord, name)))
    samples = []
    low = 0.
    for i in range(int(sr * duration)):
        t = i / sr
        low += .2 * (rng.uniform(-1, 1) - low)
        if name == 'reels':
            # 24 evenly spaced detents in one loop; pitch/gain follow the reel lifecycle.
            pulse = (t % (duration / 24)) / (duration / 24)
            value = .12 * low + .055 * math.sin(2 * math.pi * pulse) * math.exp(-pulse * 5)
        elif name == 'press' or name.startswith('stop'):
            body = 135 if name == 'press' else 170 + 8 * 'abc'.index(name[-1])
            value = (.8 * low + .24 * math.sin(2 * math.pi * body * t)
                     + .08 * math.sin(2 * math.pi * 437 * t)) * math.exp(-t * 48)
        else:
            hits = 3 if name == 'win-jackpot' else 2 if name == 'win-big' else 1
            value = 0.
            for hit in range(hits):
                age = t - hit * .12
                if age >= 0:
                    value += .12 * sum(math.sin(2 * math.pi * f * age) * math.exp(-age * decay)
                                       for f, decay in [(660, 18), (937, 26), (1561, 38)])
        edge = 1 if name == 'reels' else max(0, min(1, t / .002, (duration - t) / .012))
        samples.append(int(max(-.6, min(.6, value * edge)) * 32767))
    with wave.open(str(out / f'{name}.wav'), 'wb') as w:
        w.setparams((1, 2, sr, 0, 'NONE', 'not compressed'))
        w.writeframes(struct.pack('<' + 'h' * len(samples), *samples))
print('mechanical voices: deterministic, damped, peak ceiling -4.4 dBFS')
