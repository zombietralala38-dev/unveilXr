// ------------------------------------------------------------
//  Seak Obfuscator – vFINAL (clon exacto de Luraph, formato binario preempaquetado)
// ------------------------------------------------------------

const HEADER = `--[[ this code is protected by Seak obfuscator ]]`;

// Anti‑env logger original (sin detección de Studio)
const ANTI_ENV_LOGGER_CODE = `local p=game.Players.LocalPlayer local c=p and p.Character local anim=c and c:FindFirstChild("Animate") local dummy=Instance.new("LocalScript") local ok,bad=false,false if anim and pcall(function()return anim:IsA("LocalScript")end)then ok=true end if not pcall(function()return dummy:IsA("LocalScript") print("https://r.mtdv.me/blog/posts/obfuscaiton-methods-") twhile true do end end`;

// ---------------------- Utilidades (estilo Luraph) ----------------------
function randomName() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let s = '';
    for (let i = 0; i < 15; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
}

// Ofuscación de números exactamente como Luraph (expansión matemática)
function luraphMath(n) {
    if (Math.random() < 0.8) return n.toString();  // a veces los deja limpios
    const a = Math.floor(Math.random() * 3000) + 500;
    const b = Math.floor(Math.random() * 50) + 2;
    const c = Math.floor(Math.random() * 800) + 10;
    const d = Math.floor(Math.random() * 20) + 2;
    return `(((((${n}+${a})*${b})/${b})-${a})+((${c}*${d})/${d})-${c})`;
}

function runtimeString(str) {
    return `string.char(${str.split('').map(c => luraphMath(c.charCodeAt(0))).join(',')})`;
}

// Basura idéntica a la de Luraph (predicados opacos y variables muertas)
function generateSingleJunkLine() {
    const r = Math.random();
    if (r < 0.3) return `local ${randomName()}=${luraphMath(Math.floor(Math.random() * 999))};`;
    else if (r < 0.6) return `local ${randomName()}=string.char(${luraphMath(Math.floor(Math.random() * 255))});`;
    else return `if not(${luraphMath(1)}==${luraphMath(1)})then local x=1 end;`;
}

function generateJunkArray(count) {
    return Array.from({ length: count }, generateSingleJunkLine);
}

// ---------------------- Control Flow Flattening (CFF) ----------------------
function applyCFF(blocks) {
    const stateVar = randomName();
    let lua = `local ${stateVar}=${luraphMath(1)}; while true do `;
    for (let i = 0; i < blocks.length; i++) {
        if (i === 0) lua += `if ${stateVar}==${luraphMath(1)} then ${blocks[i]} ${stateVar}=${luraphMath(2)} `;
        else lua += `elseif ${stateVar}==${luraphMath(i + 1)} then ${blocks[i]} ${stateVar}=${luraphMath(i + 2)} `;
    }
    lua += `elseif ${stateVar}==${luraphMath(blocks.length + 1)} then break end end `;
    return lua;
}

// ---------------------- VM Binaria Preempaquetada (idéntica a Luraph) ----------------------
function buildBinaryVM(payloadStr) {
    // 1. Empaquetar binario: DWORD (4 bytes) tamaño + payload bytes
    const len = payloadStr.length;
    const lenBytes = [
        (len >> 24) & 0xFF,
        (len >> 16) & 0xFF,
        (len >> 8) & 0xFF,
        len & 0xFF
    ];
    const payloadBytes = [];
    for (let i = 0; i < len; i++) {
        payloadBytes.push(payloadStr.charCodeAt(i));
    }
    const allBytes = lenBytes.concat(payloadBytes);

    // 2. Cifrar con XOR (clave dinámica, igual que Luraph)
    const key = Math.floor(Math.random() * 200) + 50;
    const encrypted = allBytes.map((b, idx) => (b ^ ((key + idx) & 0xFF)));

    // 3. Cinta binaria cifrada (string Lua)
    const tape = encrypted.map(b => luraphMath(b)).join(',');

    // Nombres de variables ofuscados
    const DATA   = randomName();   // string binario
    const POS    = randomName();   // puntero
    const GETB   = randomName();   // getByte()
    const GETDW  = randomName();   // getDWORD()
    const GETSTR = randomName();   // getString()
    const SRC    = randomName();   // código fuente desempaquetado
    const F      = randomName();   // función cargada

    // 4. Construir el intérprete (cuerpo principal)
    const vmCode = `
        local ${DATA} = string.char(${tape});
        local ${POS} = ${luraphMath(1)};
        local key = ${key};

        local function ${GETB}()
            local b = string.byte(${DATA}, ${POS}, ${POS});
            ${POS} = ${POS} + ${luraphMath(1)};
            return bit32.bxor(b, (key + ${POS} - ${luraphMath(2)}) % 256);
        end

        local function ${GETDW}()
            local b1 = ${GETB}();
            local b2 = ${GETB}();
            local b3 = ${GETB}();
            local b4 = ${GETB}();
            return b1 * 16777216 + b2 * 65536 + b3 * 256 + b4;
        end

        local function ${GETSTR}(len)
            local t = {};
            for i = ${luraphMath(1)}, len do
                t[i] = string.char(${GETB}());
            end
            return table.concat(t);
        end

        -- Desempaquetar tamaño y código fuente
        local len = ${GETDW}();
        local ${SRC} = ${GETSTR}(len);

        -- Ejecutar (igual que Luraph)
        local ${F}, err = loadstring(${SRC});
        if ${F} then ${F}() end;
    `;

    // 5. Aplanar el flujo de la VM con CFF
    const blocks = vmCode.split(';').filter(s => s.trim().length > 0).map(s => s.trim());
    return applyCFF(blocks);
}

// ---------------------- Anti‑debug (Luraph exacto) ----------------------
const ANTI_DEBUG_CODE = `
    local hookOk = pcall(function()
        debug.sethook(function() end, "c");
        debug.sethook(nil);
    end);
    if not hookOk then while true do end end;

    local origPrint, origWarn, origError = print, warn, error;
    print = function() end;
    warn = function() end;
    error = function() end;
`;

// ---------------------- Capas de VM señuelo (Multi‑handler) ----------------------
function pickHandlers(count) {
    const used = new Set();
    const res = [];
    while (res.length < count) {
        const n = randomName() + Math.floor(Math.random() * 99);
        if (!used.has(n)) { used.add(n); res.push(n); }
    }
    return res;
}

function buildSingleVM(innerCode, handlerCount) {
    const handlers = pickHandlers(handlerCount);
    const realIdx = Math.floor(Math.random() * handlerCount);
    const DISPATCH = randomName();
    let out = `local lM={}; `;
    for (let i = 0; i < handlers.length; i++) {
        if (i === realIdx) {
            out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunkArray(5).join(' ')} ${innerCode} end; `;
        } else {
            out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunkArray(3).join(' ')} return nil end; `;
        }
    }
    out += `local ${DISPATCH}={`;
    for (let i = 0; i < handlers.length; i++) {
        out += `[${luraphMath(i + 1)}]=${handlers[i]},`;
    }
    out += `}; `;
    const execBlocks = handlers.map((_, i) => `${DISPATCH}[${luraphMath(i + 1)}](lM)`);
    out += applyCFF(execBlocks);
    return out;
}

// ---------------------- Construcción final del blindaje ----------------------
function buildSecureVM(payloadStr) {
    // 1. Unir todo: anti‑env logger + anti‑debug + código real
    const combined = `${ANTI_ENV_LOGGER_CODE} ${ANTI_DEBUG_CODE} ${payloadStr}`;

    // 2. VM binaria principal (formato preempaquetado)
    let vm = buildBinaryVM(combined);

    // 3. 25 capas de VM señuelo (igual que Luraph)
    for (let i = 0; i < 25; i++) {
        vm = buildSingleVM(vm, Math.floor(Math.random() * 2) + 3);
    }

    return vm;
}

// ---------------------- Función principal de ofuscación ----------------------
function obfuscate(sourceCode) {
    if (!sourceCode) return '--ERROR';

    // Si el script original es un loadstring(HttpGet(...))() extraemos la URL
    let payload = sourceCode;
    const match = sourceCode.match(/loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i);
    if (match) {
        payload = `loadstring(game:HttpGet("${match[1]}"))()`;
    }

    // Blindar completamente
    const finalVM = buildSecureVM(payload);

    // Basura externa (150 líneas) para camuflaje
    const junk = generateJunkArray(150).join(' ');

    return `${HEADER}\n${junk}\n${finalVM}`;
}

module.exports = { obfuscate };
