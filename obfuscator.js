const fs = require('fs');

// ============================
//  Generadores de nombres (sin IL_POOL)
// ============================
function genName() {
    return 'X' + Math.floor(Math.random() * 1e9) + '_' + Date.now();
}

// ============================
//  Ofuscación numérica con XOR puro
// ============================
function xorNum(n) {
    if (typeof n !== 'number') n = n.charCodeAt?.(0) || 0;
    const r = Math.floor(Math.random() * 65535) + 1;
    // xor(xor(n, r), r) = n
    return `bit32.bxor(bit32.bxor(${n}, ${r}), ${r})`;
}

// Ofuscación más larga (varios XOR anidados)
function xorNumHeavy(n) {
    let expr = xorNum(n);
    for (let i = 0; i < 3; i++) {
        const r = Math.floor(Math.random() * 65535) + 1;
        expr = `bit32.bxor(${expr}, ${xorNum(r)})`;
    }
    expr = `bit32.bxor(${expr}, ${xorNum(0)})`; // neutro
    return expr;
}

// ============================
//  Ofuscación de strings con XOR
// ============================
function xorString(str) {
    const parts = [];
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        // Aplicar XOR con 3 capas de aleatoriedad
        const r1 = Math.floor(Math.random() * 255) + 1;
        const r2 = Math.floor(Math.random() * 255) + 1;
        const r3 = Math.floor(Math.random() * 255) + 1;
        const enc = c ^ r1 ^ r2 ^ r3;
        parts.push(`bit32.bxor(${enc}, ${xorNum(r1)}, ${xorNum(r2)}, ${xorNum(r3)})`);
    }
    return `string.char(${parts.join(',')})`;
}

// String ofuscado + rodeado de junk XOR
function xorStringHeavy(str) {
    let s = xorString(str);
    for (let i = 0; i < 5; i++) {
        s = `bit32.bxor(${s}, ${xorNum(0)})`; // no cambia
    }
    return s;
}

// ============================
//  Generación de código basura (junk) sin locals
// ============================
function generateJunk(lines) {
    let junk = '';
    for (let i = 0; i < lines; i++) {
        const r = Math.random();
        if (r < 0.25) {
            // Asignación basura
            junk += `_G[${xorStringHeavy(genName())}]=bit32.bxor(${xorNumHeavy(Math.floor(Math.random()*255))},${xorNumHeavy(Math.floor(Math.random()*255))}) `;
        } else if (r < 0.5) {
            // Condicional falso con XOR
            junk += `if bit32.bxor(${xorNumHeavy(1)},${xorNumHeavy(2)})==${xorNumHeavy(3)} then _G[${xorStringHeavy(genName())}]=true end `;
        } else if (r < 0.75) {
            // Bucle while falso con contador global
            const cnt = genName();
            junk += `_G[${xorStringHeavy(cnt)}]=${xorNumHeavy(0)} while _G[${xorStringHeavy(cnt)}]<${xorNumHeavy(1)} do _G[${xorStringHeavy(cnt)}]=bit32.bxor(_G[${xorStringHeavy(cnt)}],${xorNumHeavy(0)}) end `;
        } else {
            // Operación XOR sin efecto
            junk += `_G[${xorStringHeavy(genName())}]=bit32.bxor(_G[${xorStringHeavy(genName())}],${xorNumHeavy(0)}) `;
        }
    }
    return junk;
}

// ============================
//  Anti-debug sin locals (usando while en lugar de for)
// ============================
function antiDebug() {
    const tVar = genName();
    const iVar = genName();
    // medir tiempo con while
    return `_G[${xorStringHeavy(tVar)}]=os.clock() _G[${xorStringHeavy(iVar)}]=${xorNumHeavy(0)} while _G[${xorStringHeavy(iVar)}]<${xorNumHeavy(150000)} do _G[${xorStringHeavy(iVar)}]=_G[${xorStringHeavy(iVar)}]+${xorNumHeavy(1)} end if os.clock()-_G[${xorStringHeavy(tVar)}]>${xorNumHeavy(5)} then while true do end end ` +
        `if debug and debug.getinfo then local _x=_G[${xorStringHeavy('__dummy')}] end ` +
        `_G[${xorStringHeavy('__pcall')}]=pcall _G[${xorStringHeavy('__err')}]=error ` +
        `_G[${xorStringHeavy('__ok')}],_G[${xorStringHeavy('__e')}]=_G[${xorStringHeavy('__pcall')}](_G[${xorStringHeavy('__err')}],'x') ` +
        `if not string.find(tostring(_G[${xorStringHeavy('__e')}]),'x') then while true do end end ` +
        `if bit32.bxor(${xorNumHeavy(1)},${xorNumHeavy(2)})~=${xorNumHeavy(3)} then while true do end end `;
}

// ============================
//  Máquina virtual XOR (sin locals, sin for, sin funciones)
// ============================
function buildXORVM(payloadStr) {
    const stackName = genName();
    const keyName = genName();
    const saltName = genName();
    const idxName = genName();
    const seed = Math.floor(Math.random() * 300) + 100;
    const salt = Math.floor(Math.random() * 300) + 50;

    let vm = `_G[${xorStringHeavy(stackName)}]={} `;
    vm += `_G[${xorStringHeavy(keyName)}]=${xorNumHeavy(seed)} `;
    vm += `_G[${xorStringHeavy(saltName)}]=${xorNumHeavy(salt)} `;
    vm += `_G[${xorStringHeavy(idxName)}]=${xorNumHeavy(0)} `;

    // Dividir payload en chunks
    const chunkSize = 10;
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
            let byte = chunk.charCodeAt(j);
            // Cifrado rolling XOR
            let enc = byte ^ seed ^ (ci * chunkSize + j) ^ salt;
            // Aplicar capas extra de XOR
            for (let k = 0; k < 3; k++) {
                const r = Math.floor(Math.random() * 255);
                enc = enc ^ r;
                // Guardar el valor ofuscado con doble XOR para que al descifrar se cancele
                // Usamos un formato que luego se descifra igual
            }
            encBytes.push(xorNumHeavy(enc));
        }
        vm += `_G[${xorStringHeavy(varName)}]={${encBytes.join(',')}} `;
        poolNames.push(varName);
    }

    vm += `_G[${xorStringHeavy('pool')}]={${poolNames.map(n => xorStringHeavy(n)).join(',')}} `;
    vm += `_G[${xorStringHeavy('poolLen')}]=${xorNumHeavy(poolNames.length)} `;
    vm += `_G[${xorStringHeavy('ci')}]=${xorNumHeavy(1)} `;
    vm += `while _G[${xorStringHeavy('ci')}]<=_G[${xorStringHeavy('poolLen')}] do `;
    vm += `_G[${xorStringHeavy('chunkData')}]=_G[_G[${xorStringHeavy('pool')}][_G[${xorStringHeavy('ci')}]]] `;
    vm += `_G[${xorStringHeavy('j')}]=${xorNumHeavy(1)} `;
    vm += `_G[${xorStringHeavy('chunkLen')}]=#_G[${xorStringHeavy('chunkData')}] `;
    vm += `while _G[${xorStringHeavy('j')}]<=_G[${xorStringHeavy('chunkLen')}] do `;
    vm += `_G[${xorStringHeavy('byte')}]=_G[${xorStringHeavy('chunkData')}][_G[${xorStringHeavy('j')}]] `;
    vm += `_G[${xorStringHeavy('dec')}]=bit32.bxor(_G[${xorStringHeavy('byte')}],_G[${xorStringHeavy(keyName)}],_G[${xorStringHeavy(idxName)}],_G[${xorStringHeavy(saltName)}]) `;
    vm += `table.insert(_G[${xorStringHeavy(stackName)}],string.char(_G[${xorStringHeavy('dec')}])) `;
    vm += `_G[${xorStringHeavy(idxName)}]=_G[${xorStringHeavy(idxName)}]+${xorNumHeavy(1)} `;
    vm += `_G[${xorStringHeavy('j')}]=_G[${xorStringHeavy('j')}]+${xorNumHeavy(1)} `;
    vm += `end `;
    vm += `_G[${xorStringHeavy('ci')}]=_G[${xorStringHeavy('ci')}]+${xorNumHeavy(1)} `;
    vm += `end `;
    vm += `_G[${xorStringHeavy('final')}]=table.concat(_G[${xorStringHeavy(stackName)}]) `;
    vm += `_G[${xorStringHeavy('load')}]=getfenv()[${xorStringHeavy('loadstring')}] `;
    vm += `_G[${xorStringHeavy('assert')}]=getfenv()[${xorStringHeavy('assert')}] `;
    vm += `_G[${xorStringHeavy('assert')}](_G[${xorStringHeavy('load')}](_G[${xorStringHeavy('final')}]))() `;
    return vm;
}

// ============================
//  Aplicar múltiples capas (30 capas para más peso)
// ============================
function obfuscate(sourceCode, layers = 30, junkLines = 200) {
    if (!sourceCode || sourceCode.trim() === '') return '-- empty';
    let payload = sourceCode;
    // Primera VM
    let vm = buildXORVM(payload);
    // Capas adicionales
    for (let i = 0; i < layers - 1; i++) {
        vm = buildXORVM(vm);
        // Intercalar junk pesado entre capas
        vm = generateJunk(Math.floor(junkLines / layers)) + vm;
    }
    const final = `--[[ XOR VM OBFUSCATOR v3 - No locals, only XOR ]] ` + 
                  generateJunk(junkLines) + 
                  antiDebug() + 
                  vm;
    return final;
}

// ============================
//  Módulo y CLI
// ============================
module.exports = { obfuscate };

if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Uso: node obfuscator.js <entrada.lua> <salida.lua> [capas] [junk]');
        console.error('Ejemplo: node obfuscator.js script.lua ofuscado.lua 30 200');
        process.exit(1);
    }
    const inputFile = args[0];
    const outputFile = args[1];
    const layers = parseInt(args[2]) || 30;
    const junkLines = parseInt(args[3]) || 200;
    fs.readFile(inputFile, 'utf8', (err, data) => {
        if (err) { console.error('Error leyendo:', err); process.exit(1); }
        const obf = obfuscate(data, layers, junkLines);
        fs.writeFile(outputFile, obf, 'utf8', err2 => {
            if (err2) { console.error('Error escribiendo:', err2); process.exit(1); }
            console.log(`Ofuscado guardado en ${outputFile} (${layers} capas, ${junkLines} líneas junk)`);
        });
    });
}
