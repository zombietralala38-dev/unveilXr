// ============================================================
//  Seak Obfuscator v5.0 - Motor de ofuscación avanzado
// ============================================================

// ---------- CONFIGURACIÓN ----------
const CONFIG = {
    watermark: "--[[ this code it's protected by Seak obfuscator ]]",
    antiEnv: true,               // activar/desactivar anti-env logger
    vmCapas: 15,                 // cantidad de capas VM (más = más pesado)
    junkLines: 80,               // líneas de basura
    deadCodeMultiplier: 3,       // multiplicador de código muerto
    maxLocalVars: 180            // límite seguro de variables locales
};
// -----------------------------------

const HEADER = CONFIG.watermark;

function randomName() {
    return "_" + Math.random().toString(36).substring(2, 8) + Math.floor(Math.random() * 1000);
}

// ---------- OFUSCACIÓN DE NÚMEROS MEJORADA ----------
function deepNumber(n) {
    if (Math.random() < 0.6) return n.toString();
    const methods = [
        () => {
            const a = Math.floor(Math.random() * 3000) + 500;
            const b = Math.floor(Math.random() * 50) + 2;
            const c = Math.floor(Math.random() * 800) + 10;
            const d = Math.floor(Math.random() * 20) + 2;
            return `(((((${n}+${a})*${b})/${b})-${a})+((${c}*${d})/${d})-${c})`;
        },
        () => {
            const parts = [];
            let remaining = n;
            for (let i = 0; i < 3; i++) {
                const piece = Math.floor(Math.random() * Math.min(remaining, 300)) + 1;
                remaining -= piece;
                parts.push(piece);
            }
            parts.push(remaining);
            return `(${parts.join('+')})`;
        },
        () => {
            const x = Math.floor(Math.random() * 1000) + 100;
            return `((${n + x} - ${x}) + (${Math.floor(Math.random() * 50)} * 0))`;
        }
    ];
    return methods[Math.floor(Math.random() * methods.length)]();
}

// ---------- OFUSCACIÓN DE STRINGS EN ARRAYS ----------
function stringToEncryptedParts(str) {
    const parts = [];
    const chunkSize = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < str.length; i += chunkSize) {
        const chunk = str.slice(i, i + chunkSize);
        const nums = chunk.split('').map(c => deepNumber(c.charCodeAt(0)));
        parts.push(`string.char(${nums.join(',')})`);
    }
    return parts;
}

// ---------- GENERADOR DE CÓDIGO MUERTO ----------
function generateDeadCode() {
    const v = randomName();
    const cond = `((${deepNumber(1)} == ${deepNumber(2)}) or (type(${deepNumber(3)}) == "string"))`;
    const body = `local ${v} = ${deepNumber(Math.floor(Math.random() * 1000))}; ${v} = ${v} + 1;`;
    return `if ${cond} then ${body} end`;
}

// ---------- BASURA MEJORADA ----------
function generateJunkLine() {
    const r = Math.random();
    if (r < 0.2) return `local ${randomName()} = ${deepNumber(Math.floor(Math.random() * 999))}`;
    if (r < 0.4) return `local ${randomName()} = string.char(${deepNumber(Math.floor(Math.random() * 255))})`;
    if (r < 0.6) return `do local ${randomName()} = {}; ${randomName()}[1] = 1; end`;
    if (r < 0.8) return generateDeadCode();
    return `if type(nil) == "number" then while true do end end`;
}

// ---------- MÁQUINA VIRTUAL PRINCIPAL (MEJORADA) ----------
function buildDeepVM(code) {
    const methods = ['xor', 'add', 'sub'];
    const method = methods[Math.floor(Math.random() * methods.length)];
    const stack = randomName();
    const key = Math.floor(Math.random() * 200) + 30;
    const keyVar = randomName();
    const orderVar = randomName();
    
    // Partir el código en chunks pequeños
    const chunkSize = 3 + Math.floor(Math.random() * 5);
    const chunks = [];
    for (let i = 0; i < code.length; i += chunkSize) {
        chunks.push(code.slice(i, i + chunkSize));
    }
    
    // Crear un pool con chunks reales y falsos
    const totalChunks = chunks.length * 3;
    const poolVars = [];
    const order = [];
    let realIdx = 0;
    
    let vmCode = `local ${stack} = {}; local ${keyVar} = ${deepNumber(key)};\n`;
    
    for (let i = 0; i < totalChunks; i++) {
        const varName = randomName();
        poolVars.push(varName);
        
        if (realIdx < chunks.length && (Math.random() > 0.5 || (totalChunks - i) <= (chunks.length - realIdx))) {
            const chunk = chunks[realIdx];
            const encrypted = chunk.split('').map((c, j) => {
                const charCode = c.charCodeAt(0);
                let enc;
                if (method === 'xor') enc = charCode ^ ((key + j) % 256);
                else if (method === 'add') enc = (charCode + key + j) % 256;
                else enc = (charCode - key - j + 256) % 256;
                return deepNumber(enc);
            });
            vmCode += `local ${varName} = {${encrypted.join(',')}};\n`;
            order.push(i + 1);
            realIdx++;
        } else {
            const fake = Array.from({length: chunkSize}, () => deepNumber(Math.floor(Math.random() * 255)));
            vmCode += `local ${varName} = {${fake.join(',')}};\n`;
        }
    }
    
    const poolName = randomName();
    vmCode += `local ${poolName} = {${poolVars.join(',')}};\n`;
    vmCode += `local ${orderVar} = {${order.map(n => deepNumber(n)).join(',')}};\n`;
    
    const idx = randomName(), byte = randomName();
    vmCode += `local _pos = 0;\n`;
    vmCode += `for _, ${idx} in ipairs(${orderVar}) do\n`;
    vmCode += `  for _, ${byte} in ipairs(${poolName}[${idx}]) do\n`;
    if (method === 'xor') {
        vmCode += `    local _dec = bit32.bxor(${byte}, (${keyVar} + _pos) % 256);\n`;
    } else if (method === 'add') {
        vmCode += `    local _dec = (${byte} - ${keyVar} - _pos) % 256;\n`;
    } else {
        vmCode += `    local _dec = (${byte} + ${keyVar} + _pos) % 256;\n`;
    }
    vmCode += `    table.insert(${stack}, string.char(_dec));\n`;
    vmCode += `    _pos = _pos + 1;\n`;
    vmCode += `  end;\n`;
    vmCode += `end;\n`;
    vmCode += `local _e = table.concat(${stack});\n`;
    vmCode += `assert(loadstring(_e))();\n`;
    
    return vmCode;
}

