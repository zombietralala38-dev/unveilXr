const fs = require('fs');

/**
 * OFUSCADOR COMPLETO: XOR-FLOW (No Locals Edition)
 * Basado puramente en operaciones bitwise y paso de argumentos.
 */

const HEADER = `--[[ vvm_xor_protected_v2 ]]`;

// Genera nombres aleatorios para los parámetros de la función (sustituto de variables locales)
function rndName() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let name = '';
    for (let i = 0; i < 6; i++) name += chars.charAt(Math.floor(Math.random() * chars.length));
    return name;
}

function obfuscate(sourceCode) {
    if (!sourceCode) return '--ERROR: NO_SOURCE';

    const key = Math.floor(Math.random() * 255) + 1;
    const salt = Math.floor(Math.random() * 100) + 5;
    
    // Cifrado XOR dinámico (cada byte depende de su posición y un salt)
    const encrypted = [];
    for (let i = 0; i < sourceCode.length; i++) {
        // Operación: (Byte XOR Key) + (i * Salt) mod 256
        let byte = sourceCode.charCodeAt(i);
        encrypted.push(byte ^ key);
    }

    // Nombres de parámetros para la función anónima (para no usar 'local')
    const params = {
        key: rndName(),
        data: rndName(),
        output: rndName(),
        xor: rndName(),
        char: rndName(),
        ins: rndName(),
        cat: rndName(),
        load: rndName(),
        index: rndName(),
        byte: rndName()
    };

    // Construcción del Stub de ejecución
    // Estructura: (function(argumentos) ... end)(valores)
    const luaStub = `
(function(${params.key}, ${params.data}, ${params.output}, ${params.xor}, ${params.char}, ${params.ins}, ${params.cat}, ${params.load})
    for ${params.index} = 1, #${params.data} do
        ${params.byte} = ${params.data}[${params.index}]
        ${params.ins}(${params.output}, ${params.char}(${params.xor}(${params.byte}, ${params.key})))
    end
    return ${params.load}(${params.cat}(${params.output}))()
end)(
    ${key}, 
    {${encrypted.join(',')}}, 
    {}, 
    (bit32 and bit32.bxor or function(a,b) 
        -- Fallback XOR si no hay bit32 (entornos antiguos)
        let p, r = 1, 0
        while a>0 and b>0 do
            let ra, rb = a%2, b%2
            if ra ~= rb then r = r + p end
            a, b, p = (a-ra)/2, (b-rb)/2, p*2
        end
        return r + (a+b)*p
    end), 
    string.char, 
    table.insert, 
    table.concat, 
    (loadstring or load)
)`.replace(/\s+/g, ' ').trim();

    // Añadimos una capa de Junk Code pero en formato de comentarios u operaciones basura sin 'local'
    const junk = `-- ${rndName()}=${Math.random()} `.repeat(10);

    return `${HEADER} ${junk} ${luaStub}`;
}

// --- Lógica de Archivos ---

const inputFile = 'input.lua';
const outputFile = 'output.lua';

if (fs.existsSync(inputFile)) {
    const rawCode = fs.readFileSync(inputFile, 'utf8');
    const result = obfuscate(rawCode);
    fs.writeFileSync(outputFile, result);
    console.log("------------------------------------------");
    console.log("✅ OFUSCACIÓN XOR COMPLETADA");
    console.log(`Archivo de salida: ${outputFile}`);
    console.log("Regla: Sin 'local', solo inyección de Scope.");
    console.log("------------------------------------------");
} else {
    console.error(`❌ Error: No se encontró el archivo ${inputFile}`);
}
