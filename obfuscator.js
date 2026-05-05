// ofuscador_50_50.js — 25KB (loadstring) / 40KB (hub) | 50% junk + 50% protecciones | Sin Base64

const HEADER = `--[[unveilX Fortress]]`

const usedNames = new Set()
const LUA_KEYWORDS = new Set(['and','break','do','else','elseif','end','false','for','function','if','in','local','nil','not','or','repeat','return','then','true','until','while','goto'])

function genName(prefix='_') {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let name
  do {
    name = prefix + chars[Math.floor(Math.random() * chars.length)]
    for (let i = 0; i < 6; i++) name += chars[Math.floor(Math.random() * chars.length)]
  } while (usedNames.has(name) || LUA_KEYWORDS.has(name))
  usedNames.add(name)
  return name
}

// ---------- JUNK GENERATOR (50% del peso, poco math) ----------
function generateJunk(sizeBytes) {
  let junk = ''
  const templates = [
    // Asignaciones de cadenas aleatorias
    () => {
      const a = genName('s')
      const len = Math.floor(Math.random() * 20) + 5
      let str = ''
      for (let i = 0; i < len; i++) str += String.fromCharCode(97 + Math.floor(Math.random() * 26))
      return `local ${a}="${str}" `
    },
    // Tablas vacías o con pocos elementos
    () => {
      const a = genName('t')
      return `local ${a}={} for i=1,${Math.floor(Math.random()*5)+1} do ${a}[i]=i end `
    },
    // Funciones vacías que nunca se llaman
    () => {
      const f = genName('f')
      return `local function ${f}() return end `
    },
    // Condicionales siempre falsos con basura interna
    () => {
      const a = genName('c')
      return `if false then local ${a}=1 ${a}=${a}+1 end `
    },
    // Bucles que iteran 1 vez y no hacen nada
    () => {
      const a = genName('l')
      return `for ${a}=1,1 do local _=${a} end `
    }
  ]

  while (Buffer.byteLength(junk, 'utf8') < sizeBytes) {
    const t = templates[Math.floor(Math.random() * templates.length)]
    junk += t()
  }
  return junk.substring(0, sizeBytes)
}

// ---------- PROTECCIONES (50% del peso) ----------

// Anti-debug (7 segundos total)
function buildAntiDebug(count) {
  let code = ''
  for (let i = 0; i < count; i++) {
    const st = genName('st')
    code += `local ${st}=pcall(function()return os.clock()end)and os.clock()or tick() `
    code += `repeat until (pcall(function()return os.clock()end)and os.clock()or tick())-${st}>=1 `
  }
  return code
}

// Anti-env logger (20, ofuscado, mensaje "I really like Rick and Morty")
function buildAntiEnvLogger(count) {
  let code = ''
  for (let i = 0; i < count; i++) {
    const envVar = genName('e')
    const detect = genName('d')
    code += `local ${detect}=pcall(function()local ${envVar}=getfenv and getfenv()or _ENV return ${envVar}.Logger or ${envVar}.debug or ${envVar}.sandbox end) `
    code += `if ${detect} then print("I really like Rick and Morty")while true do end end `
  }
  return code
}

// Anti-tamper (7, verifica funciones nativas con hash simple)
function buildAntiTamper(count) {
  const targets = ['print','math.floor','string.sub','table.insert']
  let code = ''
  for (let i = 0; i < count; i++) {
    const func = genName('fn')
    const hashVar = genName('h')
    const expected = Math.floor(Math.random() * 100000)
    const tgt = targets[i % targets.length]
    code += `local ${func}=${tgt} local ${hashVar}=0 if ${func} then for j=1,#tostring(${func})do ${hashVar}=(${hashVar}+j)%${expected} end else ${hashVar}=${expected+1} end `
    code += `if ${hashVar}~=${expected} then print("I really like Rick and Morty")while true do end end `
  }
  return code
}

// ---------- PAYLOAD VM (sin Base64, reconstrucción desde tabla numérica) ----------
function buildPayloadVM(originalCode) {
  // Convertir código original a array de bytes
  const bytes = []
  for (let i = 0; i < originalCode.length; i++) {
    bytes.push(originalCode.charCodeAt(i))
  }

  // Dividir la tabla en pedazos para ofuscar
  const tableName = genName('tb')
  const reconstructor = genName('rec')
  const result = genName('res')
  const exec = genName('exe')

  // Generar la tabla Lua como string
  let tableStr = `local ${tableName}={`
  for (let i = 0; i < bytes.length; i++) {
    tableStr += bytes[i]
    if (i < bytes.length - 1) tableStr += ','
  }
  tableStr += '} '

  // Función reconstructora
  const reconCode = `local function ${reconstructor}(t) local r="" for i=1,#t do r=r..string.char(t[i]) end return r end `

  // Ejecución final
  const execCode = `local ${result}=${reconstructor}(${tableName}) local ${exec}=loadstring or load if ${exec} then xpcall(${exec}(${result}),function()end) end `

  return tableStr + reconCode + execCode
}

// ---------- MAIN OBFUSCATOR ----------
function obfuscate(sourceCode, options = {}) {
  if (!sourceCode || typeof sourceCode !== 'string') {
    return '--[[ERROR]]'
  }
  usedNames.clear()

  let payload = sourceCode
  const httpMatch = sourceCode.match(/loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i)
  if (httpMatch) {
    payload = `loadstring(game:HttpGet("${httpMatch[1]}"))()`
  }

  const targetKB = options.targetSizeKB || 25
  const totalBytes = targetKB * 1024
  const halfBytes = Math.floor(totalBytes / 2)

  // Construir las protecciones + VM
  const protections = buildAntiDebug(7) +
                      buildAntiEnvLogger(20) +
                      buildAntiTamper(7) +
                      buildPayloadVM(payload)

  // Tamaño de las protecciones (en bytes)
  const protSize = Buffer.byteLength(protections, 'utf8')

  // Calcular basura necesaria para alcanzar la mitad del total (si prot es menor a halfBytes)
  let junkNeeded = halfBytes - protSize
  if (junkNeeded < 0) junkNeeded = 0

  // Generar basura (50% del peso total, aprox.)
  const junk = generateJunk(junkNeeded)

  // Armar script final
  let finalOutput = HEADER + '\n' +
    'do ' +
    junk +
    protections +
    ' end'

  // Minificar a una línea
  finalOutput = finalOutput.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()

  // Ajustar a tamaño exacto (por redondeo)
  const finalSize = Buffer.byteLength(finalOutput, 'utf8')
  if (finalSize < totalBytes) {
    // Rellenar con más basura simple hasta el objetivo
    let padding = ''
    while (Buffer.byteLength(finalOutput + padding, 'utf8') < totalBytes) {
      padding += '; '
    }
    finalOutput += padding
  }
  if (finalSize > totalBytes) {
    // Recortar a exactamente totalBytes (poco probable, pero seguro)
    finalOutput = finalOutput.substring(0, totalBytes)
  }

  return finalOutput
}

module.exports = { obfuscate }
