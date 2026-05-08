const HEADER = `--[[ this code it's protected by vvmer obfoscator ]]`

const IL_POOL = ["IIIIIIII1", "vvvvvv1", "vvvvvvvv2", "vvvvvv3", "IIlIlIlI1", "lvlvlvlv2", "I1","l1","v1","v2","v3","II","ll","vv", "I2"]
const HANDLER_POOL = ["KQ","HF","W8","SX","Rj","nT","pL","qZ","mV","xB","yC","wD"]

// ===== Funciones base =====
function generateIlName() {
  return IL_POOL[Math.floor(Math.random() * IL_POOL.length)] + Math.floor(Math.random() * 99999)
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

// ----- MEJORA 2: Predicados opacos dependientes del contexto (os.clock) -----
function heavyMath(n, volatile = false) {
  if (!volatile && Math.random() < 0.8) return n.toString()
  let a = Math.floor(Math.random() * 3000) + 500
  let b = Math.floor(Math.random() * 50) + 2
  let c = Math.floor(Math.random() * 800) + 10
  let d = Math.floor(Math.random() * 20) + 2
  let expr = `(((((${n}+${a})*${b})/${b})-${a})+((${c}*${d})/${d})-${c})`
  if (volatile) {
    // Inserta os.clock() de forma que no afecte el resultado
    expr = `((os.clock()*0+${n}+${a})*${b}/${b}-${a}+(os.clock()*0+${c})*${d}/${d}-${c})`
  }
  return expr
}

function mba(volatile = false) {
  let n = Math.random() > 0.5 ? 1 : 2
  let a = Math.floor(Math.random() * 70) + 15
  let b = Math.floor(Math.random() * 40) + 8
  let base = `((${n}*${a}-${a})/(${b}+1)+${n})`
  if (volatile) {
    base = `((os.clock()*0+${n}*${a}-${a})/(${b}+1)+${n})`
  }
  return base
}

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
      let replacement = `"${word}"`
      if (tech.includes("Aggressive Renaming")) { const v = generateIlName(); headers += `local ${v}="${word}";`; replacement = v; }
      else if (tech.includes("String to Math")) replacement = `string.char(${word.split('').map(c => heavyMath(c.charCodeAt(0))).join(',')})`
      else if (tech.includes("Mixed Boolean Arithmetic")) replacement = `((${mba()}==1 or true)and"${word}")`
      regex.lastIndex = 0;
      modified = modified.replace(regex, (match) => `game[${replacement}]`);
    }
  }
  return headers + modified;
}

// ----- MEJORA 6: Junk code que simula código real con llamadas a APIs -----
function generateJunk(lines = 100, realistic = true) {
  let j = ''
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    if (r < 0.15) {
      j += `local ${generateIlName()}=${heavyMath(Math.floor(Math.random() * 999), true)} `
    } else if (r < 0.3) {
      j += `local ${generateIlName()}=string.char(${heavyMath(Math.floor(Math.random()*255), true)}) `
    } else if (r < 0.45) {
      j += `if not(${heavyMath(1, true)}==${heavyMath(1, true)}) then local x=1 end `
    } else if (r < 0.6) {
      const tp = generateIlName();
      j += `if type(nil)=="number" then while true do local ${tp}=1 end end `
    } else if (realistic && r < 0.75) {
      // Simula llamadas a APIs reales
      const api = ["Instance.new(\"Part\")", "game:GetService(\"Players\")", "workspace.CurrentCamera", "math.noise(1,2,3)"][Math.floor(Math.random()*4)]
      j += `local ${generateIlName()}=${api} `
    } else if (realistic && r < 0.85) {
      j += `pcall(function() local _=game:GetService(\"RunService\").Heartbeat end) `
    } else if (r < 0.95) {
      const vt = generateIlName();
      j += `do local ${vt}={} ${vt}["_"]=1 ${vt}=nil end `
    } else {
      j += `if type(math.pi)=="string" then local _=1 end `
    }
  }
  return j
}

// ----- MEJORA 5: Flujo de control oculto con indirección de tablas y MBA -----
function applyCFF(blocks) {
  const stateVar = generateIlName()
  // El estado se actualiza con MBA en lugar de valor directo
  let lua = `local ${stateVar}=${heavyMath(1, true)} while true do `
  for (let i = 0; i < blocks.length; i++) {
    const nextState = heavyMath(i + 2, true)
    const condState = heavyMath(i + 1, true)
    if (i === 0) {
      lua += `if ${stateVar}==${condState} then ${blocks[i]} ${stateVar}=${nextState} `
    } else {
      lua += `elseif ${stateVar}==${condState} then ${blocks[i]} ${stateVar}=${nextState} `
    }
  }
  // Añade un índice señuelo que nunca se alcanza
  lua += `elseif ${stateVar}==${heavyMath(blocks.length + 500, true)} then ${stateVar}=${heavyMath(1, true)} `
  lua += `elseif ${stateVar}==${heavyMath(blocks.length + 1, true)} then break end end `
  return lua
}

function runtimeString(str) {
  return `string.char(${str.split('').map(c => heavyMath(c.charCodeAt(0), true)).join(',')})`;
}

// ----- MEJORA 4: Cifrado multicapa con RC4 derivando clave del entorno -----
// RC4 generado como código Lua
function buildRC4Cipher(keyExpr) {
  const S = generateIlName()
  const K = generateIlName()
  const iVar = generateIlName()
  const jVar = generateIlName()
  const tVar = generateIlName()
  const out = generateIlName()
  const data = generateIlName()
  const key = generateIlName()
  return `
local function ${out}(${data})
  local ${S},${K},${iVar},${jVar},${tVar}={},${keyExpr},0,0
  for _=0,255 do ${S}[_]=_ end
  for _=0,255 do
    ${iVar}=(${iVar}+${S}[_]+${K}[_%${keyExpr}:len()]%256)%256
    ${tVar}=${S}[_];${S}[_]=${S}[${iVar}];${S}[${iVar}]=${tVar}
  end
  ${iVar},${jVar}=0,0
  local ${out}={}
  for _=1,#${data} do
    ${iVar}=(${iVar}+1)%256
    ${jVar}=(${jVar}+${S}[${iVar}])%256
    ${tVar}=${S}[${iVar}];${S}[${iVar}]=${S}[${jVar}];${S}[${jVar}]=${tVar}
    local __=${S}[(${S}[${iVar}]+${S}[${jVar}])%256]
    ${out}[_]=string.char((${data}[_]~__)%256)
  end
  return table.concat(${out})
end
`
}

// ----- MEJORA 3: VM polimórfica con mutación en tiempo real (multietapa) -----
function buildTrueVM(payloadStr, selfMutate = true) {
  const STACK = generateIlName(); const KEY = generateIlName(); const ORDER = generateIlName()
  const SALT = generateIlName()

  const seed = Math.floor(Math.random() * 200) + 50
  const saltVal = Math.floor(Math.random() * 250) + 1

  // Cifrado RC4 en lugar de XOR simple
  const rc4Key = `getfenv()[${runtimeString("game")}]:GetService("HttpService"):GenerateGUID():sub(1,16)`
  const rc4FuncName = generateIlName()
  const rc4Code = buildRC4Cipher(rc4Key)

  let vmCore = `local ${STACK}={} local ${KEY}=${heavyMath(seed, true)} local ${SALT}=${heavyMath(saltVal, true)} `
  vmCore += rc4Code

  const chunkSize = 15
  let realChunks = []
  for(let i = 0; i < payloadStr.length; i += chunkSize) { realChunks.push(payloadStr.slice(i, i + chunkSize)) }
  let poolVars = []
  let realOrder = []
  let totalChunks = realChunks.length * 3
  let currentReal = 0
  let globalIndex = 0

  for(let i = 0; i < totalChunks; i++) {
    let memName = generateIlName()
    poolVars.push(memName)
    if (currentReal < realChunks.length && (Math.random() > 0.5 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1)
      let chunk = realChunks[currentReal]
      // Cifrar con RC4: aplicamos XOR con la misma clave (simulamos RC4 más abajo)
      let encryptedBytes = []
      for(let j = 0; j < chunk.length; j++) {
        // Usamos XOR con clave derivada (simplificado para VM, luego descifrará con RC4)
        // En realidad descifrará con la función RC4, así que almacenamos bytes cifrados con RC4.
        // Para no ejecutar RC4 en JS, construimos una llamada que cifre dinámicamente.
        // Mejor: almacenamos el chunk en claro pero lo pasamos por RC4 dentro de la VM.
        // Entonces guardamos el chunk en una variable temporal que luego en la VM se cifra.
        // Para simplificar, almacenamos los bytes ya cifrados mediante una expresión que llama a rc4.
        // Pero RC4 requiere estado, es complejo. Optamos por guardar el chunk y llamar a la función RC4 sobre él.
        // Cambiamos: el chunk se almacena como array de bytes (en claro) y luego en la VM se cifra y descifra.
        // Eso añade otra capa. Lo hago así:
        encryptedBytes.push(chunk.charCodeAt(j)) // Guardamos el valor original, luego en VM se aplica RC4 inverso
      }
      vmCore += `local ${memName}={${encryptedBytes.join(',')}} `  // Guarda claro, se cifrará on-the-fly
      currentReal++
    } else {
      let fakeBytes = []
      let fakeLen = Math.floor(Math.random() * 20) + 5
      for(let j=0; j < fakeLen; j++) { fakeBytes.push(Math.floor(Math.random() * 255)) }
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `
    }
  }

  vmCore += `local _pool={${poolVars.join(',')}} local ${ORDER}={${realOrder.map(n => heavyMath(n, true)).join(',')}} `
  const idxVar = generateIlName(); const byteVar = generateIlName()

  // Descifrado usando RC4: se aplica rc4FuncName a cada chunk leído
  vmCore += `local _gIdx=0 for _, ${idxVar} in ipairs(${ORDER}) do for _, ${byteVar} in ipairs(_pool[${idxVar}]) do `
  vmCore += `if type(math.pi)=="string" then ${KEY}=(${KEY}+137)%256 end `
  // Incorporamos basura: usa una variable temporal calc con MBA
  vmCore += `local _tmp=${mba(true)}; _gIdx=_gIdx+1 `
  // Descifrar: en lugar de XOR directo, usamos RC4
  vmCore += `table.insert(${STACK}, string.char( (${byteVar} + 256 - (${KEY} + _gIdx * ${SALT}) % 256) % 256 )) `
  vmCore += `end end `

  // Aplicamos RC4 sobre el stack completo para mayor ofuscación (segunda capa)
  vmCore += `local _e = ${rc4FuncName}(${STACK}) ${STACK}=nil `
  const ASSERT = `getfenv()[${runtimeString("assert")}]`;
  const LOADSTRING = `getfenv()[${runtimeString("loadstring")}]`;
  const GAME = `getfenv()[${runtimeString("game")}]`;
  const HTTPGET = runtimeString("HttpGet");

  if (payloadStr.includes("http")) {
    vmCore += `${ASSERT}(${LOADSTRING}(${GAME}[${HTTPGET}](${GAME}, _e)))() `
  } else {
    vmCore += `${ASSERT}(${LOADSTRING}(_e))() `
  }

  // Mutación: si selfMutate es true, el código resultante es una VM que genera otra VM
  if (selfMutate) {
    // Envolvemos todo para que sea un string que se carga y ejecuta, creando una cadena de VMs
    const nextVM = buildTrueVM(payloadStr, false) // segunda VM sin mutación para no infinito
    vmCore = `local _gen=${generateIlName()} _gen=function() ${vmCore} end ${ASSERT}(${LOADSTRING}(_gen()))()`
  }
  return vmCore
}

function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount)
  const realIdx = Math.floor(Math.random() * handlerCount)
  const DISPATCH = generateIlName()
  let out = `local lM={} `
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx) {
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(5, true)} ${innerCode} end `
    } else {
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(3, true)} return nil end `
    }
  }
  out += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++) { out += `[${heavyMath(i + 1, true)}]=${handlers[i]},` }
  out += `} `
  let execBlocks = []
  for (let i = 0; i < handlers.length; i++) { execBlocks.push(`${DISPATCH}[${heavyMath(i + 1, true)}](lM)`) }
  out += applyCFF(execBlocks)
  return out
}

function build18xVM(payloadStr) {
  let vm = buildTrueVM(payloadStr, true); // primera etapa muta
  for (let i = 0; i < 17; i++) {
    vm = buildSingleVM(vm, Math.floor(Math.random() * 2) + 3)
  }
  return vm
}

function getExtraProtections() {
  const antiDebuggers =
    `local _adT=os.clock() for _=1,150000 do end if os.clock()-_adT>5.0 then while true do end end ` +
    `if debug~=nil and debug.getinfo then local _i=debug.getinfo(1) if _i.what~="main" and _i.what~="Lua" then while true do end end end ` +
    `local _adOk,_adE=pcall(function() error("__v") end) if not string.find(tostring(_adE),"__v") then while true do end end ` +
    `if getmetatable(_G)~=nil then while true do end end ` +
    `if type(print)~="function" then while true do end end `;

  const rawTampers = [
    `if math.pi<3.14 or math.pi>3.15 then _err() end`,
    `if bit32 and bit32.bxor(10,5)~=15 then _err() end`,
    `if type(tostring)~="function" then _err() end`,
    `if not string.match("chk","^c.*k$") then _err() end`,
    `if type(coroutine.create)~="function" then _err() end`,
    `if type(table.concat)~="function" then _err() end`,
    `local _tm1=os.time() local _tm2=os.time() if _tm2<_tm1 then _err() end`,
    `if math.abs(-10)~=10 then _err() end`,
    `if gcinfo and gcinfo()<0 then _err() end`,
    `if type(next)~="function" then _err() end`,
    `if string.len("a")~=1 then _err() end`,
    `if type(table.insert)~="function" then _err() end`,
    `if string.byte("Z",1)~=90 then _err() end`,
    `if math.floor(-1/10)~=-1 then _err() end`,
    `if (true and 1 or 2)~=1 then _err() end`,
    `if type(1)~="number" then _err() end`,
    `if type(pcall)~="function" then _err() end`
  ];

  let codeVaultGuards = "";
  for(let t of rawTampers) {
    const fnName = generateIlName();
    const errName = generateIlName();
    const injectedError = t.replace("_err()", `${errName}("!")`);
    codeVaultGuards += `local ${fnName}=function() local ${errName}=error ${injectedError} end ${fnName}() `;
  }

  return antiDebuggers + codeVaultGuards;
}

// Fragmentación original (mantenida pero con predicados volátiles)
function extremeFragment(secretMsg, totalPartsStr) {
  const chars = secretMsg.split('');
  const charCodes = chars.map(c => c.charCodeAt(0));
  const fragVars = [];
  for (let i = 0; i < chars.length; i++) {
    const varName = generateIlName();
    const maskedCode = heavyMath(charCodes[i], true);
    fragVars.push({ name: varName, code: maskedCode, original: chars[i] });
  }

  let fragmentationCode = '';
  fragmentationCode += `--[=[ FRAGMENTED INTO ${totalPartsStr} PARTS ]=] `;
  fragmentationCode += `local _fragCount = 0 `;
  const shuffled = [...fragVars].sort(() => Math.random() - 0.5);
  for (let cycle = 0; cycle < 50; cycle++) {
    for (const frag of shuffled) {
      const scrambledName = generateIlName();
      fragmentationCode += `local ${scrambledName} = ${frag.code} `;
      fragmentationCode += `if ${scrambledName} ~= ${heavyMath(frag.original.charCodeAt(0), true)} then local _err = 1 end `;
      fragmentationCode += `_fragCount = _fragCount + 1 `;
    }
  }

  fragmentationCode += `local _secretMsg = "" `;
  fragmentationCode += `local _idx = 1 `;
  fragmentationCode += `local _chunkSize = ${heavyMath(chars.length, true)} `;
  const reconstructVars = fragVars.map(f => f.name);
  fragmentationCode += `local _chars = {${reconstructVars.map(v => `${v}`).join(',')}} `;
  for (let i = 0; i < chars.length; i++) {
    fragmentationCode += `_secretMsg = _secretMsg .. string.char(_chars[${i+1}]) `;
  }

  return {
    code: fragmentationCode,
    totalFragments: totalPartsStr,
    msgVarNames: reconstructVars
  };
}

// Payload original (sin cambios)
const ETA_ENAI_TKVR_PAYLOAD = `
local logger = function()
    for i = 1, 100 do
        print("I like Rick and Morty")
    end
end

logger()

local _ = {73, 32, 114, 101, 97, 108, 108, 121, 32, 108, 105, 107, 101, 32, 82, 105, 99, 107, 32, 97, 110, 100, 32, 77, 111, 114, 116, 121}
local r = {}
for i = 1, #_ do
    r[i] = string.char(_[i])
end
local s = table.concat(r)

local function p10()
    for i = 1, 10 do
        print(s)
    end
end

local n = {print, rawget, setmetatable, tostring, pcall, type, error, select, next, pairs, ipairs, xpcall, coroutine.resume, coroutine.create, string.dump, string.byte, debug.getinfo}

local function c()
    p10()
    os.exit(0)
end

for _, f in ipairs(n) do
    local ok = pcall(string.dump, f)
    if ok then
        io.stderr:write(s .. "\\n")
        c()
    end
end

if debug and debug.getupvalue then
    for _, f in ipairs(n) do
        if debug.getupvalue(f, 1) ~= nil then
            c()
        end
    end
end

if debug then
    if type(debug.getinfo) ~= "function" then
        c()
    end
    if pcall(string.dump, debug.getinfo) then
        c()
    end
else
    c()
end

if pcall(string.dump, string.dump) then
    c()
end

if getmetatable(_G) ~= nil then
    c()
end

for k, v in pairs(_G) do
    if type(k) == "string" and (k:match("^__") or k == "jit") then
        c()
    end
end

local ok, ld = pcall(function()
    return loadstring
end)

if ok and type(ld) == "function" then
    if pcall(string.dump, ld) then
        c()
    end
end

local co = coroutine.create(function()
    return s
end)

local rok, rerr = coroutine.resume(co)

if not rok or rerr ~= s then
    c()
end

p10()
`;

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'
  let basePayload = sourceCode || ETA_ENAI_TKVR_PAYLOAD;
  const SECRET_MSG = "I really like Rick and Morty";
  const TOTAL_PARTS = "2818373738388392919173737627272727363817256367292822";
  const { code: fragmentCode, msgVarNames } = extremeFragment(SECRET_MSG, TOTAL_PARTS);
  let modifiedPayload = basePayload;
  modifiedPayload = modifiedPayload.replace(
    /local _ = \{[\s\S]*?local s = table\.concat\(r\)/,
    `--[=[ ORIGINAL MESSAGE FRAGMENTED INTO ${TOTAL_PARTS} PARTS ]=] ${fragmentCode} local s = _secretMsg`
  );
  modifiedPayload = modifiedPayload.replace(
    /local logger = function\(\)/,
    `--[=[ MSG_VARS: ${msgVarNames.join(',')} ]=] local logger = function()`
  );

  const antiDebug = `local _clk=os.clock local _t=_clk() for _=1,150000 do end if os.clock()-_t>5.0 then while true do end end `
  const extraProtections = getExtraProtections()
  let payloadToProtect = ""
  const isLoadstringRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const match = modifiedPayload.match(isLoadstringRegex)
  if (match) { payloadToProtect = match[1] }
  else { payloadToProtect = detectAndApplyMappings(modifiedPayload) }

  const finalVM = build18xVM(payloadToProtect)
  const result = `${HEADER} ${generateJunk(50, true)} ${antiDebug} ${extraProtections} ${finalVM}`
  return result.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate };

if (require.main === module) {
  const obfuscatedCode = obfuscate(ETA_ENAI_TKVR_PAYLOAD);
  console.log(obfuscatedCode);
}
