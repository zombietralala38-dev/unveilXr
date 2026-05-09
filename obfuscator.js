// ============================================================
//  Seak Obfuscator v7.1 - Robusto + XOR/Luraph VM (CORREGIDO)
// ============================================================

const CONFIG = {
    watermark: "--[[ this code it's protected by Seak obfuscator ]]",
    antiEnv: true,
    vmCapas: 15,
    junkLines: 60,
    xorIntensity: 0.7
};

const HEADER = CONFIG.watermark;

function randomName() {
    return "_" + Math.random().toString(36).substring(2, 8) + Math.floor(Math.random() * 1000);
}

function xorNumber(n) {
    const key = Math.floor(Math.random() * 200) + 30;
    return `bit32.bxor(${n}, ${key})`;
}

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

function obfNumber(n) {
    return Math.random() < CONFIG.xorIntensity ? xorNumber(n) : heavyMath(n);
}

function xorStringToBytes(str) {
    const key = Math.floor(Math.random() * 200) + 30;
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
        bytes.push(obfNumber(str.charCodeAt(i) ^ key));
    }
    return { bytes, key };
}

function generateJunkLine() {
    const r = Math.random();
    if (r < 0.3) return `local ${randomName()} = ${obfNumber(Math.floor(Math.random() * 999))};`;
    if (r < 0.6) return `local ${randomName()} = string.char(${obfNumber(Math.floor(Math.random() * 255))});`;
    if (r < 0.8) return `if bit32.bxor(1,1) == 0 then while true do end end;`;
    return `do local ${randomName()} = {}; ${randomName()}[1] = nil; end;`;
}

function buildLuraphVM(code) {
    const key = Math.floor(Math.random() * 200) + 30;
    const chunkSize = 3 + Math.floor(Math.random() * 4);
    const chunks = [];
    for (let i = 0; i < code.length; i += chunkSize) {
        chunks.push(code.slice(i, i + chunkSize));
    }

    const instrTable = randomName();
    let init = `local ${instrTable} = {};\n`;
    chunks.forEach((chunk, idx) => {
        const encrypted = chunk.split('').map(c => c.charCodeAt(0) ^ key);
        init += `${instrTable}[${obfNumber(idx + 1)}] = {${encrypted.map(b => obfNumber(b)).join(',')}};\n`;
    });

    const resultVar = randomName();
    const loopVar = randomName();
    const decodedVar = randomName();
    const decodeCode = `
        local ${resultVar} = "";
        for ${loopVar} = 1, #${instrTable} do
            local ${decodedVar} = ${instrTable}[${loopVar}];
            for _, b in ipairs(${decodedVar}) do
                ${resultVar} = ${resultVar} .. string.char(bit32.bxor(b, ${obfNumber(key)}));
            end
        end
        assert(loadstring(${resultVar}))();
    `;

    return init + decodeCode;
}

function buildDispatcher(innerCode) {
    const nHandlers = 2 + Math.floor(Math.random() * 3);
    const realIdx = Math.floor(Math.random() * nHandlers);
    const dispatchTable = randomName();
    let code = `local ${dispatchTable} = {};\n`;

    for (let i = 0; i < nHandlers; i++) {
        const hName = randomName();
        if (i === realIdx) {
            code += `local ${hName} = function() ${innerCode} end;\n`;
        } else {
            code += `local ${hName} = function() return nil; end;\n`;
        }
        code += `${dispatchTable}[${obfNumber(i + 1)}] = ${hName};\n`;
    }

    const selected = randomName();
    code += `local ${selected} = ${obfNumber(realIdx + 1)};\n`;
    code += `${dispatchTable}[${selected}]();\n`;
    return code;
}

