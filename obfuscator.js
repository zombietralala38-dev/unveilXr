const HEADER = `--[[ Protected by unveilX | https://discord.gg/DU35Mhyhq ]]`
const usedNames = new Set()

function genName(prefix = '') {
  let name
  do {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'
    name = prefix
    const len = 10 + Math.floor(Math.random() * 15)
    for (let i = 0; i < len; i++) name += chars[Math.floor(Math.random() * chars.length)]
    name += Math.floor(Math.random() * 9999999)
  } while (usedNames.has(name))
  usedNames.add(name)
  return name
}

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

function generateBase64Decoder() {
  return `local function ${genName('_b64')}_b64d(s) local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/' local t={} for i=1,#b do t[b:sub(i,i)]=i-1 end local r='' local j=1 while j<=#s do local c1,c2,c3,c4=s:sub(j,j):byte()or 0,s:sub(j+1,j+1):byte()or 0,s:sub(j+2,j+2):byte()or 0,s:sub(j+3,j+3):byte()or 0 if c1>0 then c1=t[string.char(c1)]or 0 end if c2>0 then c2=t[string.char(c2)]or 0 end if c3>0 then c3=t[string.char(c3)]or 0 end if c4>0 then c4=t[string.char(c4)]or 0 end local v=(c1*64+c2)*64+c3 r=r..string.char(bit.rshift(v,16)) if j+2<=#s and s:sub(j+3,j+3)~='=' then r=r..string.char(bit.band(bit.rshift(v,8),255)) end if j+3<=#s and s:sub(j+4,j+4)~='=' then r=r..string.char(bit.band(v,255)) end j=j+4 end return r end local function ${genName('_b64')}_b64d(s) return _b64d(s) end`
}

function generateMathCode(amount = 60) {
  let code = ''
  const ops = ['876+542-123*2/3','999*888/777+666-555','1234+5678*9/10-11','456*789+123-456*789','2048+1024-512*2','9876-5432+1234/2','111*222+333-444/2','555+666*777/888','100+200*300/400','7777-6666+5555*2','123456+789012-345678','987654*321/246','111111+222222-333333','444444*555/666','777777-888+999']
  for (let i = 0; i < amount; i++) {
    const op = ops[Math.floor(Math.random() * ops.length)]
    code += `local ${genName('_m')}=${op} `
  }
  return code
}

function generateRickMortyAntiEnv() {
  const messages = [
    'I really like Rick and Morty','I really enjoy Rick and Morty','I truly love Rick and Morty','I absolutely adore Rick and Morty','Rick and Morty is amazing',
    'I think Rick and Morty rocks','Rick and Morty is incredible','I cannot stop watching Rick and Morty','Rick and Morty changed my life','I recommend Rick and Morty to everyone',
    'I really like Rick and Morty','Rick and Morty is the best','I love Rick and Morty so much','Rick and Morty is awesome','My favorite show is Rick and Morty'
  ]
  
  let code = ''
  for (let i = 0; i < 20; i++) {
    const msg = messages[i % messages.length]
    const encoded = base64Encode(msg)
    const var1 = genName('_rm')
    const var2 = genName('_check')
    code += `local ${var1}="...${encoded}..." local ${var2}=string.sub(${var1},1,1) if ${var2}~="" then local ${genName('_x')}=${genName('_y')} then break end end `
  }
  return code
}

function generateComplexAntiDebug() {
  let code = ''
  const antis = [
    `game.HttpGet=function(u) if type(u)~="string" then return "" end return game.HttpGet(u) end`,
    `function getfenv() return {} end`,
    `function debug.getinfo() return {} end`,
    `function debug.traceback() return "" end`,
    `function hookfunction() return nil end`,
    `function setfenv() return nil end`,
    `function newcclosure() return nil end`,
    `function replaceclosure() return nil end`,
    `function loadstring() return nil end`,
    `function pcall(f,...) return false end`,
    `function xpcall() return false end`,
    `print=function() end`,
    `warn=function() end`,
    `error=function() end`
  ]
  
  for (let i = 0; i < antis.length; i++) {
    const local_var = genName('_anti')
    code += `local ${local_var}=function() ${antis[i % antis.length]} if ${genName('_check')} then return end end if ${genName('_condition')} then break end `
  }
  return code
}

function generateDoubleEncoding(content) {
  let encoded = base64Encode(content)
  let double = base64Encode(encoded)
  let triple = base64Encode(double)
  return { single: encoded, double, triple }
}

function buildCompactBase64(content) {
  const { single, double, triple } = generateDoubleEncoding(content)
  
  const var1 = genName('_part')
  const var2 = genName('_part')
  const var3 = genName('_decode')
  const var4 = genName('_final')
  
  return `local ${var1}="${single}" local ${var2}="${double}" local ${var3}=_b64d(${var1}) local ${var4}=_b64d(${var3}) if ${var4}~="" then local ${genName('_exec')}=${var4} end`
}

function generateLoopAntiTamper() {
  let code = ''
  for (let i = 0; i < 10; i++) {
    const check = genName('_check')
    const flag = genName('_flag')
    code += `local ${check}=true if ${check} then local ${flag}=1 while ${flag}<100 do ${flag}=${flag}+1 if ${flag}>99 then break end end end `
  }
  return code
}

function generateFakeVariables(amount = 50) {
  let code = ''
  for (let i = 0; i < amount; i++) {
    const fakeName = genName('_fake')
    const fakeValue = Math.floor(Math.random() * 99999999)
    code += `local ${fakeName}=${fakeValue} `
  }
  return code
}

function obfuscate(sourceCode) {
  if (!sourceCode || typeof sourceCode !== 'string') {
    throw new Error('Source code must be a non-empty string')
  }
  
  usedNames.clear()
  
  let result = HEADER + ' '
  
  // Math code bloat
  result += generateMathCode(60) + ' '
  
  // Base64 decoder
  result += generateBase64Decoder() + ' '
  
  // Rick and Morty anti-env (20+)
  result += generateRickMortyAntiEnv() + ' '
  
  // Complex anti-debug
  result += generateComplexAntiDebug() + ' '
  
  // Loop anti-tamper
  result += generateLoopAntiTamper() + ' '
  
  // Encode payload
  result += buildCompactBase64(sourceCode) + ' '
  
  // More math
  result += generateMathCode(40) + ' '
  
  // Fake variables
  result += generateFakeVariables(50) + ' '
  
  // Execution wrapper with proper termination
  const execVar = genName('_run')
  const condVar = genName('_cond')
  result += `local function ${execVar}() local ${condVar}=true if ${condVar} then local _code=${base64Encode(sourceCode)} if _code~="" then if loadstring then loadstring(_code)()end end end end ${execVar}() if true then break end `
  
  // Clean up
  result = result.replace(/\s+/g, ' ').trim()
  
  return result
}

module.exports = { obfuscate }
