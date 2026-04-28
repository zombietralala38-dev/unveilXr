const HEADER = `--[[ vvm-vault: SRESLEW AGGRESSIVE MODE v3.5 ]]`;

// Nombres cortos pero variados para no inflar KB
const S = "lIivV01Sxz".split("");
const genN = () => {
    let n = "";
    for(let i=0; i<4; i++) n += S[Math.floor(Math.random()*S.length)];
    return n + Math.floor(Math.random()*99);
};

const mangleStr = (s) => `string.char(${s.split('').map(c => c.charCodeAt(0)).join(',')})`;

// 1. TÉCNICA: JUNK WATERFALL (Crea cientos de líneas de basura funcional)
function generateMassiveJunk(amount) {
    let junk = "";
    for (let i = 0; i < amount; i++) {
        const v = genN();
        const r = Math.random();
        if (r < 0.2) junk += `local ${v} = function() return ${Math.random()} end; `;
        else if (r < 0.4) junk += `local ${v} = {${Math.floor(Math.random()*100)}}; ${v}[1] = ${v}[1] + 1; `;
        else if (r < 0.6) junk += `if (math.sin(${Math.random()}) > 2) then while true do end end; `;
        else if (r < 0.8) junk += `local ${v} = string.reverse("${genN()}"); `;
        else junk += `do local ${v} = getfenv() end; `;
    }
    return junk;
}

// 2. TÉCNICA: DEBUG MACHINE ANIDADA
function buildDebugMachine() {
    const d1 = genN(); const d2 = genN();
    return `local ${d1} = {os.clock, tick, debug.getinfo, getfenv}
    local function ${d2}(f) if f() == nil and false then while true do end end end
    for i=1, #(${d1}) do ${d2}(${d1}[i]) end `;
}

// 3. TÉCNICA: CONTROL FLOW FLATTENING (Muro de condicionales)
function flatten(blocks) {
    const pc = genN();
    let res = `local ${pc} = 0 while ${pc} < ${blocks.length} do `;
    blocks.forEach((b, i) => {
        res += `if ${pc} == ${i} then ${b} ${pc} = ${pc} + 1 `;
        // Inyectamos basura entre bloques para que no parezca una secuencia
        if (Math.random() > 0.5) res += `else local _ = "${genN()}" `;
    });
    return res + `end end `;
}

// 4. TÉCNICA: NESTED VM MACHINE (Cifrado Rolling XOR + Decode Loop)
function buildNestedVM(payload) {
    const key = Math.floor(Math.random()*150)+50;
    const salt = Math.floor(Math.random()*50)+5;
    let bytes = [];
    for(let i=0; i<payload.length; i++) {
        bytes.push((payload.charCodeAt(i) + key + (i * salt)) % 256);
    }

    const st = genN(); const dt = genN(); const idx = genN();
    // Capa 1 de la VM: Re-ensamblado de bytes con corrupción silenciosa
    let vm = `local ${dt} = {${bytes.join(',')}} local ${st} = {} `;
    vm += `for ${idx}=1, #${dt} do `;
    vm += `if type(print) ~= "function" then ${key} = ${key} + 1 end `; // Tamper check
    vm += `table.insert(${st}, string.char((${dt}[${idx}] - ${key} - ((${idx}-1) * ${salt})) % 256)) end `;
    
    // Capa 2: Ejecución Hoisted
    const exec = genN();
    vm += `local ${exec} = getfenv()[${mangleStr("loadstring")}] ${exec}(table.concat(${st}))() `;
    return vm;
}

function obfuscate(src) {
    if (!src) return "--";

    // Preparar el Payload (Mangle Strings inicial)
    let code = src.replace(/"(.*?)"/g, (m, s) => mangleStr(s));
    
    // Generar las capas de la "Sreslew"
    const step1 = generateMassiveJunk(15); // Bloque de inicio
    const step2 = buildDebugMachine();     // Protección
    const step3 = buildNestedVM(code);     // El corazón
    const step4 = generateMassiveJunk(10); // Bloque final

    // Aplicar Flattening a todo el conjunto para que se vea como un muro
    const wall = flatten([step1, step2, step3, step4]);

    // Unimos todo con el Waterfall de Junk (para que parezca gigante)
    const result = `
        ${HEADER}
        ${generateMassiveJunk(30)}
        ${wall}
        ${generateMassiveJunk(20)}
    `;

    // Minificamos espacios innecesarios pero mantenemos la densidad de código
    return result.replace(/\s+/g, " ").trim();
}

module.exports = { obfuscate };
