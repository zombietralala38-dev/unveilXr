/*
 * VVMER OBFUSCATOR – SINTAXIS LIMPIA, 20% MATH CODE + 5 TÉCNICAS
 * Sin anti-debug, sin protecciones de integridad.
 * Solo ofuscación pura.
 */

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

function heavyMath(n) {
  if (Math.random() < 0.1) return n.toString()
  const a = Math.floor(Math.random() * 61) + 9
  const b = Math.floor(Math.random() * 17) + 5
  const c = Math.floor(Math.random() * 7) + 1
  return `(((${n}+${a}-${a})*${b}/${b})+${c}-${c})`
}

function runtimeString(s) {
  return `string.char(${s.split('').map(c => heavyMath(c.charCodeAt(0))).join(',')})`
}

const MAPEO = {
  "ScreenGui": "Aggressive Renaming",
  "Frame": "String to Math",
  "TextLabel": "Table Indirection",
  "TextButton": "Mixed Boolean Arithmetic",
  "Humanoid": "Dynamic Junk",
  "Player": "Fake Flow",
  "RunService": "Virtual Machine",
  "TweenService": "Fake Flow",
  "Players": "Fake Flow"
}

function detectAndApplyMappings(code) {
  let modified = code, headers = ""
  for (const [word, tech] of Object.entries(MAPEO)) {
    const regex = new RegExp(`\\b${word}\\b`, "g")
    if (regex.test(modified)) {
      let replacement = `"${word}"`
      if (tech.includes("Aggressive Renaming")) {
        const v = genName()
        headers += `local ${v}="${word}" `
        replacement = v
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

function generateAdvancedJunk(totalLines) {
  const chunkSize = 40
  let junk = ''
  for (let i = 0; i < totalLines; i += chunkSize) {
    const lines = Math.min(chunkSize, totalLines - i)
    let block = ''
    for (let j = 0; j < lines; j++) {
      const r = Math.random()
      if (r < 0.15) {
        const v = genName('m_')
        block += `local ${v}=${heavyMath(Math.floor(Math.random()*9999))}*${heavyMath(Math.floor(Math.random()*100)+1)} `
      } else if (r < 0.35) {
        block += `if ${heavyMath(1)}==${heavyMath(1)} then local ${genName('op_')}=${heavyMath(42)} end `
      } else if (r < 0.55) {
        const tp = genName('tp_')
        block += `if type(nil)=="number" then while true do local ${tp}=1 end end `
      } else if (r < 0.75) {
        const vt = genName('vt_')
        block += `do local ${vt}={} ${vt}["_"]=1 ${vt}=nil end `
      } else if (r < 0.9) {
        block += `if type(math.pi)=="string" then local _=1 end `
      } else {
        block += `for _=1,${heavyMath(1)} do local ${genName('lp_')}=math.sqrt(${heavyMath(144)}) end `
      }
    }
    junk += `do ${block} end `
  }
  return junk
}

function buildTrueVMFixed(payloadStr) {
  const STACK = genName()
  const chunkSize = 15
  let realChunks = []
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

  let vmCore = `local ${STACK}={} local ${KEY}=${heavyMath(seed)} local ${SALT}=${heavyMath(saltVal)} `

  for (let i = 0; i < totalChunks; i++) {
    const memName = genName()
    memNames.push(memName)
    if (currentReal < realChunks.length && (Math.random() > 0.5 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1)
      const chunk = realChunks[currentReal]
      let encBytes = []
      for (let j = 0; j < chunk.length; j++) {
        const enc = (chunk.charCodeAt(j) + seed + (globalIndex * saltVal)) % 256
        encBytes.push(heavyMath(enc))
        globalIndex++
      }
      vmCore += `local ${memName}={${encBytes.join(',')}} `
      currentReal++
    } else {
      let fakeBytes = []
      let fakeLen = Math.floor(Math.random() * 20) + 5
      for (let j = 0; j < fakeLen; j++) fakeBytes.push(heavyMath(Math.floor(Math.random() * 255)))
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `
    }
  }

  const poolVar = genName('_pool')
  const ORDER = genName('_order')
  const idxVar = genName('_idx')
  const byteVar = genName('_byte')

  vmCore += `local ${poolVar}={${memNames.join(',')}} `
  vmCore += `local ${ORDER}={${realOrder.map(n => heavyMath(n)).join(',')}} `
  vmCore += `local _gIdx=0 `
  vmCore += `for _,${idxVar} in ipairs(${ORDER}) do `
  vmCore += `for _,${byteVar} in ipairs(${poolVar}[${idxVar}]) do `
  vmCore += `table.insert(${STACK},string.char(math.floor((${byteVar}-${KEY}-_gIdx*${SALT})%256))) `
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

function applyCFF(blocks, stateVar) {
  let lua = `local ${stateVar}=${heavyMath(1)} `
  lua += `while true do `
  for (let i = 0; i < blocks.length; i++) {
    if (i === 0) lua += `if ${stateVar}==${heavyMath(1)} then ${blocks[i]} ${stateVar}=${heavyMath(2)} `
    else lua += `elseif ${stateVar}==${heavyMath(i+1)} then ${blocks[i]} ${stateVar}=${heavyMath(i+2)} `
  }
  lua += `elseif ${stateVar}==${heavyMath(blocks.length+1)} then break end end `
  return lua
}

function buildSingleVM(innerCode, handlerCount) {
  const handlers = []
  const used = new Set()
  const bases = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  while (handlers.length < handlerCount) {
    const base = bases[Math.floor(Math.random() * bases.length)]
    const name = base + Math.floor(Math.random() * 99)
    if (!used.has(name)) { used.add(name); handlers.push(name) }
  }

  const realIdx = Math.floor(Math.random() * handlerCount)
  const DISPATCH = genName('dispatch_')
  let out = `local lM={} `
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx)
      out += `local ${handlers[i]}=function(lM) local lM=lM ${generateAdvancedJunk(5)} ${innerCode} end `
    else
      out += `local ${handlers[i]}=function(lM) local lM=lM ${generateAdvancedJunk(3)} return nil end `
  }
  out += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++) out += `[${heavyMath(i+1)}]=${handlers[i]},`
  out += `} `

  const execBlocks = handlers.map((_, i) => `${DISPATCH}[${heavyMath(i+1)}](lM)`)
  const stateVar = genName('sv_')
  out += applyCFF(execBlocks, stateVar)
  return `do ${out} end`
}

function build18xVM(payloadStr) {
  let vm = buildTrueVMFixed(payloadStr)
  for (let i = 0; i < 17; i++)
    vm = buildSingleVM(vm, Math.floor(Math.random() * 2) + 3)
  return vm
}

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'

  let payloadToProtect = ""
  const regex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const match = sourceCode.match(regex)
  if (match) {
    payloadToProtect = match[1]
  } else {
    payloadToProtect = detectAndApplyMappings(sourceCode)
  }

  const junk = generateAdvancedJunk(150)
  const vm = build18xVM(payloadToProtect)

  const final = `${HEADER}
${junk}
${vm}`
  return final.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate }
