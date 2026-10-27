// Verifica las especies de las cartas de Sinnoh y la integridad de sus referencias a imágenes locales.
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const raiz = path.resolve(__dirname, "../..");
let cartas = 0;
const especies = new Set();
const errores = [];

try {
    const contexto = vm.createContext({console});
    for (const nombre of ["ps.js", "sinnoh_datos.js"]) {
        vm.runInContext(fs.readFileSync(path.join(raiz, nombre), "utf8"), contexto, {filename: nombre});
    }
    const {Dex, SIN} = vm.runInContext("({Dex: PS.Dex, SIN})", contexto);
    const comprobarEspecie = (nombre, origen) => {
        if (typeof nombre !== "string" || !nombre || !Dex.species.get(nombre).exists) {
            errores.push(`${origen}: especie inexistente ${JSON.stringify(nombre)}`);
        } else {
            especies.add(Dex.species.get(nombre).id);
        }
    };
    const comprobarImagenes = (objeto, origen) => {
        for (const campo of ["img", "img2"]) {
            const clave = objeto[campo];
            if (clave != null && !Object.hasOwn(SIN.img, clave)) {
                errores.push(`${origen}.${campo}: imagen inexistente ${clave}`);
            }
        }
    };
    for (const [i, token] of SIN.tokens.entries()) {
        comprobarImagenes(token, `Token ${i} (${token.n})`);
    }
    for (const mazo of SIN.decks) {
        comprobarImagenes(mazo, `Mazo ${mazo.n}`);
        for (const carta of mazo.cards) {
            const origen = `Carta ${carta.cid} (${carta.n})`;
            comprobarImagenes(carta, origen);
            if (!carta.d) continue;
            cartas++;
            comprobarEspecie(carta.d.sp, origen);
            if (Object.hasOwn(carta.d, "evo")) {
                if (!Array.isArray(carta.d.evo)) {
                    errores.push(`${origen}: evo debe ser una lista`);
                } else {
                    for (const nombre of carta.d.evo) comprobarEspecie(nombre, `${origen}, evolución`);
                }
            }
        }
    }
    const tamanos = SIN.packs.map(nombre => {
        try {
            return fs.statSync(path.join(raiz, "spr", nombre)).size;
        } catch (error) {
            errores.push(`Paquete ${nombre}: ${error.message}`);
            return null;
        }
    });
    for (const [clave, entrada] of Object.entries(SIN.img)) {
        const [paquete, inicio, bytes] = entrada;
        if (!Number.isInteger(paquete) || paquete < 0 || paquete >= tamanos.length ||
            tamanos[paquete] == null || !Number.isInteger(inicio) || inicio < 16 ||
            !Number.isInteger(bytes) || bytes <= 0 || inicio + bytes > tamanos[paquete]) {
            errores.push(`Imagen ${clave}: fuera de su paquete (${paquete}, ${inicio}, ${bytes})`);
        }
    }
} catch (error) {
    errores.push(`No se pudo completar la verificación: ${error.message}`);
}

for (const error of errores) console.error(error);
console.log(`Cartas revisadas: ${cartas}; especies distintas: ${especies.size}; errores: ${errores.length}`);
process.exitCode = errores.length ? 1 : 0;
