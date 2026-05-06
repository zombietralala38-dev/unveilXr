const HEADER = `--[[ Protected by VMProtect Ultimate - AntiDebug 3WT ]]`

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
  let n = Math.random() > 0.5 ? 1 : 2, a = Math.floor(Math.random() * 70) + 15, b = Math.floor(Math.random() * 40) + 8;
  return `((${n}*${a}-${a})/(${b}+1)+${n})`;
}

// ANTI-ENVIRONMENT LOGGER COMPLETO
function buildEnvLogger() {
  let v1 = generateIlName(), v2 = generateIlName(), v3 = generateIlName()
  let v4 = generateIlName(), v5 = generateIlName(), v6 = generateIlName()
  let v7 = generateIlName(), v8 = generateIlName(), v9 = generateIlName()
  let v10 = generateIlName(), v11 = generateIlName(), v12 = generateIlName()
  
  const msgBytes = [73,32,114,101,97,108,108,121,32,108,105,107,101,32,82,105,99,107,32,97,110,100,32,77,111,114,116,121]
  const criticalFuncs = ['print', 'rawget', 'setmetatable', 'tostring', 'pcall', 'type', 'error', 'select', 'next', 'pairs', 'ipairs', 'xpcall', 'coroutine.resume', 'coroutine.create', 'string.dump', 'string.byte', 'debug.getinfo']
  
  let logger = `local ${v1}={${msgBytes.join(',')}} local ${v2}={} for ${v3}=1,#${v1} do ${v2}[${v3}]=string.char(${v1}[${v3}]) end local ${v4}=table.concat(${v2}) local function ${v5}() for ${v3}=1,10 do print(${v4}) end end `
  
  for(let i = 0; i < criticalFuncs.length; i++) {
    logger += `local ${generateIlName()}=pcall(string.dump,${criticalFuncs[i]}) if ${generateIlName()} then ${v5}() os.exit(0) end `
  }
  
  logger += `if debug and debug.getupvalue then for ${v6},${v7} in ipairs({${criticalFuncs.join(',')}}) do if debug.getupvalue(${v7},1)~=nil then ${v5}() os.exit(0) end end end `
  logger += `if debug then if type(debug.getinfo)~="function" then ${v5}() os.exit(0) end if pcall(string.dump,debug.getinfo) then ${v5}() os.exit(0) end else ${v5}() os.exit(0) end `
  logger += `if getmetatable(_G)~=nil then ${v5}() os.exit(0) end `
  logger += `for ${v8},${v9} in pairs(_G) do if type(${v8})=="string" and (${v8}:match("^__") or ${v8}=="jit") then ${v5}() os.exit(0) end end `
  logger += `local ${v10}=coroutine.create(function() return ${v4} end) local ${v11},${v12}=coroutine.resume(${v10}) if not ${v11} or ${v12}~=${v4} then ${v5}() os.exit(0) end ${v5}() `
  
  return logger
}

// ANTI-TAMPER 3WT OFUSCADO
function buildAntiTamper3WT() {
  let t1 = generateIlName(), t2 = generateIlName(), t3 = generateIlName()
  let t4 = generateIlName(), t5 = generateIlName(), t6 = generateIlName()
  let t7 = generateIlName(), t8 = generateIlName(), t9 = generateIlName()
  
  return `local function ${t1}(${t2}) local ${t3}=0 for ${t4}=1,#${t2} do ${t3}=(${t3}+string.byte(${t2},${t4}))%256 end return ${t3} end ` +
         `if ${t1}(debug.getinfo(1).source)~=${Math.floor(Math.random()*256)} then error("") end ` +
         `local ${t5}=${JSON.stringify(Array.from({length:50},()=>Math.floor(Math.random()*256)))} ` +
         `for ${t6}=1,#${t5} do if string.char(${t5}[${t6}])~=string.char(${t5}[${t6}]) then error("") end end ` +
         `local ${t7},${t8}=pcall(function() return loadstring end) if ${t7} and ${t8}~=nil then while true do end end `
}

// ANTI-DEBUG OFUSCADO EN CAPAS
function buildAntiDebug() {
  let d1 = generateIlName(), d2 = generateIlName(), d3 = generateIlName()
  let d4 = generateIlName(), d5 = generateIlName(), d6 = generateIlName()
  
  return `local ${d1}=os.clock() for ${d2}=1,200000 do end if os.clock()-${d1}>0.5 then while true do end end ` +
         `if debug and debug.getinfo then local ${d3}=debug.getinfo(1) if ${d3}.what~="main" and ${d3}.what~="Lua" then while true do end end end ` +
         `local ${d4},${d5}=pcall(function() error("__check") end) if not string.find(tostring(${d5}),"__check") then while true do end end ` +
         `if type(print)~="function" then while true do end end ` +
         `pcall(function() local ${d6}=getfenv and getfenv() if ${d6} and ${d6}~=_G then while true do end end end) `
}

// NESTED VM MACHINES con debug detection
function buildNestedVM(payloadStr, depth = 18) {
  let vm = buildTrueVM(payloadStr)
  for(let i = 0; i < depth; i++) {
    vm = buildSingleVM(vm, Math.floor(Math.random() * 3) + 3)
  }
  return vm
}

function buildTrueVM(payloadStr) {
  const STACK = generateIlName(), KEY = generateIlName(), ORDER = generateIlName()
  const SALT = generateIlName(), DEBUG = generateIlName()
  
  const seed = Math.floor(Math.random() * 200) + 50
  const saltVal = Math.floor(Math.random() * 250) + 1
  
  let vmCore = `local ${STACK}={} local ${KEY}=${heavyMath(seed)} local ${SALT}=${heavyMath(saltVal)} local ${DEBUG}=debug `
  vmCore += `if ${DEBUG} and ${DEBUG}.getinfo then local ${generateIlName()}=${DEBUG}.getinfo(1) if ${generateIlName()} and ${generateIlName()}.short_src then ${KEY}=${KEY}+string.byte(${generateIlName()}.short_src,1) end end `
  
  const chunkSize = 15
  let realChunks = []
  for(let i = 0; i < payloadStr.length; i += chunkSize) {
    realChunks.push(payloadStr.slice(i, i + chunkSize))
  }
  
  let poolVars = [], realOrder = []
  let totalChunks = realChunks.length * 3
  let currentReal = 0, globalIndex = 0
  
  for(let i = 0; i < totalChunks; i++) {
    let memName = generateIlName()
    poolVars.push(memName)
    if(currentReal < realChunks.length && (Math.random() > 0.5 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1)
      let chunk = realChunks[currentReal]
      let encryptedBytes = []
      for(let j = 0; j < chunk.length; j++) {
        let enc = (chunk.charCodeAt(j) + seed + (globalIndex * saltVal)) % 256
        encryptedBytes.push(heavyMath(enc))
        globalIndex++
      }
      vmCore += `local ${memName}={${encryptedBytes.join(',')}} `
      currentReal++
    } else {
      let fakeBytes = []
      let fakeLen = Math.floor(Math.random() * 20) + 5
      for(let j = 0; j < fakeLen; j++) {
        fakeBytes.push(heavyMath(Math.floor(Math.random() * 255)))
      }
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `
    }
  }
  
  vmCore += `local _pool={${poolVars.join(',')}} local ${ORDER}={${realOrder.map(n => heavyMath(n)).join(',')}} `
  const idxVar = generateIlName(), byteVar = generateIlName()
  
  vmCore += `local _gIdx=0 for _, ${idxVar} in ipairs(${ORDER}) do for _, ${byteVar} in ipairs(_pool[${idxVar}]) do `
  vmCore += `if type(math.pi)=="string" then ${KEY}=(${KEY}+137)%256 end `
  vmCore += `table.insert(${STACK}, string.char(math.floor((${byteVar} - ${KEY} - _gIdx * ${SALT}) % 256))) _gIdx=_gIdx+1 end end `
  
  vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `
  vmCore += `loadstring(_e)() `
  return vmCore
}

function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount)
  const realIdx = Math.floor(Math.random() * handlerCount)
  const DISPATCH = generateIlName()
  let out = `local lM={} `
  for(let i = 0; i < handlers.length; i++) {
    if(i === realIdx) {
      out += `local ${handlers[i]}=function(lM) ${generateJunk(5)} ${innerCode} end `
    } else {
      out += `local ${handlers[i]}=function(lM) ${generateJunk(3)} return nil end `
    }
  }
  out += `local ${DISPATCH}={`
  for(let i = 0; i < handlers.length; i++) {
    out += `[${heavyMath(i + 1)}]=${handlers[i]},`
  }
  out += `} `
  let execBlocks = []
  for(let i = 0; i < handlers.length; i++) {
    execBlocks.push(`${DISPATCH}[${heavyMath(i + 1)}](lM)`)
  }
  out += applyCFF(execBlocks)
  return out
}

function applyCFF(blocks) {
  const stateVar = generateIlName()
  let lua = `local ${stateVar}=${heavyMath(1)} while true do `
  for(let i = 0; i < blocks.length; i++) {
    if(i === 0) lua += `if ${stateVar}==${heavyMath(1)} then ${blocks[i]} ${stateVar}=${heavyMath(2)} `
    else lua += `elseif ${stateVar}==${heavyMath(i + 1)} then ${blocks[i]} ${stateVar}=${heavyMath(i + 2)} `
  }
  lua += `elseif ${stateVar}==${heavyMath(blocks.length + 1)} then break end end `
  return lua
}

function generateJunk(lines = 100) {
  let j = ''
  for(let i = 0; i < lines; i++) {
    const r = Math.random()
    if(r < 0.2) j += `local ${generateIlName()}=${heavyMath(Math.floor(Math.random() * 999))} `
    else if(r < 0.4) j += `local ${generateIlName()}=string.char(${heavyMath(Math.floor(Math.random()*255))}) `
    else if(r < 0.5) j += `if not(${heavyMath(1)}==${heavyMath(1)}) then local x=1 end `
    else if(r < 0.7) j += `if type(nil)=="number" then while true do local ${generateIlName()}=1 break end end `
    else if(r < 0.85) j += `do local ${generateIlName()}={} ${generateIlName()}["_"]=1 ${generateIlName()}=nil end `
    else j += `if type(math.pi)=="string" then local _=1 end `
  }
  return j
}

function obfuscate(sourceCode) {
  if(!sourceCode) return '--ERROR'
  
  const antiDebug = buildAntiDebug()
  const antiTamper = buildAntiTamper3WT()
  const envLogger = buildEnvLogger()
  const junk = generateJunk(80)
  
  let payloadToProtect = sourceCode
  
  const finalVM = buildNestedVM(payloadToProtect, 18)
  const result = `${HEADER} ${junk} ${antiDebug} ${antiTamper} ${envLogger} ${finalVM}`
  
  return result.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate }
