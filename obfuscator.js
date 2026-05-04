const HEADER = `--[[ Protected by unveilX | https://discord.gg/DU35Mhyhq ]]`

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

// Base64 encoding
function base64Encode(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  let i = 0
  while (i < str.length) {
    const a = str.charCodeAt(i++)
    const b = i < str.length ? str.charCodeAt(i++) : 0
    const c = i < str.length ? str.charCodeAt(i++) : 0
    const bitmap = (a << 16) | (b << 8) | c
    result += chars.charAt((bitmap >> 18) & 63)
    result += chars.charAt((bitmap >> 12) & 63)
    result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '='
    result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '='
  }
  return result
}

// Base64 decode function as Lua code
function getBase64Decoder() {
  return `local function _b64d(s)
  local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  local t={}for i=1,#b do t[b:sub(i,i)]=i-1 end
  local r=''local j=1
  while j<=#s do
    local c1,c2,c3,c4=s:sub(j,j):byte()or 0,s:sub(j+1,j+1):byte()or 0,s:sub(j+2,j+2):byte()or 0,s:sub(j+3,j+3):byte()or 0
    if c1>0 then c1=t[string.char(c1)]or 0 end
    if c2>0 then c2=t[string.char(c2)]or 0 end
    if c3>0 then c3=t[string.char(c3)]or 0 end
    if c4>0 then c4=t[string.char(c4)]or 0 end
    local v=(c1*64+c2)*64+c3
    r=r..string.char(bit.rshift(v,16))
    if j+2<=#s and s:sub(j+3,j+3)~='=' then r=r..string.char(bit.band(bit.rshift(v,8),255))end
    if j+3<=#s and s:sub(j+4,j+4)~='=' then r=r..string.char(bit.band(v,255))end
    j=j+4
  end
  return r
end`
}

// Generate 100 different recursive anti-tamper checks
function generateAntiTamperChecks() {
  const checks = []
  const antiMessages = [
    'I really like Rick and Morty',
    'I really enjoy Rick and Morty',
    'I truly love Rick and Morty',
    'I absolutely adore Rick and Morty',
    'Rick and Morty is amazing',
    'I think Rick and Morty rocks',
    'Rick and Morty is incredible',
    'I cannot stop watching Rick and Morty',
    'Rick and Morty changed my life',
    'I recommend Rick and Morty to everyone',
  ]
  
  for (let i = 0; i < 100; i++) {
    const msg = antiMessages[i % antiMessages.length]
    const varName = genName('_at')
    const hashVar = genName('_h')
    const checkVar = genName('_ck')
    const recursiveFunc = genName('_rec')
    const envCheck = genName('_env')
    const customError = genName('_err')
    
    // Create unique recursive check
    const check = `
local ${varName}="${msg}#${i}"
local function ${recursiveFunc}(d,l)
  if l>100 then return true end
  local ${hashVar}=0
  for j=1,#d do ${hashVar}=(${hashVar}+string.byte(d,j)*${i+1})%2147483647 end
  if ${hashVar}%${i+7}==0 then return ${recursiveFunc}(d,l+1)end
  return false
end
local ${checkVar}=${recursiveFunc}(${varName},0)
if not ${checkVar} then local ${customError}=function()error("${msg}")end ${customError}()end
local function ${envCheck}()
  local ${varName}2="${msg}#${i}#env"
  if rawget(_G,"${varName}2")then error("${msg}")end
  rawset(_G,"${varName}2",true)
end
${envCheck}()
`
    checks.push(check)
  }
  
  return checks.join('\n')
}

// Custom error handler (replaces pcall)
function getCustomErrorHandler() {
  const errorStack = genName('_es')
  const errorTrap = genName('_et')
  const errorVal = genName('_ev')
  const traceFunc = genName('_tf')
  
  return `
local ${errorStack}={}
local function ${errorTrap}(f)
  local ${errorVal}=nil
  local function ${traceFunc}(...)
    ${errorVal}={...}
    return ...
  end
  local ok,res=xpcall(f,${traceFunc})
  if not ok then
    table.insert(${errorStack},res)
    return false,res
  end
  return true,${errorVal}
end
`
}

// Abstract loadstring
function getLoadstringAbstraction() {
  const loadVar = genName('_ld')
  const execFunc = genName('_ex')
  const safeLoad = genName('_sl')
  
  return `
local ${loadVar}=loadstring or load
local function ${safeLoad}(code,name)
  local ${execFunc}=${loadVar}(code,name)
  if ${execFunc} then return ${execFunc}else return nil end
end
`
}

// Custom concatenation (replaces table.concat)
function getCustomConcat() {
  const concatFunc = genName('_cc')
  
  return `
local function ${concatFunc}(t,sep)
  sep=sep or ''
  local r=''
  for i=1,#t do
    r=r..tostring(t[i])
    if i<#t then r=r..sep end
  end
  return r
end
`
}

// Light math obfuscation
function lightMath(n) {
  if (Math.random() < 0.95) return n.toString()
  const a = Math.floor(Math.random() * 21) + 4
  const b = Math.floor(Math.random() * 7) + 2
  return `((${n}+${a}-${a})*${b}/${b})`
}

// VM with opaque predicates
function buildOpaqueVM(innerCode) {
  const handlerCount = Math.floor(Math.random() * 4) + 5
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
  const stateVar = genName('s')
  const predicateVar = genName('p')
  
  let out = `local ${DISPATCH}={} `
  
  for (let i = 0; i < handlers.length; i++) {
    const junkAssign = `local ${genName('v')}=${lightMath(Math.floor(Math.random()*1000))} `
    if (i === realIdx) {
      out += `${DISPATCH}[${lightMath(i+1)}]=function()${junkAssign}${innerCode}end `
    } else {
      out += `${DISPATCH}[${lightMath(i+1)}]=function()${junkAssign}end `
    }
  }
  
  // Opaque predicate: always evaluates to realIdx+1
  const opaqueCondition = `(${lightMath(realIdx+1)})`
  out += `local ${stateVar}=true `
  out += `while ${stateVar} do `
  out += `if ${opaqueCondition} then ${DISPATCH}[${lightMath(realIdx+1)}]()${stateVar}=false `
  out += `else break end end `
  
  return `do ${out} end`
}

// Nested VM with recursion
function buildNestedRecursiveVM(innerCode, depth = 0) {
  if (depth >= 3) return innerCode
  return buildOpaqueVM(buildNestedRecursiveVM(innerCode, depth + 1))
}

// Split payload into 20 parts with custom concat
function build20PartVMs(payload) {
  const partLength = Math.ceil(payload.length / 20)
  const parts = []
  
  for (let i = 0; i < 20; i++) {
    parts.push(payload.slice(i * partLength, (i + 1) * partLength))
  }

  const tableName = genName('_parts')
  const concatFunc = genName('_cc')
  let vmCode = `local ${tableName}={} `

  for (let i = 0; i < parts.length; i++) {
    const encoded = parts[i].length > 0 ? `"${base64Encode(parts[i])}"` : '""'
    const inner = `${tableName}[${lightMath(i+1)}]=${encoded}`
    vmCode += buildNestedRecursiveVM(inner, 0) + ' '
  }

  // Custom concatenation
  const combinedVar = genName('_combined')
  let combiner = `local ${combinedVar}={} `
  combiner += `for ${genName('_i')}=1,20 do ${combinedVar}[${genName('_i')}]=${tableName}[${genName('_i')}]end `
  combiner += `${tableName}=nil `

  // Decode base64 parts and combine
  const decodedPayload = genName('_dp')
  let decoder = `local ${decodedPayload}='' `
  decoder += `for ${genName('_i')}=1,#${combinedVar} do `
  decoder += `${decodedPayload}=${decodedPayload}.._b64d(${combinedVar}[${genName('_i')}]) `
  decoder += `end `

  return vmCode + ' ' + combiner + ' ' + getBase64Decoder() + ' ' + decoder + ' ' + decodedPayload
}

// Custom error execution (no pcall)
function wrapWithCustomError(code, payloadVar) {
  const errorHandler = genName('_eh')
  const executionFunc = genName('_ef')
  const statusVar = genName('_st')
  
  return `
local function ${errorHandler}(f)
  local ${statusVar}=false
  local ok=xpcall(f,function(e)
    ${statusVar}=true
  end)
  if not ${statusVar} then
    local ${executionFunc}=_sl(${payloadVar})
    if ${executionFunc} then ${executionFunc}()end
  end
end
${errorHandler}(function()
  ${code}
end)
`
}

// Final wrapper with anti-tamper and anti-env
function buildFinalWrapper(mainVM, payloadVar) {
  const antiTamper = generateAntiTamperChecks()
  const errorHandler = getCustomErrorHandler()
  const loadstringAbs = getLoadstringAbstraction()
  const customConcat = getCustomConcat()
  
  return `
${antiTamper}
${errorHandler}
${loadstringAbs}
${customConcat}
${mainVM}
${wrapWithCustomError('', payloadVar)}
`
}

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'
  
  usedNames.clear()
  
  let payload = ""
  const regex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const match = sourceCode.match(regex)
  
  if (match) {
    payload = match[1]
  } else {
    payload = sourceCode
  }

  const partVMs = build20PartVMs(payload)
  const payloadVar = genName('_payload')
  
  let result = `${HEADER}\n`
  result += `local ${payloadVar}=""\n`
  result += partVMs + '\n'
  result += buildFinalWrapper(buildNestedRecursiveVM(partVMs), payloadVar)
  
  // Minify: compact whitespace but preserve functionality
  result = result.replace(/\n\s*/g, ' ').replace(/\s+/g, ' ').trim()
  
  return result
}

module.exports = { obfuscate }
