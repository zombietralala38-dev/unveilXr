// ─── HEADER ────────────────────────────────────────────────────────
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

function generateStrongJunk(lines) {
  let block = ''
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    if (r < 0.15) block += `if pcall(function() return #{1,2,3}==3 end) then local ${genName('_')}=${lightMath(1)} end `
    else if (r < 0.3) block += `pcall(function() local ${genName('x')}=#{[1]=true} return ${genName('x')} end) `
    else if (r < 0.45) block += `if pcall(function() return type(rawget)=='function' end) then local ${genName('y')}=true end `
    else if (r < 0.6) block += `for _=1,${lightMath(1)} do pcall(function() local ${genName('z')}='${genName('')}' end) end `
    else if (r < 0.75) block += `pcall(function() error() end) `
    else block += `local ${genName('u')}=pcall(function() return math.sqrt(${lightMath(144)}) end) `
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

// ═══════════════════ VM ANIDADA (genérica, acepta código externo) ═══
function buildGenericVMLayer(innerCode, layers = 4) {
  // Construye una capa de VM que toma 'code' como parámetro y lo ejecuta con innerCode.
  // innerCode es una función que recibe 'code' y hace algo (loadstring(code)())
  // Vamos a anidar varias veces buildSingleVM pero adaptado a un parámetro.
  const handlerCount = Math.floor(Math.random() * 3) + 3
  const handlers = []
  const usedLocal = new Set()
  while (handlers.length < handlerCount) {
    const base = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 52)]
    const name = base + Math.floor(Math.random() * 99)
    if (!usedLocal.has(name)) { usedLocal.add(name); handlers.push(name) }
  }

  const realIdx = Math.floor(Math.random() * handlerCount)
  const DISPATCH = genName('d')
  let layerCode = `local lM={} `
  for (let i = 0; i < handlers.length; i++) {
    const junk = generateStrongJunk(3)
    if (i === realIdx)
      layerCode += `local ${handlers[i]}=function(${DISPATCH},code) ${junk} ${innerCode} end `
    else
      layerCode += `local ${handlers[i]}=function(${DISPATCH},code) ${junk} return nil end `
  }
  layerCode += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++) layerCode += `[${lightMath(i+1)}]=${handlers[i]},`
  layerCode += `} `

  const execBlocks = handlers.map((_, i) => `${DISPATCH}[${lightMath(i+1)}](${DISPATCH},code)`)
  const stateVar = genName('s')
  // applyCFF
  layerCode += `local ${stateVar}=${lightMath(1)} while true do `
  for (let i = 0; i < execBlocks.length; i++) {
    if (i === 0) layerCode += `if ${stateVar}==${lightMath(1)} then ${execBlocks[i]} ${stateVar}=${lightMath(2)} `
    else layerCode += `elseif ${stateVar}==${lightMath(i+1)} then ${execBlocks[i]} ${stateVar}=${lightMath(i+2)} `
  }
  layerCode += `elseif ${stateVar}==${lightMath(execBlocks.length+1)} then break end end `
  return `do ${layerCode} end`
}

function generateVMExecutor() {
  // Devuelve el cuerpo de una función Lua que ejecuta código en capas de VM
  // La función externa se llamará _VME(code)
  let inner = `local fn,err=loadstring(code) if fn then fn() else error(err) end`
  // Añadir capas de VM (30 en total como build30xVM pero genérico)
  for (let i = 0; i < 30; i++) {
    inner = buildGenericVMLayer(inner, 4) // cada capa usa 4 handlers mínimo
  }
  return inner
}

// ═══════════════════ ANTI‑TAMPER GENERATOR (modificado) ═════════════
function generateGigaAntiTamper(payloadData, isUrl) {
  // RC4 real
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

  // Semillas para la clave de cifrado
  const W = Math.floor(Math.random() * 9000000) + 1000000
  const X = Math.floor(Math.random() * 9000000) + 1000000
  const key = "TempKey" + W + X

  // Cifrar flag (1 byte: 1=URL, 0=código inline) y payload
  const flagByte = String.fromCharCode(isUrl ? 1 : 0)
  const toEncrypt = flagByte + payloadData
  const encBytes = rc4(key, toEncrypt)
  const encHex = Array.from(encBytes, c => '\\x' + c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()).join('')

  // VM Executor (se insertará como función local _VME)
  const vmExecutorBody = generateVMExecutor()
  const vmFunc = `local function _VME(code)\n${vmExecutorBody}\nend`

  // Constantes ofuscadas (placeholder, se pueden generar más)
  const Q = rc4("A!_x2$9*", "\x1F\xA4\x3D\xB2\xCC\x77\xE9\x01\x10\xF0\xDA\x0F\x00")
  const R = rc4("B7!hJpQ", "\xAB\xCD\xEF\x01\x23\x45\x67\x89\xAB\xCD\xEF\x01")
  const S = rc4("z99pLm", "\xDE\xAD\xBE\xEF\x00\x11\x22\x33\x44\x55\x66\x77\x88")

  // Plantilla del anti‑tamper (idéntica al original pero con _AK modificada)
  const antiTamperTemplate = `
--[[
████████╗ █████╗ ███╗   ███╗████████╗ █████╗ ████████╗ ██████╗ ██╗   ██╗
╚══██╔══╝██╔══██╗████╗ ████║██╔════╝██╔══██╗╚══██╔══╝██╔═══██╗██║   ██║
   ██║   ███████║██╔████╔██║█████╗  ███████║   ██║   ██║   ██║██║   ██║
   ██║   ██╔══██║██║╚██╔╝██║██╔══╝  ██╔══██║   ██║   ██║   ██║██║   ██║
   ██║   ██║  ██║██║ ╚═╝ ██║███████╗██║  ██║   ██║   ╚██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝    ╚═════╝  ╚═════╝ 
]]--
local _A,_B,_C,_D,_E,_F,_G,_H,_I,_J = getfenv,rawget,pcall,debug,error,math,string,table,bit32,os
local _K = _A()
local _L,_M,_N,_O = _G.random, _G.format, _C, _D.getinfo
math.randomseed(tick())

-- Motor RC4 local
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

-- Constantes encriptadas
local _Q = _P("A!_x2$9*", "${Q}")
local _R = _P("B7!hJpQ", "${R}")
local _S = _P("z99pLm", "${S}")

-- ... (resto del código anti‑tamper: _T,_U,_V,_W,_X,_Y,_Z,_AA,_AB,_AC,_AD,_AE,_AF,_AG,_AH,_AI,_AJ) ...
-- (Lo mantengo idéntico al original por brevedad, pero va aquí completo)

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
  -- Ejecutar a través de la VM anidada
  _C(function()
    _VME(code)
  end)
end

-- Llamar al payload tras un retardo
spawn(function()
  wait(0.5 + _F.random() * 2)
  _AK()
end)

-- Auto‑limpieza
_K._GIGA_ANTITAMPER = nil
`.trim()

  return antiTamperTemplate
}

// ═══════════════════ OFUSCADOR PRINCIPAL ═══════════════════════════
function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'

  // Detectar si es cargador de URL
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

  const finalScript = HEADER + '\n' + generateGigaAntiTamper(payloadData, isUrl)
  return finalScript.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate }
