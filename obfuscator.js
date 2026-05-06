const HEADER = `--[[ VMProtect Ultimate v3.0 - Roblox Compatible ]]`

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
  if (Math.random() < 0.7) return n.toString();
  const r = Math.random()
  if (r < 0.33) {
    let a = Math.floor(Math.random() * 3000) + 500
    let b = Math.floor(Math.random() * 50) + 2
    return `(((${n}+${a})*${b}/${b})-${a})`
  } else if (r < 0.66) {
    let c = Math.floor(Math.random() * 800) + 10
    let d = Math.floor(Math.random() * 20) + 2
    return `((${c}*${d}/${d})-${c}+${n})`
  } else {
    let e = Math.floor(Math.random() * 100) + 1
    return `(((${n}+${e})-${e})*1)`
  }
}

function extremeMath(n) {
  let layers = Math.floor(Math.random() * 2) + 1
  let result = n.toString()
  for(let i = 0; i < layers; i++) {
    let a = Math.floor(Math.random() * 500) + 100
    let b = Math.floor(Math.random() * 30) + 3
    result = `(((${result}+${a})*${b}/math.floor(${b}+0.5))-${a})`
  }
  return result
}

function mba() {
  let patterns = [
    `((${Math.floor(Math.random()*10)+1}*${Math.floor(Math.random()*50)+10}-${Math.floor(Math.random()*50)+10})/(${Math.floor(Math.random()*20)+2}+1)+${Math.floor(Math.random()*5)+1})`,
    `((${Math.floor(Math.random()*100)+1} % ${Math.floor(Math.random()*20)+5}) + ${Math.floor(Math.random()*50)+1} - ${Math.floor(Math.random()*30)+1})`
  ]
  return patterns[Math.floor(Math.random() * patterns.length)]
}

function buildEnvLogger() {
  let v1 = generateIlName(), v2 = generateIlName(), v3 = generateIlName()
  let v4 = generateIlName(), v5 = generateIlName()
  
  const msgBytes = [73,32,114,101,97,108,108,121,32,108,105,107,101,32,82,105,99,107,32,97,110,100,32,77,111,114,116,121]
  
  let logger = `local ${v1}={${msgBytes.join(',')}} local ${v2}={} for ${v3}=1,#${v1} do ${v2}[${v3}]=string.char(${v1}[${v3}]) end local ${v4}=table.concat(${v2}) local function ${v5}() for ${v3}=1,3 do warn(${v4}) end end `
  logger += `if debug and debug.getinfo then local ${v3}=debug.getinfo(1) if ${v3} and ${v3}.what and ${v3}.what~="main" then ${v5}() end end `
  
  return logger
}

function buildAntiTamper() {
  let t1 = generateIlName(), t2 = generateIlName()
  return `local ${t1}=${extremeMath(Math.floor(Math.random()*50)+10)} if ${t1}~=${heavyMath(Math.floor(Math.random()*50)+10)} then warn("") end `
}

function buildAntiDebug() {
  let d1 = generateIlName(), d2 = generateIlName(), d3 = generateIlName()
  return `local ${d1}=tick() for ${d2}=1,50000 do end if tick()-${d1}>0.5 then while true do wait() end end ` +
         `if type(print)~="function" then while true do wait() end end `
}

function buildTrueVM(payloadStr) {
  const STACK = generateIlName(), KEY = generateIlName(), ORDER = generateIlName()
  const SALT = generateIlName()
  
  const seed = Math.floor(Math.random() * 200) + 50
  const saltVal = Math.floor(Math.random() * 250) + 1
  
  let vmCore = `local ${STACK}={} local ${KEY}=${heavyMath(seed)} local ${SALT}=${heavyMath(saltVal)} `
  
  const chunkSize = 12
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
      let fakeLen = Math.floor(Math.random() * 15) + 4
      for(let j = 0; j < fakeLen; j++) {
        fakeBytes.push(heavyMath(Math.floor(Math.random() * 255)))
      }
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `
    }
  }
  
  vmCore += `local _pool={${poolVars.join(',')}} local ${ORDER}={${realOrder.map(n => heavyMath(n)).join(',')}} `
  const idxVar = generateIlName(), byteVar = generateIlName()
  
  vmCore += `local _gIdx=0 for _, ${idxVar} in ipairs(${ORDER}) do for _, ${byteVar} in ipairs(_pool[${idxVar}]) do `
  vmCore += `table.insert(${STACK}, string.char(math.floor((${byteVar} - ${KEY} - _gIdx * ${SALT}) % 256))) _gIdx=_gIdx+1 end end `
  
  vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `
  vmCore += `local _f = load(_e) if _f then _f() end `
  return vmCore
}

function buildNestedVMs(payloadStr) {
  let vm = buildTrueVM(payloadStr)
  for(let i = 0; i < 5; i++) {
    vm = buildCustomVM(vm)
  }
  return vm
}

function buildCustomVM(innerCode) {
  const vmType = Math.floor(Math.random() * 3)
  const vmName = generateIlName()
  
  let vm = `local ${vmName}=function() `
  
  if(vmType === 0) {
    vm += `local _s={} for _i=1,${heavyMath(3)} do if _i==${heavyMath(1)} then ${innerCode} elseif _i==${heavyMath(2)} then else break end end `
  } else if(vmType === 1) {
    vm += `local _r1,_r2=nil,nil _r1=function() ${innerCode} end _r2=function() end _r1() `
  } else {
    vm += `local _t={[${heavyMath(1)}]=function() ${innerCode} end,[${heavyMath(2)}]=function() end} _t[${heavyMath(1)}]() `
  }
  
  vm += `end ${vmName}() `
  return vm
}

function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount)
  const realIdx = Math.floor(Math.random() * handlerCount)
  const DISPATCH = generateIlName()
  let out = `local lM={} `
  for(let i = 0; i < handlers.length; i++) {
    if(i === realIdx) {
      out += `local ${handlers[i]}=function() ${generateJunk(3)} ${innerCode} end `
    } else {
      out += `local ${handlers[i]}=function() ${generateJunk(2)} end `
    }
  }
  out += `local ${DISPATCH}={`
  for(let i = 0; i < handlers.length; i++) {
    out += `[${heavyMath(i + 1)}]=${handlers[i]},`
  }
  out += `} `
  out += `${DISPATCH}[${heavyMath(realIdx + 1)}]() `
  return out
}

function generateJunk(lines = 30) {
  let j = ''
  for(let i = 0; i < lines; i++) {
    const r = Math.random()
    if(r < 0.2) j += `local ${generateIlName()}=${heavyMath(Math.floor(Math.random() * 999))} `
    else if(r < 0.4) j += `local ${generateIlName()}=string.char(${heavyMath(Math.floor(Math.random()*255))}) `
    else if(r < 0.6) j += `local ${generateIlName()}={} ${generateIlName()}.x=1 `
    else j += `local ${generateIlName()}=function() return ${heavyMath(Math.random()*100)} end `
  }
  return j
}

function obfuscate(sourceCode) {
  if(!sourceCode) return '--ERROR'
  
  const antiDebug = buildAntiDebug()
  const antiTamper = buildAntiTamper()
  const envLogger = buildEnvLogger()
  const junk = generateJunk(30)
  
  let payloadToProtect = sourceCode
  
  let finalVM = buildTrueVM(payloadToProtect)
  finalVM = buildNestedVMs(finalVM)
  
  for(let i = 0; i < 3; i++) {
    finalVM = buildSingleVM(finalVM, Math.floor(Math.random() * 2) + 2)
  }
  
  const result = `${HEADER} ${junk} ${antiDebug} ${antiTamper} ${envLogger} ${finalVM}`
  
  return result.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate }
