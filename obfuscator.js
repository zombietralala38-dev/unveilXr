const HEADER = `--[[ Protected by vvmer obfuscator v3.0 - Advanced VM + Anti-Syntax ]]`

const HANDLER_POOL = ["KQ","HF","W8","SX","Rj","nT","pL","qZ","mV","xB","yC","wD"]

// ═══════════════════════════════════════════════════════════════════
// 🔐 GENERADOR DE NOMBRES CON BIT32
// ═══════════════════════════════════════════════════════════════════

function generateBit32Name() {
  const seed = Math.floor(Math.random() * 0xFFFFFFFF);
  const xor1 = Math.floor(Math.random() * 0xFFFFFFFF);
  const xor2 = Math.floor(Math.random() * 0xFFFFFFFF);
  return `_bit32_${Math.abs(seed ^ xor1 ^ xor2).toString(16)}`
}

function pickHandlers(count) {
  const used = new Set()
  const result = []
  while (result.length < count) {
    const base = HANDLER_POOL[Math.floor(Math.random() * HANDLER_POOL.length)]
    const name = base + Math.floor(Math.random() * 99)
    if (!used.has(name)) { used.add(name); result.push(name) }
  }
  return result
}

// ═══════════════════════════════════════════════════════════════════
// 🛡️ SISTEMA ANTI-SYNTAX-ERROR AVANZADO (v2.0)
// ═══════════════════════════════════════════════════════════════════

