const HEADER = `--[[ this code its protect by seaker and love ]]`

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
    if j+3<=#s and s:sub(j+4,j+4)~='=' then r=r..string.char(bit.band(v,255))end
    j=j+4
  end
  return r
end`
}

// VM anidada personalizada que reconstruye un mensaje a partir de fragmentos
function buildMessageVM(message, depth = 0) {
  if (depth >= 2) {
    // Caso base: devuelve un fragmento del mensaje
    const fragment = message.substring(0, 5)
    return `"${fragment}"`
  }
  
  const vmFunc = genName('_msg')
  const part1 = message.substring(0, Math.floor(message.length / 2))
  const part2 = message.substring(Math.floor(message.length / 2))
  
  return `(function()
    local ${vmFunc} = function()
      return ${buildMessageVM(part1, depth + 1)} .. ${buildMessageVM(part2, depth + 1)}
    end
    return ${vmFunc}()
  end)()`
}

// Anti-tamper SIN Base64 usando VMs anidadas para los mensajes
function generateVMProtectedAntiTamper() {
  const messages = [
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
  
  let code = ''
  
  for (let i = 0; i < 50; i++) {
    const msg = messages[i % messages.length]
    const varName = genName('_at')
    const checkVar = genName('_ck')
    const envVar = genName('_env')
    
    // El mensaje se reconstruye con VM anidada
    const messageExpr = buildMessageVM(msg, 0)
    
    code += `
local ${varName} = ${messageExpr}
local ${checkVar} = (${varName} ~= "")
if not ${checkVar} then return end
if rawget(_G, ${varName}) then return end
rawset(_G, ${varName}, true)
`
  }
  
  return code
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
    // SIN MATH CODE
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

function buildUrlExecutor(urlVar) {
  const execFunc = genName('_exec')
  return `
local function ${execFunc}()
  local _url = ${urlVar}
  local _response = game:HttpGet(_url)
  if _response then
    local _fn = _sl(_response)
    if _fn then _fn() end
  end
end
${execFunc}()
`
}

function buildDirectExecutor(codeVar) {
  const execFunc = genName('_exec')
  return `
local function ${execFunc}()
  local _fn = _sl(${codeVar})
  if _fn then _fn() end
end
${execFunc}()
`
}

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'
  
  usedNames.clear()
  
  let result = HEADER + '\n'
  result += getBase64Decoder() + '\n'
  
  const urlRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const loadstringRegex = /loadstring\s*\(\s*["'](.+?)["']\s*\)\s*\(\s*\)/i
  const urlMatch = sourceCode.match(urlRegex)
  const loadstringMatch = sourceCode.match(loadstringRegex)
  
  const targetVar = genName('_target')
  
  if (urlMatch) {
    const url = urlMatch[1]
    result += buildBase64Parts(url, targetVar) + '\n'
    result += generateVMProtectedAntiTamper() + '\n'
    result += getLoadstringAbstraction() + '\n'
    result += buildUrlExecutor(targetVar) + '\n'
  } else if (loadstringMatch) {
    const code = loadstringMatch[1]
    result += buildBase64Parts(code, targetVar) + '\n'
    result += generateVMProtectedAntiTamper() + '\n'
    result += getLoadstringAbstraction() + '\n'
    result += buildDirectExecutor(targetVar) + '\n'
  } else {
    result += buildBase64Parts(sourceCode, targetVar) + '\n'
    result += generateVMProtectedAntiTamper() + '\n'
    result += getLoadstringAbstraction() + '\n'
    result += buildDirectExecutor(targetVar) + '\n'
  }
  
  result = result.replace(/\n\s*/g, ' ').replace(/\s+/g, ' ').trim()
  return result
}

module.exports = { obfuscate }