// ---------- CAPA DE VM SIMPLE (DISPATCHER) ----------
function buildSingleVM(innerCode) {
    const handlers = [];
    const handlerCount = 2 + Math.floor(Math.random() * 3);
    const realIdx = Math.floor(Math.random() * handlerCount);
    const dispatch = randomName();
    
    let code = `local ${dispatch} = {};\n`;
    
    for (let i = 0; i < handlerCount; i++) {
        const hName = randomName();
        if (i === realIdx) {
            code += `local ${hName} = function() ${innerCode} end;\n`;
        } else {
            code += `local ${hName} = function() return nil; end;\n`;
        }
        code += `${dispatch}[${deepNumber(i + 1)}] = ${hName};\n`;
    }
    
    const state = randomName();
    code += `local ${state} = ${deepNumber(realIdx + 1)};\n`;
    code += `${dispatch}[${state}]();\n`;
    
    return code;
}

// ---------- ENVOLTURA DE FUNCIONES ----------
function functionWrapper(code) {
    const wrapper = randomName();
    return `local ${wrapper} = function() ${code} end; ${wrapper}();`;
}

// ---------- ANTI-ENV LOGGER CAMUFLADO ----------
function buildAntiEnv() {
    const envCode = `local _r,_n={},0;local function _p(v) _n=_n+1;_r[_n]=v and 1 or 0;end;do local p=true;pcall(function() local ts=game:GetService("TweenService") if not ts then return end local f=Instance.new("Frame") local tw=ts:Create(f,TweenInfo.new(0.1),{Size=UDim2.new(1,0,1,0)}) local t=os.clock() tw:Play() tw.Completed:Wait() if math.abs(os.clock()-t-0.1)>0.05 then p=false end f:Destroy() end) _p(p) end;do local p=true;pcall(function() local s=Instance.new("Sound") if pcall(function() s.PlaybackLoudness=99 end) then p=false end s:Destroy() end) _p(p) end;do local p=true;pcall(function() if not Instance then return end local f=Instance.new("Frame") if typeof(f)~="Instance" then p=false end f:Destroy() end) _p(p) end;do local p=true;pcall(function() if not game then return end if game.PlaceId==game.GameId then p=false end end) _p(p) end;do local p=true;pcall(function() local tb=Instance.new("TextBox") if pcall(function() tb.TextBounds=Vector2.new(1,1) end) then p=false end tb:Destroy() end) _p(p) end;local _s=0;for i=1,_n do _s=_s+_r[i] end;if _s~=_n then while true do end end`;
    
    const parts = stringToEncryptedParts(envCode);
    const tableName = randomName();
    const lines = [];
    
    lines.push(`local ${tableName} = {};`);
    parts.forEach(part => {
        lines.push(`table.insert(${tableName}, ${part});`);
    });
    lines.push(`assert(loadstring(table.concat(${tableName})))();`);
    
    return lines;
}

// ---------- FUNCIÓN PRINCIPAL DE OFUSCACIÓN ----------
function obfuscate(sourceCode) {
    if (!sourceCode) return '--ERROR';
    
    const antiEnvLines = CONFIG.antiEnv ? buildAntiEnv() : [];
    const junk = [];
    
    // Generar basura + código muerto
    for (let i = 0; i < CONFIG.junkLines; i++) {
        junk.push(generateJunkLine());
        if (i % 2 === 0) {
            for (let j = 0; j < CONFIG.deadCodeMultiplier; j++) {
                junk.push(generateDeadCode());
            }
        }
    }
    
    // Mezclar anti-env con basura (no al inicio para evitar desplazamiento)
    const mixed = [...junk];
    antiEnvLines.forEach(line => {
        const pos = Math.floor(Math.random() * (mixed.length - 5)) + 5;
        mixed.splice(pos, 0, line);
    });
    
    // Preparar el payload
    let payload = sourceCode;
    if (/loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(/i.test(payload)) {
        const match = payload.match(/HttpGet\s*\(\s*["']([^"']+)["']\s*\)/i);
        if (match) payload = match[1];
    }
    
    // Aplicar capas de VM
    let vmCode = buildDeepVM(payload);
    for (let i = 0; i < CONFIG.vmCapas; i++) {
        vmCode = buildSingleVM(vmCode);
    }
    vmCode = functionWrapper(vmCode);
    
    // Construir resultado final
    const antiDebug = `if getmetatable(_G)~=nil then while true do end end;`;
    const result = `${HEADER} ${antiDebug} ${mixed.join(' ')} ${vmCode}`;
    
    return result.replace(/\s+/g, " ").trim();
}

module.exports = { obfuscate };
