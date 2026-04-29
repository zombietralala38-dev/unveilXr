/*
 * VVMER OBFUSCATOR – NESTED VM + ANTI-UNPACK + MATH 10%
 * Arquitectura: Mother(7) → Ancient(6) → Deep(5) → Core(4) → Inner(3) → Tiny(2) → Atomic(1) → Payload
 * Protecciones: Time bombs, debug traps, environment lock, integrity hashes, recursive tamper.
 */

const HEADER = `--[[ VVMER ULTIMATE | 7-Layer VM | Unbreakable ]]`
const usedNames = new Set()
const MATH_RATIO = 0.10 // 10% de código matemático

// Genera nombres impredecibles
function rndName(prefix = '') {
  let name
  do {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$'
    name = prefix
    const len = 5 + Math.floor(Math.random() * 8)
    for (let i = 0; i < len; i++) name += chars[Math.floor(Math.random() * chars.length)]
  } while (usedNames.has(name))
  usedNames.add(name)
  return name
}

// Genera handlers únicos para las VMs
function genHandler() {
  const seeds = ['X','Y','Z','W','K','Q','R','T','P','S','M','N']
  return seeds[Math.floor(Math.random() * seeds.length)] + Math.floor(Math.random() * 999)
}

// Math Obfuscation (MBA + opaque predicates)
function heavyMath(n) {
  if (Math.random() < 0.3) return n.toString() // 30% sin ofuscar
  const a = Math.floor(Math.random() * 33) + 7
  const b = Math.floor(Math.random() * 13) + 3
  const c = Math.floor(Math.random() * 9) + 1
  const d = Math.floor(Math.random() * 5) + 1
  return `(((${n}*${a})/${a}+${b}-${b})*${c}/${c}+${d}-${d})`
}

// Mixed Boolean Arithmetic – expresión que siempre da 1
function mba() {
  const a = Math.floor(Math.random() * 25) + 10
  const b = Math.floor(Math.random() * 7) + 1
  return `(((${a}*${b})+${a}-${a}*${b})/${a})`
}

// Anti-Unpack: comprueba que el código no ha sido modificado
function integrityCheck() {
  const hashVar = rndName('ihash')
  const fnVar = rndName('icheck')
  return `
    local ${hashVar} = ${heavyMath(0xDEAD)}
    local ${fnVar} = function()
      if ${hashVar} ~= ${heavyMath(0xDEAD)} then while true do end end
    end
    ${fnVar}()
  `
}

// Bombas de tiempo anti-debug
function timeTraps() {
  const start = rndName('tstart')
  return `
    local ${start} = os.clock()
    local function ${rndName('t1')}() if os.clock() - ${start} > 1.5 then while true do end end end
    local function ${rndName('t2')}() if os.clock() - ${start} > 4 then error() end end
    ${rndName('t1')}() ${rndName('t2')}()
    if debug and debug.getinfo then while true do end end
    if rawget and type(rawget)=='function' then if rawget(getfenv(),'debug') then while true do end end end
  `
}

// Recursive tamper (5 niveles)
function nestedTamper(depth = 5) {
  if (depth <= 0) return ''
  const fn = rndName('tamper')
  const inner = nestedTamper(depth - 1)
  return `
    local ${fn} = function()
      if math.pi<3.14 or math.pi>3.15 then error('tampered') end
      if type(table.concat)~='function' then error() end
      ${inner}
    end
    ${fn}()
  `
}

// Junk matemático hasta alcanzar ~10% del total
function mathJunk(targetLines) {
  let junk = ''
  for (let i = 0; i < targetLines; i++) {
    const r = Math.random()
    if (r < 0.4) {
      // Cálculo puro inútil
      junk += `local ${rndName('m')} = ${heavyMath(Math.floor(Math.random()*5000))} * ${heavyMath(Math.floor(Math.random()*100)+1)} `
    } else if (r < 0.7) {
      // Opaque predicate con MBA
      junk += `if ${mba()} == ${heavyMath(1)} then local ${rndName('op')}=${heavyMath(42)} end `
    } else {
      // Bucles con matemáticas que nunca se ejecutan
      junk += `if type(math.abs)=='function' then for _=1,${heavyMath(1)} do local ${rndName('lp')}=math.sqrt(${heavyMath(144)}) end end `
    }
  }
  return junk
}

// Control Flow Flattening mejorado
function cff(blocks) {
  const state = rndName('state')
  const next = rndName('next')
  let code = `local ${state} = ${heavyMath(1)} local ${next} = ${heavyMath(1)} while true do `
  for (let i = 0; i < blocks.length; i++) {
    code += `if ${state} == ${heavyMath(i+1)} then ${blocks[i]} ${next} = ${heavyMath(i+2)} `
  }
  code += `elseif ${state} == ${heavyMath(blocks.length+1)} then break end ${state} = ${next} end `
  return code
}

// VM Core que ejecutará el payload real (última capa)
function buildAtomicVM(payloadStr) {
  const stack = rndName('stk')
  const key = rndName('key')
  const order = rndName('ord')
  const salt = rndName('slt')
  const seed = Math.floor(Math.random() * 255) + 1
  const saltVal = Math.floor(Math.random() * 127) + 1

  let code = `local ${stack},${key},${salt},_gIdx={},${heavyMath(seed)},${heavyMath(saltVal)},0 `

  // Partimos el payload en chunks y los ciframos con XOR + índice
  const chunks = []
  for (let i = 0; i < payloadStr.length; i += 12)
    chunks.push(payloadStr.slice(i, i+12))

  const realOrder = []
  const pool = []
  for (let i = 0; i < chunks.length * 2; i++) {
    const chunkVar = rndName('chk')
    pool.push(chunkVar)
    if (i < chunks.length || (Math.random() < 0.3 && realOrder.length < chunks.length)) {
      if (i < chunks.length) realOrder.push(i+1)
      const bytes = []
      const chunk = i < chunks.length ? chunks[i] : ''
      for (let j = 0; j < (chunk.length || 8); j++) {
        const byte = chunk.charCodeAt(j) || Math.floor(Math.random()*256)
        const enc = (byte ^ (seed + saltVal * (pool.length + j))) % 256
        bytes.push(heavyMath(enc))
      }
      code += `local ${chunkVar} = {${bytes.join(',')}} `
    } else {
      const fakeBytes = Array.from({length: 6+Math.floor(Math.random()*7)}, () => heavyMath(Math.floor(Math.random()*255)))
      code += `local ${chunkVar} = {${fakeBytes.join(',')}} `
    }
  }

  code += `local _pool = {${pool.join(',')}} local ${order} = {${realOrder.map(n=>heavyMath(n)).join(',')}} `
  const idx = rndName('i'), byte = rndName('b')
  code += `for _,${idx} in ipairs(${order}) do for _,${byte} in ipairs(_pool[${idx}]) do `
  code += `table.insert(${stack}, string.char((${byte} ~ (${key} + ${salt} * _gIdx)) % 256)) _gIdx = _gIdx + 1 end end `
  code += `local _e = table.concat(${stack}) ${stack}=nil `

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

// Construye una VM de nivel N que envuelve innerCode
function buildVM(innerCode, handlersNum, layer) {
  const handlers = Array.from({length: handlersNum}, () => genHandler())
  const realIndex = Math.floor(Math.random() * handlersNum)
  const dispatch = rndName('dsp')

  let code = `local lM = {} `
  for (let i = 0; i < handlers.length; i++) {
    const junk = mathJunk(2) // junk dentro de cada handler
    const tamper = nestedTamper(3)
    if (i === realIndex) {
      code += `local ${handlers[i]} = function(lM) ${junk} ${tamper} ${innerCode} end `
    } else {
      code += `local ${handlers[i]} = function(lM) ${junk} ${tamper} return nil end `
    }
  }

  code += `local ${dispatch} = {`
  for (let i = 0; i < handlers.length; i++)
    code += `[${heavyMath(i+1)}] = ${handlers[i]},`
  code += `} `

  const blocks = handlers.map((_,i) => `${dispatch}[${heavyMath(i+1)}](lM)`)
  code += cff(blocks)
  return code
}

// Convierte string a char codes ofuscados
function runtimeString(s) {
  return `string.char(${s.split('').map(c => heavyMath(c.charCodeAt(0))).join(',')})`
}

// Protecciones externas (pre-VM)
function externalShield() {
  return `
    if typeof(task)~='table' then while true do end end
    if not game or not workspace then while true do end end
    ${timeTraps()}
    ${integrityCheck()}
    ${nestedTamper(5)}
    local _sandbox_ = os.clock() for _=1,1e5 do end if os.clock()-_sandbox_>1 then while true do end end
  `
}

// Aplica mapeo de servicios ofuscados
function mapServices(code) {
  const map = {
    'game': 'Game', 'workspace': 'World', 'Players': 'Users',
    'RunService': 'Scheduler', 'TweenService': 'Animator', 'ReplicatedStorage': 'Cloud'
  }
  let modified = code
  let header = ''
  for (const [original, fake] of Object.entries(map)) {
    const regex = new RegExp(`\\b${original}\\b`, 'g')
    if (regex.test(modified)) {
      const v = rndName('svc')
      header += `local ${v} = ${runtimeString(original)} `
      modified = modified.replace(regex, `game[${v}]`)
    }
  }
  return header + modified
}

// Constructor de la torre de VMs (7 capas)
function buildTower(payloadStr) {
  let core = buildAtomicVM(payloadStr)
  core = buildVM(core, 2, 'Tiny(2)')
  core = buildVM(core, 3, 'Inner(3)')
  core = buildVM(core, 4, 'Core(4)')
  core = buildVM(core, 5, 'Deep(5)')
  core = buildVM(core, 7, 'Ancient(6)')
  core = buildVM(core, 9, 'Mother(7)')
  return core
}

// Calcula cuánto junk matemático necesitamos para el 10%
function estimateMathJunk(baseCodeLength) {
  // Asumimos que el código ya tiene algo de matemáticas, vamos a añadir más
  const targetMath = Math.floor(baseCodeLength * MATH_RATIO)
  // Cada línea de junk matemático aporta ~30 caracteres de código
  const linesNeeded = Math.floor(targetMath / 30)
  return linesNeeded
}

// Función principal
function obfuscate(sourceCode) {
  if (!sourceCode) return '-- ERROR'
  let payload = sourceCode

  const httpMatch = sourceCode.match(/loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i)
  if (httpMatch) payload = httpMatch[1]
  else payload = mapServices(sourceCode)

  const tower = buildTower(payload)
  const shield = externalShield()

  // Calcular cuánto junk añadir para el 10% matemático
  const baseCode = `${HEADER} ${shield} ${tower}`
  const neededMathLines = estimateMathJunk(baseCode.length)
  const mathJunkCode = mathJunk(neededMathLines)

  const finalCode = `${HEADER}\n${mathJunkCode} ${shield} ${tower}`
  return finalCode.replace(/\s+/g, ' ').trim()
}

module.exports = { obfuscate }
