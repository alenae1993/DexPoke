"""Extrae del mod de Tabletop Simulator "[1.4a]Pokémon: Leyendas de Sinnoh" (Workshop 2880340481)
el mapa hexagonal, los tokens, los escondites y los datos de todas las cartas.

Uso:  python extraer_mod.py "C:\\Users\\GOLDEN GAMERS\\Documents\\My Games\\Tabletop Simulator\\Mods\\Workshop\\2880340481.json" salida
Genera en la carpeta de salida: mod.json (datos), urls.json (URL de cada imagen) y names.json
(URL -> nombre del archivo en Mods\\Images, sin extensión; en este mod todas son .png).
"""
import json,collections,re,sys,os
SRC=sys.argv[1] if len(sys.argv)>1 else '2880340481.json'
OUT=sys.argv[2] if len(sys.argv)>2 else '.'
os.makedirs(OUT,exist_ok=True)
d=json.load(open(SRC,encoding='utf-8'))
OS=d['ObjectStates']
URLS={}
def U(u,tag):
    if u: URLS.setdefault(u.strip(),tag); return u.strip()
def cellof(T): return (round(T['posX']/1.65),round(T['posZ']/0.95263))
def hexc(c): return '#%02x%02x%02x'%tuple(int(round(c[k]*255)) for k in 'rgb')
# ---- tiles
cells=collections.defaultdict(list)
TEX={}
for o in OS:
    if o['Name']!='Custom_Model':continue
    T=o['Transform'];c=o['ColorDiffuse']
    tex=U(o['CustomMesh']['DiffuseURL'],'tex')
    if tex not in TEX: TEX[tex]=len(TEX)
    cells[cellof(T)].append(dict(y=T['posY'],s=T['scaleY'],col=hexc(c),a=round(c.get('a',1),2),t=TEX[tex]))
hexes=[]
for (c,r),L in cells.items():
    L.sort(key=lambda t:t['y'])
    dw=L[-1]['y']<0
    bodies=[t for t in L if t['s']>=1]
    base=0.59 if not dw else -3.63
    ytop=max(t['y'] for t in bodies) if bodies else L[0]['y']
    lvl=round((ytop-base)/0.78)
    top=L[-1]; water=top['a']<0.9
    under=[t for t in L if t['a']>=0.9]
    h=dict(c=c,r=r,l=lvl,col=top['col'],t=top['t'])
    if water: h['w']=1; h['col2']=under[-1]['col'] if under else None
    if dw: h['dw']=1
    hexes.append(h)
# ---- tokens
BI={'Plains','Forest','Mountain','Ocean'};CL={'Cold','Temperate','Warm'}
TIER={'Weak Encounter Card':'W','Moderate Encounter Card':'M','Strong Encounter Card':'S','Legendary Encounter Card':'L','Distortion Encounter Card':'D'}
def tagsum(tags):
    tags=tags or []
    r={}
    b=[x for x in tags if x in BI]; cl=[x for x in tags if x in CL]; ti=[TIER[x] for x in tags if x in TIER]
    if b:r['b']=b[0]
    if cl:r['k']=cl[0]
    if ti:r['tier']=ti[0]
    return r
tokens=[]
for o in OS:
    n=o['Name'];T=o['Transform']
    if n=='Custom_Token' or (n=='Custom_Tile' and any(k in (o.get('Tags') or []) for k in ('Distortion Gate','Campaign Token','Blessing Token','Held Item','Follower Token','Ball Token','Music Cartridge'))) or n=='Custom_Tile':
        img=U(o['CustomImage']['ImageURL'],'tok'); sec=U(o['CustomImage'].get('ImageSecondaryURL',''),'tok')
        x=dict(kind=n,n=o['Nickname'],tags=o.get('Tags',[]),gm=o.get('GMNotes',''),img=img,img2=sec,x=T['posX'],y=T['posY'],z=T['posZ'],s=T['scaleX'],cell=cellof(T),**tagsum(o.get('Tags')))
        tokens.append(x)
    elif n=='CardCustom':
        cd=list(o['CustomDeck'].values())[0]
        tokens.append(dict(kind=n,n=o['Nickname'],tags=o.get('Tags',[]),img=U(cd['FaceURL'],'card'),img2=U(cd['BackURL'],'card'),nw=cd['NumWidth'],nh=cd['NumHeight'],cid=o['CardID'],x=T['posX'],y=T['posY'],z=T['posZ'],cell=cellof(T),**tagsum(o.get('Tags'))))
    elif n=='Figurine_Custom':
        tokens.append(dict(kind=n,n=o['Nickname'],tags=o.get('Tags',[]),gm=o.get('GMNotes',''),img=U(o['CustomImage']['ImageURL'],'fig'),img2=U(o['CustomImage'].get('ImageSecondaryURL',''),'fig'),x=T['posX'],z=T['posZ'],**tagsum(o.get('Tags'))))
    elif n=='Custom_Board':
        tokens.append(dict(kind=n,n=o['Nickname'],img=U(o['CustomImage']['ImageURL'],'board')))
    elif n in('Infinite_Bag','Custom_Model_Bag'):
        for co in o.get('ContainedObjects',[]):
            ci=co.get('CustomImage') or {}
            cm=co.get('CustomMesh') or {}
            tokens.append(dict(kind='bag:'+co['Name'],bag=o['Nickname'],n=co['Nickname'],tags=co.get('Tags',[]),gm=co.get('GMNotes',''),img=U(ci.get('ImageURL',''),'bag'),img2=U(ci.get('ImageSecondaryURL',''),'bag'),tex=U(cm.get('DiffuseURL',''),'bag')))
# ---- decks
def lua(s):
    r={}
    for m in re.finditer(r'^(\w+)\s*=\s*(.+)$',s,re.M):
        k,v=m.group(1),m.group(2).strip()
        if v=='nil':v=None
        elif v.startswith('{'):v=re.findall(r'"([^"]*)"',v)
        elif v.startswith('"'):v=v.strip('"')
        else:
            try:v=int(v)
            except:pass
        r[k]=v
    return r
decks=[]
for o in OS:
    if o['Name']!='Deck':continue
    CDs={k:dict(face=U(v['FaceURL'],'deck'),back=U(v['BackURL'],'deck'),w=v['NumWidth'],h=v['NumHeight'],uniqueBack=v.get('UniqueBack',False)) for k,v in o['CustomDeck'].items()}
    cards=[]
    for co in o['ContainedObjects']:
        e=dict(n=co['Nickname'],tags=[x for x in co.get('Tags',[]) if x not in('_TAGGED','Expansion: Unknown','Pokemon Card')],gm=co.get('GMNotes',''),cid=co['CardID'],desc=co.get('Description',''))
        e.update(tagsum(co.get('Tags')))
        if co.get('LuaScript'): e['d']=lua(co['LuaScript'])
        cards.append(e)
    decks.append(dict(n=o['Nickname'],tags=o.get('Tags'),sheets=CDs,cards=cards))
U(d.get('TableURL'),'table')
json.dump(dict(hexes=hexes,tex={v:k for k,v in TEX.items()},tokens=tokens,decks=decks),open(os.path.join(OUT,'mod.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=0)
json.dump(URLS,open(os.path.join(OUT,'urls.json'),'w'),indent=0)
def cache_name(u):  # nombre con que TTS guarda la imagen en Mods\Images (se le agrega .png)
    s=re.sub(r'[^A-Za-z0-9]','',u); m=re.search(r'ugc(\d+)(\w+)$',s)
    return 'httpssteamusercontentaakamaihdnetugc'+m.group(1)+m.group(2) if m else s
json.dump({u:cache_name(u) for u in URLS},open(os.path.join(OUT,'names.json'),'w'),indent=0)
print(len(hexes),len(tokens),len(decks),len(URLS),collections.Counter(URLS.values()))
