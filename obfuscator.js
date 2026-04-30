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
  if (Math.random() < 0.8) return n.toString()
  const a = Math.floor(Math.random() * 21) + 4
  const b = Math.floor(Math.random() * 7) + 2
  return `((${n} + ${a} - ${a}) * ${b} / ${b})`
}

function runtimeString(s) {
  return `string.char(${s.split('').map(c => lightMath(c.charCodeAt(0))).join(',')})`
}

// ═══════════════════ JUNK GENERATOR (más estable) ════════════════════════════════
function generateStrongJunk(lines) {
  let block = ''
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    const varName = genName('_')
    if (r < 0.25) {
      block += `pcall(function() local ${varName}=1 end) `
    } else if (r < 0.5) {
      block += `if pcall(function() return type(math.sqrt)== "function" end) then local ${varName}=true end `
    } else {
      block += `local ${varName}=pcall(function() return ${lightMath(144)} end) `
    }
  }
  return block
}

function junkBlocks(totalLines, blockSize = 20) {
  let full = ''
  for (let i = 0; i < totalLines; i += blockSize) {
    const lines = Math.min(blockSize, totalLines - i)
    full += `do ${generateStrongJunk(lines)} end `
  }
  return full
}

// ═══════════════════ VM ANIDADA (corregida y más estable) ═════════════════════════
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
    const junk = generateStrongJunk(2)
    if (i === realIdx) {
      layerCode += `local \( {handlers[i]}=function( \){DISPATCH},code) ${junk} ${innerCode} end `
    } else {
      layerCode += `local \( {handlers[i]}=function( \){DISPATCH},code) ${junk} return end `
    }
  }
  
  layerCode += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++) {
    layerCode += `[\( {lightMath(i+1)}]= \){handlers[i]},`
  }
  layerCode += `} `

  const stateVar = genName('s')
  layerCode += `local \( {stateVar}= \){lightMath(1)} `
  layerCode += `while ${stateVar} <= ${lightMath(handlerCount)} do `
  
  for (let i = 0; i < handlers.length; i++) {
    layerCode += `if \( {stateVar}== \){lightMath(i+1)} then \( {DISPATCH}[ \){lightMath(i+1)}](${DISPATCH},code) \( {stateVar}= \){lightMath(i+2)} `
  }
  
  layerCode += `else break end end `
  return `do ${layerCode} end`
}

function generateVMExecutor() {
  let inner = `local fn,err=loadstring(code) if fn then fn() else error("exec")end`
  for (let i = 0; i < 25; i++) {  // Reduje ligeramente a 25 para mayor estabilidad
    inner = buildGenericVMLayer(inner)
  }
  return inner
}

// ═══════════════════ RC4 + ENCRYPTION (sin cambios) ════════════════════════════════
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

// ═══════════════════ ANTI-TAMPER (corregido y limpio) ═════════════════════════════
function generateAntiTamper(payloadData, isUrl) {
  const W = Math.floor(Math.random() * 9000000) + 1000000
  const X = Math.floor(Math.random() * 9000000) + 1000000
  const key = "TempKey" + W + X

  const flagByte = String.fromCharCode(isUrl ? 1 : 0)
  const toEncrypt = flagByte + payloadData
  const encHex = encryptPayload(toEncrypt, key)

  const vmExecutorBody = generateVMExecutor()
  const vmFunc = `local function _VME(code)\n${vmExecutorBody}\nend`

  const antiTamperCode = `
local _A,_B,_C,_D,_E,_F,_G,_H,_I,_J = getfenv,rawget,pcall,debug,error,math,string,table,bit32,os
local _K = _A()

math.randomseed(tick())

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

local _Q = _P("A!_x2$9*", "${encryptPayload("\\x1F\\xA4\\x3D\\xB2\\xCC\\x77\\xE9\\x01\\x10\\xF0\\xDA\\x0F\\x00", "A!_x2$9*")}")
local _R = _P("B7!hJpQ", "${encryptPayload("\\xAB\\xCD\\xEF\\x01\\x23\\x45\\x67\\x89\\xAB\\xCD\\xEF\\x01", "B7!hJpQ")}")

local function _T() for _=1,_F.random(1,2) do local x=_F.random(1000,9999) end end

local _W = _F.random(1000000,9999999)
local _Y = tick()
local _Z = false

local function _AB(level)
  if _Z then return end
  _Z = true
  spawn(function()
    wait(3 + _F.random()*5)
    _C(function() error("0x".._F.format("%08X",_F.random(0,0xFFFFFFFF))) end)
  end)
end

local function _AC()
  if _K.syn or _K.scripthook or _K.fluxus or _K.krnl then return true end
  if tick() - _Y > 30 then return true end
  return false
end

local function _AJ()
  _T()
  if _AC() then _AB(1) end
end

spawn(function()
  while not _Z do
    wait(15 + _F.random()*15)
    _AJ()
  end
end)

${vmFunc}

local function _AK()
  if _Z then return end
  local decrypt = function(cipher) return _P("TempKey"..\( {W}.. \){X}, cipher) end
  local data = decrypt("${encHex}")
  local flag = _F.byte(data, 1)
  local content = _F.sub(data, 2)
  local code = nil
  if flag == 1 then
    _C(function() code = game:HttpGet(content) end)
    if not code then _AB(1); return end
  else
    code = content
  end
  _C(function() _VME(code) end)
end

spawn(function()
  wait(0.5 + _F.random()*1.5)
  _AK()
end)
`.trim()

  return antiTamperCode
}

// ═══════════════════ OFUSCADOR PRINCIPAL (limpio) ═══════════════════════════
function obfuscate(sourceCode) {
  if (!sourceCode || typeof sourceCode !== "string") return '--ERROR: Código vacío o inválido'

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
  
  // Minificar un poco sin romper legibilidad crítica
  return finalScript.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate }
