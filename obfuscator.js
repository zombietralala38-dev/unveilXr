const HEADER = `--[[ this code its protected by unveilX | https://discord.gg/DU35Mhyhq ]]`

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

// Solo 5% de envoltura matemática, el resto números limpios
function lightMath(n) {
  if (Math.random() < 0.95) return n.toString()
  const a = Math.floor(Math.random() * 21) + 4
  const b = Math.floor(Math.random() * 7) + 2
  return `((${n}+${a}-${a})*${b}/${b})`
}

function runtimeString(s) {
  return `string.char(${s.split('').map(c => lightMath(c.charCodeAt(0))).join(',')})`
}

// VM de una sola capa con dispatch y flujo de control falso
function buildSingleVM(innerCode) {
  const handlerCount = Math.floor(Math.random() * 4) + 3
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
    const junkAssign = `local ${genName('v')}=${lightMath(Math.floor(Math.random()*1000))} `
    if (i === realIdx) {
      out += `local ${handlers[i]}=function(lM) ${junkAssign} ${innerCode} end `
    } else {
      out += `local ${handlers[i]}=function(lM) ${junkAssign} return nil end `
    }
  }
  out += `local ${DISPATCH}={} `
  for (let i = 0; i < handlers.length; i++) {
    out += `${DISPATCH}[${lightMath(i+1)}]=${handlers[i]} `
  }

  const stateVar = genName('s')
  out += `local ${stateVar}=${lightMath(1)} `
  out += `while true do `
  out += `if ${stateVar}==${lightMath(1)} then ${DISPATCH}[${lightMath(realIdx+1)}](lM) ${stateVar}=${lightMath(2)} `
  for (let i = 1; i < handlers.length; i++) {
    const fakeBlock = `local ${genName('f')}=${lightMath(i)} `
    out += `elseif ${stateVar}==${lightMath(i+1)} then ${fakeBlock} ${stateVar}=${lightMath(i+2)} `
  }
  out += `else break end end `
  return `do ${out} end`
}

// VM anidada mínima (2 capas) para sellar cada parte
function buildMinimalNestedVM(innerCode) {
  let vm = buildSingleVM(innerCode)
  for (let i = 0; i < 2; i++) vm = buildSingleVM(vm)
  return vm
}

// VM verdadera que reconstruye el payload final y lo ejecuta
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
  if (payloadStr.includes("http")) {
    const GAME = `getfenv()[${runtimeString("game")}]`
    const HTTPGET = runtimeString("HttpGet")
    vmCore += `${ASSERT}(${LOADSTRING}(${GAME}[${HTTPGET}](${GAME},_e)))() `
  } else {
    vmCore += `${ASSERT}(${LOADSTRING}(_e))() `
  }
  return vmCore
}

// **** CORRECCIÓN AQUÍ: uso de tabla en lugar de variables sueltas ****
function build20PartVMs(payload) {
  const partLength = Math.ceil(payload.length / 20)
  const parts = []
  for (let i = 0; i < 20; i++) {
    parts.push(payload.slice(i * partLength, (i + 1) * partLength))
  }

  const tableName = genName('_parts')   // Tabla que contendrá todas las partes
  let vmCode = `local ${tableName} = {} `

  for (let i = 0; i < parts.length; i++) {
    const encoded = parts[i].length > 0 ? runtimeString(parts[i]) : '""'
    // Guardamos directamente en la tabla
    const inner = `${tableName}[${lightMath(i+1)}] = ${encoded}`
    // Cada asignación va envuelta en su VM sellada
    vmCode += buildMinimalNestedVM(inner) + ' '
  }

  // Ahora combinamos las partes desde la tabla
  const combinedVar = genName('_combined')
  const idxVar = genName('_i')
  let combiner = `local ${combinedVar} = {} `
  combiner += `for ${idxVar}=1,20 do ${combinedVar}[${idxVar}] = ${tableName}[${idxVar}] end `
  combiner += `${tableName} = nil `
  combiner += `local _payload = table.concat(${combinedVar}) `
  combiner += buildTrueVM('_payload')

  return vmCode + ' ' + combiner
}

// Envoltorio final para que acabe en "break end"
function wrapWithBreakEnd(code) {
  const state = genName('_x')
  return `
do
  local ${state} = 1
  while true do
    if ${state} == 1 then
      ${code}
      ${state} = 2
    else
      break
    end
  end
end`
}

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'

  let payload = ""
  const regex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const match = sourceCode.match(regex)
  if (match) {
    payload = match[1]
  } else {
    payload = sourceCode
  }

  const mainVM = build20PartVMs(payload)
  const final = wrapWithBreakEnd(mainVM)

  let result = `${HEADER}\n${final}`
  result = result.replace(/\s+/g, " ").trim()
  return result
}

module.exports = { obfuscate }
