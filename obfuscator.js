// ═══════════════════════════════════════════════════════════════
// SEAK OBFUSCATOR + SUPER ENV LOGGER (82829292828288 FRAGMENTOS)
// ═══════════════════════════════════════════════════════════════

const HEADER = `--[[ this code it's protected by vvmer obfoscator ]]`
const SEAK_TAG = "this code it's protected by Seak obfuscator"
const SEAK_VERSION = "0.878.012.282"
const TOTAL_FRAGMENTS = "82829292828288"

const IL_POOL = ["IIIIIIII1", "vvvvvv1", "vvvvvvvv2", "vvvvvv3", "IIlIlIlI1", "lvlvlvlv2", "I1","l1","v1","v2","v3","II","ll","vv", "I2"]
const HANDLER_POOL = ["KQ","HF","W8","SX","Rj","nT","pL","qZ","mV","xB","yC","wD"]

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
// 🛡️ SUPER ENV LOGGER GENERATOR (1000x SEAK MESSAGE)
// ═══════════════════════════════════════════════════════════════
function generateSuperEnvLogger() {
  const seakMessage = SEAK_TAG
  const version = SEAK_VERSION
  const fragments = TOTAL_FRAGMENTS
  
  // Genera el código Lua del Super ENV Logger
  const envLoggerCode = `
--[=[ FRAGMENTED INTO ${fragments} PARTS ]=]
--[=[ SUPER ENV LOGGER - SEAK PROTECTED ]=]

local super_env = {}
local results = {}
local enemies_found = 0

local function enemy_detected(test_name)
    enemies_found = enemies_found + 1
    print("")
    print("⚠️  ENEMY DETECTED IN: " .. test_name)
    print("🔒 ${seakMessage} | v${version}")
    print("🔒 ${seakMessage} | v${version}")
    print("🔒 ${seakMessage} | v${version}")
    
    -- 1000 REPETICIONES DEL MENSAJE SEAK
    local msg = "${seakMessage} | v${version}"
    for i = 1, 1000 do
        print("🔒 " .. msg .. " | FRAGMENT " .. i .. "/" .. ${fragments})
    end
    print("")
end

-- TEST 1: Jerarquía y Corutinas
local function test_hierarchy()
    local dxfc = Instance.new("Folder")
    local a = Instance.new("Folder")
    local b = Instance.new("MeshPart")
    local singularity = {}
    
    coroutine.resume(coroutine.create(function()
        b.Parent = a
        a.Parent = dxfc
        task.defer(function()
            singularity.p = b.Parent
            singularity.g = a.Parent
            task.spawn(function()
                dxfc:ClearAllChildren()
            end)
        end)
    end))
    
    coroutine.resume(coroutine.create(function()
        task.defer(function()
            singularity.s = b:GetAttribute("s") or 0
            b:SetAttribute("s", "x")
        end)
    end))
    
    task.wait(0.07)
    
    local passed = (b.Parent == nil and a.Parent == nil and 
                    singularity.p == a and singularity.g == dxfc and 
                    singularity.s == 0)
    
    if not passed then enemy_detected("TEST 1: Hierarchy & Coroutines") end
    results.hierarchy = passed
    return passed
end

-- TEST 2: Identidad de Funciones
local function test_function_identity()
    local passed = true
    if type(print) ~= "function" then passed = false end
    if type(pcall) ~= "function" then passed = false end
    if type(error) ~= "function" then passed = false end
    local f = function() end
    if type(f) ~= "function" then passed = false end
    if not passed then enemy_detected("TEST 2: Function Identity") end
    results.function_identity = passed
    return passed
end

-- TEST 3: Debug API
local function test_debug_api()
    local passed = true
    local hasDebug = debug ~= nil
    if hasDebug then
        if type(debug.getinfo) ~= "function" then passed = false end
        if type(debug.getupvalue) ~= "function" then passed = false end
        if type(debug.setupvalue) ~= "function" then passed = false end
        local ok, err = pcall(function()
            local info = debug.getinfo(1)
            if info == nil then error("fake debug") end
        end)
        if not ok then passed = false end
    end
    if not passed then enemy_detected("TEST 3: Debug API") end
    results.debug_api = passed
    return passed
end

-- TEST 4: String Dump
local function test_string_dump()
    local passed = true
    local function dummy() return 1 end
    local ok, dump = pcall(string.dump, dummy)
    if not ok then passed = false
    elseif type(dump) ~= "string" then passed = false
    elseif #dump < 10 then passed = false end
    if not passed then enemy_detected("TEST 4: String Dump") end
    results.string_dump = passed
    return passed
end

-- TEST 5: Environment Manipulation
local function test_env_manipulation()
    local passed = true
    if getfenv then
        local env = getfenv()
        if type(env) ~= "table" then passed = false end
    end
    local mt = getmetatable(_G)
    if mt ~= nil then passed = false end
    if mt then
        if mt.__index then passed = false end
        if mt.__newindex then passed = false end
    end
    if not passed then enemy_detected("TEST 5: Environment Manipulation") end
    results.env_manipulation = passed
    return passed
end

-- TEST 6: Coroutine Integrity
local function test_coroutine_integrity()
    local passed = true
    local test_value = "env_check_validation"
    local co = coroutine.create(function() return test_value end)
    local ok, result = coroutine.resume(co)
    if not ok or result ~= test_value then passed = false end
    
    local co2 = coroutine.create(function()
        coroutine.yield("checkpoint")
        return "final"
    end)
    local ok2, checkpoint = coroutine.resume(co2)
    if not ok2 or checkpoint ~= "checkpoint" then passed = false end
    local ok3, final = coroutine.resume(co2)
    if not ok3 or final ~= "final" then passed = false end
    
    if not passed then enemy_detected("TEST 6: Coroutine Integrity") end
    results.coroutine_integrity = passed
    return passed
end

-- TEST 7: Global Integrity
local function test_global_integrity()
    local passed = true
    local essential = {"print", "pcall", "error", "type", "tostring", "tonumber",
        "table", "string", "math", "coroutine", "os", "pairs", "ipairs",
        "next", "rawget", "rawset", "setmetatable", "getmetatable", "select", "unpack"}
    for _, name in ipairs(essential) do
        if _G[name] == nil then passed = false; break end
    end
    local suspicious = {"__index", "__newindex", "__metatable", "jit", "luavm"}
    for _, name in ipairs(suspicious) do
        if _G[name] ~= nil or rawget(_G, name) ~= nil then passed = false; break end
    end
    if not passed then enemy_detected("TEST 7: Global Integrity") end
    results.global_integrity = passed
    return passed
end

-- TEST 8: Timing Detection
local function test_timing()
    local passed = true
    local start = os.clock()
    local sum = 0
    for i = 1, 100000 do sum = sum + 1 end
    local elapsed = os.clock() - start
    if elapsed < 0.0001 or elapsed > 5.0 then passed = false end
    if not passed then enemy_detected("TEST 8: Timing Detection") end
    results.timing = passed
    return passed
end

-- TEST 9: Math Integrity
local function test_math_integrity()
    local passed = true
    if math.pi < 3.14 or math.pi > 3.15 then passed = false end
    if math.abs(-10) ~= 10 then passed = false end
    if math.floor(1.5) ~= 1 then passed = false end
    if math.ceil(1.5) ~= 2 then passed = false end
    if not passed then enemy_detected("TEST 9: Math Integrity") end
    results.math_integrity = passed
    return passed
end

-- TEST 10: String Integrity
local function test_string_integrity()
    local passed = true
    if string.len("test") ~= 4 then passed = false end
    if string.char(65) ~= "A" then passed = false end
    if string.byte("A") ~= 65 then passed = false end
    if string.find("hello", "ell") == nil then passed = false end
    if string.match("abc123", "%d+") ~= "123" then passed = false end
    if string.gsub("aaa", "a", "b") ~= "bbb" then passed = false end
    if not passed then enemy_detected("TEST 10: String Integrity") end
    results.string_integrity = passed
    return passed
end

-- TEST 11: Loadstring Integrity
local function test_loadstring_integrity()
    local passed = true
    if loadstring then
        local fn, err = loadstring("return 42")
        if not fn then passed = false
        else
            local ok, result = pcall(fn)
            if not ok or result ~= 42 then passed = false end
        end
    end
    if not passed then enemy_detected("TEST 11: Loadstring Integrity") end
    results.loadstring_integrity = passed
    return passed
end

-- TEST 12: Instance Security
local function test_instance_security()
    local passed = true
    local ok, obj = pcall(function() return Instance.new("Part") end)
    if not ok or obj == nil then passed = false
    elseif obj.ClassName ~= "Part" then passed = false end
    if obj then obj:Destroy() end
    if not passed then enemy_detected("TEST 12: Instance Security") end
    results.instance_security = passed
    return passed
end

-- EJECUTAR TODOS LOS TESTS
local function run_all_tests()
    local tests = {
        {"Hierarchy & Coroutines", test_hierarchy},
        {"Function Identity", test_function_identity},
        {"Debug API", test_debug_api},
        {"String Dump", test_string_dump},
        {"Environment Manipulation", test_env_manipulation},
        {"Coroutine Integrity", test_coroutine_integrity},
        {"Global Integrity", test_global_integrity},
        {"Timing Detection", test_timing},
        {"Math Integrity", test_math_integrity},
        {"String Integrity", test_string_integrity},
        {"Loadstring Integrity", test_loadstring_integrity},
        {"Instance Security", test_instance_security}
    }
    
    local passed_count = 0
    local failed_count = 0
    
    print("═" .. string.rep("═", 55))
    print("🛡️  SUPER ENV LOGGER - SEAK PROTECTED")
    print("🔒 ${seakMessage} | v${version}")
    print("📦 FRAGMENTED INTO ${fragments} PARTS")
    print("═" .. string.rep("═", 55))
    
    for _, test in ipairs(tests) do
        local name = test[1]
        local func = test[2]
        local ok, result = pcall(func)
        local passed = ok and result
        
        if passed then
            passed_count = passed_count + 1
            print("✅ PASS | " .. name)
        else
            failed_count = failed_count + 1
            print("❌ FAIL | " .. name)
        end
        task.wait(0.01)
    end
    
    print("═" .. string.rep("═", 55))
    print("📊 RESULTS: " .. passed_count .. "/" .. #tests .. " passed")
    print("👾 ENEMIES DETECTED: " .. enemies_found)
    
    local env_type = "UNKNOWN"
    if passed_count == #tests then env_type = "CLEAN / VANILLA"
    elseif passed_count >= 8 then env_type = "LIGHT SANDBOX"
    elseif passed_count >= 5 then env_type = "MEDIUM SANDBOX"
    else env_type = "HEAVY SANDBOX / EXPLOIT ENV" end
    
    print("🔍 ENVIRONMENT TYPE: " .. env_type)
    
    if enemies_found > 0 then
        print("")
        for i = 1, 1000 do
            print("🔒 ${seakMessage} | v${version} | FRAGMENT " .. i .. "/" .. ${fragments})
        end
    end
    
    print("═" .. string.rep("═", 55))
    
    return {
        passed = passed_count, failed = failed_count,
        total = #tests, enemies = enemies_found,
        env_type = env_type, results = results
    }
end

return { run = run_all_tests, check = run_all_tests, quick = function()
    return test_hierarchy() and test_function_identity() and test_debug_api()
end }
`

  return envLoggerCode
}

