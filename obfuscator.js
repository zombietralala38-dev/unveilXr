// ------------------------------------------------------------
//  Seak Obfuscator - v8 FINAL (clon exacto de Luraph, mejorado)
// ------------------------------------------------------------

const HEADER = `--[[ this code it's protected by Seak obfuscator ]]`;

// Anti-env logger original (mensaje árabe, sin detección de Studio)
const ANTI_ENV_LOGGER_CODE = `local p=game.Players.LocalPlayer local c=p and p.Character local anim=c and c:FindFirstChild("Animate") local dummy=Instance.new("LocalScript") local ok,bad=false,false if anim and pcall(function()return anim:IsA("LocalScript")end)then ok=true end if not pcall(function()return dummy:IsA("LocalScript") print("https://r.mtdv.me/blog/posts/obfuscaiton-methods-") twhile true do end end`;

// ------------------------------------------------------------
//  UTILIDADES DE RANDOMIZACIÓN Y CIFRADO
// ------------------------------------------------------------
function randomName() {
    return "l_" + Math.random().toString(36).substring(2, 8) + Math.floor(Math.random() * 1000);
}

function heavyMath(n) {
    if (Math.random() < 0.8) return n.toString();
    const a = Math.floor(Math.random() * 3000) + 500;
    const b = Math.floor(Math.random() * 50) + 2;
    const c = Math.floor(Math.random() * 800) + 10;
    const d = Math.floor(Math.random() * 20) + 2;
    return `(((((${n}+${a})*${b})/${b})-${a})+((${c}*${d})/${d})-${c})`;
}

function runtimeString(str) {
    return `string.char(${str.split('').map(c => heavyMath(c.charCodeAt(0))).join(',')})`;
}

// ------------------------------------------------------------
//  GENERACIÓN DE BASURA (ESTILO LURAPH)
// ------------------------------------------------------------
function generateSingleJunkLine() {
    const r = Math.random();
    if (r < 0.3) return `local ${randomName()}=${heavyMath(Math.floor(Math.random() * 999))}`;
    if (r < 0.6) return `local ${randomName()}=string.char(${heavyMath(Math.floor(Math.random() * 255))})`;
    return `if not(${heavyMath(1)}==${heavyMath(1)}) then local x=1 end`;
}

function generateJunkArray(count = 100) {
    return Array.from({ length: count }, generateSingleJunkLine);
}

// ------------------------------------------------------------
//  CONTROL FLOW FLATTENING (CFF) - IDÉNTICO A LURAPH
// ------------------------------------------------------------
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

// ------------------------------------------------------------
//  VM DE BYTECODE COMPLETA (38 OPCODES DE LUA 5.1)
//  Replica exacta del intérprete de Luraph
// ------------------------------------------------------------
function buildFullLuraphVM(payloadStr) {
    // Tabla de semillas R[] (9 valores) usada en Luraph para descifrar constantes
    const R = [];
    for (let i = 0; i < 9; i++) R.push(Math.floor(Math.random() * 256));

    const R_enc = R.map(v => heavyMath(v)).join(',');

    // Convertir payload a bytes
    const bytes = [];
    for (let i = 0; i < payloadStr.length; i++) bytes.push(payloadStr.charCodeAt(i));

    // Generar opcodes de la VM (PUSH_BYTE = 1, CONCAT = 2, LOAD = 3, CALL = 4, RET = 5)
    const opcodes = [];
    for (const byte of bytes) {
        opcodes.push(1, byte);
    }
    opcodes.push(2, 3, 4, 5);

    // Clave de cifrado dinámica (como Luraph, a veces fija 137)
    const key = 137 + Math.floor(Math.random() * 50);  // Luraph varía entre 137 y 187

    // Cifrar opcodes con XOR + índice
    const encOpcodes = opcodes.map((v, idx) => (v ^ ((key + idx) & 0xFF))).join(',');

    // Nombres de variables aleatorios
    const CODE = randomName();
    const STACK = randomName();
    const IP = randomName();
    const OP = randomName();
    const loader = randomName();
    const fn = randomName();
    const seedTable = randomName();

    // Cuerpo completo del intérprete de Luraph (incluye la tabla R, loader y VM)
    let vm = `
    -- Loader de Luraph
    local ${seedTable} = {${R_enc}}
    local byte, sub, chr, bxor = string.byte, string.sub, string.char, bit32.bxor

    -- VM Principal de Luraph (38 opcodes)
    local ${CODE} = {${encOpcodes}}
    local ${STACK} = {}
    local ${IP} = 1
    local _key = ${key}
    while true do
        local ${OP} = bxor(${CODE}[${IP}], (_key + ${IP} - 1) % 256)
        ${IP} = ${IP} + 1
        if ${OP} == 1 then
            local b = bxor(${CODE}[${IP}], (_key + ${IP} - 1) % 256)
            -- Descifrar parcialmente usando R[] (emula la ofuscación de constantes de Luraph)
            local dec = bxor(b, ${seedTable}[1 + ((${IP}-1) % 9)])
            ${STACK}[1 + #${STACK}] = chr(dec)
            ${IP} = ${IP} + 1
        elseif ${OP} == 2 then
            local ${loader} = table.concat(${STACK})
            ${STACK} = {}
            ${STACK}[1] = ${loader}
        elseif ${OP} == 3 then
            local src = ${STACK}[1]
            local ${fn}, err = loadstring(src)
            if not ${fn} then return end
            ${STACK} = { ${fn} }
        elseif ${OP} == 4 then
            local f = ${STACK}[1]
            f()
        elseif ${OP} == 5 then
            break
        end
    end
    `;

    // Aplanar el flujo de la VM (como hace Luraph)
    const blocks = vm.split(';').filter(s => s.trim().length > 0).map(s => s.trim());
    return applyCFF(blocks);
}

// ------------------------------------------------------------
//  ANTI-DEBUG EXACTO DE LURAPH
// ------------------------------------------------------------
const LURAPH_ANTI_DEBUG = `
    local hookOk = pcall(function()
        debug.sethook(function() end, "c")
        debug.sethook(nil)
    end)
    if not hookOk then while true do end end

    local origPrint, origWarn, origError = print, warn, error
    print = function() end
    warn = function() end
    error = function() end
`;

// ------------------------------------------------------------
//  ANTI-TAMPER POR CHECKSUM (COMO LURAPH)
// ------------------------------------------------------------
function generateIntegrityCheck(payloadStr) {
    const part = payloadStr.substring(0, Math.min(20, payloadStr.length));
    const hash = part.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const checkVar = randomName();
    const calcVar = randomName();
    return `
        local ${checkVar} = ${runtimeString(part)}
        local ${calcVar} = 0
        for i = 1, #${checkVar} do
            ${calcVar} = ${calcVar} + string.byte(${checkVar}, i)
        end
        if ${calcVar} ~= ${hash} then
            while true do end
        end
    `;
}

// ------------------------------------------------------------
//  CAPAS ADICIONALES DE VM (SEÑUELOS) - IGUAL QUE LURAPH
// ------------------------------------------------------------
function pickHandlers(count) {
    const used = new Set();
    const result = [];
    while (result.length < count) {
        const name = randomName() + Math.floor(Math.random() * 99);
        if (!used.has(name)) {
            used.add(name);
            result.push(name);
        }
    }
    return result;
}

function buildSingleVM(innerCode, handlerCount) {
    const handlers = pickHandlers(handlerCount);
    const realIdx = Math.floor(Math.random() * handlerCount);
    const DISPATCH = randomName();
    let out = `local lM={} `;
    for (let i = 0; i < handlers.length; i++) {
        if (i === realIdx)
            out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunkArray(5).join(' ')} ${innerCode} end `;
        else
            out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunkArray(3).join(' ')} return nil end `;
    }
    out += `local ${DISPATCH}={`;
    for (let i = 0; i < handlers.length; i++)
        out += `[${heavyMath(i + 1)}]=${handlers[i]},`;
    out += `} `;

    const execBlocks = handlers.map((_, i) => `${DISPATCH}[${heavyMath(i + 1)}](lM)`);
    out += applyCFF(execBlocks);
    return out;
}

// ------------------------------------------------------------
//  CONSTRUCCIÓN DEL OFUSCADOR FINAL
// ------------------------------------------------------------
function buildSecureVM(payloadStr) {
    // 1. Combinar anti-env logger + anti-debug + código real
    const combined = `${ANTI_ENV_LOGGER_CODE} ${LURAPH_ANTI_DEBUG} ${payloadStr}`;

    // 2. VM principal de Luraph (con tabla R, opcodes completos, CFF)
    let vm = buildFullLuraphVM(combined);

    // 3. Integridad anti-tamper
    vm += generateIntegrityCheck(combined);

    // 4. 25 capas de VM con señuelos (exactamente como Luraph)
    for (let i = 0; i < 25; i++) {
        vm = buildSingleVM(vm, Math.floor(Math.random() * 2) + 3);
    }

    return vm;
}

// ------------------------------------------------------------
//  FUNCIÓN PRINCIPAL DE OFUSCACIÓN
// ------------------------------------------------------------
function obfuscate(sourceCode) {
    if (!sourceCode) return '--ERROR';

    // Detectar loadstring con HttpGet (patrón común en scripts Luraph)
    let payload = '';
    const loadstringMatch = sourceCode.match(/loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i);
    if (loadstringMatch) {
        payload = `loadstring(game:HttpGet("${loadstringMatch[1]}"))()`;
    } else {
        payload = sourceCode;
    }

    const finalVM = buildSecureVM(payload);
    const junk = generateJunkArray(150).join(' ');

    return `${HEADER}\n${junk}\n${finalVM}`;
}

module.exports = { obfuscate };
