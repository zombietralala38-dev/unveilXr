// ------------------------------------------------------------
//  Seak Mini Obfuscator v1 — Ofuscador Lua modular en JavaScript
// ------------------------------------------------------------

// ========== UTILIDADES GENERALES ==========
function randomName(len = 8) {
    let s = '';
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
    for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return '_' + s;
}

// Genera una expresión MBA que siempre evalúa a 'n'
function mbaNumber(n) {
    const a = Math.floor(Math.random() * 200) + 10;
    const b = Math.floor(Math.random() * 20) + 2;
    const c = Math.floor(Math.random() * 100) + 5;
    const d = Math.floor(Math.random() * 20) + 2;
    return `(((${n}+${a})*${b}/${b})-${a}+(${c}*${d}/${d})-${c})`;
}

// ========== 0. MINIFY (simple) ==========
function minify(code) {
    return code
        .replace(/--\[\[[\s\S]*?\]\]/g, '')   // comentarios multilinea
        .replace(/--.*$/gm, '')               // comentarios de línea
        .replace(/\n\s*\n/g, '\n')            // líneas vacías
        .replace(/[ \t]+/g, ' ')              // espacios múltiples
        .trim();
}

// ========== 1. STRING ENCRYPTION ==========
function encryptStrings(code) {
    return code.replace(/"([^"]*)"|'([^']*)'/g, (match, double, single) => {
        const str = double || single;
        if (str.length === 0) return match;
        const bytes = str.split('').map(c => c.charCodeAt(0));
        const key = Math.floor(Math.random() * 200) + 50;
        const enc = bytes.map((b, i) => ((b ^ ((key + i) & 0xFF)))).join(',');
        return `string.char(${bytes.map((b, i) => mbaNumber((b ^ ((key + i) & 0xFF)))).join(',')})`;
    });
}

// ========== 2. NUMBER OBFUSCATION (Literals) ==========
function obfuscateNumbers(code) {
    return code.replace(/\b(\d+(\.\d+)?)\b/g, (match, num) => {
        if (isNaN(num)) return match;
        return Math.random() < 0.7 ? mbaNumber(Number(num)) : match;
    });
}

