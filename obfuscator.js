// ============================================================
//  Seak Obfuscator v11.0 – Robusto + XOR + VM Luraph
// ============================================================

const CONFIG = {
    watermark: "--[[ this code it's protected by Seak obfuscator ]]",
    antiEnv: true,                // activar protección anti‑entorno
    vmCapas: 15,                  // capas de dispatcher adicionales
    junkLines: 50,                // líneas de basura extra
    xorIntensity: 0.7             // 70% de números se ofuscan con XOR
};

const HEADER = CONFIG.watermark;

// ---------- UTILIDADES ----------
function randomName() {
    return "_" + Math.random().toString(36).substring(2, 8) + Math.floor(Math.random() * 1000);
}

// Número ofuscado con XOR (la mayoría)
function xorNumber(n) {
    const key = Math.floor(Math.random() * 200) + 30;
    return `bit32.bxor(${n}, ${key})`;
}

// Número ofuscado con aritmética pesada (solo el 30%)
function heavyMath(n) {
    if (Math.random() < 0.3) {
        let a = Math.floor(Math.random() * 3000) + 500;
        let b = Math.floor(Math.random() * 50) + 2;
        let c = Math.floor(Math.random() * 800) + 10;
        let d = Math.floor(Math.random() * 20) + 2;
        return `(((((${n}+${a})*${b})/${b})-${a})+((${c}*${d})/${d})-${c})`;
    }
    return n.toString();
}

// Elegir método según intensidad de XOR configurada
function obfNumber(n) {
    return Math.random() < CONFIG.xorIntensity ? xorNumber(n) : heavyMath(n);
}

// Cifrar string a bytes ofuscados con XOR (devuelve array de números)
function xorStringToBytes(str, key) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
        bytes.push(obfNumber(str.charCodeAt(i) ^ key));
    }
    return bytes;
}

// Línea de basura con poco impacto en variables
function generateJunkLine() {
    const r = Math.random();
    if (r < 0.3) return `local ${randomName()} = ${obfNumber(Math.floor(Math.random() * 999))};`;
    if (r < 0.6) return `local ${randomName()} = string.char(${obfNumber(Math.floor(Math.random() * 255))});`;
    if (r < 0.8) return `if bit32.bxor(1,1) == 0 then while true do end end;`;
    return `do local ${randomName()} = {}; ${randomName()}[1] = nil; end;`;
}

// ---------- MÁQUINA VIRTUAL ESTILO LURAPH ----------
function buildLuraphVM(code) {
    const key = Math.floor(Math.random() * 200) + 30;
    const chunkSize = 3 + Math.floor(Math.random() * 4);   // fragmentos pequeños
    const chunks = [];
    for (let i = 0; i < code.length; i += chunkSize) {
        chunks.push(code.slice(i, i + chunkSize));
    }

    const instrTable = randomName();
    let init = `local ${instrTable} = {}; `;

    // Cada instrucción es un array de bytes cifrados con XOR
    chunks.forEach((chunk, idx) => {
        const encrypted = xorStringToBytes(chunk, key);
        init += `${instrTable}[${obfNumber(idx + 1)}] = {${encrypted.join(',')}}; `;
    });

    const resultVar = randomName();
    const loopVar = randomName();
    const decodedVar = randomName();

    // Bucle que descifra, concatena y ejecuta
    const decodeCode = `
        local ${resultVar} = "";
        for ${loopVar} = 1, #${instrTable} do
            local ${decodedVar} = ${instrTable}[${loopVar}];
            for _, b in ipairs(${decodedVar}) do
                ${resultVar} = ${resultVar} .. string.char(bit32.bxor(b, ${obfNumber(key)}));
            end;
        end;
        assert(loadstring(${resultVar}))();
    `;

    return init + decodeCode;
}

// ---------- CAPA DE DISPATCHER (FALSA RAMIFICACIÓN) ----------
function buildDispatcher(innerCode) {
    const nHandlers = 2 + Math.floor(Math.random() * 3);
    const realIdx = Math.floor(Math.random() * nHandlers);
    const dispatchTable = randomName();
    let code = `local ${dispatchTable} = {}; `;

    for (let i = 0; i < nHandlers; i++) {
        const hName = randomName();
        if (i === realIdx) {
            code += `local ${hName} = function() ${innerCode} end; `;
        } else {
            code += `local ${hName} = function() return nil; end; `;
        }
        code += `${dispatchTable}[${obfNumber(i + 1)}] = ${hName}; `;
    }

    const selected = randomName();
    code += `local ${selected} = ${obfNumber(realIdx + 1)}; `;
    code += `${dispatchTable}[${selected}]();`;
    return code;
}

// ---------- ANTI‑ENV LOGGER (ROBUSTO, CON TABLA) ----------
function buildAntiEnvBlock() {
    // Código que se ejecutará para detectar inyecciones (todos los checks que tenías)
    const envCode = `local _r,_n={},0;local function _p(v) _n=_n+1;_r[_n]=v and 1 or 0;end;do local p=true;pcall(function() local ts=game:GetService("TweenService") if not ts then return end local f=Instance.new("Frame") local tw=ts:Create(f,TweenInfo.new(0.1),{Size=UDim2.new(1,0,1,0)}) local t=os.clock() tw:Play() tw.Completed:Wait() if math.abs(os.clock()-t-0.1)>0.05 then p=false end f:Destroy() end) _p(p) end;do local p=true;pcall(function() local s=Instance.new("Sound") if pcall(function() s.PlaybackLoudness=99 end) then p=false end s:Destroy() end) _p(p) end;do local p=true;pcall(function() if not Instance then return end local f=Instance.new("Frame") if typeof(f)~="Instance" then p=false end f:Destroy() end) _p(p) end;do local p=true;pcall(function() if not game then return end if game.PlaceId==game.GameId then p=false end end) _p(p) end;do local p=true;pcall(function() local tb=Instance.new("TextBox") if pcall(function() tb.TextBounds=Vector2.new(1,1) end) then p=false end tb:Destroy() end) _p(p) end;local _s=0;for i=1,_n do _s=_s+_r[i] end;if _s~=_n then while true do end end`;

    const key = Math.floor(Math.random() * 200) + 30;
    const chunkSize = 5 + Math.floor(Math.random() * 3);  // fragmentos pequeños
    const chunks = [];
    for (let i = 0; i < envCode.length; i += chunkSize) {
        chunks.push(envCode.slice(i, i + chunkSize));
    }

    const tableName = randomName();

    // 1. Línea que crea la tabla (debe ir al principio)
    const initLine = `local ${tableName} = {};`;

    // 2. Por cada fragmento creamos una entrada en la tabla con {clave, bytes}
    const fragmentLines = [];
    chunks.forEach(chunk => {
        const bytes = xorStringToBytes(chunk, key);
        fragmentLines.push(`table.insert(${tableName}, {${obfNumber(key)}, {${bytes.join(',')}}});`);
    });

    // 3. Reconstructor (va al final, ya con la tabla llena)
    const reconstVar = randomName();
    const reconstructLine = `
        local ${reconstVar} = "";
        for _, __e in ipairs(${tableName}) do
            local __k = __e[1];
            local __b = __e[2];
            for _, __v in ipairs(__b) do
                ${reconstVar} = ${reconstVar} .. string.char(bit32.bxor(__v, __k));
            end;
        end;
        assert(loadstring(${reconstVar}))();
    `;

    // Devolvemos las tres partes por separado
    return { initLine, fragmentLines, reconstructLine };
}

// ---------- OFUSCACIÓN PRINCIPAL ----------
function obfuscate(sourceCode) {
    if (!sourceCode) return '--ERROR';

    const antiEnv = CONFIG.antiEnv ? buildAntiEnvBlock() : null;

    // Generar basura
    const junk = [];
    for (let i = 0; i < CONFIG.junkLines; i++) {
        junk.push(generateJunkLine());
    }

    // Construir array de salida con el orden correcto
    const lines = [];

    // 1. Inicializar la tabla (si hay anti‑env) al principio absoluto
    if (antiEnv) {
        lines.push(antiEnv.initLine);
    }

    // 2. Basura
    lines.push(...junk);

    // 3. Insertar fragmentos del anti‑env en posiciones aleatorias PERO nunca en índice 0
    if (antiEnv) {
        antiEnv.fragmentLines.forEach(line => {
            // Elegir posición aleatoria desde 1 en adelante (nunca 0)
            const pos = Math.floor(Math.random() * (lines.length - 1)) + 1;
            lines.splice(pos, 0, line);
        });
    }

    // 4. Reconstructor al final del bloque
    if (antiEnv) {
        lines.push(antiEnv.reconstructLine);
    }

    // Anti‑debugger simple
    const antiDebug = `if getmetatable(_G)~=nil then while true do end end;`;

    // Preparar payload
    let payload = sourceCode;
    // Si es un loadstring con HttpGet, extraemos la URL
    if (/loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(/i.test(payload)) {
        const match = payload.match(/HttpGet\s*\(\s*["']([^"']+)["']\s*\)/i);
        if (match) payload = match[1];
    }

    // Envolver en VM Luraph
    let vmCode = buildLuraphVM(payload);
    // Añadir capas de dispatcher
    for (let i = 0; i < CONFIG.vmCapas; i++) {
        vmCode = buildDispatcher(vmCode);
    }

    // Resultado final (compactamos espacios para que quede una sola línea)
    const result = `${HEADER} ${antiDebug} ${lines.join(' ')} ${vmCode}`;
    return result.replace(/\s+/g, ' ').trim();
}

module.exports = { obfuscate };
