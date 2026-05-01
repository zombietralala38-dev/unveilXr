const HEADER = `--[[ VVMER | Mega Protection ]]`

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
  return `string.char(${s.split('').map(c => c.charCodeAt(0)).join(',')})`
}

// ════════════════════════════════════════════════════════════════════
// TODO EL CÓDIGO OFUSCADO SE ENCRIPTARÁ CON ESTA CADENA /98/89/111...
// Nadie ve pcall, protecciones, junk, VM, NADA. Solo la cadena.
// ════════════════════════════════════════════════════════════════════

const MAPEO = {
  "ScreenGui":"Aggressive Renaming","Frame":"String to Math",
  "TextButton":"Mixed Boolean Arithmetic","Humanoid":"Dynamic Junk",
  "Player":"Fake Flow","RunService":"Virtual Machine",
  "TweenService":"Fake Flow","Players":"Fake Flow"
}

function detectAndApplyMappings(code) {
  let modified = code, headers = ""
  for (const [word, tech] of Object.entries(MAPEO)) {
    const regex = new RegExp(`\\b${word}\\b`, "g")
    if (regex.test(modified)) {
      let replacement = `"${word}"`
      if (tech.includes("Aggressive Renaming")) {
        const v = genName(); headers += `local ${v}="${word}" `; replacement = v
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

function generateJunk(lines) {
  let j = ""
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    if (r < 0.35) j += `pcall(function() local _=${lightMath(1)} end) `
    else if (r < 0.65) j += `do local _t={} _t=nil end `
    else j += `if type(math.pi)=="string" then local _=1 end `
  }
  return j
}

function encryptPayload(str, seed, salt) {
  const bytes = []
  for (let i = 0; i < str.length; i++) {
    bytes.push((str.charCodeAt(i) + seed + i * salt) % 256)
  }
  return bytes
}

let microVMCounter = 0
function buildMicroVM(payloadBytes, seed, salt) {
  const letters = ['aa','bb','cc','dd','ee','ff','gg','hh','ii','jj','kk','ll','mm','nn','oo','pp','qq','rr','ss','tt','uu','vv','ww','xx','yy','zz']
  const S  = letters[microVMCounter++ % letters.length] + (microVMCounter % 9)
  const K  = letters[microVMCounter++ % letters.length] + (microVMCounter % 9)
  const T  = letters[microVMCounter++ % letters.length] + (microVMCounter % 9)
  const R  = letters[microVMCounter++ % letters.length] + (microVMCounter % 9)

  let mv = `local ${S}={} local ${K}=${seed} local ${T}={${payloadBytes.join(',')}} for _i,_b in ipairs(${T}) do table.insert(${S},string.char((_b-${K}-(_i-1)*${salt})%256)) end local ${R}=table.concat(${S}) local _ok,_er=pcall(loadstring(${R})) if not _ok then local _fn=loadstring(${R}) if _fn then setfenv(_fn,getfenv()) pcall(_fn) end end`

  return mv
}

function buildWrapperVM(innerCode) {
  const hCount = Math.floor(Math.random() * 2) + 3
  const handlers = []
  const used = new Set()
  while (handlers.length < hCount) {
    const n = 'h' + Math.floor(Math.random() * 9999)
    if (!used.has(n)) { used.add(n); handlers.push(n) }
  }
  const realIdx = Math.floor(Math.random() * hCount)
  const D = 'd' + Math.floor(Math.random() * 9999)
  const S = 's' + Math.floor(Math.random() * 9999)

  let out = `local lM={} `
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx)
      out += `local ${handlers[i]}=function() ${innerCode} end `
    else
      out += `local ${handlers[i]}=function() return nil end `
  }
  out += `local ${D}={`
  for (let i = 0; i < handlers.length; i++) out += `[${i+1}]=${handlers[i]},`
  out += `} local ${S}=1 while true do `
  for (let i = 0; i < handlers.length; i++) {
    const cond = i === 0 ? `if` : `elseif`
    out += `${cond} ${S}==${i+1} then ${D}[${i+1}]() ${S}=${i+2} `
  }
  out += `elseif ${S}==${handlers.length+1} then break end end`
  return `do ${out} end`
}

function buildFullChain(payloadStr) {
  const CHUNK = 25
  const seed  = Math.floor(Math.random() * 180) + 40
  const salt  = Math.floor(Math.random() * 150) + 1

  const allBytes = encryptPayload(payloadStr, seed, salt)
  const chunks   = []
  for (let i = 0; i < allBytes.length; i += CHUNK)
    chunks.push(allBytes.slice(i, i + CHUNK))

  const micros = chunks.map((chunk, idx) => buildMicroVM(chunk, seed, salt))
  let combined = micros.join(' ')

  for (let i = 0; i < 3; i++) {
    combined = buildWrapperVM(combined)
  }

  return combined
}

function getProtections() {
  return `pcall(function() if getmetatable(_G)~=nil then while true do end end end) pcall(function() if debug and debug.getinfo then while true do end end end) pcall(function() if getgc then while true do end end end) pcall(function() if hookfunction or replacefunction then while true do end end end) pcall(function() local t=os.clock() for _=1,100000 do end if os.clock()-t>5 then while true do end end end) pcall(function() if io and io.write then while true do end end end)`
}

// ════════════════════════════════════════════════════════════════════
// ENCRIPTADOR: TODO se cifra con XOR + cadena /98/89/111...
// ════════════════════════════════════════════════════════════════════
function encryptEntireCode(fullCode) {
  const key = 89 // número aleatorio para XOR
  const encrypted = fullCode.split('').map(c => (c.charCodeAt(0) ^ key) & 0xFF)
  
  // Retornar como cadena /98/89/111/... (números separados por /)
  return {
    bytes: encrypted,
    chain: '/' + encrypted.join('/') + '/',
    key: key
  }
}

// ════════════════════════════════════════════════════════════════════
// DECODER: Ejecuta la cadena cifrada /98/89/111/...
// ════════════════════════════════════════════════════════════════════
function buildDecoder(encryptedBytes, encryptionKey) {
  // Variable corta para ser discreta
  const V = 'v' + Math.floor(Math.random() * 9999)
  const D = 'd' + Math.floor(Math.random() * 9999)
  const C = 'c' + Math.floor(Math.random() * 9999)

  // El decoder es pequeño y simple: solo descifra y ejecuta
  let decoder = `local ${V}={${encryptedBytes.join(',')}} `
  decoder   += `local ${D}={} `
  decoder   += `for _i,_b in ipairs(${V}) do table.insert(${D},string.char(bit32.bxor(_b,${encryptionKey}))) end `
  decoder   += `local ${C}=table.concat(${D}) `
  decoder   += `pcall(loadstring(${C}))`

  return decoder
}

// ════════════════════════════════════════════════════════════════════
// MAIN OBFUSCATE: TODO se ofusca en la cadena /98/89/111...
// ════════════════════════════════════════════════════════════════════
function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'
  microVMCounter = 0
  usedNames.clear()

  const isLoadstringRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const match = sourceCode.match(isLoadstringRegex)
  const payload = match ? match[1] : detectAndApplyMappings(sourceCode)

  // Construir TODO el código ofuscado
  const protections = getProtections()
  const junk        = generateJunk(12)
  const vm          = buildFullChain(payload)

  // TODO junto: protecciones + junk + VM
  const fullCode = `${protections} ${junk} ${vm}`

  // Cifrar TODO
  const encrypted = encryptEntireCode(fullCode)

  // Generar el decoder que descifra y ejecuta TODO
  const decoderCode = buildDecoder(encrypted.bytes, encrypted.key)

  // Resultado final: solo el header + el decoder que ejecuta la cadena
  return `${HEADER} ${decoderCode}`.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate }
