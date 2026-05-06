// obfuscator_vvmer.js - Ultra Protected VM with 200-Chunk Anti-ENV Logger
const HEADER = `--[[vvmer protected]]`

const usedNames = new Set()
const LUA_KEYWORDS = new Set(['and','break','do','else','elseif','end','false','for','function','if','in','local','nil','not','or','repeat','return','then','true','until','while','goto'])

function genName(p='_') {
  const c='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let n
  do {
    n=p+c[Math.floor(Math.random()*c.length)]+Math.random().toString(36).slice(2,10)
  } while (usedNames.has(n)||LUA_KEYWORDS.has(n))
  usedNames.add(n)
  return n
}

// ════════════════════════════════════════════════════════════════════════════
// 1. ANTI-ENV LOGGER - 200 CORRUPTED CHUNKS
// ════════════════════════════════════════════════════════════════════════════

function generateAntiEnvChunks() {
  const chunks = []
  const antiEnvChecks = [
    'debug',
    'getinfo',
    'getlocal',
    'getupvalue',
    'setlocal',
    'setupvalue',
    'hook',
    'sethook',
    'traceback',
    'getfenv',
    'setfenv',
    'rawget',
    'rawset',
    'getmetatable',
    'setmetatable',
    'loadstring',
    'load',
    'string.dump',
    'coroutine',
    'xpcall',
    'pcall',
    'error',
    'select',
    'next',
    'pairs',
    'ipairs',
    'type',
    'tostring',
    'tonumber',
    'print',
    'io',
    'os',
    'package',
    '_G',
  ]

  // Generate 200 chunks (10-20 lines each)
  for (let i = 0; i < 200; i++) {
    const chunkSize = Math.floor(Math.random() * 10) + 10
    let chunk = ''
    
    for (let j = 0; j < chunkSize; j++) {
      const check = antiEnvChecks[Math.floor(Math.random() * antiEnvChecks.length)]
      const varName = genName('ae')
      const funcName = genName('f')
      
      // Generate corrupted but functional checks
      if (Math.random() > 0.5) {
        chunk += `local ${varName}=type(${check})=="function" local ${funcName}=function() if ${varName} then end end ${funcName}() `
      } else {
        chunk += `local ${varName}=rawget(_G,"${check}") if ${varName}~=nil then end `
      }
    }
    
    chunks.push(chunk)
  }
  
  return chunks
}

function buildAntiEnvWithVM(chunks) {
  let vmCode = ''
  
  // Wrap each chunk in nested VMs
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    
    // Single VM wrapper
    const handlers = []
    for (let h = 0; h < 5; h++) {
      handlers.push(genName('h'))
    }
    
    const realIdx = Math.floor(Math.random() * handlers.length)
    const dispatchTable = genName('d')
    
    let singleVM = `local ${dispatchTable}={} `
    
    for (let h = 0; h < handlers.length; h++) {
      if (h === realIdx) {
        singleVM += `function ${dispatchTable}[${h}]() ${chunk} end `
      } else {
        singleVM += `function ${dispatchTable}[${h}]() end `
      }
    }
    
    singleVM += `${dispatchTable}[${realIdx}]() `
    
    // Nest it 3 times
    let nested = singleVM
    for (let nest = 0; nest < 2; nest++) {
      const d2 = genName('d')
      const h2 = []
      for (let x = 0; x < 3; x++) h2.push(genName('h'))
      const r2 = Math.floor(Math.random() * h2.length)
      let n2 = `local ${d2}={} `
      for (let x = 0; x < h2.length; x++) {
        if (x === r2) {
          n2 += `function ${d2}[${x}]() ${nested} end `
        } else {
          n2 += `function ${d2}[${x}]() end `
        }
      }
      n2 += `${d2}[${r2}]() `
      nested = n2
    }
    
    vmCode += nested
  }
  
  return vmCode
}

// ════════════════════════════════════════════════════════════════════════════
// 2. DEBUG VM MACHINE
// ════════════════════════════════════════════════════════════════════════════

function buildDebugVM() {
  const checks = []
  const checkFns = [
    'if debug and debug.getinfo then local _=debug.getinfo(1) if _~=nil then end end',
    'if type(debug)=="table" then end',
    'if pcall(function() debug.getinfo(1) end) then end',
    'local _ok,_err=pcall(function() return debug.getupvalue end) if _ok then end',
    'if debug and type(debug.traceback)=="function" then end',
    'if debug and debug.sethook then end',
    'if debug and debug.getlocal then end',
  ]
  
  for (let i = 0; i < 30; i++) {
    const fn = checkFns[Math.floor(Math.random() * checkFns.length)]
    const varName = genName('dbg')
    checks.push(`local ${varName}=function() ${fn} end ${varName}()`)
  }
  
  return checks.join(' ')
}

// ════════════════════════════════════════════════════════════════════════════
// 3. NESTED VM MACHINE (Fragile - 18 layers)
// ════════════════════════════════════════════════════════════════════════════

function buildNestedVM(innerCode, depth = 18) {
  let code = innerCode
  
  for (let layer = 0; layer < depth; layer++) {
    const handlers = []
    for (let i = 0; i < 4; i++) {
      handlers.push(genName('h'))
    }
    
    const realIdx = Math.floor(Math.random() * handlers.length)
    const d = genName('d')
    const slot = genName('s')
    
    let vm = `local ${d}={} `
    
    for (let h = 0; h < handlers.length; h++) {
      if (h === realIdx) {
        vm += `function ${d}[${h}]() ${code} end `
      } else {
        vm += `function ${d}[${h}]() end `
      }
    }
    
    vm += `local ${slot}=${realIdx} ${d}[${slot}]() `
    code = vm
  }
  
  return code
}

