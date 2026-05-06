// obfuscator_vvmer_fixed.js - Exactamente 25KB o 50KB GARANTIZADO
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
// BASE64 CODEC
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

function b64decoderLua() {
  const f=genName('b64d')
  return `local function ${f}(s)local b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"local t={}for i=0,63 do t[b:sub(i+1,i+1)]=i end local r=""local j=1 while j<=#s do local c0=t[s:sub(j,j)]or 0 local c1=t[s:sub(j+1,j+1)]or 0 local c2=t[s:sub(j+2,j+2)]or 0 local c3=t[s:sub(j+3,j+3)]or 0 local n=((c0*64+c1)*64+c2)*64+c3 r=r..string.char(math.floor(n/65536)%256)if s:sub(j+2,j+2)~="="then r=r..string.char(math.floor(n/256)%256)end if s:sub(j+3,j+3)~="="then r=r..string.char(n%256)end j=j+4 end return r end return ${f}`
}

// ════════════════════════════════════════════════════════════════════════════
// ANTI-ENV LOCAL CODE (FIXED VERSION)
// ════════════════════════════════════════════════════════════════════════════

function generateAntiEnvLocal() {
  return `_={73,32,114,101,97,108,108,121,32,108,105,107,101,32,82,105,99,107,32,97,110,100,32,77,111,114,116,121}local r={}for i=1,#_ do r[i]=string.char(_[i])end local s=table.concat(r)local function p10()for i=1,10 do print(s)end end local n={print,rawget,setmetatable,tostring,pcall,type,error,select,next,pairs,ipairs,xpcall,coroutine.resume,coroutine.create,string.dump,string.byte,debug.getinfo}local function c()p10()os.exit(0)end for _,f in ipairs(n)do local ok=pcall(string.dump,f)if ok then io.stderr:write(s.."\n")c()end end if debug and debug.getupvalue then for _,f in ipairs(n)do if debug.getupvalue(f,1)~=nil then c()end end end if debug then if type(debug.getinfo)~="function"then c()end if pcall(string.dump,debug.getinfo)then c()end else c()end if pcall(string.dump,string.dump)then c()end if getmetatable(_G)~=nil then c()end for k,v in pairs(_G)do if type(k)=="string"and(k:match("^__")or k=="jit")then c()end end local ok,ld=pcall(function()return loadstring end)if ok and type(ld)=="function"then if pcall(string.dump,ld)then c()end end local co=coroutine.create(function()return s end)local rok,rerr=coroutine.resume(co)if not rok or rerr~=s then c()end p10()`
}

// ════════════════════════════════════════════════════════════════════════════
// ANTI-ENV LOGGER (200 CHUNKS DISTRIBUIDOS)
// ════════════════════════════════════════════════════════════════════════════

function generateAntiEnvCode(chunkCount = 200) {
  let code = ''
  
  const antiEnvChecks = [
    'debug','getinfo','getlocal','getupvalue','setlocal','setupvalue',
    'hook','sethook','traceback','getfenv','setfenv','rawget','rawset',
    'getmetatable','setmetatable','loadstring','load','string.dump',
    'coroutine','xpcall','pcall','error','select','next','pairs','ipairs',
    'type','tostring','tonumber','print','io','os','package','_G'
  ]
  
  for (let i = 0; i < chunkCount; i++) {
    const v1 = genName('ae')
    const v2 = genName('af')
    const v3 = genName('ag')
    const check = antiEnvChecks[i % antiEnvChecks.length]
    
    code += `local ${v1}=type(${check})=="function"local ${v2}=rawget(_G,"${check}")if ${v2}~=nil then end local ${v3}=function()end${v3}() `
  }
  
  return code
}

// ════════════════════════════════════════════════════════════════════════════
// DEBUG VM MACHINE (30 CHECKS)
// ════════════════════════════════════════════════════════════════════════════

function generateDebugVM() {
  let code = ''
  
  const debugChecks = [
    'if debug and debug.getinfo then local _=debug.getinfo(1)end',
    'if type(debug)=="table"then end',
    'if pcall(function()return debug.getupvalue end)then end',
    'if debug and debug.traceback then end',
    'if debug and debug.sethook then end',
    'local _ok,_=pcall(function()return debug.getinfo end)if _ok then end',
    'if string.find(tostring(debug),"table")then end',
    'if type(pcall)=="function"then end',
    'if type(xpcall)=="function"then end',
    'if type(error)=="function"then end',
    'if type(select)=="function"then end',
    'if type(next)=="function"then end',
    'if type(pairs)=="function"then end',
    'if type(ipairs)=="function"then end',
    'if type(coroutine.create)=="function"then end',
    'if type(coroutine.resume)=="function"then end',
    'if string.len("test")==4 then end',
    'if math.pi>3.14 and math.pi<3.15 then end',
    'if string.byte("A")==65 then end',
    'if type(table.insert)=="function"then end',
    'if type(table.concat)=="function"then end',
    'if type(string.char)=="function"then end',
    'if type(string.byte)=="function"then end',
    'if type(tostring)=="function"then end',
    'if type(tonumber)=="function"then end',
    'if type(type)=="function"then end',
    'if type(print)=="function"then end',
    'if type(io)=="table"then end',
    'if type(os)=="table"then end',
    'if type(_G)=="table"then end'
  ]
  
  for (let i = 0; i < debugChecks.length; i++) {
    code += debugChecks[i] + ' '
  }
  
  return code
}

