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

function getLoadstringAbstraction() {
  const loadVar = genName('_ld')
  const execFunc = genName('_ex')
  const safeLoad = genName('_sl')
  
  return `local ${loadVar}=loadstring or load
local function ${safeLoad}(code,name)
  local ${execFunc}=${loadVar}(code,name)
  if ${execFunc} then return ${execFunc}()else return nil end
end
`
}

function splitIntoParts(content, numParts = 15) {
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
  let code = `local ${tableName}={}`
  
  for (let i = 0; i < parts.length; i++) {
    const encoded = parts[i].length > 0 ? `"${base64Encode(parts[i])}"` : '""'
    code += `;${tableName}[${i+1}]=${encoded}`
  }
  
  const decodedVar = genName('_decoded')
  code += `;local ${decodedVar}=""`
  code += `;for ${genName('_i')}=1,#${tableName} do ${decodedVar}=${decodedVar}.._b64d(${tableName}[${genName('_i')}])end`
  
  code += `;${targetVar}=${decodedVar}`
  
  return code
}

function generateAntiTamper() {
  const checks = [
    'if rawget(_G,"_check1")then return end rawset(_G,"_check1",true)',
    'if rawget(_G,"_check2")then return end rawset(_G,"_check2",true)',
    'if rawget(_G,"_check3")then return end rawset(_G,"_check3",true)',
  ]
  
  let code = ''
  for (let check of checks) {
    code += `;${check}`
  }
  return code
}

function buildUrlExecutor(urlVar) {
  const execVar = genName('_url_exec')
  return `;local function ${execVar}() local _response=game:HttpGet(${urlVar}) if _response then _sl(_response)end end;${execVar}()`
}

function buildDirectExecutor(codeVar) {
  const execVar = genName('_code_exec')
  return `;local function ${execVar}() _sl(${codeVar})end;${execVar}()`
}

function obfuscate(sourceCode) {
  if (!sourceCode || typeof sourceCode !== 'string') {
    throw new Error('Source code must be a non-empty string')
  }
  
  usedNames.clear()
  
  let result = HEADER + '\n'
  result += getBase64Decoder() + '\n'
  result += getLoadstringAbstraction() + '\n'
  
  // Detectar tipo de código
  const urlRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const urlMatch = sourceCode.match(urlRegex)
  
  const targetVar = genName('_target')
  
  if (urlMatch) {
    const url = urlMatch[1]
    result += buildBase64Parts(url, targetVar) + '\n'
    result += generateAntiTamper() + '\n'
    result += buildUrlExecutor(targetVar) + '\n'
  } else {
    // Es código directo
    result += buildBase64Parts(sourceCode, targetVar) + '\n'
    result += generateAntiTamper() + '\n'
    result += buildDirectExecutor(targetVar) + '\n'
  }
  
  // Limpiar espacios excesivos pero mantener estructura válida
  result = result.split('\n').map(line => line.trim()).filter(line => line.length > 0).join(';')
  result = result.replace(/;+/g, ';').trim()
  
  return result
}

module.exports = { obfuscate }