// ════════════════════════════════════════════════════════════════════════════
// 4. CUSTOM LOCKER VM (Recursive Corrupt Execution)
// ════════════════════════════════════════════════════════════════════════════

function buildLockerVM(payload) {
  const lockVar = genName('lock')
  const stateVar = genName('state')
  const stackVar = genName('stack')
  const idxVar = genName('idx')
  const chunkVar = genName('chunk')
  
  // Split payload into chunks
  const chunkSize = 8
  const chunks = []
  for (let i = 0; i < payload.length; i += chunkSize) {
    chunks.push(payload.slice(i, i + chunkSize))
  }
  
  let locker = `local ${stackVar}={} `
  
  // Store chunks in fragile VM
  for (let i = 0; i < chunks.length; i++) {
    const chunkName = genName('c')
    const chunk = chunks[i]
    const bytes = []
    
    for (let j = 0; j < chunk.length; j++) {
      bytes.push(chunk.charCodeAt(j))
    }
    
    locker += `local ${chunkName}={${bytes.join(',')}} `
    locker += `for ${idxVar}=1,#${chunkName} do table.insert(${stackVar}, string.char(${chunkName}[${idxVar}])) end `
  }
  
  // Build locker state machine
  locker += `local ${stateVar}=0 `
  locker += `local ${lockVar}=function() `
  locker += `${stateVar}=${stateVar}+1 `
  locker += `if ${stateVar}>10 then ${stateVar}=0 end `
  locker += `end `
  
  // Execute with corruption
  locker += `for _=1,#${stackVar} do ${lockVar}() end `
  locker += `local _payload=table.concat(${stackVar}) `
  locker += `local _fn=loadstring or load `
  locker += `if _fn then _fn(_payload)() end `
  
  return locker
}

// ════════════════════════════════════════════════════════════════════════════
// 5. MAIN OBFUSCATOR
// ════════════════════════════════════════════════════════════════════════════

function b64encode(str) {
  const c='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let r='',i=0
  while(i<str.length){
    const a=str.charCodeAt(i++),b=i<str.length?str.charCodeAt(i++):0,d=i<str.length?str.charCodeAt(i++):0
    const n=(a<<16)|(b<<8)|d
    r+=c[(n>>18)&63]+c[(n>>12)&63]+(i-2<str.length?c[(n>>6)&63]:'=')+(i-1<str.length?c[n&63]:'=')
  }
  return r
}

function b64decode() {
  const f=genName('b64d')
  return `local function ${f}(s) local b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/" local t={} for i=0,63 do t[b:sub(i+1,i+1)]=i end local r="" local j=1 while j<=#s do local c0=t[s:sub(j,j)]or 0 local c1=t[s:sub(j+1,j+1)]or 0 local c2=t[s:sub(j+2,j+2)]or 0 local c3=t[s:sub(j+3,j+3)]or 0 local n=((c0*64+c1)*64+c2)*64+c3 r=r..string.char(math.floor(n/65536)%256) if s:sub(j+2,j+2)~="=" then r=r..string.char(math.floor(n/256)%256) end if s:sub(j+3,j+3)~="=" then r=r..string.char(n%256) end j=j+4 end return r end return ${f}`
}

function obfuscate(sourceCode, opts = {}) {
  if (!sourceCode || typeof sourceCode !== 'string') return '--ERROR'
  
  usedNames.clear()
  
  // Detect type
  const isLoadstring = sourceCode.includes('loadstring') || sourceCode.includes('game:HttpGet')
  const targetSize = isLoadstring ? 25 : 50 // KB
  
  // Get payload
  let payload = sourceCode
  const httpMatch = sourceCode.match(/loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i)
  if (httpMatch) {
    payload = `loadstring(game:HttpGet("${httpMatch[1]}"))()`
  }
  
  // Build components
  const encoded = b64encode(payload)
  const b64fn = genName('b64')
  const payVar = genName('p')
  
  let output = HEADER + ' do '
  
  // 1. Anti-ENV Logger (200 chunks)
  const antiEnvChunks = generateAntiEnvChunks()
  const antiEnvVM = buildAntiEnvWithVM(antiEnvChunks)
  output += antiEnvVM + ' '
  
  // 2. Debug VM
  const debugVM = buildDebugVM()
  output += debugVM + ' '
  
  // 3. Nested VM with payload
  const payloadCode = `${b64decode()} local ${payVar}="${encoded}" local ${b64fn}=${b64fn.split('return ')[1]} local _d=${b64fn}(${payVar}) local _l=loadstring or load if _l then _l(_d)() end`
  const nestedPayload = buildNestedVM(payloadCode, 18)
  output += nestedPayload + ' '
  
  // 4. Locker VM (wraps everything)
  const lockerPayload = buildLockerVM(nestedPayload)
  output += lockerPayload + ' '
  
  output += ' end'
  
  // Minify
  output = output.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
  
  // Size check
  const sizeKB = (output.length / 1024).toFixed(2)
  console.log(`[vvmer] Output size: ${sizeKB}KB (target: ${targetSize}KB)`)
  
  return output
}

module.exports = { obfuscate }
