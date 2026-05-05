// ═══════════════════════════════════════════════════
//  OFUSCADOR VM ANTI-TODO - v4.20 "Rick & Morty"
// ═══════════════════════════════════════════════════
// SIN Math.random, SIN IL_POOL, SIN piedad.
// 200 trozos anti-env con VM corrompido + locker ciego.

// ── PRNG determinista (reemplaza Math.random) ──
let seed = 0x5EED;
function nextRand() {
    seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF;
    return seed / 0x7FFFFFFF;
}
function randInt(max) {
    return (nextRand() * max) | 0;  // |0 reemplaza Math.floor
}
function floor(n) { return n | 0; }

// ── Nombres sin IL_POOL ──
const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
function randomName(len = 6) {
    let s = "";
    for (let i = 0; i < len; i++) s += ALPHABET[randInt(ALPHABET.length)];
    return s;
}

// ── Aritmética sin Math ──
function heavyMath(n) {
    // evita Math.random, genera expresión ofuscada
    if (nextRand() < 0.8) return n.toString();
    let a = randInt(3000) + 500;
    let b = randInt(50) + 2;
    let c = randInt(800) + 10;
    let d = randInt(20) + 2;
    return `(((((${n}+${a})*${b})/${b})-${a})+((${c}*${d})/${d})-${c})`;
}

function mba() {
    let n = nextRand() > 0.5 ? 1 : 2;
    let a = randInt(70) + 15;
    let b = randInt(40) + 8;
    return `((${n}*${a}-${a})/(${b}+1)+${n})`;
}

// ── Mapeos originales ──
const MAPEO = {
    "ScreenGui":"Aggressive Renaming","Frame":"String to Math","TextLabel":"Table Indirection",
    "TextButton":"Mixed Boolean Arithmetic","Humanoid":"Dynamic Junk","Player":"Fake Flow",
    "RunService":"Virtual Machine","TweenService":"Fake Flow","Players":"Fake Flow"
};

function detectAndApplyMappings(code) {
    let modified = code, headers = "";
    for (const [word, tech] of Object.entries(MAPEO)) {
        const regex = new RegExp(`\\b${word}\\b`, "g");
        if (regex.test(modified)) {
            let replacement = `"${word}"`;
            if (tech.includes("Aggressive Renaming")) {
                const v = randomName(8);
                headers += `local ${v}="${word}";`;
                replacement = v;
            } else if (tech.includes("String to Math")) {
                replacement = `string.char(${word.split('').map(c => heavyMath(c.charCodeAt(0))).join(',')})`;
            } else if (tech.includes("Mixed Boolean Arithmetic")) {
                replacement = `((${mba()}==1 or true)and"${word}")`;
            }
            regex.lastIndex = 0;
            modified = modified.replace(regex, () => `game[${replacement}]`);
        }
    }
    return headers + modified;
}

// ── Basura CODE VAULT (tarpits, opacos) ──
function generateJunk(lines = 100) {
    let j = '';
    for (let i = 0; i < lines; i++) {
        const r = nextRand();
        if (r < 0.2) j += `local ${randomName()}=${heavyMath(randInt(999))} `;
        else if (r < 0.4) j += `local ${randomName()}=string.char(${heavyMath(randInt(255))}) `;
        else if (r < 0.5) j += `if not(${heavyMath(1)}==${heavyMath(1)}) then local _=1 end `;
        else if (r < 0.7) {
            const tp = randomName();
            j += `if type(nil)=="number" then while true do local ${tp}=1 end end `;
        } else if (r < 0.85) {
            const vt = randomName();
            j += `do local ${vt}={} ${vt}["_"]=1 ${vt}=nil end `;
        } else {
            j += `if type(math.pi)=="string" then local _=1 end `;
        }
    }
    return j;
}

// ── Flujo plano (CFF) ──
function applyCFF(blocks) {
    const stateVar = randomName();
    let lua = `local ${stateVar}=${heavyMath(1)} while true do `;
    for (let i = 0; i < blocks.length; i++) {
        if (i === 0) lua += `if ${stateVar}==${heavyMath(1)} then ${blocks[i]} ${stateVar}=${heavyMath(2)} `;
        else lua += `elseif ${stateVar}==${heavyMath(i + 1)} then ${blocks[i]} ${stateVar}=${heavyMath(i + 2)} `;
    }
    lua += `elseif ${stateVar}==${heavyMath(blocks.length + 1)} then break end end `;
    return lua;
}

// ── VM verdadera con cifrado rodante ──
function buildTrueVM(payloadStr, extraOpts = {}) {
    const STACK = randomName(); const KEY = randomName(); const ORDER = randomName();
    const SALT = randomName();
    const seedVal = randInt(200) + 50;
    const saltVal = randInt(250) + 1;
    let vmCore = `local ${STACK}={} local ${KEY}=${heavyMath(seedVal)} local ${SALT}=${heavyMath(saltVal)} `;
    const chunkSize = 15;
    let realChunks = [];
    for (let i = 0; i < payloadStr.length; i += chunkSize) realChunks.push(payloadStr.slice(i, i + chunkSize));
    let poolVars = [], realOrder = [];
    let totalChunks = realChunks.length * 3;
    let currentReal = 0, globalIndex = 0;
    for (let i = 0; i < totalChunks; i++) {
        let memName = randomName(7);
        poolVars.push(memName);
        if (currentReal < realChunks.length && (nextRand() > 0.5 || (totalChunks - i) === (realChunks.length - currentReal))) {
            realOrder.push(i + 1);
            let chunk = realChunks[currentReal];
            let encryptedBytes = [];
            for (let j = 0; j < chunk.length; j++) {
                let enc = (chunk.charCodeAt(j) + seedVal + (globalIndex * saltVal)) % 256;
                encryptedBytes.push(heavyMath(enc));
                globalIndex++;
            }
            vmCore += `local ${memName}={${encryptedBytes.join(',')}} `;
            currentReal++;
        } else {
            let fakeBytes = [];
            for (let j = 0; j < randInt(20) + 5; j++) fakeBytes.push(heavyMath(randInt(255)));
            vmCore += `local ${memName}={${fakeBytes.join(',')}} `;
        }
    }
    vmCore += `local _pool={${poolVars.join(',')}} local ${ORDER}={${realOrder.map(n => heavyMath(n)).join(',')}} `;
    const idxVar = randomName(), byteVar = randomName();
    vmCore += `local _gIdx=0 for _, ${idxVar} in ipairs(${ORDER}) do for _, ${byteVar} in ipairs(_pool[${idxVar}]) do `;
    vmCore += `if type(math.pi)=="string" then ${KEY}=(${KEY}+137)%256 end `; // corrupción silenciosa
    vmCore += `table.insert(${STACK}, string.char((${byteVar} - ${KEY} - _gIdx * ${SALT}) % 256)) _gIdx=_gIdx+1 end end `;
    vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `;
    const ASSERT = `getfenv()["assert"]`;
    const LOADSTRING = `getfenv()["loadstring"]`;
    const GAME = `getfenv()["game"]`;
    const HTTPGET = `"HttpGet"`;
    if (payloadStr.includes("http")) {
        vmCore += `${ASSERT}(${LOADSTRING}(${GAME}[${HTTPGET}](${GAME}, _e)))() `;
    } else {
        vmCore += `${ASSERT}(${LOADSTRING}(_e))() `;
    }
    return vmCore;
}

// ── VM simple (para anidar) ──
function buildSingleVM(innerCode, handlerCount) {
    const handlers = [];
    for (let i = 0; i < handlerCount; i++) handlers.push(randomName(6));
    const realIdx = randInt(handlerCount);
    const DISPATCH = randomName();
    let out = `local lM={} `;
    for (let i = 0; i < handlers.length; i++) {
        if (i === realIdx) out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(5)} ${innerCode} end `;
        else out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(3)} return nil end `;
    }
    out += `local ${DISPATCH}={`;
    for (let i = 0; i < handlers.length; i++) out += `[${heavyMath(i+1)}]=${handlers[i]},`;
    out += `} `;
    let execBlocks = [];
    for (let i = 0; i < handlers.length; i++) execBlocks.push(`${DISPATCH}[${heavyMath(i+1)}](lM)`);
    out += applyCFF(execBlocks);
    return out;
}

// ── Nested VM configurable ──
function buildNestedVM(payloadStr, depth) {
    let vm = buildTrueVM(payloadStr);
    for (let i = 0; i < depth; i++) {
        vm = buildSingleVM(vm, randInt(3) + 3);
    }
    return vm;
}

// ── Locker CIEGO (clave dinámica del entorno) ──
function buildCiegoLocker(codeToLock) {
    // Clave ciega derivada del entorno: dirección de una función + os.clock
    const keySource = `(function() local k={} local f=function() end k[1]=tostring(f):byte(1,8) return k[1][1]+(os.clock()*1000)%256 end)()`;
    return `
        local _ciegoKey = ${keySource}
        local _ciegoStr = "${btoa(codeToLock)}" -- base64 simple
        local _dec = {}
        for i=1,#_ciegoStr do
            _dec[i] = string.char((string.byte(_ciegoStr,i) - _ciegoKey) % 256)
        end
        local _payload = table.concat(_dec)
        assert(loadstring(_payload))()
    `;
}

// ── Locker SELF-LOVE (auto-integridad) ──
function buildSelfLoveLocker(innerCode) {
    // Suma de comprobación del propio código (se excluye a sí mismo)
    return `
        local _self = debug.getinfo(1,"S").source
        local _hash = 0
        for i=1,#_self do _hash = (_hash + string.byte(_self,i)) % 256 end
        if _hash ~= ${heavyMath(innerCode.length % 256)} then while true do end end
        ${innerCode}
    `;
}

// ── ANTI-ENV LOGGER PARTIDO EN 200 TROCOS + VM CORROMPIDO ──
function generateAntiEnvParted(splits = 200) {
    // Código base anti-entorno
    const baseCode = `
        local _clk = os.clock
        local _t = _clk()
        for _=1,150000 do end
        if os.clock()-_t > 5.0 then while true do end end
        if debug and debug.getinfo then
            local _i = debug.getinfo(1)
            if _i.what ~= "main" then while true do end end
        end
        local _ok, _e = pcall(function() error("__v") end)
        if not string.find(tostring(_e), "__v") then while true do end end
        if getmetatable(_G) then while true do end end
        if type(print) ~= "function" then while true do end end
        if math.pi < 3.14 or math.pi > 3.15 then while true do end end
        if bit32 and bit32.bxor(10,5) ~= 15 then while true do end end
        if type(coroutine.create) ~= "function" then while true do end end
        if string.len("a") ~= 1 then while true do end end
        if (true and 1 or 2) ~= 1 then while true do end end
    `;
    // Dividir en trozos
    const chunkLen = Math.ceil(baseCode.length / splits);
    let chunks = [];
    for (let i = 0; i < baseCode.length; i += chunkLen) {
        chunks.push(baseCode.slice(i, i + chunkLen));
    }
    // Ajustar a exactamente 'splits' trozos (si hay menos, añadir basura)
    while (chunks.length < splits) {
        chunks.push(`local ${randomName()}=nil `);
    }
    // Cada trozo se mete en una mini-VM que lo descifra y lo guarda en una tabla global
    const globalTableName = randomName(8);
    let finalCode = `local ${globalTableName} = {} `;
    chunks.forEach((chunk, idx) => {
        // VM individual para cada trozo usando cifrado propio
        const encryptedChunk = chunk.split('').map(c => (c.charCodeAt(0) + idx + 42) % 256);
        const chunkVar = randomName(6);
        finalCode += `local ${chunkVar} = {${encryptedChunk.join(',')}} `;
        finalCode += `local ${randomName()} = {} for _,v in ipairs(${chunkVar}) do table.insert(${randomName()}, string.char((v - ${idx} - 42) % 256)) end `;
        finalCode += `${globalTableName}[${idx+1}] = table.concat(${randomName()}) `;
    });
    // Reconstruir y ejecutar
    finalCode += `local _antiEnv = table.concat(${globalTableName}) `;
    finalCode += `local _af = loadstring(_antiEnv) if _af then _af() else while true do end end `;

    // Envolver todo en una VM nested para mayor ofuscación
    return buildTrueVM(finalCode);
}

// ── Obfuscate principal con todas las opciones ──
function obfuscate(sourceCode, options = {}) {
    const {
        debug = false,
        nestingDepth = 17,          // default profundidad original
        ciego = true,                // activar locker ciego
        selfLove = true,            // activar locker self-love
        antiEnvSplits = 200         // trozos del anti-env
    } = options;

    if (!sourceCode) return '-- ERROR: null code';

    // Payload base
    const isLoadstringRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i;
    let payloadToProtect = "";
    const match = sourceCode.match(isLoadstringRegex);
    if (match) payloadToProtect = match[1];
    else payloadToProtect = detectAndApplyMappings(sourceCode);

    // Debug: sin ofuscación real
    if (debug) {
        return `print("DEBUG VM: ${payloadToProtect}")`;
    }

    // Aplicar lockers
    let protectedPayload = payloadToProtect;
    if (ciego) {
        protectedPayload = buildCiegoLocker(protectedPayload);
    }
    if (selfLove) {
        protectedPayload = buildSelfLoveLocker(protectedPayload);
    }

    // Generar partes
    const antiEnvCode = generateAntiEnvParted(antiEnvSplits);
    const mainVM = buildNestedVM(protectedPayload, nestingDepth);
    const baseJunk = generateJunk(50);
    const header = `--[[ PROTEGIDO POR VM CIEGO + AUTO-AMOR ]]`;

    const fullCode = `${header} ${baseJunk} ${antiEnvCode} ${mainVM}`;
    return fullCode.replace(/\s+/g, " ").trim();
}

module.exports = { obfuscate };