function buildAdvancedAntiSyntax() {
  return `
local _syntaxValidator = function(code)
  local fn = loadstring(code)
  return fn ~= nil
end

local _repairCode = function(code)
  local repaired = code
  
  -- Reparación 1: Cierra paréntesis abiertos
  local openParen = 0
  for i = 1, #repaired do
    local char = repaired:sub(i, i)
    if char == "(" then openParen = openParen + 1 end
    if char == ")" then openParen = openParen - 1 end
  end
  while openParen > 0 do
    repaired = repaired .. ")"
    openParen = openParen - 1
  end
  
  -- Reparación 2: Cierra corchetes abiertos
  local openBracket = 0
  for i = 1, #repaired do
    local char = repaired:sub(i, i)
    if char == "[" then openBracket = openBracket + 1 end
    if char == "]" then openBracket = openBracket - 1 end
  end
  while openBracket > 0 do
    repaired = repaired .. "]"
    openBracket = openBracket - 1
  end
  
  -- Reparación 3: Cierra llaves abiertos
  local openBrace = 0
  for i = 1, #repaired do
    local char = repaired:sub(i, i)
    if char == "{" then openBrace = openBrace + 1 end
    if char == "}" then openBrace = openBrace - 1 end
  end
  while openBrace > 0 do
    repaired = repaired .. "}"
    openBrace = openBrace - 1
  end
  
  -- Reparación 4: Agrega 'end' faltantes (básico)
  local ifCount = 0
  for _, w in ipairs({"if", "for", "while", "function"}) do
    local _, c = string.gsub(repaired, "\\b"..w.."\\b", "")
    ifCount = ifCount + c
  end
  
  local _, endCount = string.gsub(repaired, "\\bend\\b", "")
  
  for _ = 1, (ifCount - endCount) do
    repaired = repaired .. " end"
  end
  
  -- Reparación 5: Completa strings sin cerrar
  local inString = false
  local stringChar = nil
  local lastChar = ""
  
  for i = 1, #repaired do
    local char = repaired:sub(i, i)
    
    if (char == '"' or char == "'") and lastChar ~= "\\\\" then
      if not inString then
        inString = true
        stringChar = char
      elseif char == stringChar then
        inString = false
      end
    end
    
    lastChar = char
  end
  
  if inString and stringChar then
    repaired = repaired .. stringChar
  end
  
  return repaired
end

local _extractBlocks = function(code)
  local blocks = {}
  local currentBlock = ""
  local inString = false
  local stringChar = nil
  local parenDepth = 0
  local bracketDepth = 0
  local braceDepth = 0
  local inComment = false
  
  local i = 1
  while i <= #code do
    local char = code:sub(i, i)
    local nextChar = code:sub(i + 1, i + 1)
    
    -- Detecta comentarios
    if not inString and char == "-" and nextChar == "-" then
      inComment = true
      currentBlock = currentBlock .. "--"
      i = i + 2
      while i <= #code and code:sub(i, i) ~= "\\n" do
        currentBlock = currentBlock .. code:sub(i, i)
        i = i + 1
      end
      currentBlock = currentBlock .. "\\n"
      i = i + 1
    end
    
    -- Detecta strings
    if (char == '"' or char == "'") and not inComment then
      if not inString then
        inString = true
        stringChar = char
      elseif char == stringChar then
        inString = false
      end
      currentBlock = currentBlock .. char
      i = i + 1
    end
    
    -- Cuenta paréntesis, corchetes y llaves
    if not inString and not inComment then
      if char == "(" then parenDepth = parenDepth + 1 end
      if char == ")" then parenDepth = parenDepth - 1 end
      if char == "[" then bracketDepth = bracketDepth + 1 end
      if char == "]" then bracketDepth = bracketDepth - 1 end
      if char == "{" then braceDepth = braceDepth + 1 end
      if char == "}" then braceDepth = braceDepth - 1 end
    end
    
    currentBlock = currentBlock .. char
    
    -- Cuando todos los delimitadores cierren, es un bloque completo
    if parenDepth == 0 and bracketDepth == 0 and braceDepth == 0 and 
       not inString and not inComment and 
       (char == "\\n" or i == #code) then
      
      if currentBlock:match("%S") then
        table.insert(blocks, currentBlock)
      end
      currentBlock = ""
      inComment = false
    end
    
    i = i + 1
  end
  
  if currentBlock:match("%S") then
    table.insert(blocks, currentBlock)
  end
  
  return blocks
end

local _executeBlocks = function(code)
  local blocks = _extractBlocks(code)
  local results = {}
  
  for _, block in ipairs(blocks) do
    local repaired = _repairCode(block)
    
    -- Intenta ejecutar el bloque
    local ok, result = pcall(function()
      local fn = loadstring(repaired)
      if fn then return fn() end
      return nil
    end)
    
    if ok then
      table.insert(results, result)
    end
  end
  
  return results
end

local _safeTryAdvanced = function(code)
  if not code or code == "" then return nil end
  
  -- Nivel 1: Intenta código original completo
  local ok1, result1 = pcall(function()
    local fn = loadstring(code)
    if fn then return fn() end
  end)
  
  if ok1 then return result1 end
  
  -- Nivel 2: Intenta código reparado
  local repaired = _repairCode(code)
  local ok2, result2 = pcall(function()
    local fn = loadstring(repaired)
    if fn then return fn() end
  end)
  
  if ok2 then return result2 end
  
  -- Nivel 3: Ejecuta por bloques
  local ok3, result3 = pcall(function()
    return _executeBlocks(code)
  end)
  
  if ok3 then return result3 end
  
  -- Nivel 4: Como último recurso, ejecuta línea por línea
  local lines = {}
  for line in string.gmatch(code, "[^\\n]+") do
    table.insert(lines, line)
  end
  
  for _, line in ipairs(lines) do
    if line:match("%S") then
      pcall(function()
        local fn = loadstring(line)
        if fn then fn() end
      end)
    end
  end
  
  return nil
end

-- Ejecutar el código ofuscado con protección
_safeTryAdvanced([[PAYLOAD_AQUI]])
`
}

// ═══════════════════════════════════════════════════════════════════
// ⚡ MATEMÁTICAS PESADAS CON BIT32 MEJORADA
// ═══════════════════════════════════════════════════════════════════

function heavyMathBit32Advanced(n) {
  const techniques = [
    // Técnica 1: XOR múltiple
    () => {
      const mask1 = Math.floor(Math.random() * 0xFFFFFFFF);
      const mask2 = Math.floor(Math.random() * 0xFFFFFFFF);
      return `bit32.bxor(bit32.bxor(${n},${mask1}),${mask2})`;
    },
    
    // Técnica 2: Shifts complejos
    () => {
      const s1 = Math.floor(Math.random() * 16) + 1;
      const s2 = Math.floor(Math.random() * 16) + 1;
      return `bit32.lshift(bit32.rshift(bit32.lshift(${n},${s1}),${s1+s2}),${s2})`;
    },
    
    // Técnica 3: AND + OR
    () => {
      const mask = (1 << Math.floor(Math.random() * 16)) - 1;
      return `bit32.bor(bit32.band(${n},${mask}),bit32.band(${n},bit32.bnot(${mask})))`;
    },
    
    // Técnica 4: Rotación doble
    () => {
      const r1 = Math.floor(Math.random() * 32);
      const r2 = (32 - r1) % 32;
      return `bit32.lrotate(bit32.rrotate(${n},${r1}),${r2})`;
    },
    
    // Técnica 5: Operaciones encadenadas
    () => {
      const a = Math.floor(Math.random() * 100);
      const b = Math.floor(Math.random() * 100);
      const c = Math.floor(Math.random() * 100);
      return `bit32.band(bit32.bxor(${n}|${a},${b}),bit32.bor(${n},${c}))`;
    },
    
    // Técnica 6: Negación compleja
    () => {
      return `bit32.band(bit32.bnot(bit32.bnot(${n})),0xFFFFFFFF)`;
    },
    
    // Técnica 7: Combinación de rotaciones
    () => {
      const r1 = Math.floor(Math.random() * 16);
      const r2 = Math.floor(Math.random() * 16);
      return `bit32.lrotate(bit32.lrotate(${n},${r1}),${r2})`;
    }
  ];

  const chosen = techniques[Math.floor(Math.random() * techniques.length)];
  return chosen();
}

// ═══════════════════════════════════════════════════════════════════
// 🎭 GENERADOR DE CÓDIGO BASURA AVANZADO
// ═══════════════════════════════════════════════════════════════════

function generateAdvancedJunk(lines = 150) {
  let junk = '';
  
  for (let i = 0; i < lines; i++) {
    const r = Math.random();
    const varName = generateBit32Name();
    
    if (r < 0.12) {
      // Junk: XOR múltiple
      const a = Math.floor(Math.random() * 100);
      const b = Math.floor(Math.random() * 100);
      const c = Math.floor(Math.random() * 100);
      junk += `local ${varName}=bit32.bxor(bit32.bxor(${a},${b}),${c}); `;
    } else if (r < 0.25) {
      // Junk: Shifts encadenados
      const val = Math.floor(Math.random() * 255);
      const s1 = Math.floor(Math.random() * 8) + 1;
      const s2 = Math.floor(Math.random() * 8) + 1;
      junk += `local ${varName}=bit32.lshift(bit32.rshift(${val},${s1}),${s2}); `;
    } else if (r < 0.38) {
      // Junk: AND + OR
      const mask = Math.floor(Math.random() * 1000);
      junk += `local ${varName}=bit32.bor(bit32.band(${mask},${mask}),0); `;
    } else if (r < 0.5) {
      // Junk: Rotaciones
      const rot = Math.floor(Math.random() * 32);
      junk += `local ${varName}=bit32.lrotate(${Math.floor(Math.random() * 100)},${rot}); `;
    } else if (r < 0.62) {
      // Junk: Comparaciones falsas
      const a = Math.floor(Math.random() * 1000);
      junk += `if not(${a}==${a})then return end; `;
    } else if (r < 0.75) {
      // Junk: Tabla vacía
      const tblName = generateBit32Name();
      junk += `do local ${tblName}={}; for i=1,3 do ${tblName}[i]=bit32.bxor(i,i) end; ${tblName}=nil; end; `;
    } else if (r < 0.87) {
      // Junk: Bucle falso
      const loopVar = generateBit32Name();
      junk += `for ${loopVar}=1,1 do if false then local x=1 end end; `;
    } else {
      // Junk: Negación bit a bit
      const val = Math.floor(Math.random() * 100);
      junk += `local ${varName}=bit32.band(bit32.bnot(bit32.bnot(${val})),0xFFFFFFFF); `;
    }
  }
  
  return junk;
}

// ═══════════════════════════════════════════════════════════════════
// 🚀 MÁQUINA VIRTUAL MEJORADA (v3.0)
// ═══════════════════════════════════════════════════════════════════

function buildAdvancedVM(payloadStr) {
  const STACK = generateBit32Name();
  const KEY = generateBit32Name();
  const SALT = generateBit32Name();
  const COUNTER = generateBit32Name();
  const POOL = generateBit32Name();
  const DISPATCH = generateBit32Name();
  
  const seed = Math.floor(Math.random() * 500) + 100;
  const saltVal = Math.floor(Math.random() * 300) + 50;
  const chunkSize = Math.floor(Math.random() * 8) + 6;
  
  let vmCore = `
local ${STACK}={};
local ${KEY}=${heavyMathBit32Advanced(seed)};
local ${SALT}=${heavyMathBit32Advanced(saltVal)};
local ${COUNTER}=${heavyMathBit32Advanced(0)};
`;

  // Fragmentar payload en chunks
  let chunks = [];
  for (let i = 0; i < payloadStr.length; i += chunkSize) {
    chunks.push(payloadStr.slice(i, i + chunkSize));
  }

  // Crear pool de memoria falso
  let poolVars = [];
  let realIndicies = [];
  let totalSlots = chunks.length * 4;
  let currentChunk = 0;
  
  for (let i = 0; i < totalSlots; i++) {
    const memVar = generateBit32Name();
    poolVars.push(memVar);

    if (currentChunk < chunks.length && Math.random() > 0.3) {
      realIndicies.push(i + 1);
      
      let chunk = chunks[currentChunk];
      let encBytes = [];

      for (let j = 0; j < chunk.length; j++) {
        const char = chunk.charCodeAt(j);
        const offset = (char + seed + (currentChunk * saltVal)) % 256;
        encBytes.push(`bit32.band(${offset},0xFF)`);
      }

      vmCore += `local ${memVar}={${encBytes.join(',')}};`;
      currentChunk++;
    } else {
      // Memoria falsa
      let fakeBytes = [];
      let fakeLen = Math.floor(Math.random() * 10) + 3;
      
      for (let j = 0; j < fakeLen; j++) {
        const fake = Math.floor(Math.random() * 256);
        fakeBytes.push(`bit32.bxor(${fake},0)`);
      }

      vmCore += `local ${memVar}={${fakeBytes.join(',')}};`;
    }
  }

  // Dispatcher
  vmCore += `local ${POOL}={${poolVars.join(',')}};`;
  vmCore += `local _order={${realIndicies.map(n => heavyMathBit32Advanced(n)).join(',')}};`;

  // Núcleo de desencriptación
  vmCore += `
local _globalIdx=0;
for _, _realIdx in ipairs(_order) do
  for _, _byte in ipairs(${POOL}[_realIdx]) do
    local _decrypted=bit32.band((_byte-${KEY}-_globalIdx*${SALT})%256,0xFF);
    table.insert(${STACK}, string.char(_decrypted));
    _globalIdx=_globalIdx+1;
  end;
end;

local _payload=table.concat(${STACK});
${STACK}=nil;
${POOL}=nil;

-- Ejecutar payload desencriptado
local _execFn=function()
  local _load=getfenv()["load"..string.char(115,116,114,105,110,103)];
  if _load then
    local _fn=_load(_payload);
    if _fn then return _fn() end;
  end;
  return nil;
end;

pcall(_execFn);
`;

  return vmCore;
}

