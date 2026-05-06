const HEADER = `--[[ VMProtect Ultimate - Garcia's Greco's Final ]]`

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
  let n = Math.random() > 0.5 ? 1 : 2
  let a = Math.floor(Math.random() * 70) + 15
  let b = Math.floor(Math.random() * 40) + 8
  return `((${n}*${a}-${a})/(${b}+1)+${n})`
}

// OFUSCAR STRINGS - cualquier print o loading string se ofusca igual que codigo
function obfuscateString(str) {
  if (str.length === 0) return '""'
  let result = 'string.char('
  for (let i = 0; i < str.length; i++) {
    if (i > 0) result += ','
    result += heavyMath(str.charCodeAt(i))
  }
  result += ')'
  return result
}

// ENVIRONMENT LOGGER (sin # ni ;)
function buildEnvLogger() {
  let v1 = generateIlName()
  let v2 = generateIlName()
  let v3 = generateIlName()
  let v4 = generateIlName()
  let v5 = generateIlName()
  
  let msg = "I really like Rick and Morty"
  let msgBytes = []
  for (let i = 0; i < msg.length; i++) {
    msgBytes.push(msg.charCodeAt(i))
  }
  
  let logger = `local ${v1}={`
  for (let i = 0; i < msgBytes.length; i++) {
    if (i > 0) logger += ','
    logger += heavyMath(msgBytes[i])
  }
  logger += `} `
  logger += `local ${v2}={} `
  logger += `for ${v3}=1,${v1}.${generateIlName()} do `
  logger += `${v2}[${v3}]=string.char(${v1}[${v3}]) `
  logger += `end `
  logger += `local ${v4}=table.concat(${v2}) `
  logger += `local function ${v5}() `
  logger += `for ${v3}=1,3 do warn(${v4}) end `
  logger += `end `
  logger += `if debug and debug.getinfo then `
  logger += `local ${v3}=debug.getinfo(1) `
  logger += `if ${v3} and ${v3}.what and ${v3}.what~="main" then `
  logger += `${v5}() `
  logger += `end `
  logger += `end `
  
  return logger
}

// ANTI-TAMPER (sin errores)
function buildAntiTamper() {
  let t1 = generateIlName()
  let t2 = generateIlName()
  let t3 = generateIlName()
  return `local ${t1}=${Math.floor(Math.random() * 50) + 10} ` +
         `local ${t2}=${Math.floor(Math.random() * 50) + 10} ` +
         `if ${t1}~=${t2} then ` +
         `local ${t3}=warn ` +
         `${t3}("") ` +
         `end `
}

// ANTI-DEBUG (sin bucles infinitos)
function buildAntiDebug() {
  let d1 = generateIlName()
  let d2 = generateIlName()
  let d3 = generateIlName()
  let d4 = generateIlName()
  return `local ${d1}=tick() ` +
         `for ${d2}=1,30000 do end ` +
         `if tick()-${d1}>0.5 then ` +
         `warn("debug") ` +
         `end ` +
         `local ${d3},${d4}=pcall(function() error("check") end) ` +
         `if not string.find(tostring(${d4}),"check") then ` +
         `warn("") ` +
         `end `
}

// TRUE VM (load en lugar de loadstring)
function buildTrueVM(payloadStr) {
  const STACK = generateIlName()
  const KEY = generateIlName()
  const ORDER = generateIlName()
  const SALT = generateIlName()
  
  const seed = Math.floor(Math.random() * 200) + 50
  const saltVal = Math.floor(Math.random() * 250) + 1
  
  let vmCore = `local ${STACK}={} `
  vmCore += `local ${KEY}=${heavyMath(seed)} `
  vmCore += `local ${SALT}=${heavyMath(saltVal)} `
  
  const chunkSize = 15
  let realChunks = []
  for (let i = 0; i < payloadStr.length; i += chunkSize) {
    realChunks.push(payloadStr.slice(i, i + chunkSize))
  }
  
  let poolVars = []
  let realOrder = []
  let totalChunks = realChunks.length * 3
  let currentReal = 0
  let globalIndex = 0
  
  for (let i = 0; i < totalChunks; i++) {
    let memName = generateIlName()
    poolVars.push(memName)
    if (currentReal < realChunks.length && (Math.random() > 0.5 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1)
      let chunk = realChunks[currentReal]
      let encryptedBytes = []
      for (let j = 0; j < chunk.length; j++) {
        let enc = (chunk.charCodeAt(j) + seed + (globalIndex * saltVal)) % 256
        encryptedBytes.push(heavyMath(enc))
        globalIndex = globalIndex + 1
      }
      vmCore += `local ${memName}={`
      for (let j = 0; j < encryptedBytes.length; j++) {
        if (j > 0) vmCore += ','
        vmCore += encryptedBytes[j]
      }
      vmCore += `} `
      currentReal = currentReal + 1
    } else {
      let fakeBytes = []
      let fakeLen = Math.floor(Math.random() * 20) + 5
      for (let j = 0; j < fakeLen; j++) {
        fakeBytes.push(heavyMath(Math.floor(Math.random() * 255)))
      }
      vmCore += `local ${memName}={`
      for (let j = 0; j < fakeBytes.length; j++) {
        if (j > 0) vmCore += ','
        vmCore += fakeBytes[j]
      }
      vmCore += `} `
    }
  }
  
  vmCore += `local _pool={`
  for (let i = 0; i < poolVars.length; i++) {
    if (i > 0) vmCore += ','
    vmCore += poolVars[i]
  }
  vmCore += `} `
  
  vmCore += `local ${ORDER}={`
  for (let i = 0; i < realOrder.length; i++) {
    if (i > 0) vmCore += ','
    vmCore += heavyMath(realOrder[i])
  }
  vmCore += `} `
  
  const idxVar = generateIlName()
  const byteVar = generateIlName()
  
  vmCore += `local _gIdx=0 `
  vmCore += `for _${idxVar}=1,${ORDER}.${generateIlName()} do `
  vmCore += `local ${idxVar}=${ORDER}[_${idxVar}] `
  vmCore += `for _${byteVar}=1,_pool[${idxVar}].${generateIlName()} do `
  vmCore += `local ${byteVar}=_pool[${idxVar}][_${byteVar}] `
  vmCore += `local _dec=math.floor((${byteVar} - ${KEY} - _gIdx * ${SALT}) % 256) `
  vmCore += `table.insert(${STACK}, string.char(_dec)) `
  vmCore += `_gIdx=_gIdx+1 `
  vmCore += `end `
  vmCore += `end `
  
  vmCore += `local _e = table.concat(${STACK}) `
  vmCore += `${STACK}=nil `
  vmCore += `local _f = load(_e) `
  vmCore += `if _f then `
  vmCore += `_f() `
  vmCore += `end `
  
  return vmCore
}

// NESTED VM CUSTOM (5 niveles)
function buildNestedVMs(payloadStr) {
  let vm = buildTrueVM(payloadStr)
  for (let i = 0; i < 5; i++) {
    vm = buildCustomVM(vm)
  }
  return vm
}

function buildCustomVM(innerCode) {
  let vmType = Math.floor(Math.random() * 3)
  let vmName = generateIlName()
  
  let vm = `local ${vmName}=function() `
  
  if (vmType === 0) {
    vm += `local _s={} `
    vm += `for _i=1,${heavyMath(3)} do `
    vm += `if _i==${heavyMath(1)} then `
    vm += innerCode
    vm += `elseif _i==${heavyMath(2)} then `
    vm += `else `
    vm += `break `
    vm += `end `
    vm += `end `
  } else if (vmType === 1) {
    vm += `local _r1,_r2=nil,nil `
    vm += `_r1=function() `
    vm += innerCode
    vm += `end `
    vm += `_r2=function() end `
    vm += `_r1() `
  } else {
    vm += `local _t={} `
    vm += `_t[${heavyMath(1)}]=function() `
    vm += innerCode
    vm += `end `
    vm += `_t[${heavyMath(2)}]=function() end `
    vm += `_t[${heavyMath(1)}]() `
  }
  
  vm += `end `
  vm += `${vmName}() `
  return vm
}

// SINGLE VM CON HANDLERS
function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount)
  const realIdx = Math.floor(Math.random() * handlerCount)
  const DISPATCH = generateIlName()
  
  let out = `local lM={} `
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx) {
      out += `local ${handlers[i]}=function() `
      out += generateJunk(3)
      out += innerCode
      out += `end `
    } else {
      out += `local ${handlers[i]}=function() `
      out += generateJunk(2)
      out += `end `
    }
  }
  
  out += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++) {
    out += `[${heavyMath(i + 1)}]=${handlers[i]}`
    if (i < handlers.length - 1) out += ','
  }
  out += `} `
  out += `${DISPATCH}[${heavyMath(realIdx + 1)}]() `
  
  return out
}

// JUNK CODE (sin # ni ;)
function generateJunk(lines) {
  lines = lines || 40
  let j = ''
  for (let i = 0; i < lines; i++) {
    let r = Math.random()
    if (r < 0.2) {
      j += `local ${generateIlName()}=${heavyMath(Math.floor(Math.random() * 999))} `
    } else if (r < 0.4) {
      j += `local ${generateIlName()}=string.char(${heavyMath(Math.floor(Math.random() * 255))}) `
    } else if (r < 0.6) {
      j += `local ${generateIlName()}={} `
      j += `${generateIlName()}.x=1 `
    } else {
      j += `local ${generateIlName()}=function() `
      j += `return ${heavyMath(Math.random() * 100)} `
      j += `end `
    }
  }
  return j
}

// FUNCION PRINCIPAL
function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'
  
  let antiDebug = buildAntiDebug()
  let antiTamper = buildAntiTamper()
  let envLogger = buildEnvLogger()
  let junk = generateJunk(35)
  
  // Ofuscar el código fuente completo como string
  let finalVM = buildNestedVMs(sourceCode)
  
  // Capas de handlers
  for (let i = 0; i < 3; i++) {
    finalVM = buildSingleVM(finalVM, Math.floor(Math.random() * 2) + 2)
  }
  
  let result = HEADER + ' '
  result = result + junk + ' '
  result = result + antiDebug + ' '
  result = result + antiTamper + ' '
  result = result + envLogger + ' '
  result = result + finalVM
  
  // Eliminar espacios múltiples
  result = result.replace(/\s+/g, ' ')
  result = result.trim()
  
  return result
}

module.exports = { obfuscate }
