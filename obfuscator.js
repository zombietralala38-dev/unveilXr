const HEADER = `--[[ Protected by unveilX | https://discord.gg/DU35Mhyhq ]]`
const usedNames = new Set()

function genName(prefix = '') {
  let name
  do {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'
    name = prefix
    const len = 8 + Math.floor(Math.random() * 12)
    for (let i = 0; i < len; i++) name += chars[Math.floor(Math.random() * chars.length)]
    name += Math.floor(Math.random() * 999999)
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

function generateMathCode() {
  const operations = ['876+542-123*2/3','999*888/777+666-555','1234+5678*9/10-11','456*789+123-456*789','2048+1024-512*2','9876-5432+1234/2','111*222+333-444/2','555+666*777/888','100+200*300/400','7777-6666+5555*2','123456+789012-345678','987654*321/246','111111+222222-333333','444444*555/666','777777-888+999']
  let code = ''
  for (let i = 0; i < 40; i++) {
    const op = operations[Math.floor(Math.random() * operations.length)]
    const var1 = genName('_m')
    code += `local ${var1}=${op} `
  }
  return code
}

function generateBase64Decoder() {
  return `local function _b64d(s) local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/' local t={} for i=1,#b do t[b:sub(i,i)]=i-1 end local r='' local j=1 while j<=#s do local c1,c2,c3,c4=s:sub(j,j):byte()or 0,s:sub(j+1,j+1):byte()or 0,s:sub(j+2,j+2):byte()or 0,s:sub(j+3,j+3):byte()or 0 if c1>0 then c1=t[string.char(c1)]or 0 end if c2>0 then c2=t[string.char(c2)]or 0 end if c3>0 then c3=t[string.char(c3)]or 0 end if c4>0 then c4=t[string.char(c4)]or 0 end local v=(c1*64+c2)*64+c3 r=r..string.char(bit.rshift(v,16)) if j+2<=#s and s:sub(j+3,j+3)~='=' then r=r..string.char(bit.band(bit.rshift(v,8),255)) end if j+3<=#s and s:sub(j+4,j+4)~='=' then r=r..string.char(bit.band(v,255)) end j=j+4 end return r end`
}

function generateAntiDebug() {
  const names = [genName('_ahg'),genName('_agf'),genName('_adi'),genName('_atr'),genName('_ahf'),genName('_asf'),genName('_anc'),genName('_arc')]
  return `local ${names[0]}=game.HttpGet game.HttpGet=function(u) if type(u)~="string" then return "" end return ${names[0]}(u) end local ${names[1]}=getfenv if ${names[1]} then function getfenv(l) return {} end end local ${names[2]}=debug.getinfo if ${names[2]} then function debug.getinfo() return {} end end local ${names[3]}=debug.traceback if ${names[3]} then function debug.traceback() return "" end end local ${names[4]}=hookfunction if ${names[4]} then hookfunction=function() return nil end end local ${names[5]}=setfenv if ${names[5]} then function setfenv() return nil end end local ${names[6]}=newcclosure if ${names[6]} then newcclosure=function() return nil end end local ${names[7]}=replaceclosure if ${names[7]} then replaceclosure=function() return nil end end`
}

function generateAntiLogger() {
  const names = [genName('_p'),genName('_w'),genName('_e'),genName('_pc'),genName('_sg'),genName('_dt'),genName('_di')]
  return `local ${names[0]}=print print=function(...) return nil end local ${names[1]}=warn if warn then warn=function(...) return nil end end local ${names[2]}=error error=function(...) return nil end local ${names[3]}=pcall pcall=function(f,...) local ok=pcall(f,...) return ok end local ${names[4]}=string.gmatch string.gmatch=function() return function() return nil end end local ${names[5]}=debug.traceback debug.traceback=function() return "" end local ${names[6]}=debug.getinfo debug.getinfo=function() return {} end`
}

function generateAntiEnv() {
  const names = [genName('_gmt'),genName('_smt'),genName('_rg'),genName('_rs'),genName('_rl'),genName('_next'),genName('_pairs'),genName('_ipairs'),genName('_type')]
  return `local ${names[0]}=getmetatable getmetatable=function() return {} end local ${names[1]}=setmetatable setmetatable=function() return nil end local ${names[2]}=rawget rawget=function() return nil end local ${names[3]}=rawset rawset=function() return nil end local ${names[4]}=rawlen if ${names[4]} then rawlen=function() return 0 end end local ${names[5]}=next next=function() return nil end local ${names[6]}=pairs pairs=function() return function() return nil end end local ${names[7]}=ipairs ipairs=function() return function() return nil end end local ${names[8]}=type type=function() return "unknown" end`
}

function generateComplexMath() {
  const vars = []
  for (let i = 0; i < 50; i++) {
    const v1 = Math.floor(Math.random() * 99999)
    const v2 = Math.floor(Math.random() * 99999)
    const v3 = Math.floor(Math.random() * 99999)
    const ops = ['+', '-', '*', '/', '%']
    const op1 = ops[Math.floor(Math.random() * ops.length)]
    const op2 = ops[Math.floor(Math.random() * ops.length)]
    const varName = genName('_calc')
    vars.push(`local ${varName}=${v1}${op1}${v2}${op2}${v3}`)
  }
  return vars.join(' ')
}

function splitIntoParts(content, numParts = 35) {
  const partLength = Math.ceil(content.length / numParts)
  const parts = []
  for (let i = 0; i < numParts; i++) {
    parts.push(content.slice(i * partLength, (i + 1) * partLength))
  }
  return parts
}

function buildBase64Table(content, targetVar) {
  const parts = splitIntoParts(content, 40)
  const tableName = genName('_ptab')
  let code = `local ${tableName}={} `
  
  for (let i = 0; i < parts.length; i++) {
    const encoded = `"${base64Encode(parts[i])}"`
    code += `${tableName}[${i}]=${encoded} `
  }
  
  const loopVar = genName('_loop')
  code += `local ${targetVar}="" for ${loopVar}=0,${parts.length-1} do ${targetVar}=${targetVar}.._b64d(${tableName}[${loopVar}]) end `
  
  return code
}

function generateLoadstringMask(codeVar) {
  const m1 = genName('_m1')
  const m2 = genName('_m2')
  const m3 = genName('_m3')
  const execFunc = genName('_run')
  
  return `local ${m1}=(loadstring or load) local ${m2}=${m1}(${codeVar}) local function ${m3}() if ${m2} then return ${m2}() end end local function ${execFunc}() ${m3}() end ${execFunc}()`
}

function obfuscate(sourceCode) {
  if (!sourceCode || typeof sourceCode !== 'string') {
    throw new Error('Source code must be a non-empty string')
  }
  
  usedNames.clear()
  
  let result = HEADER + ' '
  result += generateMathCode() + ' '
  result += generateBase64Decoder() + ' '
  result += generateAntiDebug() + ' '
  result += generateAntiLogger() + ' '
  result += generateAntiEnv() + ' '
  result += generateComplexMath() + ' '
  
  const targetVar = genName('_target')
  result += buildBase64Table(sourceCode, targetVar) + ' '
  result += generateLoadstringMask(targetVar) + ' '
  
  for (let i = 0; i < 30; i++) {
    result += `local ${genName('_fake')}=${Math.floor(Math.random() * 9999999)} `
  }
  
  result = result.replace(/\s+/g, ' ').trim()
  
  return result
}

module.exports = { obfuscate }
