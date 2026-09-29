"""
Actualiza los datos de Mi Dex a partir de tu archivo de Power BI.

Uso (en la carpeta del proyecto):
    python herramientas/actualizar_datos.py "C:/ruta/a/Pokemon_BI.pbix"

Genera el archivo data.js en la carpeta principal. Después solo tienes que
subir ese data.js a GitHub y la app se actualiza sola en los teléfonos.

Requisitos (una sola vez):
    pip install pbixray pandas
"""
import csv, io, json, math, re, sys, urllib.request
from pathlib import Path

POKEAPI = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/"


def s(v):
    """Texto limpio o None."""
    if v is None:
        return None
    if isinstance(v, float) and math.isnan(v):
        return None
    v = str(v).strip()
    return None if v in ("", "<NA>", "nan", "None") else v


def num(v):
    v = s(v)
    if v is None:
        return None
    try:
        f = float(v)
        return int(f) if f == int(f) else f
    except ValueError:
        return v


def lst(v):
    v = s(v)
    return [x.strip() for x in v.split(",") if x.strip()] if v else []


def key(t):
    return re.sub(r"[^A-Z0-9]", "", (t or "").upper())


def pokeapi_csv(name):
    print(f"  descargando {name}.csv de PokeAPI...")
    with urllib.request.urlopen(POKEAPI + name + ".csv", timeout=60) as r:
        return list(csv.DictReader(io.StringIO(r.read().decode("utf-8"))))


# ---------- cambios de stats desde FunctionCode (ej. LowerUserDefSpDef1) ----------
WHO = ["PlusMinusUserAndAllies", "GroundedGrassBattlers", "GrassBattlers", "PoisonedTarget",
       "UserAndAllies", "Allies", "User", "Target"]
ST = [("MainStats", ["ATK", "DEF", "SPA", "SPD", "SPE"]), ("CriticalHitRate", ["CRIT"]),
      ("SpAtk", ["SPA"]), ("SpDef", ["SPD"]), ("Attack", ["ATK"]), ("Defense", ["DEF"]),
      ("Speed", ["SPE"]), ("Accuracy", ["ACC"]), ("Evasion", ["EVA"]), ("Atk", ["ATK"]),
      ("Def", ["DEF"]), ("Spd", ["SPE"]), ("Acc", ["ACC"]), ("Eva", ["EVA"])]


def parse_function_code(fc):
    out = []
    for m in re.finditer(r"(Raise|Lower)", fc):
        i = m.end()
        sign = 1 if m.group(1) == "Raise" else -1
        who = None
        for w in WHO:
            if fc.startswith(w, i):
                who, i = w, i + len(w)
                break
        if who is None:
            if re.search(r"(UserAddStockpile|UserConsumeBerry)$", fc[:m.start()]):
                who = "User"
            else:
                continue
        while True:
            stats = []
            while True:
                for tok, ss in ST:
                    if fc.startswith(tok, i):
                        stats += ss
                        i += len(tok)
                        break
                else:
                    break
            mm = re.match(r"(\d)(Or(\d))?", fc[i:])
            if not stats or not mm:
                break
            i += mm.end()
            note = ""
            if mm.group(3):
                rest = fc[i:]
                note = "o " + ("+" if sign > 0 else "-") + mm.group(3) + (
                    " con sol" if "InSun" in rest else " si es tipo Dragón" if "Dragon" in rest else "")
            for st in stats:
                out.append([who, st, sign * int(mm.group(1)), note])
            if not any(fc.startswith(tok, i) for tok, _ in ST):
                break
    return out