// ═══════════════════════════════════════════════════════════════════
// 🔟 MÁQUINA VIRTUAL MULTICAPA (25 CAPAS)
// ═══════════════════════════════════════════════════════════════════

function buildMultilayerVM(payloadStr) {
  let vm = buildAdvancedVM(payloadStr);

  // 25 capas de ofuscación
  for (let layer = 0; layer < 25; layer++) {
    const handlers = pickHandlers(Math.floor(Math.random() * 3) + 4);
    const realIdx = Math.floor(Math.random() * handlers.length);
    const DISP = generateBit32Name();

    let layerCode = `local lM={}; `;

    for (let i = 0; i < handlers.length; i++) {
      if (i === realIdx) {
        layerCode += `local ${handlers[i]}=function(lM) local lM=lM; ${generateAdvancedJunk(4)}; ${vm}; end; `;
      } else {
        layerCode += `local ${handlers[i]}=function(lM) local lM=lM; ${generateAdvancedJunk(2)}; return nil; end; `;
      }
    }

    layerCode += `local ${DISP}={`;
    for (let i = 0; i < handlers.length; i++) {
      layerCode += `[${heavyMathBit32Advanced(i + 1)}]=${handlers[i]},`;
    }
    layerCode += `};`;

    let execBlocks = [];
    for (let i = 0; i < handlers.length; i++) {
      execBlocks.push(`${DISP}[${heavyMathBit32Advanced(i + 1)}](lM)`);
    }

    // CFF (Control Flow Flattening)
    const stateVar = generateBit32Name();
    let cff = `local ${stateVar}=${heavyMathBit32Advanced(1)}; while true do `;
    for (let i = 0; i < execBlocks.length; i++) {
      if (i === 0) {
        cff += `if ${stateVar}==${heavyMathBit32Advanced(i + 1)} then ${execBlocks[i]}; ${stateVar}=${heavyMathBit32Advanced(i + 2)}; `;
      } else {
        cff += `elseif ${stateVar}==${heavyMathBit32Advanced(i + 1)} then ${execBlocks[i]}; ${stateVar}=${heavyMathBit32Advanced(i + 2)}; `;
      }
    }
    cff += `elseif ${stateVar}==${heavyMathBit32Advanced(execBlocks.length + 1)} then break; end; end; `;

    vm = layerCode + cff;
  }

  return vm;
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

function obfuscate(sourceCode) {
  if (!sourceCode) {
    return `${HEADER} local _safe=function() end; _safe();`;
  }

  // 1. Generar sistema anti-syntax avanzado
  const antiSyntax = buildAdvancedAntiSyntax().replace("PAYLOAD_AQUI", sourceCode);

  // 2. Ofuscar el sistema anti-syntax con VM multicapa
  const finalVM = buildMultilayerVM(antiSyntax);

  // 3. Agregar junk initial
  const initialJunk = generateAdvancedJunk(200);

  // 4. Combinar todo
  const result = `${HEADER} ${initialJunk} ${finalVM}`;

  // 5. Limpiar espacios
  return result.replace(/\s+/g, " ").trim();
}

module.exports = { obfuscate };

// Test
if (require.main === module) {
  const testCode = `
    local function test()
      print("Hello World")
      for i = 1, 5 do
        print(i)
      end
    end
    
    test()
  `;

  console.log("🚀 Testing obfuscator v3.0...");
  const obfuscated = obfuscate(testCode);
  console.log("✅ Obfuscated length:", obfuscated.length);
  console.log("📊 Compression ratio:", (obfuscated.length / testCode.length).toFixed(1) + "x");
}
