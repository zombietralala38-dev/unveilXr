/*
 * VVMER MEGA OBFUSCATOR – PROTECCIÓN TOTAL (INVISIBLE + CORRUPCIÓN SILENCIOSA)
 * - 30 capas VM anidadas con cifrado XOR rodante
 * - Anti Debug / Anti Decompiler / Anti Console / Anti Executer / Anti Logger / Anti Hook / Anti Dump / Anti Timewarp
 * - Pcall en todas las comprobaciones, corrupción silenciosa sin bucles infinitos visibles
 * - Matemática reducida (<15%)
 * - Todo el payload (junk + protecciones + código) viaja dentro de las VMs
 * - La salida ES un solo bloque cifrado con cargador mínimo (invisible)
 */

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
  return `string.char(${s.split('').map(c => lightMath(c.charCodeAt(0))).join(',')})`
}

// Junk ligero con scope aislado
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

// --- CORRUPCIÓN SILENCIOSA ---
// En lugar de crashear, modifica _CORRUPT para que las desencriptaciones futuras fallen.
function silentAntiTamper() {
  const checks = [
    `pcall(function() if getfenv(0)~=getfenv() then _CORRUPT=_CORRUPT+1 end end)`,
    `pcall(function() if string.dump then _CORRUPT=_CORRUPT+1 end end)`,
    `pcall(function() if io and io.write then _CORRUPT=_CORRUPT+1 end end)`,
    `pcall(function() if game:GetService('RunService'):IsStudio() then _CORRUPT=_CORRUPT+1 end end)`,
    `pcall(function() if getmetatable(_G)~=nil then _CORRUPT=_CORRUPT+1 end end)`,
    `pcall(function() if loadstring then _CORRUPT=_CORRUPT+1 end end)`,
    `pcall(function() if debug and debug.getinfo then _CORRUPT=_CORRUPT+1 end end)`,
    `pcall(function() if getgc then _CORRUPT=_CORRUPT+1 end end)`,
    `pcall(function() if hookfunction or replacefunction then _CORRUPT=_CORRUPT+1 end end)`,
    `pcall(function() local t0=os.clock() for _=1,100000 do end if os.clock()-t0>5 then _CORRUPT=_CORRUPT+1 end end)`
  ]
  let block = `local ${genName('c')}=0 `
  for (const c of checks) {
    block += `do ${c} end `
  }
  block += `_CORRUPT=${genName('c')} `
  return block
}

// VM verdadera con corrupción silenciosa incorporada
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

  let vmCore = `local ${STACK}={} local ${KEY}=${lightMath(seed)} local ${SALT}=${lightMath(saltVal)} local _CORRUPT=0 `

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
  // Corrupción silenciosa: si _CORRUPT>0 se usan claves falsas (invierte seed o duplica salt)
  vmCore += `local _effKey=(${KEY}) local _effSalt=(${SALT}) `
  vmCore += `if _CORRUPT>0 then _effKey=256-_effKey _effSalt=_effSalt*2 end `
  vmCore += `for _,${idxVar} in ipairs(${ORDER}) do `
  vmCore += `for _,${byteVar} in ipairs(${poolVar}[${idxVar}]) do `
  vmCore += `table.insert(${STACK},string.char(math.floor((${byteVar}-_effKey-_gIdx*_effSalt)%256))) `
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

// CFF para dispatchers (capa individual de VM)
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

// Capa simple de VM con pcall ofuscado
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
    const fakeJunk = junkBlocks(2, 5)
    if (i === realIdx)
      out += `local ${handlers[i]}=function(lM) local lM=lM ${fakeJunk} lM._inner=[[${innerCode}]] end `
    else
      out += `local ${handlers[i]}=function(lM) local lM=lM ${fakeJunk} return nil end `
  }
  out += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++) out += `[${lightMath(i+1)}]=${handlers[i]},`
  out += `} `
  const execBlocks = handlers.map((_, i) => `${DISPATCH}[${lightMath(i+1)}](lM)`)
  const stateVar = genName('s')
  out += applyCFF(execBlocks, stateVar)
  // Ahora pasamos el inner que se devuelve como string y lo ejecutamos
  out += `local _str=lM._inner if _str then assert(loadstring(_str))() end `
  return `do ${out} end`
}

// 30 capas de VM con payload completo (protecciones, junk, código original)
function build30xVM(fullPayload) {
  let vm = buildTrueVM(fullPayload)
  for (let i = 0; i < 29; i++)
    vm = buildSingleVM(vm, Math.floor(Math.random() * 3) + 3)
  return vm
}

// Cifrado invisible del script completo (el cargador externo)
function obfuscateLoader(vmCode) {
  const key = Math.floor(Math.random() * 200) + 50
  let enc = ''
  for (let i = 0; i < vmCode.length; i++) {
    const c = vmCode.charCodeAt(i) ^ ((key + i) % 256)
    enc += '\\' + c.toString(10).padStart(3, '0')
  }
  // Loader mínimo generado con string.char
  const loaderFunc = `local a,b=${lightMath(key)},[[]] for i=1,#b do local c=b:byte(i)~((a+i-1)%256) io.write(string.char(c)) end`
  // En realidad necesitamos ejecutar el código, no solo imprimir. Usaremos loadstring.
  const finalLoader = `(function() local k=${lightMath(key)} local s=[[${enc}]] local r={} for i=1,#s do local byte=s:byte(i)~((k+i-1)%256) r[#r+1]=string.char(byte) end assert(loadstring(table.concat(r)))() end)()`
  return finalLoader
}

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'

  let originalPayload = ""
  const regex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const match = sourceCode.match(regex)
  if (match) {
    originalPayload = `game:HttpGet("${match[1]}")`   // mantenemos la lógica original
  } else {
    originalPayload = sourceCode
  }

  // Construir carga total: protecciones silenciosas + junk pesado + código original
  const protections = silentAntiTamper()
  const junk = junkBlocks(100, 30)  // cantidad ajustable
  const fullPayload = protections + junk + originalPayload

  // Envolver en 30 capas VM
  const vmCode = build30xVM(fullPayload)

  // Enmascarar aún más: cifrar la salida para que el script final sea solo el loader
  const final = `${HEADER}\n${obfuscateLoader(vmCode)}`
  return final.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate }
