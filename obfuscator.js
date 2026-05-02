const HEADER = `--[[ this code its protected by unveilX | https://discord.gg/DU35Mhyhq]]`

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

// Reducir matemáticas en un 30% adicional respecto al valor actual (7.5% → 5.25%)
function lightMath(n) {
  if (Math.random() < 0.9475) return n.toString() // 94.75% sin matemáticas
  const a = Math.floor(Math.random() * 21) + 4
  const b = Math.floor(Math.random() * 7) + 2
  return `((${n}+${a}-${a})*${b}/${b})`
}

function runtimeString(s) {
  return `string.char(${s.split('').map(c => lightMath(c.charCodeAt(0))).join(',')})`
}

const MAPEO = {
  "ScreenGui": "Aggressive Renaming",
  "Frame": "String to Math",
  "TextLabel": "Table Indirection",
  "TextButton": "Mixed Boolean Arithmetic",
  "Humanoid": "Dynamic Junk",
  "Player": "Fake Flow",
  "RunService": "Virtual Machine",
  "TweenService": "Fake Flow",
  "Players": "Fake Flow"
}

function detectAndApplyMappings(code) {
  let modified = code, headers = ""
  for (const [word, tech] of Object.entries(MAPEO)) {
    const regex = new RegExp(`\\b${word}\\b`, "g")
    if (regex.test(modified)) {
      let replacement = `"${word}"`
      if (tech.includes("Aggressive Renaming")) {
        const v = genName()
        headers += `local ${v}="${word}" `
        replacement = v
      } else if (tech.includes("String to Math")) {
        replacement = `string.char(${word.split('').map(c => c.charCodeAt(0)).join(',')})`
      } else if (tech.includes("Mixed Boolean Arithmetic")) {
        replacement = `((1==1 or true)and"${word}")`
      }
      regex.lastIndex = 0
      modified = modified.replace(regex, () => `game[${replacement}]`)
    }
  }
  return headers + modified
}

