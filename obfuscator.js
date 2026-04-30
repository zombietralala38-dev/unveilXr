/*
 * VVMER XTREME OFUSCATOR – XOR EN TODAS LAS DEFENSAS
 * - Antitamper y pcall cifrados con XOR + clave rodante.
 * - Corrupción silenciosa en cada capa VM.
 * - 30 capas de VM anidadas, CFF y junk ultraligero.
 * - Máximo 200 locales por scope (bloques do…end).
 */

const HEADER = `--[[ VVMER | XOR protections ]]`

const usedNames = new Set()
function genName(p = '') {
  let n
  do {
    const c = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'
    n = p
    const l = 5 + Math.floor(Math.random() * 8)
    for (let i = 0; i < l; i++) n += c[Math.floor(Math.random() * c.length)]
    n += Math.floor(Math.random() * 99999)
  } while (usedNames.has(n))
  usedNames.add(n)
  return n
}

// Mate ligera (<15% del código)
function lightMath(n) {
  if (Math.random() < 0.85) return n.toString()
  const a = Math.floor(Math.random() * 21) + 4
  const b = Math.floor(Math.random() * 7) + 2
  return `((${n}+${a}-${a})*${b}/${b})`
}

// Cifrado XOR de strings (devuelve array de bytes cifrados + clave)
function xorEncrypt(str) {
  const key = Math.floor(Math.random() * 200) + 33  // clave visible solo una vez
  const enc = []
  for (let i = 0; i < str.length; i++) {
    const byte = (str.charCodeAt(i) ^ key) % 256
    enc.push(byte)
  }
  return { key, bytes: enc }
}

// Convierte bytes cifrados con XOR en código Lua que descifra
function xorToString(enc) {
  const { key, bytes } = enc
  const arrName = genName('_xor')
  const kName = genName('_k')
  const resName = genName('_r')
  // Crea una tabla con los bytes, luego itera y aplica XOR con la clave
  let lua = `local ${arrName}={${bytes.join(',')}} local ${resName}="" local ${kName}=${lightMath(key)} `
  lua += `for _=1,#${arrName} do ${resName}=${resName}..string.char(bit32.bxor(${arrName}[_],${kName})) end `
  lua += `${resName}`
  return lua
}

// Convierte una cadena de código en una expresión que la descifra con XOR
function xorCode(code) {
  const enc = xorEncrypt(code)
  return `(function() ${xorToString(enc)} end)()`
}

// Obtiene el string "pcall" ofuscado con XOR
function xorPcall() {
  return xorCode('pcall')
}

// Protecciones mega (todas en XOR)
function megaProtections() {
  const checks = [
    // Anti env logger
    `if getfenv(0)~=getfenv() then while true do end end`,
    // Anti decompiler
    `if string.dump then while true do end end`,
    // Anti console
    `if io and io.write then while true do end end`,
    // Anti executer (studio)
    `if game:GetService('RunService'):IsStudio() then while true do end end`,
    // Anti tamper (metatable)
    `if getmetatable(_G)~=nil then while true do end end`,
    // Anti deobfuscator
    `if loadstring then while true do end end`,
    // Anti debug
    `if debug and debug.getinfo then while true do end end`,
    // Anti dump
    `if getgc then while true do end end`,
    // Anti hook
    `if hookfunction or replacefunction then while true do end end`,
    // Anti timewarp
    `local ${genName('t')}=os.clock() for _=1,100000 do end if os.clock()-${genName('t')}>5 then while true do end end`
  ]

  const pc = xorPcall()  // "pcall" ofuscado
  let all = ''
  for (const c of checks) {
    const encCode = xorCode(c)
    all += `do ${pc}(function() ${encCode} end) end `
  }
  return all
}

// Corrupción silenciosa: pequeña alteración en la clave del VM si detecta algo raro
function silentCorruption(keyVar) {
  const cond = Math.random() < 0.5
    ? `if type(math.pi)=="string" then`
    : `if #${keyVar}==1 then`
  return `${cond} ${keyVar}=(${keyVar}+${lightMath(137)})%256 end`
}

// VM primaria (cifrado XOR-Affine rodante) con corrupción silenciosa
function buildTrueVM(payloadStr) {
  const STACK = genName()
  const chunkSize = 15
  const realChunks = []
  for (let i = 0; i < payloadStr.length; i += chunkSize)
    realChunks.push(payloadStr.slice(i, i + chunkSize))

  const seed = Math.floor(Math.random() * 200) + 50
  const saltVal = Math.floor(Math.random() * 250) + 1
  const KEY = genName('k')
  const SALT = genName('s')
  const memNames = []
  let realOrder = []
  let globalIndex = 0
  const totalChunks = realChunks.length * 3
  let currentReal = 0

  let vm = `local ${STACK}={} local ${KEY}=${lightMath(seed)} local ${SALT}=${lightMath(saltVal)} `

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
      vm += `local ${memName}={${encBytes.join(',')}} `
      currentReal++
    } else {
      let fakeBytes = []
      let fakeLen = Math.floor(Math.random() * 20) + 5
      for (let j = 0; j < fakeLen; j++) fakeBytes.push(lightMath(Math.floor(Math.random() * 255)))
      vm += `local ${memName}={${fakeBytes.join(',')}} `
    }
  }

  const poolVar = genName('_pool')
  const ORDER = genName('_ord')
  const idxVar = genName('_idx')
  const byteVar = genName('_b')

  vm += `local ${poolVar}={${memNames.join(',')}} `
  vm += `local ${ORDER}={${realOrder.map(n => lightMath(n)).join(',')}} `
  vm += `local _gIdx=0 `
  // Bucle con corrupción silenciosa
  vm += `for _,${idxVar} in ipairs(${ORDER}) do `
  vm += `  for _,${byteVar} in ipairs(${poolVar}[${idxVar}]) do `
  vm += `    ${silentCorruption(KEY)} `
  vm += `    table.insert(${STACK},string.char(math.floor((${byteVar}-${KEY}-_gIdx*${SALT})%256))) `
  vm += `    _gIdx=_gIdx+1 `
  vm += `  end `
  vm += `end `

  vm += `local _e=table.concat(${STACK}) ${STACK}=nil `

  // Llamada final con "assert" y "loadstring" ofuscados vía runtimeString
  const ASSERT = `getfenv()[${runtimeString("assert")}]`
  const LOADSTRING = `getfenv()[${runtimeString("loadstring")}]`
  const GAME = `getfenv()[${runtimeString("game")}]`
  const HTTPGET = runtimeString("HttpGet")
  if (payloadStr.includes("http"))
    vm += `${ASSERT}(${LOADSTRING}(${GAME}[${HTTPGET}](${GAME},_e)))() `
  else
    vm += `${ASSERT}(${LOADSTRING}(_e))() `

  return vm
}

// CFF con estado ofuscado
function applyCFF(blocks, stateVar) {
  let lua = `local ${stateVar}=${lightMath(1)} `
  lua += `while true do `
  for (let i = 0; i < blocks.length; i++) {
    if (i === 0) lua += `if ${stateVar}==${lightMath(1)} then ${blocks[i]} ${stateVar}=${lightMath(2)} `
    else lua += `elseif ${stateVar}==${lightMath(i+1)} then ${blocks[i]} ${stateVar}=${lightMath(i+2)} `
  }
  lua += `elseif ${stateVar}==${lightMath(blocks.length+1)} then break end end `
  return lua
}

// Capa VM envuelta en do…end, con dispatchers ofuscados y corrupción interna
function buildSingleVM(innerCode, handlerCount) {
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
  let out = `local lM={} `
  for (let i = 0; i < handlers.length; i++) {
    const junk = `local ${genName('_')}=${lightMath(1)}`
    if (i === realIdx)
      out += `local ${handlers[i]}=function(lM) local lM=lM ${junk} ${innerCode} end `
    else
      out += `local ${handlers[i]}=function(lM) local lM=lM ${junk} return nil end `
  }
  out += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++) out += `[${lightMath(i+1)}]=${handlers[i]},`
  out += `} `

  const execBlocks = handlers.map((_, i) => `${DISPATCH}[${lightMath(i+1)}](lM)`)
  const stateVar = genName('s')
  out += applyCFF(execBlocks, stateVar)
  return `do ${out} end`
}

// 30 capas de VM
function build30xVM(payload) {
  let vm = buildTrueVM(payload)
  for (let i = 0; i < 29; i++)
    vm = buildSingleVM(vm, Math.floor(Math.random() * 3) + 3)
  return vm
}

// Junk muy reducido con pcall ofuscado
function genJunk(lines) {
  let block = ''
  const pc = xorPcall()
  for (let i = 0; i < lines; i++) {
    block += `do ${pc}(function() local ${genName('_')}=${lightMath(1)} end) end `
  }
  return block
}

function junkBlocks(total, each = 30) {
  let res = ''
  for (let i = 0; i < total; i += each) {
    res += `do ${genJunk(Math.min(each, total - i))} end `
  }
  return res
}

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'

  let payload = ""
  const rgx = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const m = sourceCode.match(rgx)
  if (m) payload = m[1]
  else payload = sourceCode  // Ya aplicaremos ofuscación de palabras clave si hace falta

  const prot = megaProtections()
  const junk = junkBlocks(50, 25)
  const vm = build30xVM(payload)

  const final = `${HEADER}
${prot}
${junk}
${vm}`
  return final.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate }
