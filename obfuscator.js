// ============================================================
//  Seak Obfuscator v15.0 – v4 Robusta + Anti‑env al final + VM Luraph
// ============================================================

const CONFIG = {
    watermark: "--[[ this code it's protected by Seak obfuscator ]]",
    antiEnv: true,                // Protección anti‑entorno
    vmCapas: 18,                  // Capas de dispatcher (más = más ilegible)
    junkLines: 80,                // Líneas de basura
    xorIntensity: 0.7             // 70% de números usan XOR, el resto heavyMath
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

// Número con aritmética pesada (solo el 30% de los casos)
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

// Cifrar un string con XOR y devolver array de números ofuscados
function xorStringToBytes(str, key) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
        bytes.push(obfNumber(str.charCodeAt(i) ^ key));
    }
    return bytes;
}

// Línea de basura con poco impacto en variables locales
function generateJunkLine() {
    const r = Math.random();
    if (r < 0.3) return `local ${randomName()} = ${obfNumber(Math.floor(Math.random() * 999))};`;
    if (r < 0.6) return `local ${randomName()} = string.char(${obfNumber(Math.floor(Math.random() * 255))});`;
    if (r < 0.8) return `if bit32.bxor(1,1) == 0 then while true do end end;`;
    return `do local ${randomName()} = {}; ${randomName()}[1] = nil; end;`;
}

// ---------- VM ESTILO LURAPH (INSTRUCCIONES CIFRADAS) ----------
function buildLuraphVM(code) {
    const key = Math.floor(Math.random() * 200) + 30;
    const chunkSize = 3 + Math.floor(Math.random() * 4);   // Fragmentos pequeños
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

// ---------- CAPA DE DISPATCHER (CON HANDLERS FALSOS) ----------
function buildDispatcher(innerCode) {
    const nHandlers = 2 + Math.floor(Math.random() * 4);   // De 2 a 5 handlers
    const realIdx = Math.floor(Math.random() * nHandlers);  // El verdadero
    const dispatchTable = randomName();
    let code = `local ${dispatchTable} = {}; `;

    for (let i = 0; i < nHandlers; i++) {
        const hName = randomName();
        if (i === realIdx) {
            // Solo este contiene el código real
            code += `local ${hName} = function() ${innerCode} end; `;
        } else {
            // Los demás devuelven nil o hacen operaciones falsas
            const fakeAction = Math.random() < 0.5
                ? `return nil;`
                : `local _ = ${obfNumber(Math.floor(Math.random() * 1000))}; return;`;
            code += `local ${hName} = function() ${fakeAction} end; `;
        }
        code += `${dispatchTable}[${obfNumber(i + 1)}] = ${hName}; `;
    }

    const selected = randomName();
    code += `local ${selected} = ${obfNumber(realIdx + 1)}; `;
    code += `${dispatchTable}[${selected}]();`;
    return code;
}

// ---------- ANTI‑ENV LOGGER (BLOQUE ROBUSTO, SE COLOCA AL FINAL) ----------
function buildAntiEnvBlock() {
    // Código que detecta entornos sospechosos (todos los checks que tenías)
    const envCode = `local _r,_n={},0;local function _p(v) _n=_n+1;_r[_n]=v and 1 or 0;end;do local p=true;pcall(function() local ts=game:GetService("TweenService") if not ts then return end local f=Instance.new("Frame") local tw=ts:Create(f,TweenInfo.new(0.1),{Size=UDim2.new(1,0,1,0)}) local t=os.clock() tw:Play() tw.Completed:Wait() if math.abs(os.clock()-t-0.1)>0.05 then p=false end f:Destroy() end) _p(p) end;do local p=true;pcall(function() local s=Instance.new("Sound") if pcall(function() s.PlaybackLoudness=99 end) then p=false end s:Destroy() end) _p(p) end;do local p=true;pcall(function() if not Instance then return end local f=Instance.new("Frame") if typeof(f)~="Instance" then p=false end f:Destroy() end) _p(p) end;do local p=true;pcall(function() if not game then return end if game.PlaceId==game.GameId then p=false end end) _p(p) end;do local p=true;pcall(function() local tb=Instance.new("TextBox") if pcall(function() tb.TextBounds=Vector2.new(1,1) end) then p=false end tb:Destroy() end) _p(p) end;local _s=0;for i=1,_n do _s=_s+_r[i] end;if _s~=_n then while true do end end`;

    const key = Math.floor(Math.random() * 200) + 30;
    const chunkSize = 6 + Math.floor(Math.random() * 4);  // Fragmentos pequeños
    const chunks = [];
    for (let i = 0; i < envCode.length; i += chunkSize) {
        chunks.push(envCode.slice(i, i + chunkSize));
    }

    const tableName = randomName();
    let block = `local ${tableName} = {}; `;   // Tabla al inicio del bloque

    // Insertar fragmentos ofuscados
    chunks.forEach(chunk => {
        const bytes = xorStringToBytes(chunk, key);
        block += `table.insert(${tableName}, {${obfNumber(key)}, {${bytes.join(',')}}}); `;
    });

    // Reconstructor
    const reconstVar = randomName();
    block += `
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

    return block;
}

// ---------- OFUSCACIÓN PRINCIPAL ----------
function obfuscate(sourceCode) {
    if (!sourceCode) return '--ERROR';

    // Anti‑env (se añadirá al final)
    const antiEnvBlock = CONFIG.antiEnv ? buildAntiEnvBlock() : '';

    // Basura
    const junk = [];
    for (let i = 0; i < CONFIG.junkLines; i++) {
        junk.push(generateJunkLine());
    }

    // Anti‑debugger simple (va al principio)
    const antiDebug = `if getmetatable(_G)~=nil then while true do end end;`;

    // Payload: extraer URL si es un loadstring con HttpGet
    let payload = sourceCode;
    if (/loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(/i.test(payload)) {
        const match = payload.match(/HttpGet\s*\(\s*["']([^"']+)["']\s*\)/i);
        if (match) payload = match[1];
    }

    // VM principal estilo Luraph
    let vmCode = buildLuraphVM(payload);
    // Añadir capas de dispatcher con handlers falsos
    for (let i = 0; i < CONFIG.vmCapas; i++) {
        vmCode = buildDispatcher(vmCode);
    }

    // Construir resultado: HEADER + antiDebug + basura + VM + antiEnv (al final)
    const result = `${HEADER} ${antiDebug} ${junk.join(' ')} ${vmCode} ${antiEnvBlock}`;
    return result.replace(/\s+/g, ' ').trim();
}

module.exports = { obfuscate };