// ---------- ANTI-ENV LOGGER (devuelve partes separadas) ----------
function buildAntiEnv() {
    const envCode = `local _r,_n={},0;local function _p(v) _n=_n+1;_r[_n]=v and 1 or 0;end;do local p=true;pcall(function() local ts=game:GetService("TweenService") if not ts then return end local f=Instance.new("Frame") local tw=ts:Create(f,TweenInfo.new(0.1),{Size=UDim2.new(1,0,1,0)}) local t=os.clock() tw:Play() tw.Completed:Wait() if math.abs(os.clock()-t-0.1)>0.05 then p=false end f:Destroy() end) _p(p) end;do local p=true;pcall(function() local s=Instance.new("Sound") if pcall(function() s.PlaybackLoudness=99 end) then p=false end s:Destroy() end) _p(p) end;do local p=true;pcall(function() if not Instance then return end local f=Instance.new("Frame") if typeof(f)~="Instance" then p=false end f:Destroy() end) _p(p) end;do local p=true;pcall(function() if not game then return end if game.PlaceId==game.GameId then p=false end end) _p(p) end;do local p=true;pcall(function() local tb=Instance.new("TextBox") if pcall(function() tb.TextBounds=Vector2.new(1,1) end) then p=false end tb:Destroy() end) _p(p) end;local _s=0;for i=1,_n do _s=_s+_r[i] end;if _s~=_n then while true do end end`;

    const chunkSize = 4 + Math.floor(Math.random() * 3);
    const chunks = [];
    for (let i = 0; i < envCode.length; i += chunkSize) {
        chunks.push(envCode.slice(i, i + chunkSize));
    }

    const tableName = randomName();
    const initLine = `local ${tableName} = {};`;
    const fragmentLines = [];
    chunks.forEach(chunk => {
        const { bytes, key } = xorStringToBytes(chunk);
        fragmentLines.push(`table.insert(${tableName}, {${obfNumber(key)}, {${bytes.join(',')}}});`);
    });

    const reconstVar = randomName();
    const reconstructLine = `
        local ${reconstVar} = "";
        for _, __entry in ipairs(${tableName}) do
            local __key = __entry[1];
            local __bytes = __entry[2];
            for _, __b in ipairs(__bytes) do
                ${reconstVar} = ${reconstVar} .. string.char(bit32.bxor(__b, __key));
            end
        end
        assert(loadstring(${reconstVar}))();
    `;

    return { initLine, fragmentLines, reconstructLine };
}

// ---------- OFUSCACIÓN PRINCIPAL ----------
function obfuscate(sourceCode) {
    if (!sourceCode) return '--ERROR';

    const antiEnv = CONFIG.antiEnv ? buildAntiEnv() : null;
    const junk = [];
    for (let i = 0; i < CONFIG.junkLines; i++) {
        junk.push(generateJunkLine());
    }

    // Construir array final con orden garantizado
    const combined = [];
    
    // 1. Línea de creación de tabla anti-env (si existe) siempre al principio
    if (antiEnv) {
        combined.push(antiEnv.initLine);
    }
    
    // 2. Basura
    combined.push(...junk);
    
    // 3. Insertar fragmentos del anti-env aleatoriamente, PERO NUNCA en índice 0
    if (antiEnv) {
        antiEnv.fragmentLines.forEach(line => {
            const pos = Math.floor(Math.random() * (combined.length - 1)) + 1;
            combined.splice(pos, 0, line);
        });
    }
    
    // 4. Reconstructor al FINAL
    if (antiEnv) {
        combined.push(antiEnv.reconstructLine);
    }

    const antiDebug = `if getmetatable(_G)~=nil then while true do end end;`;

    // Payload
    let payload = sourceCode;
    if (/loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(/i.test(payload)) {
        const match = payload.match(/HttpGet\s*\(\s*["']([^"']+)["']\s*\)/i);
        if (match) payload = match[1];
    }

    // VM Luraph + capas
    let vmCode = buildLuraphVM(payload);
    for (let i = 0; i < CONFIG.vmCapas; i++) {
        vmCode = buildDispatcher(vmCode);
    }

    const result = `${HEADER} ${antiDebug} ${combined.join(' ')} ${vmCode}`;
    return result.replace(/\s+/g, " ").trim();
}

module.exports = { obfuscate };