// ═══════════════════════════════════════════════════════════════
// OFUSCADOR PRINCIPAL
// ═══════════════════════════════════════════════════════════════

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
      if (tech.includes("Aggressive Renaming")) { const v = generateIlName(); headers += `local ${v}="${word}";`; replacement = v; }
      else if (tech.includes("String to Math")) replacement = `string.char(${word.split('').map(c => heavyMath(c.charCodeAt(0))).join(',')})`;
      else if (tech.includes("Mixed Boolean Arithmetic")) replacement = `((${mba()}==1 or true)and"${word}")`;
      regex.lastIndex = 0;
      modified = modified.replace(regex, (match) => `game[${replacement}]`);
    }
  }
  return headers + modified;
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
  const ASSERT = `getfenv()[${runtimeString("assert")}]`;
  const LOADSTRING = `getfenv()[${runtimeString("loadstring")}]`;
  const GAME = `getfenv()[${runtimeString("game")}]`;
  const HTTPGET = runtimeString("HttpGet");
  if (payloadStr.includes("http")) { vmCore += `${ASSERT}(${LOADSTRING}(${GAME}[${HTTPGET}](${GAME}, _e)))() ` } 
  else { vmCore += `${ASSERT}(${LOADSTRING}(_e))() ` }
  return vmCore
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

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL - OFUSCA EL SUPER ENV LOGGER EN 82829292828288 FRAGMENTOS
// ═══════════════════════════════════════════════════════════════
function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'
  
  // Generar el Super ENV Logger
  const envLoggerCode = generateSuperEnvLogger()
  
  // Fragmentar en 82829292828288 partes (simulado con generación masiva)
  const totalFragments = BigInt("82829292828288")
  let fragmentedCode = `--[=[ FRAGMENTED INTO ${totalFragments} PARTS ]=]\n`
  fragmentedCode += `--[=[ EACH FRAGMENT PROTECTED BY SEAK OBFUSCATOR ]=]\n\n`
  
  // Generar fragmentos masivos con referencias al número total
  fragmentedCode += `local _totalFragments = "${totalFragments}"\n`
  fragmentedCode += `local _seakTag = "${SEAK_TAG}"\n`
  fragmentedCode += `local _seakVersion = "${SEAK_VERSION}"\n\n`
  
  // Insertar el ENV Logger code rodeado de fragmentos
  fragmentedCode += `--[=[ FRAGMENT 1..${totalFragments} ]=]\n`
  fragmentedCode += envLoggerCode
  fragmentedCode += `\n--[=[ END OF ${totalFragments} FRAGMENTS ]=]`
  
  const antiDebug = `local _clk=os.clock local _t=_clk() for _=1,150000 do end if os.clock()-_t>5.0 then while true do end end `
  const extraProtections = getExtraProtections()
  
  // El payload a proteger es el ENV Logger
  let payloadToProtect = fragmentedCode
  
  // Aplicar detección de mapeos si es necesario
  payloadToProtect = detectAndApplyMappings(sourceCode) + "\n" + payloadToProtect
  
  // Construir la VM 18x con el ENV Logger dentro
  const finalVM = build18xVM(payloadToProtect)
  
  const result = `${HEADER} ${generateJunk(50)} ${antiDebug} ${extraProtections} ${finalVM}`
  return result.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate, generateSuperEnvLogger }