// ========== 3. TABLE INDIRECTION ==========
function tableIndirection(code) {
    // Envuelve tablas literales en accesos indirectos
    return code.replace(/(local\s+\w+\s*=\s*)\{/g, (match, prefix) => {
        const tName = randomName();
        return `local ${tName}={} ${prefix}${tName}`;
    });
}

// ========== 4. SWIZZLE (intercambio de variables) ==========
function swizzle(code) {
    const locals = code.match(/local\s+(\w+)/g);
    if (!locals || locals.length < 2) return code;
    const names = locals.map(l => l.replace('local ', ''));
    // Intercambia pares
    for (let i = 0; i < names.length - 1; i += 2) {
        const a = names[i], b = names[i + 1];
        code = code.replace(new RegExp(`\\b${a}\\b`, 'g'), '___SWAP___');
        code = code.replace(new RegExp(`\\b${b}\\b`, 'g'), a);
        code = code.replace(/___SWAP___/g, b);
    }
    return code;
}

// ========== 5. CFF v1 (Control Flow Flattening simple) ==========
function controlFlowFlattening(code) {
    const lines = code.split('\n').filter(l => l.trim().length > 0);
    if (lines.length < 3) return code;
    const stateVar = randomName();
    let result = `local ${stateVar}=1 while true do `;
    lines.forEach((line, i) => {
        if (i === 0) result += `if ${stateVar}==${mbaNumber(1)} then ${line} ${stateVar}=${mbaNumber(2)} `;
        else result += `elseif ${stateVar}==${mbaNumber(i + 1)} then ${line} ${stateVar}=${mbaNumber(i + 2)} `;
    });
    result += `elseif ${stateVar}==${mbaNumber(lines.length + 1)} then break end end`;
    return result;
}

// ========== 6. REVERSE-IF ==========
function reverseIf(code) {
    return code.replace(/if\s+(.+?)\s+then\s+(.+?)\s+end/gi, (match, cond, body) => {
        if (Math.random() > 0.5) {
            return `if not(${cond}) then else ${body} end`;
        }
        return match;
    });
}

// ========== 7. JUNK-IF ==========
function junkIf(code) {
    const junkLines = [];
    for (let i = 0; i < 3; i++) {
        const a = Math.floor(Math.random() * 100);
        const b = Math.floor(Math.random() * 100);
        junkLines.push(`if ${mbaNumber(a)}==${mbaNumber(b)} then local ${randomName()}=1 end;`);
    }
    return junkLines.join(' ') + code;
}

// ========== 8. ENCRYPT FUNCTION CALLS ==========
function encryptFunctionCalls(code) {
    const funcs = ['print', 'warn', 'game', 'pairs', 'ipairs', 'table', 'string', 'math', 'tick'];
    funcs.forEach(fn => {
        const enc = fn.split('').map(c => c.charCodeAt(0) + 1).join(',');
        code = code.replace(new RegExp(`\\b${fn}\\b`, 'g'), `getfenv()[string.char(${enc})]`);
    });
    return code;
}

// ========== 9. MBA v1 (Mixed Boolean Arithmetic) ==========
function mixedBooleanArithmetic(code) {
    return code.replace(/\b(\d+)\s*([+\-*/])\s*(\d+)\b/g, (match, a, op, b) => {
        const expr = `(bit32.bxor(${a},0) ${op} bit32.bxor(${b},0))`;
        return Math.random() < 0.5 ? expr : match;
    });
}

// ========== 10. LOCAL VARIABLE OBFUSCATION ==========
function obfuscateLocals(code) {
    const localMap = {};
    return code.replace(/\b(\w+)\b/g, (match, word) => {
        if (/^(local|if|then|else|end|for|while|do|function|return|break)$/.test(word)) return word;
        if (!localMap[word]) localMap[word] = randomName(6);
        return localMap[word];
    });
}

// ========== 11. _G LOOKUP ==========
function gLookup(code) {
    const globals = ['print', 'game', 'workspace', 'math', 'string', 'table'];
    globals.forEach(g => {
        code = code.replace(new RegExp(`\\b${g}\\b`, 'g'), `_G[${mbaNumber(g.charCodeAt(0))}]`);
    });
    return code;
}

// ========== 12. DEMO VM (Luamina PUSH/PULL) ==========
function demoVM(code) {
    const varName = randomName();
    const bytes = code.split('').map(c => c.charCodeAt(0));
    const key = Math.floor(Math.random() * 200) + 50;
    const enc = bytes.map((b, i) => ((b ^ ((key + i) & 0xFF))));
    const pushPull = enc.map(b => `table.insert(stack,${b})`).join(';');
    const dec = `for i=1,#stack do result=result..string.char(bit32.bxor(stack[i],(${key}+i-1)%256)) end`;
    return `local stack={} ${pushPull} local result='' ${dec} loadstring(result)()`;
}

// ========== 13. WPACKER (empaquetado binario simple) ==========
function wpacker(code) {
    const bytes = code.split('').map(c => c.charCodeAt(0));
    const key = Math.floor(Math.random() * 200) + 50;
    const enc = bytes.map((b, i) => ((b ^ ((key + i) & 0xFF))));
    const data = enc.join(',');
    return `local d={${data}} local r='' for i=1,#d do r=r..string.char(bit32.bxor(d[i],(${key}+i-1)%256)) end loadstring(r)()`;
}

// ========== OFUSCADOR PRINCIPAL ==========
function obfuscate(code, options = {}) {
    let result = code;

    const passes = [
        { name: 'minify', fn: minify, enabled: options.minify !== false },
        { name: 'encryptStrings', fn: encryptStrings, enabled: options.encryptStrings !== false },
        { name: 'obfuscateNumbers', fn: obfuscateNumbers, enabled: options.obfuscateNumbers !== false },
        { name: 'tableIndirection', fn: tableIndirection, enabled: options.tableIndirection !== false },
        { name: 'swizzle', fn: swizzle, enabled: options.swizzle !== false },
        { name: 'controlFlowFlattening', fn: controlFlowFlattening, enabled: options.cff !== false },
        { name: 'reverseIf', fn: reverseIf, enabled: options.reverseIf !== false },
        { name: 'junkIf', fn: junkIf, enabled: options.junkIf !== false },
        { name: 'encryptFunctionCalls', fn: encryptFunctionCalls, enabled: options.encFunc !== false },
        { name: 'mixedBooleanArithmetic', fn: mixedBooleanArithmetic, enabled: options.mba !== false },
        { name: 'obfuscateLocals', fn: obfuscateLocals, enabled: options.locals !== false },
        { name: 'gLookup', fn: gLookup, enabled: options.gLookup !== false },
        { name: 'demoVM', fn: demoVM, enabled: options.demoVM !== false },
        { name: 'wpacker', fn: wpacker, enabled: options.wpacker !== false },
    ];

    passes.forEach(pass => {
        if (pass.enabled) {
            try {
                result = pass.fn(result);
                console.log(`✔ ${pass.name}`);
            } catch (e) {
                console.error(`✖ ${pass.name}: ${e.message}`);
            }
        }
    });

    return result;
}

// ========== EXPORTAR ==========
module.exports = { obfuscate, minify, encryptStrings, obfuscateNumbers, tableIndirection, swizzle, controlFlowFlattening, reverseIf, junkIf, encryptFunctionCalls, mixedBooleanArithmetic, obfuscateLocals, gLookup, demoVM, wpacker };