function generateStrongJunk(lines) {
  let block = ''
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    if (r < 0.15) {
      block += `if pcall(function() return #{1,2,3}==3 end) then local ${genName('_')}=${lightMath(1)} end `
    } else if (r < 0.3) {
      block += `pcall(function() local ${genName('x')}=#{[1]=true} return ${genName('x')} end) `
    } else if (r < 0.45) {
      block += `if pcall(function() return type(rawget)=='function' end) then local ${genName('y')}=true end `
    } else if (r < 0.6) {
      block += `for _=1,${lightMath(1)} do pcall(function() local ${genName('z')}='${genName('')}' end) end `
    } else if (r < 0.75) {
      block += `pcall(function() error() end) `
    } else {
      block += `local ${genName('u')}=pcall(function() return math.sqrt(${lightMath(144)}) end) `
    }
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

// VM verdadera que ejecuta la carga útil (similar a antes, se usará para combinación final)
function buildTrueVM(payloadStr) {
  const STACK = genName()
  const chunkSize = 15
  const realChunks = []
  for (let i = 0; i < payloadStr.length; i += chunkSize)
    realChunks.push(payloadStr.slice(i, i + chunkSize))

  const seed = Math.floor(Math.random() * 200) + 50
  const saltVal = Math.floor(Math.random() * 250) + 1
  const KEY = genName()
  const SALT = genName()
  const memNames = []
  let realOrder = []
  let globalIndex = 0
  const totalChunks = realChunks.length * 3
  let currentReal = 0

  let vmCore = `local ${STACK}={} local ${KEY}=${lightMath(seed)} local ${SALT}=${lightMath(saltVal)} `

  for (let i = 0; i < totalChunks; i++) {
    const memName = genName()
    memNames.push(memName)
    if (currentReal < realChunks.length && (Math.random() > 0.5 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1)
      const chunk = realChunks[currentReal]
      let encBytes = []
      for (let j = 0; j < chunk.length; j++) {
        const enc = (chunk.charCodeAt(j) + seed + (globalIndex * saltVal)) % 256
        encBytes.push(lightMath(enc))
        globalIndex++
      }
      vmCore += `local ${memName}={${encBytes.join(',')}} `
      currentReal++
    } else {
      let fakeBytes = []
      let fakeLen = Math.floor(Math.random() * 20) + 5
      for (let j = 0; j < fakeLen; j++) fakeBytes.push(lightMath(Math.floor(Math.random() * 255)))
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `
    }
  }

  const poolVar = genName('_pool')
  const ORDER = genName('_order')
  const idxVar = genName('_idx')
  const byteVar = genName('_byte')

  vmCore += `local ${poolVar}={${memNames.join(',')}} `
  vmCore += `local ${ORDER}={${realOrder.map(n => lightMath(n)).join(',')}} `
  vmCore += `local _gIdx=0 `
  vmCore += `for _,${idxVar} in ipairs(${ORDER}) do `
  vmCore += `for _,${byteVar} in ipairs(${poolVar}[${idxVar}]) do `
  vmCore += `table.insert(${STACK},string.char(math.floor((${byteVar}-${KEY}-_gIdx*${SALT})%256))) `
  vmCore += `_gIdx=_gIdx+1 end end `
  vmCore += `local _e=table.concat(${STACK}) ${STACK}=nil `

  const ASSERT = `getfenv()[${runtimeString("assert")}]`
  const LOADSTRING = `getfenv()[${runtimeString("loadstring")}]`
  const GAME = `getfenv()[${runtimeString("game")}]`
  const HTTPGET = runtimeString("HttpGet")
  if (payloadStr.includes("http"))
    vmCore += `${ASSERT}(${LOADSTRING}(${GAME}[${HTTPGET}](${GAME},_e)))() `
  else
    vmCore += `${ASSERT}(${LOADSTRING}(_e))() `

  return vmCore
}

function applyCFF(blocks, stateVar) {
  let lua = `local ${stateVar}=${lightMath(1)} ; while true do `
  for (let i = 0; i < blocks.length; i++) {
    if (i === 0) {
      lua += `if ${stateVar}==${lightMath(1)} then ${blocks[i]} ${stateVar}=${lightMath(2)} `
    } else {
      lua += `elseif ${stateVar}==${lightMath(i+1)} then ${blocks[i]} ${stateVar}=${lightMath(i+2)} `
    }
  }
  lua += `elseif ${stateVar}==${lightMath(blocks.length+1)} then break end end `
  return lua
}

// VM de una sola capa personalizable (estilo Luraph mejorado)
function buildSingleVM(innerCode, handlerCount = null) {
  if (!handlerCount) handlerCount = Math.floor(Math.random() * 4) + 4
  const handlers = []
  const used = new Set()
  const bases = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  while (handlers.length < handlerCount) {
    const base = bases[Math.floor(Math.random() * bases.length)]
    const name = base + Math.floor(Math.random() * 99)
    if (!used.has(name)) { used.add(name); handlers.push(name) }
  }

  const realIdx = Math.floor(Math.random() * handlerCount)
  const DISPATCH = genName('d')
  let out = `local lM={} local _A,_B,_C=0,0,0 `
  for (let i = 0; i < handlers.length; i++) {
    const fakeJunk = junkBlocks(Math.floor(Math.random() * 5) + 2, 4)
    const extraDecoy = Math.random() < 0.3
      ? `_A,_B,_C=${lightMath(Math.floor(Math.random()*100))},${lightMath(Math.floor(Math.random()*100))},${lightMath(Math.floor(Math.random()*100))} ; `
      : ''
    if (i === realIdx)
      out += `local ${handlers[i]}=function(lM) ${extraDecoy} ${fakeJunk} ${innerCode} return nil end ;`
    else
      out += `local ${handlers[i]}=function(lM) ${extraDecoy} ${fakeJunk} return nil end ;`
  }
  out += `local ${DISPATCH}={} `
  // Claves mezcladas con lightMath y alguna indirección
  for (let i = 0; i < handlers.length; i++) {
    const key = Math.random() < 0.5
      ? `[${lightMath(i+1)}]`
      : `[string.char(${lightMath(65+i)},${lightMath(65+i)}).."x"]`
    out += `${DISPATCH}${key}=${handlers[i]} ;`
  }
  out += `local _realIdx=${realIdx+1} ;`
  // Resolución dinámica con un poco de ofuscación adicional
  const getHandler = `(function(idx) if idx==${lightMath(realIdx+1)} then return ${DISPATCH}[${lightMath(realIdx+1)}] else return ${DISPATCH}[idx] end end)`
  const execPart = `(${getHandler})(${lightMath(realIdx+1)})(lM)`
  const stateVar = genName('s')
  out += applyCFF(Array(handlers.length).fill(execPart), stateVar)
  return `do ${out} end`
}

// Construye una VM anidada de 2 capas (mínimo) para cada parte del payload
function buildMinimalNestedVM(innerCode) {
  let vm = buildSingleVM(innerCode, Math.floor(Math.random() * 3) + 3)
  vm = buildSingleVM(vm, Math.floor(Math.random() * 3) + 3)
  return vm
}

// Anti‑env logger más pequeño, silencioso y fuerte
function antiEnvLoggerCode() {
  // Si se detecta un entorno manipulado, corrompe silenciosamente la ejecución
  return `
do
  local function _stealthCheck()
    if pcall(getfenv, 0) then return true end
    if debug and debug.getinfo then
      if pcall(debug.getinfo, print) then return true end
    end
    return false
  end
  if _stealthCheck() then
    -- Corromper variables críticas sin errores obvios
    local _t = { __index = function() return error(nil, 0) end }
    setmetatable(_G, _t)
    -- Bucle infinito que hace perder tiempo de análisis
    while true do end
  end
end`
}

function megaProtections() {
  const cleanLogger = antiEnvLoggerCode()
  return buildMinimalNestedVM(cleanLogger)
}

// Divide el payload en 20 partes y las encapsula en VMs mínimas
function splitPayloadIntoParts(payload, partsCount = 20) {
  const partLength = Math.ceil(payload.length / partsCount)
  const parts = []
  for (let i = 0; i < partsCount; i++) {
    parts.push(payload.slice(i * partLength, (i + 1) * partLength))
  }
  return parts
}

function build20PartVMs(payload) {
  const parts = splitPayloadIntoParts(payload, 20)
  const partVMs = []
  const partVarBase = genName('_p')
  const partTable = genName('_parts')

  // Declaración de tabla global de partes
  let header = `local ${partTable}={} `
  for (let i = 0; i < parts.length; i++) {
    const partVar = genName('_part' + i)
    const decoyJunk = junkBlocks(Math.floor(Math.random() * 5) + 2, 5)
    // Cada parte debe almacenarse en la tabla en la posición correspondiente
    const storeCode = `${partTable}[${lightMath(i+1)}]=${partVar}`
    // La parte misma se obtiene de un string ofuscado que representa el fragmento
    const partStr = parts[i]
    const encoded = runtimeString(partStr)
    // Código interno que decodifica y asigna
    const inner = `local ${partVar}=${encoded} ; ${decoyJunk} ; ${storeCode}`
    const vm = buildMinimalNestedVM(inner)
    partVMs.push(vm)
  }

  // Mezclar los VMs de las partes con basura adicional para que estén dispersos
  let combined = header
  for (let i = 0; i < partVMs.length; i++) {
    combined += `do ${partVMs[i]} end `
    const spacer = junkBlocks(Math.floor(Math.random() * 10) + 5, 20)
    combined += spacer
  }

  // Combinador final que junta las 20 partes y ejecuta
  const combiner = `
do
  local _assembled = {}
  for i=1,20 do
    table.insert(_assembled, ${partTable}[i])
  end
  local _finalPayload = table.concat(_assembled)
  ${partTable}=nil
  ${buildTrueVM('_finalPayload')}
end`

  combined += combiner
  return combined
}

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'

  let payload = ""
  const regex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const match = sourceCode.match(regex)
  if (match) {
    payload = match[1]
  } else {
    payload = detectAndApplyMappings(sourceCode)
  }

  const protections = megaProtections()
  const junk = junkBlocks(80, 30)
  const mainVM = build20PartVMs(payload)

  let final = `${HEADER}
${protections}
${junk}
${mainVM}`
  final = final.replace(/\s+/g, " ").trim()
  return final
}

module.exports = { obfuscate }
