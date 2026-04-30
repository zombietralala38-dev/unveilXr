/*
 * VVMER STEALTH OBFUSCATOR – XOR + RUNTIME DECRYPT + HOOK DETECTION
 * - Ninguna protección en claro
 * - Detección de hooks, sandbox, debugger, entorno virtual
 * - 30 capas VM anidadas con CFF
 * - 15% matemáticas máximo
 */

const HEADER = `--[[ VVMER Stealth ]]`

// ---- utilidades ----
const usedNames = new Set()
function genName(pref = '') {
  let name
  do {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'
    name = pref
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

// ---- XOR cifrado de string a código ejecutable ----
function xorBytes(str) {
  const key = Math.floor(Math.random() * 200) + 33
  const bytes = []
  for (let i = 0; i < str.length; i++) {
    bytes.push((str.charCodeAt(i) ^ key) % 256)
  }
  return { key, bytes }
}

// genera código Lua que descifra y ejecuta el string dado
function buildEncryptedExecutor(codeStr) {
  const { key, bytes } = xorBytes(codeStr)
  const tblName = genName('_e')
  const keyName = genName('_k')
  const builderName = genName('_c')
  // genera el string descifrado
  let lua = `(function()`
  lua += `local ${tblName}={${bytes.join(',')}} `
  lua += `local ${builderName}="" `
  lua += `local ${keyName}=${lightMath(key)} `
  lua += `for _=1,#${tblName} do `
  lua += `${builderName}=${builderName}..string.char(bit32.bxor(${tblName}[_],${keyName})) `
  lua += `end `
  // obtiene la función loadstring
  lua += `local _loader=getfenv()["${runtimeString('loadstring')}"] `
  lua += `if _loader then `
  lua += `local _fn=_loader(${builderName}) `
  lua += `if _fn then _fn() end `
  lua += `end `
  lua += `end)()`
  return lua
}

// pcall ofuscado
function buildObfuscatedPcall() {
  const pcallName = genName('_p')
  // "pcall" en runtimeString
  return `getfenv()[${runtimeString('pcall')}]`
}

// ---- mega protecciones con ejecución XOR + pcall ----
function megaProtections() {
  // las condiciones ahora son simplemente cadenas de código (se cifrarán)
  const conditions = [
    // detección de sandbox/hook por getfenv
    `if getfenv(0) ~= getfenv() then while true do end end`,
    // anti decompiler
    `if string.dump then while true do end end`,
    // anti console
    `if io and io.write then while true do end end`,
    // anti studio
    `if game:GetService('RunService'):IsStudio() then while true do end end`,
    // anti tamper metatabla
    `if getmetatable(_G) ~= nil then while true do end end`,
    // anti deobfuscator
    `if loadstring or getfenv().loadstring then while true do end end`,
    // anti debug
    `if debug and debug.getinfo then while true do end end`,
    // anti dump
    `if getgc then while true do end end`,
    // anti hook / hookfunction / replacefunction
    `if hookfunction or replacefunction or hookmetamethod then while true do end end`,
    // anti time warp
    `local _st=os.clock() for _=1,100000 do end if os.clock()-_st>5 then while true do end end`
  ]

  const obfuscatedPcall = buildObfuscatedPcall()
  let out = ''
  for (const cond of conditions) {
    // cifra el código de la condición y crea el ejecutor
    const encryptedExecutor = buildEncryptedExecutor(cond)
    // envuelve en pcall ofuscado
    out += `do ${obfuscatedPcall}(function() ${encryptedExecutor} end) end `
  }
  return out
}

// ---- VM verdadera con corrupción silenciosa (versión mejorada) ----
function buildTrueVM(payload) {
  const STACK = genName('_s')
  const chunkSize = 15
  const realChunks = []
  for (let i = 0; i < payload.length; i += chunkSize)
    realChunks.push(payload.slice(i, i + chunkSize))

  const seed = Math.floor(Math.random() * 200) + 50
  const saltVal = Math.floor(Math.random() * 250) + 1
  const KEY = genName('_k')
  const SALT = genName('_t')
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
  const idxVar = genName('_i')
  const byteVar = genName('_b')

  vm += `local ${poolVar}={${memNames.join(',')}} `
  vm += `local ${ORDER}={${realOrder.map(n => lightMath(n)).join(',')}} `
  vm += `local _gIdx=0 `
  // corrupción silenciosa: modifica la clave si se está depurando
  vm += `for _,${idxVar} in ipairs(${ORDER}) do `
  vm += `  for _,${byteVar} in ipairs(${poolVar}[${idxVar}]) do `
  vm += `    if type(math.pi)=="string" then ${KEY}=(${KEY}+137)%256 end `
  vm += `    table.insert(${STACK},string.char(math.floor((${byteVar}-${KEY}-_gIdx*${SALT})%256))) `
  vm += `    _gIdx=_gIdx+1 `
  vm += `  end `
  vm += `end `

  vm += `local _res=table.concat(${STACK}) ${STACK}=nil `
  // ejecución segura con assert y loadstring ofuscados
  vm += `getfenv()["${runtimeString('assert')}"](getfenv()["${runtimeString('loadstring')}"](_res))() `
  return vm
}

// CFF
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

// Capa VM aislada (con do...end)
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
  const DISPATCH = genName('_d')
  let out = `local lM={} `
  for (let i = 0; i < handlers.length; i++) {
    const miniJunk = `local ${genName('_')}=${lightMath(1)} `
    if (i === realIdx)
      out += `local ${handlers[i]}=function(lM) local lM=lM ${miniJunk} ${innerCode} end `
    else
      out += `local ${handlers[i]}=function(lM) local lM=lM ${miniJunk} return nil end `
  }
  out += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++) out += `[${lightMath(i+1)}]=${handlers[i]},`
  out += `} `
  const execBlocks = handlers.map((_, i) => `${DISPATCH}[${lightMath(i+1)}](lM)`)
  const stateVar = genName('_s')
  out += applyCFF(execBlocks, stateVar)
  return `do ${out} end`
}

// 30 capas
function build30xVM(payload) {
  let vm = buildTrueVM(payload)
  for (let i = 0; i < 29; i++)
    vm = buildSingleVM(vm, Math.floor(Math.random() * 3) + 3)
  return vm
}

// Junk con pcall ofuscado (poco)
function genLittleJunk(lines) {
  const obPcall = buildObfuscatedPcall()
  let block = ''
  for (let i = 0; i < lines; i++) {
    block += `do ${obPcall}(function() local ${genName('_')}=${lightMath(1)} end) end `
  }
  return block
}

function junkBlocks(total, each = 25) {
  let res = ''
  for (let i = 0; i < total; i += each) {
    res += `do ${genLittleJunk(Math.min(each, total - i))} end `
  }
  return res
}

// ---- función principal ----
function obfuscate(source) {
  if (!source) return '--ERROR'

  // extrae URL de HttpGet si existe
  const match = source.match(/loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i)
  let payload = match ? match[1] : source

  const prot = megaProtections()
  const junk = junkBlocks(40, 20)
  const vm = build30xVM(payload)

  const result = `${HEADER}
${prot}
${junk}
${vm}`
  return result.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate }
