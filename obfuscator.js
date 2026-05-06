// vvmer-obfuscator con ETA ENAI TKVR LOGGER integrado + fragmentación extrema CODE VAULT + ANTI-DEBUG LOCKER
const HEADER = `--[[ this code its prtexted by Seak obfuscator ]]`

const IL_POOL = ["IIIIIIII1", "vvvvvv1", "vvvvvvvv2", "vvvvvv3", "IIlIlIlI1", "lvlvlvlv2", "I1","l1","v1","v2","v3","II","ll","vv", "I2"]
const HANDLER_POOL = ["KQ","HF","W8","SX","Rj","nT","pL","qZ","mV","xB","yC","wD"]
const LOCKER_POOL = ["L0CK","TR4P","H0N3Y","P0T","SN4R3","F4K3","D3C0Y","B41T","M1M1C","GH0ST"]

function generateIlName() {
  return IL_POOL[Math.floor(Math.random() * IL_POOL.length)] + Math.floor(Math.random() * 99999)
}

function generateLockerName() {
  return LOCKER_POOL[Math.floor(Math.random() * LOCKER_POOL.length)] + Math.floor(Math.random() * 9999)
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

function heavyMath(n) {
  if (Math.random() < 0.8) return n.toString();
  let a = Math.floor(Math.random() * 3000) + 500
  let b = Math.floor(Math.random() * 50) + 2
  let c = Math.floor(Math.random() * 800) + 10
  let d = Math.floor(Math.random() * 20) + 2
  return `(((((${n}+${a})*${b})/${b})-${a})+((${c}*${d})/${d})-${c})`
}

function mba() {
  let n = Math.random() > 0.5 ? 1 : 2, a = Math.floor(Math.random() * 70) + 15, b = Math.floor(Math.random() * 40) + 8;
  return `((${n}*${a}-${a})/(${b}+1)+${n})`;
}

// ═══════════════════════════════════════════════════════════════
// ANTI-DEBUG LOCKER: Bomba de VM infinita escondida
// ═══════════════════════════════════════════════════════════════
function buildAntiDebugLocker(innerCode) {
  const LOCKER_KEY = generateLockerName();
  const TRAP_DOOR = generateLockerName();
  const GUARDIAN = generateLockerName();
  const SENTINEL = generateLockerName();
  const WARDEN = generateLockerName();
  
  // Capa 1: Anti-tampering superficial
  const antiTamper = `
    local ${LOCKER_KEY} = ${heavyMath(Math.floor(Math.random() * 9999) + 1000)}
    local ${TRAP_DOOR} = function()
      if debug and debug.getinfo then
        local info = debug.getinfo(1, "S")
        if info and info.source and string.find(info.source, "=[C]") then
          while true do end
        end
      end
      if getfenv and getfenv(0) ~= _G then
        while true do end
      end
    end
  `;
  
  // Capa 2: VM infinita falsa (señuelo para debuggers)
  const infiniteVMTrap = `
    local ${GUARDIAN} = function()
      local vm_stack = {}
      local vm_key = ${heavyMath(Math.random() * 500 + 100)}
      for i = 1, 100000 do
        table.insert(vm_stack, math.random(1, 256))
        if i % 1000 == 0 and debug and debug.getinfo then
          while true do end
        end
      end
      return vm_stack
    end
  `;
  
  // Capa 3: Anti-hook detection
  const antiHook = `
    local ${SENTINEL} = function()
      local original_clock = os.clock()
      for _ = 1, 10000 do end
      if os.clock() - original_clock > 10 then
        while true do end
      end
      local test_func = function() return true end
      local ok, result = pcall(string.dump, test_func)
      if not ok then
        while true do end
      end
    end
  `;
  
  // Capa 4: Environment validation
  const envValidation = `
    local ${WARDEN} = function()
      if _G ~= getfenv(0) then while true do end end
      if type(print) ~= "function" then while true do end end
      if math.pi < 3.14 or math.pi > 3.15 then while true do end end
      if string.byte and string.byte("A") ~= 65 then while true do end end
    end
  `;
  
  // Capa 5: Lógica de decisión (si pasa todas las pruebas, ejecuta normalmente)
  const decisionLogic = `
    ${TRAP_DOOR}()
    ${GUARDIAN}()
    ${SENTINEL}()
    ${WARDEN}()
    
    -- Si llegamos aquí, todo está bien, ejecutar código normal
    ${innerCode}
  `;
  
  return antiTamper + infiniteVMTrap + antiHook + envValidation + decisionLogic;
}

// ═══════════════════════════════════════════════════════════════
// CODE VAULT: Fragmentación extrema del mensaje secreto en partes
// ═══════════════════════════════════════════════════════════════
function extremeFragment(secretMsg, totalPartsStr) {
  const chars = secretMsg.split('');
  const charCodes = chars.map(c => c.charCodeAt(0));
  const fragVars = [];
  
  for (let i = 0; i < chars.length; i++) {
    const varName = generateIlName();
    const maskedCode = heavyMath(charCodes[i]);
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
      fragmentationCode += `if ${scrambledName} ~= ${heavyMath(frag.original.charCodeAt(0))} then local _err = 1 end `;
      fragmentationCode += `_fragCount = _fragCount + 1 `;
    }
  }
  
  fragmentationCode += `local _secretMsg = "" `;
  fragmentationCode += `local _idx = 1 `;
  
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

// VM verdadera con Rolling XOR + Salt (CODE VAULT)
function buildTrueVM(payloadStr) {
  const STACK = generateIlName(); const KEY = generateIlName(); const ORDER = generateIlName()
  const SALT = generateIlName();
  
  const seed = Math.floor(Math.random() * 200) + 50
  const saltVal = Math.floor(Math.random() * 250) + 1
  
  let vmCore = `local ${STACK}={} local ${KEY}=${heavyMath(seed)} local ${SALT}=${heavyMath(saltVal)} `
  const chunkSize = 15; let realChunks = [];
  for(let i = 0; i < payloadStr.length; i += chunkSize) { realChunks.push(payloadStr.slice(i, i + chunkSize)); }
  let poolVars = []; let realOrder = [];
  let totalChunks = realChunks.length * 3; let currentReal = 0; let globalIndex = 0;
  
  for(let i = 0; i < totalChunks; i++) {
    let memName = generateIlName(); poolVars.push(memName);
    if (currentReal < realChunks.length && (Math.random() > 0.5 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1);
      let chunk = realChunks[currentReal]; let encryptedBytes = [];
      for(let j = 0; j < chunk.length; j++) { 
        let enc = (chunk.charCodeAt(j) + seed + (globalIndex * saltVal)) % 256;
        encryptedBytes.push(heavyMath(enc)); 
        globalIndex++;
      }
      vmCore += `local ${memName}={${encryptedBytes.join(',')}} `;
      currentReal++;
    } else {
      let fakeBytes = []; let fakeLen = Math.floor(Math.random() * 20) + 5;
      for(let j = 0; j < fakeLen; j++) { fakeBytes.push(heavyMath(Math.floor(Math.random() * 255))); }
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `;
    }
  }
  
  vmCore += `local _pool={${poolVars.join(',')}} local ${ORDER}={${realOrder.map(n => heavyMath(n)).join(',')}} `;
  const idxVar = generateIlName(); const byteVar = generateIlName();
  
  vmCore += `local _gIdx=0 for _, ${idxVar} in ipairs(${ORDER}) do for _, ${byteVar} in ipairs(_pool[${idxVar}]) do `;
  vmCore += `if type(math.pi)=="string" then ${KEY}=(${KEY}+137)%256 end `;
  vmCore += `table.insert(${STACK}, string.char(math.floor((${byteVar} - ${KEY} - _gIdx * ${SALT}) % 256))) _gIdx=_gIdx+1 end end `;
  
  vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `;
  return vmCore;
}

function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount); const realIdx = Math.floor(Math.random() * handlerCount);
  const DISPATCH = generateIlName(); let out = `local lM={} ` 
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx) { out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(5)} ${innerCode} end ` } 
    else { out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(3)} return nil end ` }
  }
  out += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++) { out += `[${heavyMath(i + 1)}]=${handlers[i]},` }
  out += `} `
  let execBlocks = []; for (let i = 0; i < handlers.length; i++) { execBlocks.push(`${DISPATCH}[${heavyMath(i + 1)}](lM)`) }
  out += applyCFF(execBlocks); return out
}