# ---------- Formas: megas, gigamax, regionales y otras (desde PokeAPI) ----------
REGION = {"alola": "Alola", "galar": "Galar", "hisui": "Hisui", "paldea": "Paldea"}
FORM_ES = {"White-Striped Form": "Forma Raya Blanca", "Blue-Striped Form": "Forma Raya Azul",
           "Red-Striped Form": "Forma Raya Roja", "Origin Forme": "Forma Origen", "Altered Forme": "Forma Modificada",
           "Therian Forme": "Forma Tótem", "Incarnate Forme": "Forma Avatar", "Female": "Hembra", "Male": "Macho",
           "Combat Breed": "Raza Combatiente", "Blaze Breed": "Raza Ardiente", "Aqua Breed": "Raza Acuática",
           "Average Size": "Tamaño Mediano", "Large Size": "Tamaño Grande", "Super Size": "Tamaño Enorme",
           "Small Size": "Tamaño Pequeño", "Crowned Sword": "Espada Suprema", "Crowned Shield": "Escudo Supremo",
           "Complete Forme": "Forma Completa", "10% Forme": "Forma 10%", "50% Forme": "Forma 50%",
           "Ice Rider": "Jinete Glacial", "Shadow Rider": "Jinete Espectral", "Eternamax": "Dinamax Infinito",
           "Hangry Mode": "Forma Voraz", "Noice Face": "Cara Deshielo", "Zen Mode": "Modo Daruma",
           "Primal Kyogre": "Kyogre Primigenio", "Primal Groudon": "Groudon Primigenio",
           "Attack Forme": "Forma Ataque", "Defense Forme": "Forma Defensa", "Speed Forme": "Forma Velocidad",
           "Sky Forme": "Forma Cielo", "Pirouette Forme": "Forma Danza", "Blade Forme": "Forma Filo",
           "Unbound": "Desatado", "Dusk Mane": "Melena Crepuscular", "Dawn Wings": "Alas del Alba", "Ultra": "Ultra",
           "Midnight Form": "Forma Nocturna", "Dusk Form": "Forma Crepuscular", "School Form": "Forma Banco",
           "Rapid Strike Style": "Estilo Fluido", "Low Key Form": "Forma Grave", "Terastal Form": "Forma Teracristal",
           "Stellar Form": "Forma Astral", "Wellspring Mask": "Máscara Fuente", "Hearthflame Mask": "Máscara Horno",
           "Cornerstone Mask": "Máscara Cimiento", "Family of Three": "Familia de Tres", "Roaming Form": "Forma Andante",
           "Chest Form": "Forma Cofre", "Three-Segment Form": "Forma Trinaria", "Hero Form": "Forma Heroica",
           "Bloodmoon": "Luna Carmesí", "Original Color": "Color Original",
           "Yellow Plumage": "Plumaje Amarillo", "Blue Plumage": "Plumaje Azul", "White Plumage": "Plumaje Blanco"}
SKIP = ("-totem", "-starter", "-cap", "pikachu-rock-star", "pikachu-belle", "pikachu-pop-star", "pikachu-phd",
        "pikachu-libre", "pikachu-cosplay")


def add_forms(P, moves, abil):
    print("Agregando megas, gigamax y formas (PokeAPI)...")
    pk = {r["id"]: r for r in pokeapi_csv("pokemon")}
    fo = {r["pokemon_id"]: r for r in pokeapi_csv("pokemon_forms") if r["is_default"] == "1"}
    fnames = {}
    for r in pokeapi_csv("pokemon_form_names"):
        fnames.setdefault(r["pokemon_form_id"], {})[r["local_language_id"]] = (r["form_name"], r["pokemon_name"])
    vg_gen = {r["id"]: int(r["generation_id"]) for r in pokeapi_csv("version_groups")}
    tipos = {r["id"]: r["identifier"].upper() for r in pokeapi_csv("types")}
    stats, types, abils = {}, {}, {}
    for r in pokeapi_csv("pokemon_stats"):
        stats.setdefault(r["pokemon_id"], {})[int(r["stat_id"])] = int(r["base_stat"])
    for r in pokeapi_csv("pokemon_types"):
        types.setdefault(r["pokemon_id"], []).append((int(r["slot"]), tipos[r["type_id"]]))
    ab_id = {r["id"]: key(r["identifier"]) for r in pokeapi_csv("abilities")}
    ab_names = {}
    for r in pokeapi_csv("ability_names"):
        ab_names.setdefault(ab_id.get(r["ability_id"]), {})[r["local_language_id"]] = r["name"]
    ab_text = {}
    for r in pokeapi_csv("ability_flavor_text"):
        if r["language_id"] == "7":
            ab_text[ab_id.get(r["ability_id"])] = " ".join(r["flavor_text"].split())  # queda el más reciente
    for r in pokeapi_csv("pokemon_abilities"):
        abils.setdefault(r["pokemon_id"], []).append((int(r["slot"]), r["is_hidden"] == "1", ab_id[r["ability_id"]]))
    move_id = {r["id"]: key(r["identifier"]) for r in pokeapi_csv("moves")}
    print("  (movimientos por forma: archivo grande, puede tardar un poco)")
    pm = {}
    for r in pokeapi_csv("pokemon_moves"):
        if int(r["pokemon_id"]) > 10000:
            pm.setdefault(r["pokemon_id"], []).append(r)

    base = {p["id"]: p for p in P}

    # Ajustes a filas del modelo (ver LEEME)
    for p in P:
        if p["c"] == "BASCULIN":  # tu fila era la Forma Raya Blanca (Gen 8); la base es la Raya Roja (Gen 5)
            p["g"], p["fn"] = 5, "Forma Raya Roja"
            ab = sorted(abils.get("550", []))
            p["a"] = [a for _, h, a in ab if not h]
            p["ha"] = [a for _, h, a in ab if h]
        if p["c"] == "GIRATINA":
            p["fn"] = "Forma Modificada"  # los stats del modelo son los de la Forma Modificada
        if p["c"] == "DIPPLIN" and p["st"][4] == 90:
            p["st"][4] = 80  # valor oficial
            p["b"] = sum(p["st"])

    def es_form_name(fid, en_name, ident, kind):
        es = (fnames.get(fid, {}).get("7") or ("", ""))[0]
        if es:
            return es
        m = re.search(r"-(alola|galar|hisui|paldea)", ident)
        if kind == "regional" and m:
            extra = re.search(r"\((.+)\)", en_name or "")
            return f"Forma de {REGION[m.group(1)]}" + (f" ({FORM_ES.get(extra.group(1), extra.group(1))})" if extra else "")
        if kind == "gmax":
            return "Gigamax"
        if kind == "mega":
            return (en_name or "").replace("Mega ", "Mega-")
        return FORM_ES.get(en_name, en_name)

    nuevos, vistos = [], {}
    for p in P:
        vistos.setdefault(p["id"], []).append((tuple(p["t"]), tuple(p["st"]), tuple(sorted(p["a"] + p["ha"]))))
    for pid, r in sorted(pk.items(), key=lambda x: int(x[0])):
        if int(pid) <= 10000:
            continue
        ident = r["identifier"]
        if any(x in ident for x in SKIP):
            continue
        sp = int(r["species_id"])
        b = base.get(sp)
        f = fo.get(pid)
        if not b or not f:
            continue
        kind = ("mega" if f["is_mega"] == "1" or "-primal" in ident else "gmax" if ident.endswith("-gmax") or "eternamax" in ident
                else "regional" if re.search(r"-(alola|galar|hisui|paldea)", ident) else "forma")
        st = [stats[pid][k] for k in range(1, 7)]
        tt = [t for _, t in sorted(types.get(pid, []))]
        ab = sorted(abils.get(pid, []))
        a = [x for _, h, x in ab if not h]
        ha = [x for _, h, x in ab if h]
        if not a and not ha:
            a, ha = b["a"], b["ha"]  # PokeAPI aún sin habilidad para esta forma nueva
        firma = (tuple(tt), tuple(st), tuple(sorted(a + ha)))
        if kind == "forma" and firma in vistos[sp]:
            continue  # formas solo de color (Minior, etc.)
        vistos[sp].append(firma)
        for x in a + ha:
            if x not in abil:
                n = ab_names.get(x, {})
                abil[x] = [n.get("7") or n.get("9") or x, ab_text.get(x), n.get("9")]
        en_fn, en_full = (fnames.get(f["id"], {}).get("9") or ("", ""))
        fn = es_form_name(f["id"], en_fn, ident, kind) or " / ".join(abil.get(x, [x])[0] or x for x in a)
        if kind == "mega":
            nombre = fn if fn.lower().startswith("mega") else f"Mega-{b['n']}"
        elif kind == "regional":
            nombre = f"{b['n']} de {REGION[re.search(r'-(alola|galar|hisui|paldea)', ident).group(1)]}"
        elif kind == "gmax":
            nombre = f"{b['n']} Gigamax"
        else:
            nombre = b["n"]
        # movimientos propios de la forma (último juego disponible); si no tiene, hereda los de la especie
        lv, tm, em = b["lv"], b["tm"], b["em"]
        code = lambda x: move_id.get(x["move_id"])
        rows = [x for x in pm.get(pid, []) if code(x) in moves]
        # último juego en que la forma aprende movimientos por nivel
        vgs = sorted({x["version_group_id"] for x in rows if x["pokemon_move_method_id"] == "1"},
                     key=lambda v: (vg_gen.get(v, 0), int(v)))
        if vgs and kind not in ("mega", "gmax"):  # megas y gigamax usan los movimientos de su especie
            rows = [x for x in rows if x["version_group_id"] == vgs[-1]]
            lv = sorted([[int(x["level"] or 0), code(x)] for x in rows if x["pokemon_move_method_id"] == "1"])
            tm = sorted({code(x) for x in rows if x["pokemon_move_method_id"] in ("3", "4")}) or b["tm"]
            em = sorted({code(x) for x in rows if x["pokemon_move_method_id"] == "2"})
        nuevos.append(dict(b, c=key(ident), n=nombre, fn=fn, fk=kind, fo=b["c"], im=int(pid), t=tt, st=st, b=sum(st),
                           a=a, ha=ha, lv=lv, tm=tm, em=em, ev=[], g=vg_gen.get(f["introduced_in_version_group_id"], b["g"]),
                           h=int(r["height"]) / 10, w=int(r["weight"]) / 10, ford=int(f["form_order"] or 0)))
    ESTILO = {"single-strike": "Estilo Brusco", "rapid-strike": "Estilo Fluido"}
    usados = {}
    for x in P + nuevos:
        usados.setdefault((x["id"], x["n"], x["fn"]), []).append(x)
    for grupo in usados.values():
        if len(grupo) > 1:
            for x in grupo:
                if not x.get("fk"):
                    continue
                ident = next((r["identifier"] for i, r in pk.items() if int(i) == x["im"]), "")
                extra = next((v for k, v in ESTILO.items() if k in ident), None)
                if not extra:
                    extra = " / ".join(abil.get(a, [a])[0] or a for a in x["a"])
                x["fn"] = f"{x['fn'] or 'Forma'} ({extra})"
    P.extend(nuevos)
    P.sort(key=lambda x: (x["id"] or 9999, 1 if x.get("fk") else 0, x.get("ford", 0)))
    for x in P:
        x.pop("ford", None)
    cuenta = {}
    for x in nuevos:
        cuenta[x["fk"]] = cuenta.get(x["fk"], 0) + 1
    print("  formas agregadas:", cuenta)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    pbix = sys.argv[1]
    from pbixray import PBIXRay

    print("Leyendo", pbix)
    model = PBIXRay(pbix)
    T = {}
    for t in model.tables:
        df = model.get_table(t)
        df.columns = [c.strip() for c in df.columns]
        T[t] = df

    dex = {s(r["POKEMON"]): int(r["N_Pokedex"]) for r in T["Pokemon_Pokedex"].to_dict("records")}

    # Movimientos: [es, tipo, categoría, potencia, precisión, PP, descripción, prioridad, prob. efecto, objetivo, en, cambios de stats, extras]
    moves, fcode = {}, {}
    for r in T["moves"].to_dict("records"):
        c = s(r["Movimiento"])
        fcode[c] = s(r["FunctionCode"]) or ""
        moves[c] = [s(r["Movimiento es Español"]), s(r["Type"]), s(r["Category"]), num(r["Power"]),
                    num(r["Accuracy"]), num(r["TotalPP"]), s(r["Description"]), num(r["Priority"]),
                    num(r["EffectChance"]), s(r["Target"]), None, None, None]

    abil = {s(r["Ability"]): [s(r["Name"]), s(r["Description"]), None] for r in T["abilities"].to_dict("records")}

    P = []
    for r in T["pokemon"].to_dict("records"):
        code = s(r["POKEMON"]).strip("[]")
        mv = lst(r["Moves"])
        evo = lst(r["Evolution"])
        st = [num(r[k]) for k in ["HP", "ATK", "DEF", "SPA", "SPD", "SPE"]]
        # En el modelo las columnas vienen en orden PS, Atq, Def, VEL, AtEsp, DefEsp:
        # se reordenan a PS, Atq, Def, AtEsp, DefEsp, Vel.
        st = [st[0], st[1], st[2], st[4], st[5], st[3]]
        P.append(dict(
            c=code, n=s(r["Name"]), id=dex.get(s(r["POKEMON"])), t=lst(r["Types"]), g=num(r["Generation"]),
            st=st, b=num(r["BST"]), cat=s(r["Category"]), dx=s(r["Pokedex"]), h=num(r["Height"]), w=num(r["Weight"]),
            a=lst(r["Abilities"]), ha=lst(r["HiddenAbilities"]),
            lv=[[int(mv[i]), mv[i + 1]] for i in range(0, len(mv) - 1, 2)],
            tm=lst(r["TutorMoves"]), em=lst(r["EggMoves"]),
            ev=[[evo[i], evo[i + 1], evo[i + 2] if i + 2 < len(evo) else ""] for i in range(0, len(evo), 3)],
            eg=lst(r["EggGroups"]), hs=num(r["HatchSteps"]), gr=s(r["GenderRatio"]), gw=s(r["GrowthRate"]),
            cr=num(r["CatchRate"]), hp=num(r["Happiness"]), be=num(r["BaseExp"]), evs=s(r["EVs"]),
            col=s(r["Color"]), hab=s(r["Habitat"]), sh=s(r["Shape"]), fl=lst(r["Flags"]), fn=s(r["FormName"])))
    P.sort(key=lambda x: x["id"] or 9999)

    # Cambios de stats de cada movimiento (desde tu columna FunctionCode)
    for c, m in moves.items():
        m[11] = parse_function_code(fcode.get(c, "")) or None

    # Nombres en inglés y extras (absorción, retroceso, curación...) desde PokeAPI
    print("Buscando nombres en inglés y extras en PokeAPI (requiere internet)...")
    mids = {r["id"]: r["identifier"] for r in pokeapi_csv("moves")}
    en, es = {}, {}
    for r in pokeapi_csv("move_names"):
        if r["local_language_id"] == "9":
            en[r["move_id"]] = r["name"]
        elif r["local_language_id"] == "7":
            es[r["move_id"]] = r["name"]
    bycode, byes = {}, {}
    for i, ident in mids.items():
        if i in en:
            bycode[key(ident)] = en[i]
            bycode.setdefault(key(en[i]), en[i])
            if i in es:
                byes[key(es[i])] = en[i]
    MANUAL_EN = {"NIHILLIGHT": "Nihil Light"}
    for c, m in moves.items():
        m[10] = MANUAL_EN.get(c) or bycode.get(c) or byes.get(key(m[0]))
    en2code = {key(m[10]): c for c, m in moves.items() if m[10]}
    for r in pokeapi_csv("move_meta"):
        k = key(mids.get(r["move_id"], ""))
        c = k if k in moves else en2code.get(k)
        if not c:
            continue
        x = {}
        for f in ["drain", "healing", "flinch_chance", "crit_rate"]:
            v = int(r[f] or 0)
            if v:
                x[f[:2]] = v
        if r["min_hits"] and r["max_hits"] and r["max_hits"] != "1":
            x["hits"] = [int(r["min_hits"]), int(r["max_hits"])]
        if x:
            moves[c][12] = x

    aids = {r["id"]: key(r["identifier"]) for r in pokeapi_csv("abilities")}
    aen = {aids[r["ability_id"]]: r["name"] for r in pokeapi_csv("ability_names")
           if r["local_language_id"] == "9" and r["ability_id"] in aids}
    MANUAL_AEN = {"ASONECHILLINGNEIGH": "As One", "ASONEGRIMNEIGH": "As One",
                  "EMBODYASPECTATTACK": "Embody Aspect", "EMBODYASPECTDEFENSE": "Embody Aspect",
                  "EMBODYASPECTSPDEF": "Embody Aspect", "EMBODYASPECTSPEED": "Embody Aspect"}
    for c, a in abil.items():
        a[2] = MANUAL_AEN.get(c) or aen.get(c)

    add_forms(P, moves, abil)

    sin_en = [c for c, m in moves.items() if not m[10]] + [c for c, a in abil.items() if not a[2]]
    if sin_en:
        print("Aviso: sin nombre en inglés:", ", ".join(sin_en))

    out = Path(__file__).resolve().parent.parent / "data.js"
    data = json.dumps(dict(P=P, M=moves, A=abil), ensure_ascii=False, separators=(",", ":"))
    out.write_text("const D=" + data.replace("</", "<\\/") + ";\n", encoding="utf-8")
    print(f"Listo: {out} ({len(P)} Pokémon, {len(moves)} movimientos, {len(abil)} habilidades)")


if __name__ == "__main__":
    main()
