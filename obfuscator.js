
// ─── HEADER (único watermark) ──────────────────────────────────────
const HEADER = `--[[ this code its protected by unveilX | https://discord.gg/DU35Mhyhq]]`

// ═══════════════════ UTILIDADES ═══════════════════════════════════
const usedNames = new Set()

function genName(prefix = '') {
  let name
  do {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'
    name = prefix
    const len = 5 + Math.floor(Math.random() * 8)
    for (let i = 0; i < len; i++) name += chars[Math.floor(Math.random() * chars.length)]
    name += Math.floor(Math.random() * 99999)
  } while (usedNames.has(name))
  usedNames.add(name)
  return name
}

function lightMath(n) {
  if (Math.random() < 0.85) return n.toString()
  const a = Math.floor(Math.random() * 21) + 4
  const b = Math.floor(Math.random() * 7) + 2
  return `((${n}+${a}-${a})*${b}/${b})`
}

function runtimeString(s) {
  return `string.char(${s.split('').map(c => lightMath(c.charCodeAt(0))).join(',')})`
}

// ═══════════════════ JUNK GENERATOR ════════════════════════════════
function generateStrongJunk(lines) {
  let block = ''
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    const varName = genName('_')
    if (r < 0.15) block += `if pcall(function() return #{1,2,3}==3 end) then local ${varName}=${lightMath(1)} end `
    else if (r < 0.3) block += `pcall(function() local ${varName}=#{[1]=true} return ${varName} end) `
    else if (r < 0.45) block += `if pcall(function() return type(rawget)=='function' end) then local ${varName}=true end `
    else if (r < 0.6) block += `for _=1,${lightMath(1)} do pcall(function() local ${varName}='${genName('')}' end) end `
    else if (r < 0.75) block += `pcall(function() error() end) `
    else block += `local ${varName}=pcall(function() return math.sqrt(${lightMath(144)}) end) `
  }
  return block
}

function junkBlocks(totalLines, blockSize = 30) {
  let full = ''
  for (let i = 0; i < totalLines; i += blockSize) {
    const lines = Math.min(blockSize, totalLines - i)
    full += `do ${generateStrongJunk(lines)} end `
  }
  return full
}

// ═══════════════════ VM ANIDADA MULTICAPA ═════════════════════════
function buildGenericVMLayer(innerCode) {
  const handlerCount = Math.floor(Math.random() * 3) + 3
  const handlers = []
  const usedLocal = new Set()
  
  while (handlers.length < handlerCount) {
    const base = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 52)]
    const name = base + Math.floor(Math.random() * 99)
    if (!usedLocal.has(name)) { 
      usedLocal.add(name)
      handlers.push(name) 
    }
  }

  const realIdx = Math.floor(Math.random() * handlerCount)
  const DISPATCH = genName('d')
  let layerCode = `local lM={} `
  
  for (let i = 0; i < handlers.length; i++) {
    const junk = generateStrongJunk(3)
    if (i === realIdx) {
      layerCode += `local ${handlers[i]}=function(${DISPATCH},code) ${junk} ${innerCode} end `
    } else {
      layerCode += `local ${handlers[i]}=function(${DISPATCH},code) ${junk} return nil end `
    }
  }
  
  layerCode += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++) {
    layerCode += `[${lightMath(i+1)}]=${handlers[i]},`
  }
  layerCode += `} `

  const execBlocks = handlers.map((_, i) => `${DISPATCH}[${lightMath(i+1)}](${DISPATCH},code)`)
  const stateVar = genName('s')
  layerCode += `local ${stateVar}=${lightMath(1)} while true do `
  
  for (let i = 0; i < execBlocks.length; i++) {
    if (i === 0) {
      layerCode += `if ${stateVar}==${lightMath(1)} then ${execBlocks[i]} ${stateVar}=${lightMath(2)} `
    } else {
      layerCode += `elseif ${stateVar}==${lightMath(i+1)} then ${execBlocks[i]} ${stateVar}=${lightMath(i+2)} `
    }
  }
  
  layerCode += `elseif ${stateVar}==${lightMath(execBlocks.length+1)} then break end end `
  return `do ${layerCode} end`
}

function generateVMExecutor() {
  let inner = `local fn,err=loadstring(code) if fn then fn() else error(err) end`
  // 30 capas de VM anidadas
  for (let i = 0; i < 30; i++) {
    inner = buildGenericVMLayer(inner)
  }
  return inner
}

// ═══════════════════ RC4 ENCRYPTION ════════════════════════════════
function rc4(key, data) {
  const s = Array.from({ length: 256 }, (_, i) => i)
  let j = 0
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key.charCodeAt(i % key.length)) % 256
    ;[s[i], s[j]] = [s[j], s[i]]
  }
  let i = 0, j2 = 0
  const result = []
  for (const c of data) {
    i = (i + 1) % 256
    j2 = (j2 + s[i]) % 256
    ;[s[i], s[j2]] = [s[j2], s[i]]
    result.push(c.charCodeAt(0) ^ s[(s[i] + s[j2]) % 256])
  }
  return String.fromCharCode(...result)
}

function encryptPayload(data, key) {
  const encrypted = rc4(key, data)
  return Array.from(encrypted, c => '\\x' + c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()).join('')
}

// ═══════════════════ ANTI‑TAMPER GENERATOR (CORREGIDO) ═════════════
function generateAntiTamper(payloadData, isUrl) {
  const W = Math.floor(Math.random() * 9000000) + 1000000
  const X = Math.floor(Math.random() * 9000000) + 1000000
  const key = "TempKey" + W + X

  const flagByte = String.fromCharCode(isUrl ? 1 : 0)
  const toEncrypt = flagByte + payloadData
  const encHex = encryptPayload(toEncrypt, key)

  const vmExecutorBody = generateVMExecutor()
  const vmFunc = `local function _VME(code)
${vmExecutorBody}
end`

  // Constantes encrypted de ejemplo
  const Q = encryptPayload("\x1F\xA4\x3D\xB2\xCC\x77\xE9\x01\x10\xF0\xDA\x0F\x00", "A!_x2$9*")
  const R = encryptPayload("\xAB\xCD\xEF\x01\x23\x45\x67\x89\xAB\xCD\xEF\x01", "B7!hJpQ")
  const S = encryptPayload("\xDE\xAD\xBE\xEF\x00\x11\x22\x33\x44\x55\x66\x77\x88", "z99pLm")

  const antiTamperCode = `
local _A,_B,_C,_D,_E,_F,_G,_H,_I,_J = getfenv,rawget,pcall,debug,error,math,string,table,bit32,os
local _K = _A()

math.randomseed(tick())

-- RC4 engine
local function _P(key, data)
  local s = {}
  for i = 0, 255 do s[i] = i end
  local j = 0
  for i = 0, 255 do
    j = (j + s[i] + _F.byte(key, (i % #key) + 1)) % 256
    s[i], s[j] = s[j], s[i]
  end
  local i, j = 0, 0
  local r = {}
  for k = 1, #data do
    i = (i + 1) % 256
    j = (j + s[i]) % 256
    s[i], s[j] = s[j], s[i]
    r[k] = _F.char(_I.bxor(_F.byte(data, k), s[(s[i] + s[j]) % 256]))
  end
  return _H.concat(r)
end

-- Encrypted constants
local _Q = _P("A!_x2$9*", "${Q}")
local _R = _P("B7!hJpQ", "${R}")
local _S = _P("z99pLm", "${S}")

-- Camuflaje / junk functions
local function _T()
  for _ = 1, _F.random(1,3) do
    local x = _F.random(1000,9999)
    local y = x / 7
    local z = {}
    for i = 1, 10 do z[i] = _F.random() end
    _H.sort(z)
  end
end

local function _U()
  local f = _K["loadstring"] or loadstring
  local ok, err = _C(function()
    local code = "return " .. _F.random(1,100)
    local fn = f(code)
    if fn then fn() end
  end)
  return ok ~= false
end

local function _V(n)
  local t = {}
  for i = 1, n do t[i] = _F.char(_F.random(65,90)) end
  return _H.concat(t)
end

-- Estado corrupto y canarios
local _W = _F.random(1000000,9999999)
local _X = _F.random(1000000,9999999)
local _Y = tick()
local _Z = false
local _AA = 0

-- Corrupción progresiva
local function _AB(level)
  if _Z then return end
  _Z = true
  _AA = level
  spawn(function()
    local delay = 5 + _F.random() * 10
    wait(delay)
    if level == 1 then
      local orig = game.FindFirstChild
      game.FindFirstChild = function(...)
        if _F.random() > 0.85 then return nil end
        return orig(...)
      end
      _K.loadstring = function(...) return loadstring("error('tamper')") end
    elseif level == 2 then
      _C(function() game:GetService("Players").LocalPlayer:Kick("0x" .. _F.format("%08X", _F.random(0, 0xFFFFFFFF))) end)
      _C(function() game:GetService("CoreGui"):ClearAllChildren() end)
    elseif level == 3 then
      spawn(function() while true do wait(0.5) _C(function()
        local kids = workspace:GetChildren()
        if #kids > 0 then kids[_F.random(#kids)]:Destroy() end
      end) end end)
    elseif level == 4 then
      local plrs = game:GetService("Players")
      plrs.PlayerAdded:Connect(function(p)
        spawn(function() while true do wait(1) p:Kick("0x" .. _F.format("%X", _F.random(0, 0xFFFF))) end end)
      end)
      plrs.PlayerRemoving:Connect(function(p) while true do wait() end end)
    elseif level >= 5 then
      spawn(function()
        local part = Instance.new("Part")
        part.Anchored = true
        part.Parent = workspace
        wait(0.1)
        while true do
          _C(function()
            for i = 1, 5000 do
              local clone = part:Clone()
              clone.Parent = workspace
            end
          end)
          wait()
        end
      end)
    end
    while true do
      wait(_F.random() * 2 + 0.5)
      _C(function() error("MEMORY CORRUPTION AT 0x" .. _F.format("%08X", _F.random(0, 0xFFFFFF))) end)
    end
  end)
end

-- Detección de Sandbox
local function _AC()
  if _K.syn or _K.scripthook or _K.fluxus or _K.krnl then return true end
  if not _C(function() print(1) end) then return true end
  if _K.writefile or _K.appendfile or _K.readfile or _K.makefolder then return true end
  local fenv = _A(0)
  if type(fenv) ~= "table" then return true end
  local count = 0
  for _ in pairs(fenv) do count = count + 1 end
  if count > 350 then return true end
  if tick() - _Y < 0.08 then return true end
  return false
end

-- Detección de Hooks y Loggers
local function _AD()
  local function probe() return true end
  local ok = _C(function()
    local info = _D.getinfo(probe, "S")
    return info and info.what == "Lua"
  end)
  if not ok then return true end
  local fn = _K.loadstring
  if type(fn) ~= "function" then return true end
  local chunk, err = fn("return 1")
  if not chunk or type(chunk) ~= "function" then return true end
  local success, val = _C(chunk)
  if not success or val ~= 1 then return true end
  if not _C(function() return _D.getregistry() end) then return true end
  return false
end

-- Verificación de integridad del script (checksum)
local _AE = _P("IntegrityCheckSalt#1", "\\xDE\\xAD\\xBE\\xEF\\x00\\x11\\x22\\x33\\x44\\x55\\x66\\x77")
local _AF = 0x5A5A5A5A
local function _AG()
  local h = 0x811C9DC5
  for i = 1, #_AE do
    local b = _F.byte(_AE, i)
    h = _I.bxor(h, b)
    h = (h * 0x01000193) % 0x100000000
  end
  if h ~= _AF then
    _AB(3)
    return false
  end
  return true
end

-- Verificación de funciones críticas
local function _AH()
  local libs = {"loadstring","getfenv","setfenv","pcall","xpcall","debug.getinfo"}
  for _, lib in ipairs(libs) do
    local parts = {}
    for seg in _F.gmatch(lib, "[^.]+") do
      _H.insert(parts, seg)
    end
    local obj = _K
    for i = 1, #parts - 1 do
      obj = obj[parts[i]]
      if type(obj) ~= "table" then
        _AB(4)
        return false
      end
    end
    local fn = obj[parts[#parts]]
    if type(fn) ~= "function" then
      _AB(4)
      return false
    end
  end
  return true
end

-- Detección de pausas y step-over
local function _AI()
  local now = tick()
  local diff = now - (_Y + _W % 100)
  if diff > 5.0 then
    _AB(2)
    return false
  end
  if diff < 0.02 and _F.random() > 0.95 then
    _AB(1)
  end
  _W = _I.bxor(_W, 0x5A5A5A5A)
  return true
end

-- Verificación maestro
local function _AJ()
  _T()
  if _AC() then _AB(3); return end
  _U()
  if _AD() then _AB(4); return end
  _AG()
  _AH()
  _AI()
  _X = _I.bror(_X, 3)
  _W = _W + 1
  _T()
end

-- Vigilancia eterna
spawn(function()
  while not _Z do
    wait(10 + _F.random() * 20)
    _AJ()
  end
end)

-- ═══════════ VM EXECUTOR ═══════════
${vmFunc}

-- ═══════════ FUNCIÓN DE CARGA FINAL ═══════════
local function _AK()
  if _Z then return end
  local decrypt = function(cipher)
    return _P("TempKey" .. ${W} .. ${X}, cipher)
  end
  local data = decrypt("${encHex}")
  local flag = _F.byte(data, 1)
  local content = _F.sub(data, 2)
  local code = nil
  if flag == 1 then
    _C(function()
      code = game:HttpGet(content)
    end)
    if not code then _AB(2); return end
  else
    code = content
  end
  _C(function()
    _VME(code)
  end)
end

spawn(function()
  wait(0.5 + _F.random() * 2)
  _AK()
end)

-- Auto‑limpieza
_K._GIGA_ANTITAMPER = nil
`.trim()

  return antiTamperCode
}

// ═══════════════════ OFUSCADOR PRINCIPAL ═══════════════════════════
function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR: Empty code'

  const regex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const match = sourceCode.match(regex)

  let payloadData, isUrl
  if (match) {
    payloadData = match[1]
    isUrl = true
  } else {
    payloadData = sourceCode
    isUrl = false
  }

  const antiTamperCode = generateAntiTamper(payloadData, isUrl)
  const finalScript = HEADER + '\n' + antiTamperCode
  
  return finalScript.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate }
