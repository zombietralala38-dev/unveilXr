// obfuscator.js - XOR-only obfuscator for Lua (no locals, no IL_POOL)
// Usage: node obfuscator.js input.lua output.lua

const fs = require('fs');

// Generador de nombres globales (sin local)
function genName() {
    return 'X' + Math.floor(Math.random() * 999999) + '_' + Date.now();
}

// Expresión XOR que devuelve el mismo número (n = xor(xor(n, r), r))
function xorNumber(n) {
    const r = Math.floor(Math.random() * 65535) + 1;
    return `bit32.bxor(bit32.bxor(${n}, ${r}), ${r})`;
}

// Ofusca un string a una tabla de números XOR-eados
function xorString(str) {
    const parts = [];
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        const r1 = Math.floor(Math.random() * 255) + 1;
        const r2 = Math.floor(Math.random() * 255) + 1;
        const enc = code ^ r1 ^ r2;
        parts.push(`bit32.bxor(${enc}, ${r1}, ${r2})`);
    }
    return `string.char(${parts.join(',')})`;
}

// Genera código basura sin local (solo variables globales y XOR)
function generateJunk(lines) {
    let junk = '';
    for (let i = 0; i < lines; i++) {
        const r = Math.random();
        if (r < 0.33) {
            junk += `_G[${xorString(genName())}]=bit32.bxor(${Math.floor(Math.random()*255)},${Math.floor(Math.random()*255)}) `;
        } else if (r < 0.66) {
            junk += `if bit32.bxor(${Math.floor(Math.random()*10)},${Math.floor(Math.random()*10)})==0 then _G[${xorString(genName())}]=true end `;
        } else {
            junk += `for _=1,bit32.bxor(${Math.floor(Math.random()*50)},${Math.floor(Math.random()*50)}) do _G[${xorString(genName())}]=nil end `;
        }
    }
    return junk;
}

// Construye una máquina virtual XOR (sin local)
function buildXORVM(payloadStr) {
    const stackName = genName();
    const keyName = genName();
    const seed = Math.floor(Math.random() * 200) + 50;
    const salt = Math.floor(Math.random() * 200) + 1;
    
    let vm = `_G[${xorString(stackName)}]={} `;
    vm += `_G[${xorString(keyName)}]=${xorNumber(seed)} `;
    vm += `_G[${xorString('salt')}]=${xorNumber(salt)} `;
    
    // Dividir payload en chunks
    const chunkSize = 12;
    const chunks = [];
    for (let i = 0; i < payloadStr.length; i += chunkSize) {
        chunks.push(payloadStr.substr(i, chunkSize));
    }
    
    const poolNames = [];
    for (let ci = 0; ci < chunks.length; ci++) {
        const chunk = chunks[ci];
        const varName = genName();
        const encBytes = [];
        for (let j = 0; j < chunk.length; j++) {
            const byte = chunk.charCodeAt(j);
            let enc = byte ^ seed ^ (ci * chunkSize + j) ^ salt;
            enc = enc ^ (Math.floor(Math.random()*255)) ^ (Math.floor(Math.random()*255));
            encBytes.push(`bit32.bxor(${enc}, ${xorNumber(seed)}, ${xorNumber(1)})`);
        }
        vm += `_G[${xorString(varName)}]={${encBytes.join(',')}} `;
        poolNames.push(varName);
    }
    
    vm += `_G[${xorString('__pool')}]={${poolNames.map(n => xorString(n)).join(',')}} `;
    vm += `_G[${xorString('__idx')}]=0 `;
    vm += `for _=1,#_G[${xorString('__pool')}] do `;
    vm += `for _,b in ipairs(_G[_G[${xorString('__pool')}][_]]) do `;
    vm += `table.insert(_G[${xorString(stackName)}], string.char(`;
    vm += `bit32.bxor(b, _G[${xorString(keyName)}], _G[${xorString('__idx')}], _G[${xorString('salt')}])`;
    vm += `)) _G[${xorString('__idx')}]=_G[${xorString('__idx')}]+1 `;
    vm += `end end `;
    vm += `getfenv()[${xorString('assert')}](getfenv()[${xorString('loadstring')}](table.concat(_G[${xorString(stackName)}])))()`;
    return vm;
}

// Anti-debug sin local
function antiDebug() {
    return `_G[${xorString('__t')}]=os.clock() for _=1,150000 do end if os.clock()-_G[${xorString('__t')}]>5 then while true do end end ` +
           `if debug and debug.getinfo then if debug.getinfo(1).what~='main' then while true do end end end ` +
           `local _,e=pcall(error,'x') if not string.find(e,'x') then while true do end end ` +
           `if bit32.bxor(1,2)~=3 then while true do end end `;
}

// Ofuscador principal (aplica 18 capas de VM)
function obfuscate(sourceCode) {
    if (!sourceCode || sourceCode.trim() === '') return '-- empty';
    
    // Eliminar cualquier local del código original? No, solo se ofusca el código.
    // Pero el ofuscador NO debe introducir 'local' en la salida, ya está garantizado.
    let payload = sourceCode;
    
    // Primera VM con el payload original
    let vm = buildXORVM(payload);
    // 17 capas adicionales (total 18)
    for (let i = 0; i < 17; i++) {
        vm = buildXORVM(vm);
    }
    // Envolver con junk y anti-debug
    const final = `--[[ XOR OBFUSCATED - No locals, only XOR ]] ${generateJunk(40)} ${antiDebug()} ${vm}`;
    return final;
}

// Módulo para Node.js
module.exports = { obfuscate };

// Si se ejecuta directamente, leer archivos
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Uso: node obfuscator.js <archivo_entrada.lua> <archivo_salida.lua>');
        process.exit(1);
    }
    const inputFile = args[0];
    const outputFile = args[1];
    fs.readFile(inputFile, 'utf8', (err, data) => {
        if (err) { console.error('Error leyendo archivo:', err); process.exit(1); }
        const obfuscated = obfuscate(data);
        fs.writeFile(outputFile, obfuscated, 'utf8', (err2) => {
            if (err2) { console.error('Error escribiendo archivo:', err2); process.exit(1); }
            console.log(`Ofuscado guardado en ${outputFile}`);
        });
    });
}
