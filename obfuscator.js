// ------------------------------------------------------------
//  Seak Nano v2 — Corregido, sin errores de nil
// ------------------------------------------------------------

function randomName(len = 6) {
    let s = '';
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
    for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return '_' + s;
}

function mba(n) {
    if (Math.random() > 0.6) return n.toString();
    const a = Math.floor(Math.random() * 100) + 10;
    return `((${n}+${a})-${a})`;
}

// ------------------------------------------------------------
//  MÓDULO 1: ENCRIPTACIÓN DE STRINGS (XOR)
// ------------------------------------------------------------
function encryptStrings(code) {
    return code.replace(/"([^"]*)"|'([^']*)'/g, (match, double, single) => {
        const str = double || single;
        if (!str || str.length < 2) return match;
        const key = Math.floor(Math.random() * 200) + 50;
        const enc = str.split('').map((c, i) => ((c.charCodeAt(0) ^ ((key + i) & 0xFF))));
        const decName = randomName();
        const keyName = randomName();
        // Generar decodificación segura dentro de una función
        return `(function()local ${keyName}=${key}local t={${enc.join(',')}}local r=''for i=1,#t do r=r..string.char(bit32.bxor(t[i],(${keyName}+i-1)%256))end return r end)()`;
    });
}

// ------------------------------------------------------------
//  MÓDULO 2: OFUSCACIÓN DE NÚMEROS (MBA)
// ------------------------------------------------------------
function obfuscateNumbers(code) {
    return code.replace(/\b(\d+)\b/g, (match, num) => {
        if (match.startsWith('0x')) return match; // no tocar hex
        return Math.random() < 0.6 ? mba(Number(num)) : match;
    });
}

// ------------------------------------------------------------
//  MÓDULO 3: JUNK-IF MÍNIMO
// ------------------------------------------------------------
function junkIf(code) {
    const a = Math.floor(Math.random() * 100);
    const b = a + Math.floor(Math.random() * 20) + 1; // garantiza que nunca sean iguales
    const v = randomName();
    return `if ${a}==${b} then local ${v}=1 end;` + code;
}

// ------------------------------------------------------------
//  MÓDULO 4: REVERSE-IF
// ------------------------------------------------------------
function reverseIf(code) {
    return code.replace(/if\s+(.+?)\s+then\s+(.+?)\s+end/g, (match, cond, body) => {
        if (body.length > 40 || Math.random() > 0.4) return match;
        return `if not(${cond})then else ${body} end`;
    });
}

// ------------------------------------------------------------
//  MÓDULO 5: OFUSCACIÓN DE LOCALS (renombrado seguro)
// ------------------------------------------------------------
function obfuscateLocals(code) {
    const keywords = new Set([
        'local', 'if', 'then', 'else', 'elseif', 'end', 'for', 'while', 'do',
        'function', 'return', 'break', 'nil', 'true', 'false', 'and', 'or',
        'not', 'repeat', 'until', 'in', 'pairs', 'ipairs', 'self'
    ]);
    const builtins = new Set([
        'print', 'warn', 'error', 'game', 'workspace', 'math', 'string',
        'table', 'bit32', 'tick', 'wait', 'spawn', 'delay', 'pcall',
        'xpcall', 'loadstring', 'getfenv', 'setfenv', 'rawget', 'rawset',
        'type', 'tonumber', 'tostring', 'assert', 'select', 'unpack',
        'require', 'Vector3', 'CFrame', 'UDim2', 'Color3', 'Instance'
    ]);

    const localMap = {};

    // Primero renombrar declaraciones local
    code = code.replace(/local\s+(\w+)/g, (match, name) => {
        if (keywords.has(name) || builtins.has(name)) return match;
        if (!localMap[name]) localMap[name] = randomName(8);
        return `local ${localMap[name]}`;
    });

    // Luego renombrar usos (evitando palabras clave y builtins)
    for (const [orig, obf] of Object.entries(localMap)) {
        const regex = new RegExp(`(?<![a-zA-Z0-9_])${orig}(?![a-zA-Z0-9_])`, 'g');
        code = code.replace(regex, obf);
    }

    return code;
}

// ------------------------------------------------------------
//  MÓDULO 6: WPACKER CORREGIDO (sin errores de nil)
// ------------------------------------------------------------
function wpacker(code) {
    const bytes = code.split('').map(c => c.charCodeAt(0));
    const key = Math.floor(Math.random() * 200) + 50;
    const enc = bytes.map((b, i) => ((b ^ ((key + i) & 0xFF))));
    const dataName = randomName();
    const resultName = randomName();
    const keyName = randomName();
    const idxName = randomName();

    // Estructura segura: todo dentro de una función anónima que se autoejecuta
    return `(function()local ${dataName}={${enc.join(',')}}local ${keyName}=${key}local ${resultName}=''for ${idxName}=1,#${dataName} do ${resultName}=${resultName}..string.char(bit32.bxor(${dataName}[${idxName}],(${keyName}+${idxName}-1)%256))end loadstring(${resultName})()end)()`;
}

// ------------------------------------------------------------
//  OFUSCADOR PRINCIPAL
// ------------------------------------------------------------
function obfuscate(code) {
    let result = code;

    result = junkIf(result);           // +50 bytes
    result = encryptStrings(result);   // +150-300 bytes
    result = obfuscateNumbers(result); // +50-100 bytes
    result = reverseIf(result);        // +20-50 bytes
    result = obfuscateLocals(result);  // +100-200 bytes
    result = wpacker(result);          // +200-400 bytes (capa final)

    return result;
}

// ------------------------------------------------------------
//  PRUEBA
// ------------------------------------------------------------
function test() {
    const simple = `print("hola")`;
    const hub = `
        local player = game.Players.LocalPlayer
        local char = player.Character
        if char then
            print("hub cargado")
        end
    `;

    const ofSimple = obfuscate(simple);
    const ofHub = obfuscate(hub);

    console.log('=== SIMPLE ===');
    console.log('Peso:', ofSimple.length, 'bytes');
    console.log(ofSimple);
    console.log('');
    console.log('=== HUB ===');
    console.log('Peso:', ofHub.length, 'bytes');
    console.log(ofHub);
}

if (require.main === module) test();

module.exports = { obfuscate };
