const HEADER = `--[[ VVMER ULTIMATE | Valid Syntax ]]`

const usedNames = new Set()
function genName(prefix = '') {
  let name
  do {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'
    name = prefix
    const len = 6 + Math.floor(Math.random() * 8)
    for (let i = 0; i < len; i++) name += chars[Math.floor(Math.random() * chars.length)]
    name += Math.floor(Math.random() * 99999)
  } while (usedNames.has(name))
  usedNames.add(name)
  return name
}

function genHandler() {
  const pre = ['X','Y','Z','W','K','Q','R','T','P','S','M','N']
  return pre[Math.floor(Math.random() * pre.length)] + Math.floor(Math.random() * 999)
}

function heavyMath(n) {
  if (Math.random() < 0.4) return n.toString()
  const a = Math.floor(Math.random() * 61) + 9
  const b = Math.floor(Math.random() * 17) + 5
  return `(${n}*${b}/${b}+${a}-${a})`   // expresión sencilla, siempre correcta
}

function runtimeString(s) {
  return `string.char(${s.split('').map(c => heavyMath(c.charCodeAt(0))).join(',')})`
}

// Junk: siempre termina con ';' y sin bloques abiertos
function generateJunk(lines) {
  let junk = ''
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    if (r < 0.35) {
      junk += `local ${genName('j')}=${heavyMath(1)};`
    } else if (r < 0.6) {
      junk += `if ${heavyMath(1)}==${heavyMath(1)} then local ${genName('x')}=1 end;`
    } else if (r < 0.8) {
      junk += `for _=1,${heavyMath(1)} do local ${genName('l')}=1 end;`
    } else {
      junk += `local function ${genName('f')}() return ${heavyMath(42)} end;`
    }
  }
  return junk
}

// VM Core (la más interna) – ejecutará el payload
function buildAtomicVM(payloadStr) {
  const stack = genName('stk')
  const key = genName('key')
  const ord = genName('ord')
  const seed = Math.floor(Math.random() * 200) + 50

  let code = `local ${stack},${key},_gIdx={},${heavyMath(seed)},0;`
  const chunkSize = 10
  const chunks = []
  for (let i = 0; i < payloadStr.length; i += chunkSize)
    chunks.push(payloadStr.slice(i, i + chunkSize))

  const total = chunks.length * 3
  const pool = []
  const order = []
  let ci = 0, gi = 0

  for (let i = 0; i < total; i++) {
    const cv = genName('chk')
    pool.push(cv)
    if (ci < chunks.length && (Math.random() > 0.3 || (total - i) <= (chunks.length - ci))) {
      order.push(i + 1)
      const bytes = []
      for (let j = 0; j < chunks[ci].length; j++) {
        const enc = (chunks[ci].charCodeAt(j) + seed + gi) % 256
        bytes.push(heavyMath(enc))
        gi++
      }
      code += `local ${cv}={${bytes.join(',')}};`
      ci++
    } else {
      const fake = Array.from({length: 5 + Math.floor(Math.random()*8)}, () => heavyMath(Math.floor(Math.random()*255)))
      code += `local ${cv}={${fake.join(',')}};`
    }
  }

  code += `local _pool={${pool.join(',')}}; local ${ord}={${order.map(n=>heavyMath(n)).join(',')}};`
  const iv = genName('i'), bv = genName('b')
  code += `for _,${iv} in ipairs(${ord}) do for _,${bv} in ipairs(_pool[${iv}]) do table.insert(${stack},string.char((${bv}-${key}-_gIdx)%256)); _gIdx=_gIdx+1 end end;`
  code += `local _e=table.concat(${stack}); ${stack}=nil;`

  const load = `getfenv()[${runtimeString('loadstring')}]`
  const assert = `getfenv()[${runtimeString('assert')}]`
  const game = `getfenv()[${runtimeString('game')}]`
  const http = runtimeString('HttpGet')

  if (payloadStr.includes('http'))
    code += `${assert}(${load}(${game}[${http}](${game},_e)))();`
  else
    code += `${assert}(${load}(_e))();`
  return code
}

// Capa de VM – envuelve innerCode en handlers falsos
function buildVMLayer(innerCode, handlersNum) {
  const handlers = []
  for (let i = 0; i < handlersNum; i++) handlers.push(genHandler())
  const real = Math.floor(Math.random() * handlersNum)
  const dsp = genName('dsp')

  let out = `local lM={};`
  for (let i = 0; i < handlers.length; i++) {
    const junk = generateJunk(2)
    if (i === real) {
      out += `local ${handlers[i]}=function(lM) ${junk} ${innerCode} end;`
    } else {
      out += `local ${handlers[i]}=function(lM) ${junk} return nil end;`
    }
  }
  out += `local ${dsp}={`
  for (let i = 0; i < handlers.length; i++) out += `[${heavyMath(i+1)}]=${handlers[i]},`
  out += `};`

  // Ejecución: sencilla secuencia if/elseif (sin bucle, sin riesgo)
  out += `local ${genName('st')}=${heavyMath(1)};`
  for (let i = 0; i < handlers.length; i++) {
    if (i === 0) out += `if ${genName('st')}==${heavyMath(1)} then ${dsp}[${heavyMath(i+1)}](lM);`
    else out += `elseif ${genName('st')}==${heavyMath(i+1)} then ${dsp}[${heavyMath(i+1)}](lM);`
  }
  out += `end;`  // cierra la cadena if/elseif
  return out
}

// Torre de 10 capas
function buildVMTower(payloadStr) {
  let core = buildAtomicVM(payloadStr)
  core = buildVMLayer(core, 3)
  core = buildVMLayer(core, 4)
  core = buildVMLayer(core, 5)
  core = buildVMLayer(core, 4)
  core = buildVMLayer(core, 6)
  core = buildVMLayer(core, 5)
  core = buildVMLayer(core, 7)
  core = buildVMLayer(core, 5)
  core = buildVMLayer(core, 8)
  core = buildVMLayer(core, 6)
  return core
}

// Mapeo de servicios
function mapServices(code) {
  const map = {game:'Game',workspace:'World',Players:'Users',RunService:'Scheduler'}
  let h = ''
  for (const [k] of Object.entries(map)) {
    const regex = new RegExp(`\\b${k}\\b`,'g')
    if (regex.test(code)) {
      const v = genName('svc')
      h += `local ${v}=${runtimeString(k)};`
      code = code.replace(regex, `game[${v}]`)
    }
  }
  return h + code
}

// Función principal
function obfuscate(sourceCode) {
  if (!sourceCode) return '-- ERROR'
  let payload = sourceCode
  const httpMatch = sourceCode.match(/loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i)
  if (httpMatch) payload = httpMatch[1]
  else payload = mapServices(sourceCode)

  const tower = buildVMTower(payload)

  // Envolvemos TODO en una función autoejecutable para sellar cualquier 'end'
  const finalCode = `${HEADER}\n(function() ${tower} end)();`
  return finalCode.replace(/\s+/g, ' ').trim()
}

module.exports = { obfuscate }
