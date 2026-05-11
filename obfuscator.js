// ------------------------------------------------------------
//  Seak Nano v1 — Ofuscador Lua ultraligero (<1KB print, <10KB hub)
// ------------------------------------------------------------

function randomName(len = 6) {
    let s = '';
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
    for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return '_' + s;
}

// MBA ligero (sin exagerar)
function mba(n) {
    if (Math.random() > 0.5) return n.toString();
    const a = Math.floor(Math.random() * 100) + 10;
    return `((${n}+${a})-${a})`;
}

// ------------------------------------------------------------
//  MÓDULO 1: ENCRIPTACIÓN DE STRINGS (XOR ligero)
// ------------------------------------------------------------
function encryptStrings(code) {
    return code.replace(/"([^"]+)"|'([^']+)'/g, (match, d, s) => {
        const str = d || s;
        if (str.length < 2) return match;
        const k = Math.floor(Math.random() * 200) + 50;
        const enc = str.split('').map((c, i) => ((c.charCodeAt(0) ^ ((k + i) & 0xFF)))).join(',');
        return `string.char(${enc})`;
    });
}

// ------------------------------------------------------------
//  MÓDULO 2: OFUSCACIÓN DE NÚMEROS (MBA ligero)
// ------------------------------------------------------------
function obfuscateNumbers(code) {
    return code.replace(/\b(\d+)\b/g, (m, n) => Math.random() < 0.6 ? mba(Number(n)) : m);
}

// ------------------------------------------------------------
//  MÓDULO 3: CFF LIGERO (solo si el código es corto)
// ------------------------------------------------------------
function cffLite(code) {
    const lines = code.split('\n').filter(l => l.trim().length > 0);
    if (lines.length < 2) return code;
    const sv = randomName();
    let out = `local ${sv}=1 while ${sv}<${lines.length + 2} do `;
    lines.forEach((l, i) => {
        out += `if ${sv}==${i + 1} then ${l} ${sv}=${i + 2} `;
    });
    out += `end `;
    return out;
}

// ------------------------------------------------------------
//  MÓDULO 4: REVERSE-IF (ligero)
// ------------------------------------------------------------
function reverseIf(code) {
    return code.replace(/if\s+(.+?)\s+then\s+(.+?)\s+end/g, (m, cond, body) => {
        if (Math.random() > 0.5 || body.length > 30) return m;
        return `if not(${cond})then else ${body} end`;
    });
}

// ------------------------------------------------------------
//  MÓDULO 5: JUNK-IF MÍNIMO (1 o 2 líneas)
// ------------------------------------------------------------
function junkIfLite(code) {
    const a = Math.floor(Math.random() * 50);
    const b = a + Math.floor(Math.random() * 10) + 1;
    const v = randomName();
    return `if ${a}==${b} then local ${v}=1 end; ` + code;
}

// ------------------------------------------------------------
//  MÓDULO 6: ENCRIPTACIÓN DE FUNCIONES (lookup mínimo)
// ------------------------------------------------------------
function encryptFunctions(code) {
    const funcs = ['print', 'warn', 'game', 'pairs', 'ipairs', 'tick'];
    funcs.forEach(fn => {
        const enc = fn.split('').map(c => c.charCodeAt(0)).join(',');
        code = code.replace(new RegExp(`\\b${fn}\\b`, 'g'), `getfenv()[string.char(${enc})]`);
    });
    return code;
}

// ------------------------------------------------------------
//  MÓDULO 7: OFUSCACIÓN DE LOCALS (solo renombrado ligero)
// ------------------------------------------------------------
function obfuscateLocals(code) {
    const keywords = new Set(['local','if','then','else','end','for','while','do','function','return','break','nil','true','false','and','or','not','repeat','until']);
    const map = {};
    code = code.replace(/local\s+(\w+)/g, (m, name) => {
        if (!map[name]) map[name] = randomName(6);
        return `local ${map[name]}`;
    });
    // Reemplazar usos
    for (const [orig, obf] of Object.entries(map)) {
        code = code.replace(new RegExp(`\\b${orig}\\b`, 'g'), obf);
    }
    return code;
}

// ------------------------------------------------------------
//  MÓDULO 8: WPACKER NANO (empaquetado binario mínimo)
// ------------------------------------------------------------
function wpackerNano(code) {
    const bytes = code.split('').map(c => c.charCodeAt(0));
    const k = Math.floor(Math.random() * 200) + 50;
    const enc = bytes.map((b, i) => ((b ^ ((k + i) & 0xFF)))).join(',');
    return `local d={${enc}}local r=''for i=1,#d do r=r..string.char(bit32.bxor(d[i],(${k}+i-1)%256))end loadstring(r)()`;
}

// ------------------------------------------------------------
//  OFUSCADOR PRINCIPAL
// ------------------------------------------------------------
function obfuscate(code) {
    let result = code;

    // Aplicar solo las transformaciones más ligeras
    result = encryptStrings(result);       // +100-300 bytes
    result = obfuscateNumbers(result);     // +50-150 bytes
    result = reverseIf(result);            // +20-50 bytes
    result = junkIfLite(result);           // +50 bytes fijo
    result = encryptFunctions(result);     // +100-200 bytes
    result = obfuscateLocals(result);      // +50-100 bytes
    result = wpackerNano(result);          // +200-400 bytes (capa final)

    return result;
}

// ------------------------------------------------------------
//  PRUEBA RÁPIDA
// ------------------------------------------------------------
function test() {
    const simple = `print("hola")`;
    const hub = `
        local a = 1
        local b = 2
        game.Players.LocalPlayer:Kick()
        print("hub cargado")
    `;

    const o1 = obfuscate(simple);
    const o2 = obfuscate(hub);

    console.log('Simple:', o1.length, 'bytes');
    console.log(o1);
    console.log('');
    console.log('Hub:', o2.length, 'bytes');
    console.log(o2);
}

// Solo ejecutar test si se llama directamente
if (require.main === module) test();

module.exports = { obfuscate };
