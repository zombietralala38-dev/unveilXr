/*
 * VVMER ULTIMATE OBFUSCATOR - 50KB OUTPUT - 10 NESTED VM LAYERS
 * Anti-debug, anti-tamper, anti-unpack, heavy math, junk tsunami
 * Generates ~50KB of obfuscated Lua code regardless of input size
 */

const HEADER = `--[[ VVMER ULTIMATE | 10-Layer VM | 50KB Shield ]]`

// ------------------------------------------------------------------------
// UTILITIES - Sin patrones, todo aleatorio
// ------------------------------------------------------------------------
const usedNames = new Set()
function genName(prefix = '') {
  let name
  do {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$'
    name = prefix
    const len = 6 + Math.floor(Math.random() * 9)
    for (let i = 0; i < len; i++) name += chars[Math.floor(Math.random() * chars.length)]
    name += Math.floor(Math.random() * 99999)
  } while (usedNames.has(name))
  usedNames.add(name)
  return name
}

function genHandler() {
  const pre = ['X','Y','Z','W','K','Q','R','T','P','S','M','N','A','B','C','D']
  return pre[Math.floor(Math.random() * pre.length)] + Math.floor(Math.random() * 999)
}

// Math Obfuscation (10% del código final serán ecuaciones)
function heavyMath(n) {
  if (Math.random() < 0.4) return n.toString()
  const a = Math.floor(Math.random() * 61) + 9
  const b = Math.floor(Math.random() * 17) + 5
  const c = Math.floor(Math.random() * 11) + 2
  const d = Math.floor(Math.random() * 7) + 1
  return `(((${n}*${a})/${a}+${b}-${b})*${c}/${c}+${d}-${d})`
}

function mba() {
  const a = Math.floor(Math.random() * 31) + 11
  const b = Math.floor(Math.random() * 9) + 2
  return `(((${a}*${b})+${a}-${a}*${b})/${a})`
}

function runtimeString(s) {
  return `string.char(${s.split('').map(c => heavyMath(c.charCodeAt(0))).join(',')})`
}

// ------------------------------------------------------------------------
// JUNK CODE GENERATOR - Matemáticas, bucles, condiciones falsas
// ------------------------------------------------------------------------
function generateJunk(lines) {
  let junk = ''
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    if (r < 0.35) {
      const v = genName('j_')
      junk += `local ${v} = ${heavyMath(Math.floor(Math.random() * 9999))} * ${heavyMath(Math.floor(Math.random() * 100) + 1)} `
    } else if (r < 0.6) {
      junk += `if ${mba()} == ${heavyMath(1)} then local ${genName('op_')}=${heavyMath(42)} end `
    } else if (r < 0.8) {
      junk += `if type(math.abs) == 'function' then for _ = 1, ${heavyMath(1)} do local ${genName('lp_')}=math.sqrt(${heavyMath(144)}) end end `
    } else {
      const fn = genName('dummy_')
      junk += `local function ${fn}() return ${heavyMath(777)} end `
    }
  }
  return junk
}

// ------------------------------------------------------------------------
// ANTI-DEBUG & ANTI-UNPACK
// ------------------------------------------------------------------------
function timeBombs() {
  const t0 = genName('tstart')
  const t1 = genName('trap1')
  const t2 = genName('trap2')
  const t3 = genName('trap3')
  return `
    local ${t0} = os.clock()
    local ${t1} = function() if os.clock() - ${t0} > 1.2 then while true do end end end
    local ${t2} = function() if os.clock() - ${t0} > 3.5 then error() end end
    local ${t3} = function() if os.clock() - ${t0} > 7 then while true do end end end
    ${t1}() ${t2}() ${t3}()
    if debug and debug.getinfo then while true do end end
    if rawget and type(rawget) == 'function' then if rawget(getfenv(), 'debug') then while true do end end end
  `
}

function integrityLock() {
  const hashVar = genName('ih')
  const checker = genName('check')
  return `
    local ${hashVar} = ${heavyMath(0xCAFEBABE)}
    local ${checker} = function()
      if ${hashVar} ~= ${heavyMath(0xCAFEBABE)} then while true do end end
      if math.pi < 3.14 or math.pi > 3.15 then error('tampered') end
      if type(table.concat) ~= 'function' then error() end
    end
    ${checker}()
  `
}

function recursiveTamper(depth = 5) {
  if (depth <= 0) return ''
  const fn = genName('tamper_')
  const inner = recursiveTamper(depth - 1)
  return `
    local ${fn} = function()
      if string.byte('A') ~= 65 then error() end
      if type(tostring) ~= 'function' then error() end
      ${inner}
    end
    ${fn}()
  `
}

// ------------------------------------------------------------------------
// CONTROL FLOW FLATTENING (CFF) para VMs
// ------------------------------------------------------------------------
function applyCFF(blocks) {
  const state = genName('state')
  const next = genName('next')
  let lua = `local ${state} = ${heavyMath(1)} local ${next} = ${heavyMath(1)} while true do `
  for (let i = 0; i < blocks.length; i++) {
    lua += `if ${state} == ${heavyMath(i + 1)} then ${blocks[i]} ${next} = ${heavyMath(i + 2)} `
  }
  lua += `elseif ${state} == ${heavyMath(blocks.length + 1)} then break end ${state} = ${next} end `
  return lua
}

// ------------------------------------------------------------------------
// VM CORE (la más interna) que ejecuta el payload
// ------------------------------------------------------------------------
function buildAtomicVM(payloadStr) {
  const stack = genName('stk')
  const key = genName('key')
  const salt = genName('slt')
  const ord = genName('ord')
  const seed = Math.floor(Math.random() * 251) + 5
  const saltVal = Math.floor(Math.random() * 131) + 7

  let code = `local ${stack},${key},${salt},_gIdx = {},${heavyMath(seed)},${heavyMath(saltVal)},0 `

  // Fragmentar payload en chunks de 10 bytes
  const chunkSize = 10
  const realChunks = []
  for (let i = 0; i < payloadStr.length; i += chunkSize)
    realChunks.push(payloadStr.slice(i, i + chunkSize))

  const totalChunks = realChunks.length * 4   // Añadimos ruido
  let currentReal = 0
  let globalIndex = 0
  const poolVars = []
  const realOrder = []

  for (let i = 0; i < totalChunks; i++) {
    const chunkVar = genName('chk')
    poolVars.push(chunkVar)
    const isReal = currentReal < realChunks.length &&
      (Math.random() > 0.3 || (totalChunks - i) <= (realChunks.length - currentReal))
    if (isReal) {
      realOrder.push(i + 1)
      const chunk = realChunks[currentReal]
      const encBytes = []
      for (let j = 0; j < chunk.length; j++) {
        // XOR con clave evolutiva
        const enc = (chunk.charCodeAt(j) ^ (seed + saltVal * globalIndex)) % 256
        encBytes.push(heavyMath(enc))
        globalIndex++
      }
      code += `local ${chunkVar} = {${encBytes.join(',')}} `
      currentReal++
    } else {
      const fakeLen = 8 + Math.floor(Math.random() * 12)
      const fake = []
      for (let k = 0; k < fakeLen; k++) fake.push(heavyMath(Math.floor(Math.random() * 255)))
      code += `local ${chunkVar} = {${fake.join(',')}} `
    }
  }

  code += `local _pool = {${poolVars.join(',')}} local ${ord} = {${realOrder.map(n => heavyMath(n)).join(',')}} `
  const idxVar = genName('i'), byteVar = genName('b')
  code += `for _,${idxVar} in ipairs(${ord}) do for _,${byteVar} in ipairs(_pool[${idxVar}]) do `
  code += `table.insert(${stack}, string.char((${byteVar} ~ (${key} + ${salt} * _gIdx)) % 256)) _gIdx = _gIdx + 1 end end `
  code += `local _e = table.concat(${stack}) ${stack} = nil `

  const loadstring = `getfenv()[${runtimeString('loadstring')}]`
  const assert = `getfenv()[${runtimeString('assert')}]`
  const game = `getfenv()[${runtimeString('game')}]`
  const httpget = runtimeString('HttpGet')

  if (payloadStr.includes('http'))
    code += `${assert}(${loadstring}(${game}[${httpget}](${game}, _e)))() `
  else
    code += `${assert}(${loadstring}(_e))() `

  return code
}

// ------------------------------------------------------------------------
// CONSTRUYE UNA CAPA DE VM (anida innerCode)
// ------------------------------------------------------------------------
function buildVMLayer(innerCode, handlerCount) {
  const handlers = []
  for (let i = 0; i < handlerCount; i++) handlers.push(genHandler())
  const realIdx = Math.floor(Math.random() * handlerCount)
  const dispatch = genName('dsp')

  let out = `local lM = {} `
  for (let i = 0; i < handlers.length; i++) {
    const junk = generateJunk(3)          // junk dentro de cada handler
    const tamper = recursiveTamper(3)     // tamper anidado
    if (i === realIdx) {
      out += `local ${handlers[i]} = function(lM) ${junk} ${tamper} ${innerCode} end `
    } else {
      out += `local ${handlers[i]} = function(lM) ${junk} ${tamper} return nil end `
    }
  }

  out += `local ${dispatch} = {`
  for (let i = 0; i < handlers.length; i++)
    out += `[${heavyMath(i + 1)}] = ${handlers[i]},`
  out += `} `

  const blocks = handlers.map((_, i) => `${dispatch}[${heavyMath(i + 1)}](lM)`)
  out += applyCFF(blocks)
  return out
}

// ------------------------------------------------------------------------
// TORRE DE VMs (10 capas)
// ------------------------------------------------------------------------
function buildVMTower(payloadStr) {
  let core = buildAtomicVM(payloadStr)
  core = buildVMLayer(core, 3)   // capa 1
  core = buildVMLayer(core, 4)   // capa 2
  core = buildVMLayer(core, 5)   // capa 3
  core = buildVMLayer(core, 4)   // capa 4
  core = buildVMLayer(core, 6)   // capa 5
  core = buildVMLayer(core, 5)   // capa 6
  core = buildVMLayer(core, 7)   // capa 7
  core = buildVMLayer(core, 5)   // capa 8
  core = buildVMLayer(core, 8)   // capa 9
  core = buildVMLayer(core, 6)   // capa 10 (Mother)
  return core
}

// ------------------------------------------------------------------------
// GENERADOR DE RELLENO PARA ALCANZAR 50KB
// ------------------------------------------------------------------------
function generateBulkJunk(targetSizeBytes) {
  // Cada línea de junk produce ~45 caracteres en promedio.
  // 50 KB = 51200 bytes. Asumiendo que el payload base + protecciones + VM ~ 15-20 KB,
  // necesitamos añadir ~30-35 KB de junk, lo que equivale a ~750 líneas de junk.
  // Pero podemos también insertar strings largas aleatorias.
  let bulk = ''
  const linesNeeded = Math.floor(targetSizeBytes / 45) + 100
  for (let i = 0; i < linesNeeded; i++) {
    bulk += generateJunk(1) + ' '
  }
  return bulk
}

// ------------------------------------------------------------------------
// MAPEO DE SERVICIOS OFUSCADOS
// ------------------------------------------------------------------------
function mapServices(code) {
  const map = {
    game: 'Game',
    workspace: 'World',
    Players: 'Users',
    RunService: 'Scheduler',
    TweenService: 'Animator',
    ReplicatedStorage: 'Cloud',
    Lighting: 'Lights',
    SoundService: 'Audio',
  }
  let modified = code
  let header = ''
  for (const [original] of Object.entries(map)) {
    const regex = new RegExp(`\\b${original}\\b`, 'g')
    if (regex.test(modified)) {
      const v = genName('svc_')
      header += `local ${v} = ${runtimeString(original)} `
      modified = modified.replace(regex, `game[${v}]`)
    }
  }
  return header + modified
}

// ------------------------------------------------------------------------
// FUNCIÓN PRINCIPAL DE OFUSCACIÓN
// ------------------------------------------------------------------------
function obfuscate(sourceCode) {
  if (!sourceCode) return '-- ERROR'

  let payload = sourceCode
  const httpMatch = sourceCode.match(
    /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  )
  if (httpMatch) {
    payload = httpMatch[1] // solo la URL
  } else {
    payload = mapServices(sourceCode)
  }

  const tower = buildVMTower(payload)

  const protections = `
    if typeof(task) ~= 'table' then while true do end end
    if not game or not workspace then while true do end end
    ${timeBombs()}
    ${integrityLock()}
    ${recursiveTamper(5)}
  `

  const baseCode = `${HEADER}\n${protections}\n${tower}`
  // Estimar tamaño actual y rellenar hasta ~50KB
  const currentSize = Buffer.byteLength(baseCode, 'utf8')
  const targetSize = 51200 // 50KB
  let additionalJunk = ''
  if (currentSize < targetSize) {
    const needed = targetSize - currentSize
    additionalJunk = generateBulkJunk(needed)
  }

  const finalCode = `${HEADER}\n${additionalJunk}\n${protections}\n${tower}`
  // Compactar espacios para que no ocupe de más, pero mantenemos la lógica
  return finalCode.replace(/\s+/g, ' ').trim()
}

module.exports = { obfuscate }