function build18xVM(payloadStr) {
  let vm = buildTrueVM(payloadStr);
  for (let i = 0; i < 17; i++) {
    vm = buildSingleVM(vm, Math.floor(Math.random() * 2) + 3); 
  }
  return vm;
}

function generateJunk(lines = 100) {
  let j = ''
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    if (r < 0.2) j += `local ${generateIlName()}=${heavyMath(Math.floor(Math.random() * 999))} `
    else if (r < 0.4) j += `local ${generateIlName()}=string.char(${heavyMath(Math.floor(Math.random()*255))}) `
    else if (r < 0.5) j += `if not(${heavyMath(1)}==${heavyMath(1)}) then local x=1 end `
    else if (r < 0.7) {
      const tp = generateIlName();
      j += `if type(nil)=="number" then while true do local ${tp}=1 end end `
    } else if (r < 0.85) {
      const vt = generateIlName();
      j += `do local ${vt}={} ${vt}["_"]=1 ${vt}=nil end `
    } else {
      j += `if type(math.pi)=="string" then local _=1 end `
    }
  }
  return j
}

function applyCFF(blocks) {
  const stateVar = generateIlName()
  let lua = `local ${stateVar}=${heavyMath(1)} while true do `
  for (let i = 0; i < blocks.length; i++) {
    if (i === 0) lua += `if ${stateVar}==${heavyMath(1)} then ${blocks[i]} ${stateVar}=${heavyMath(2)} `
    else lua += `elseif ${stateVar}==${heavyMath(i + 1)} then ${blocks[i]} ${stateVar}=${heavyMath(i + 2)} `
  }
  lua += `elseif ${stateVar}==${heavyMath(blocks.length + 1)} then break end end `
  return lua
}

function runtimeString(str) {
  return `string.char(${str.split('').map(c => heavyMath(c.charCodeAt(0))).join(',')})`;
}

function getExtraProtections() {
  const antiDebuggers =
    `local _adT=os.clock() for _=1,150000 do end if os.clock()-_adT>5.0 then while true do end end ` +
    `if debug~=nil and debug.getinfo then local _i=debug.getinfo(1) if _i.what~="main" and _i.what~="Lua" then while true do end end end ` +
    `local _adOk,_adE=pcall(function() error("__v") end) if not string.find(tostring(_adE),"__v") then while true do end end `;

  const rawTampers = [
    `if math.pi<3.14 or math.pi>3.15 then _err() end`,
    `if bit32 and bit32.bxor(10,5)~=15 then _err() end`,
    `if type(tostring)~="function" then _err() end`,
    `if not string.match("chk","^c.*k$") then _err() end`,
    `if type(coroutine.create)~="function" then _err() end`,
    `if type(table.concat)~="function" then _err() end`,
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

// ═════════════════════════════════════════
// PAYLOAD DEL LOGGER ETA ENAI TKVR ORIGINAL
// ═════════════════════════════════════════
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

// ═════════════════════════════════════════
// FUNCIÓN PRINCIPAL DE OFUSCACIÓN CON LOCKER
// ═════════════════════════════════════════
function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'
  
  let basePayload = sourceCode || ETA_ENAI_TKVR_PAYLOAD;
  
  // Fragmentar el mensaje secreto
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
  
  // Construir VM con el payload
  const finalVM = build18xVM(modifiedPayload);
  
  // Envolver todo en el ANTI-DEBUG LOCKER
  const lockedCode = buildAntiDebugLocker(finalVM);
  
  const result = `${HEADER} ${generateJunk(50)} ${antiDebug} ${lockedCode}`
  return result.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate };

if (require.main === module) {
  const obfuscatedCode = obfuscate(ETA_ENAI_TKVR_PAYLOAD);
  console.log(obfuscatedCode);
}
