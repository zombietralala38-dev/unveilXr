const HEADER = `--[[ thsi codr it's protected by Seak obfuscator ]]`

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
    if j+3<=#s and s:sub(j+4,j+4)~='=' then r=r..string.char(bit.band(bit.rshift(v,255))end
    j=j+4
  end
  return r
end`
}

function generateAntiTamperChecks() {
  const checks = []
  const antiMessages = [
    'I really like Rick and Morty',
    'I really enjoy Rick and Morty',
    'I truly love Rick and Morty',
    'I absolutely adore Rick and Morty',
    'Rick and Morty is amazing',
  ]
  
  for (let i = 0; i < 50; i++) {
    const msg = antiMessages[i % antiMessages.length]
    const varName = genName('_at')
    const hashVar = genName('_h')
    const checkVar = genName('_ck')
    const recursiveFunc = genName('_rec')
    const envCheck = genName('_env')
    const customError = genName('_err')
    
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

function splitIntoParts(content, numParts = 20) {
  const partLength = Math.ceil(content.length / numParts)
  const parts = []
  for (let i = 0; i < numParts; i++) {
    parts.push(content.slice(i * partLength, (i + 1) * partLength))
  }
  return parts
}

function buildBase64Parts(content, targetVar) {
  const parts = splitIntoParts(content)
  const tableName = genName('_parts')
  let code = `local ${tableName}={} `
  
  for (let i = 0; i < parts.length; i++) {
    const encoded = parts[i].length > 0 ? `"${base64Encode(parts[i])}"` : '""'
    code += `${tableName}[${i+1}]=${encoded} `
  }
  
  const combinedVar = genName('_combined')
  code += `local ${combinedVar}={} `
  code += `for ${genName('_i')}=1,${parts.length} do ${combinedVar}[${genName('_i')}]=${tableName}[${genName('_i')}] end `
  code += `${tableName}=nil `
  
  code += `local ${targetVar}='' `
  code += `for ${genName('_i')}=1,#${combinedVar} do `
  code += `${targetVar}=${targetVar}.._b64d(${combinedVar}[${genName('_i')}]) `
  code += `end `
  
  return code
}

// Para URLs: descarga y ejecuta
function buildUrlExecutor(urlVar) {
  const execFunc = genName('_exec')
  return `
local function ${execFunc}()
  local _url = ${urlVar}
  local _response = game:HttpGet(_url)
  if _response then
    local _fn = _sl(_response, "@" .. _url)
    if _fn then _fn() end
  end
end
${execFunc}()
`
}

// Para código directo: lo ejecuta con pcall ofuscado
function buildDirectExecutor(codeVar) {
  const execFunc = genName('_exec')
  const statusVar = genName('_st')
  const resultVar = genName('_res')
  
  return `
local function ${execFunc}()
  local ${statusVar}, ${resultVar} = pcall(function()
    local _fn = _sl(${codeVar})
    if _fn then _fn() end
  end)
  if not ${statusVar} then
    local _fn = _sl(${codeVar})
    if _fn then _fn() end
  end
end
${execFunc}()
`
}

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'
  
  usedNames.clear()
  
  let result = HEADER + '\n'
  result += getBase64Decoder() + '\n'
  
  // Detectar tipo de entrada
  const urlRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const loadstringRegex = /loadstring\s*\(\s*["'](.+?)["']\s*\)\s*\(\s*\)/i
  const urlMatch = sourceCode.match(urlRegex)
  const loadstringMatch = sourceCode.match(loadstringRegex)
  
  const targetVar = genName('_target')
  
  if (urlMatch) {
    // ES UNA URL - ofuscarla y usar HTTP
    const url = urlMatch[1]
    result += buildBase64Parts(url, targetVar) + '\n'
    result += generateAntiTamperChecks() + '\n'
    result += getLoadstringAbstraction() + '\n'
    result += buildUrlExecutor(targetVar) + '\n'
    
  } else if (loadstringMatch) {
    // ES UN LOADSTRING - extraer código y ofuscarlo directo
    const code = loadstringMatch[1]
    result += buildBase64Parts(code, targetVar) + '\n'
    result += generateAntiTamperChecks() + '\n'
    result += getLoadstringAbstraction() + '\n'
    result += buildDirectExecutor(targetVar) + '\n'
    
  } else {
    // ES CÓDIGO NORMAL - ofuscarlo directamente
    result += buildBase64Parts(sourceCode, targetVar) + '\n'
    result += generateAntiTamperChecks() + '\n'
    result += getLoadstringAbstraction() + '\n'
    result += buildDirectExecutor(targetVar) + '\n'
  }
  
  result = result.replace(/\n\s*/g, ' ').replace(/\s+/g, ' ').trim()
  return result
}

module.exports = { obfuscate }
