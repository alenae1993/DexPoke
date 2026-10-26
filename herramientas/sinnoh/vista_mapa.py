"""Dibuja una vista previa del mapa hexagonal del mod.  Uso: python vista_mapa.py 2880340481.json mapa.png  (requiere Pillow)"""
import json,collections,math,sys
from PIL import Image,ImageDraw
d=json.load(open(sys.argv[1],encoding='utf-8'))
cm=[o for o in d['ObjectStates'] if o['Name']=='Custom_Model']
cells=collections.defaultdict(list)
for o in cm:
  T=o['Transform'];c=o['ColorDiffuse']
  cells[(round(T['posX']/1.65),round(T['posZ']/0.95263))].append((T['posY']+0.0*T['scaleY'],T['scaleY'],c,o['CustomMesh']['DiffuseURL'][-21:-1]))
S=14
img=Image.new('RGB',(1400,1000),'black');dr=ImageDraw.Draw(img)
for (c,r),L in cells.items():
  L.sort(key=lambda t:t[0]); y,sy,col,tex=L[-1]
  cx=700+c*1.65*S; cz=500-r*0.95263*S
  pts=[(cx+1.1*S*math.cos(math.radians(a)),cz+1.1*S*math.sin(math.radians(a))) for a in range(0,360,60)]
  rgb=tuple(int(col[k]*255) for k in 'rgb')
  dr.polygon(pts,fill=rgb,outline=(0,0,0))
  if tex!='0EB98FE18D328D774F63F4E87585A2ADBE3226DD'[-20:]: dr.text((cx-4,cz-5),tex[-1],fill='white')
img.save(sys.argv[2] if len(sys.argv)>2 else 'mapa.png')