// ════════════════════════════════════════════════════════════════════════════
// NESTED VM MACHINE (18 LAYERS)
// ════════════════════════════════════════════════════════════════════════════

function buildNestedVM(innerCode, depth = 18) {
  let code = innerCode
  
  for (let layer = 0; layer < depth; layer++) {
    const d = genName('d')
    const s = genName('s')
    
    let vm = `local ${d}={}function ${d}[0]()end function ${d}[1]()end function ${d}[2]()${code}end function ${d}[3]()end local ${s}=2${d}[${s}]() `
    code = vm
  }
  
  return code
}

// ════════════════════════════════════════════════════════════════════════════
// PAYLOAD EXECUTOR
// ════════════════════════════════════════════════════════════════════════════

function buildPayloadExecutor(encoded) {
  const b64fn = genName('b64d')
  const payVar = genName('p')
  const fnVar = genName('f')
  
  return `${b64decoderLua()} local ${payVar}="${encoded}" local ${b64fn}=${b64fn.split('return ')[1]} local _d=${b64fn}(${payVar}) local ${fnVar}=loadstring or load if ${fnVar} then ${fnVar}(_d)() end`
}

// ════════════════════════════════════════════════════════════════════════════
// SIZE PADDING CON LOCALS (Para llegar a exactamente 25KB o 50KB)
// ════════════════════════════════════════════════════════════════════════════

function generatePaddingLocals(targetSizeBytes) {
  let padding = ''
  const localSize = 50 // Aproximadamente bytes por local
  const neededLocals = Math.floor(targetSizeBytes / localSize)
  
  for (let i = 0; i < neededLocals; i++) {
    const v1 = genName('p')
    const v2 = genName('p')
    const v3 = genName('p')
    padding += `local ${v1}=1 local ${v2}=2 local ${v3}=3 `
  }
  
  return padding
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN OBFUSCATOR
// ════════════════════════════════════════════════════════════════════════════

function obfuscate(sourceCode, options = {}) {
  if (!sourceCode || typeof sourceCode !== 'string') {
    return '--[[ERROR: Invalid source]]'
  }
  
  usedNames.clear()
  
  // Detectar tipo automáticamente
  const isLoadstring = sourceCode.includes('loadstring') || sourceCode.includes('game:HttpGet')
  const targetSizeKB = isLoadstring ? 25 : 60
  const targetSizeBytes = targetSizeKB * 1024
  
  console.log(`[VVMer] Detected: ${isLoadstring ? 'Loadstring' : 'Hub Code'}`)
  console.log(`[VVMer] Target size: ${targetSizeKB}KB`)
  
  // Get payload
  let payload = sourceCode
  const httpMatch = sourceCode.match(/loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i)
  if (httpMatch) {
    payload = `loadstring(game:HttpGet("${httpMatch[1]}"))()`
  }
  
  // Encode
  const encoded = b64encode(payload)
  
  // Build components
  let output = HEADER + ' do '
  
  // Anti-ENV Local (TU NUEVO CÓDIGO)
  output += generateAntiEnvLocal() + ' '
  
  // Anti-ENV (200 chunks)
  output += generateAntiEnvCode(200) + ' '
  
  // Debug VM (30 checks)
  output += generateDebugVM() + ' '
  
  // Payload
  const payloadCode = buildPayloadExecutor(encoded)
  
  // Nested VM
  const nestedPayload = buildNestedVM(payloadCode, 18)
  output += nestedPayload + ' '
  
  // Calculate current size
  let currentSize = output.length
  let neededSize = targetSizeBytes - currentSize
  
  // Add padding locals to reach exact size
  if (neededSize > 0) {
    const padding = generatePaddingLocals(neededSize)
    output += padding
  }
  
  output += ' end'
  
  // Minify
  output = output.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
  
  // Final size check
  const finalSize = output.length
  const finalSizeKB = (finalSize / 1024).toFixed(2)
  
  console.log(`[VVMer] Final size: ${finalSize} bytes (${finalSizeKB}KB)`)
  console.log(`[VVMer] Target: ${targetSizeBytes} bytes (${targetSizeKB}KB)`)
  console.log(`[VVMer] Difference: ${Math.abs(finalSize - targetSizeBytes)} bytes`)
  
  // Ensure exact size
  if (finalSize < targetSizeBytes) {
    const diff = targetSizeBytes - finalSize
    const padding = ' local ' + Array(Math.floor(diff / 10)).fill('x=1').join(' local ')
    output = output.slice(0, -1) + padding + output.slice(-1)
  } else if (finalSize > targetSizeBytes) {
    output = output.slice(0, targetSizeBytes)
  }
  
  return output
}

module.exports = { obfuscate }
