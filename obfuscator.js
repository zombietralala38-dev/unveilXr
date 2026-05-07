const HEADER = `--[[ Protected by MOONVEIL OBFUSCATOR v4.0 ]]`

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

// ═══════════════════════════════════════════════════════════════
// 🚀 VM MACHINE EXACTAS 35KB
// ═══════════════════════════════════════════════════════════════

function buildVM35KB(payload) {
  const vmVar = genName()
  const keyVar = genName()
  const decVar = genName()
  const chunkSize = 1000
  
  let vmCode = `local ${vmVar}={}`
  let totalSize = vmCode.length
  const targetSize = 35 * 1024
  
  const key = Math.floor(Math.random() * 256)
  const encrypted = []
  
  for (let i = 0; i < payload.length; i++) {
    encrypted.push((payload.charCodeAt(i) ^ key) & 0xFF)
  }
  
  const encStr = encrypted.join(',')
  vmCode += `local ${keyVar}=${key}`
  vmCode += `local ${decVar}=''`
  
  let chunks = []
  for (let i = 0; i < encStr.length; i += chunkSize) {
    chunks.push(encStr.substring(i, i + chunkSize))
  }
  
  vmCode += `local _e={${encStr}}`
  vmCode += `for i=1,#_e do ${decVar}=${decVar}..string.char(bit32.bxor(_e[i],${keyVar}))end`
  vmCode += `loadstring(${decVar})()`
  
  totalSize = Buffer.byteLength(vmCode, 'utf8')
  
  if (totalSize < targetSize) {
    const paddingSize = targetSize - totalSize
    const paddingCode = generatePadding(paddingSize)
    vmCode = vmCode + paddingCode
  }
  
  return vmCode.substring(0, targetSize)
}

function generatePadding(size) {
  let padding = ""
  const paddingPatterns = [
    () => `local _p${genName()}=bit32.bxor(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)})`,
    () => `local _q${genName()}=bit32.band(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)})`,
    () => `local _r${genName()}=bit32.bor(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)})`,
  ]
  
  while (Buffer.byteLength(padding, 'utf8') < size) {
    const pattern = paddingPatterns[Math.floor(Math.random() * paddingPatterns.length)]
    padding += pattern() + " "
  }
  
  return padding.substring(0, size)
}

// ═══════════════════════════════════════════════════════════════
// 🛡️ ANTI-SYNTAX GIGANTESCO SIN COMENTARIOS
// ═══════════════════════════════════════════════════════════════

function buildGigantAntiSyntax() {
  const v1 = genName('_')
  const v2 = genName('_')
  const v3 = genName('_')
  const v4 = genName('_')
  const v5 = genName('_')
  const v6 = genName('_')
  const v7 = genName('_')
  const v8 = genName('_')
  const v9 = genName('_')
  const v10 = genName('_')
  const v11 = genName('_')
  const v12 = genName('_')
  const v13 = genName('_')
  const v14 = genName('_')
  const v15 = genName('_')

  return `
local ${v1}={}
${v1}.validate=function(code)if not code or code==""then return false end local ok,fn=pcall(loadstring,code)return ok and fn~=nil end
${v1}.countDelimiters=function(code)local parens={open=0,close=0}local brackets={open=0,close=0}local braces={open=0,close=0}local inString=false local stringChar=nil local inComment=false for i=1,#code do local char=code:sub(i,i)local nextChar=code:sub(i+1,i+1)local prevChar=i>1 and code:sub(i-1,i-1)or""if not inComment then if char=="-"and nextChar=="-"then inComment=true end end if inComment and char=="\\n"then inComment=false end if not inString and(char=="\\"or char=="'")and prevChar~="\\\\"then if not inString then inString=true stringChar=char elseif char==stringChar then inString=false end end if not inString and not inComment then if char=="("then parens.open=parens.open+1 elseif char==")"then parens.close=parens.close+1 elseif char=="["then brackets.open=brackets.open+1 elseif char=="]"then brackets.close=brackets.close+1 elseif char=="{"then braces.open=braces.open+1 elseif char=="}"then braces.close=braces.close+1 end end end return{parens=parens,brackets=brackets,braces=braces,balanced=(parens.open==parens.close and brackets.open==brackets.close and braces.open==braces.close)}end
${v1}.repairParens=function(code)local delims=${v1}.countDelimiters(code)local fixed=code while delims.parens.open>delims.parens.close do fixed=fixed..")"delims.parens.close=delims.parens.close+1 end while delims.parens.close>delims.parens.open do fixed="("..fixed delims.parens.open=delims.parens.open+1 end return fixed end
${v1}.repairBrackets=function(code)local delims=${v1}.countDelimiters(code)local fixed=code while delims.brackets.open>delims.brackets.close do fixed=fixed.."]"delims.brackets.close=delims.brackets.close+1 end while delims.brackets.close>delims.brackets.open do fixed="["..fixed delims.brackets.open=delims.brackets.open+1 end return fixed end
${v1}.repairBraces=function(code)local delims=${v1}.countDelimiters(code)local fixed=code while delims.braces.open>delims.braces.close do fixed=fixed.."}"delims.braces.close=delims.braces.close+1 end while delims.braces.close>delims.braces.open do fixed="{"..fixed delims.braces.open=delims.braces.open+1 end return fixed end
${v1}.repairKeywords=function(code)local fixed=code local keywords={if="end",for="end",while="end",["function"]="end",["do"]="end",repeat="until"}for open,close in pairs(keywords)do local openCount=select(2,string.gsub(fixed,"\\\\b"..open.."\\\\b",""))local closeCount=select(2,string.gsub(fixed,"\\\\b"..close.."\\\\b",""))if openCount>closeCount then for _=1,openCount-closeCount do fixed=fixed.." "..close end end end return fixed end
${v1}.repairStrings=function(code)local fixed=code local inString=false local stringChar=nil local escaped=false for i=1,#fixed do local char=fixed:sub(i,i)local prevChar=i>1 and fixed:sub(i-1,i-1)or""if prevChar=="\\\\"then escaped=true else escaped=false end if not escaped and(char=="\\"or char=="'")then if not inString then inString=true stringChar=char elseif char==stringChar then inString=false end end end if inString and stringChar then fixed=fixed..stringChar end return fixed end
${v1}.repairOperators=function(code)local fixed=code local operators={"+","-","*","/","%","^","==","~=","<=",">=","<",">","and","or",".."}for _,op in ipairs(operators)do local escaped=string.gsub(op,"[%^$()%[%].%*+?-]","%%%1")if string.find(fixed,escaped.."%s*$")then fixed=fixed.." nil"end end return fixed end
${v1}.repairReturns=function(code)local fixed=code local inString=false local stringChar=nil local i=1 while i<=#fixed do local char=fixed:sub(i,i)if char=="\\"or char=="'"then if not inString then inString=true stringChar=char elseif char==stringChar then inString=false end end if not inString and i+5<=#fixed and fixed:sub(i,i+5)=="return"then local nextPos=i+6 local nextChar=fixed:sub(nextPos,nextPos)if nextChar==""or nextChar=="\\n"or nextChar==" "or nextChar==";"then fixed=fixed:sub(1,nextPos-1).." nil"..fixed:sub(nextPos)i=i+4 end end i=i+1 end return fixed end
${v1}.repairComplete=function(code)if not code or code==""then return""end local fixed=code fixed=${v1}.repairStrings(fixed)fixed=${v1}.repairParens(fixed)fixed=${v1}.repairBrackets(fixed)fixed=${v1}.repairBraces(fixed)fixed=${v1}.repairKeywords(fixed)fixed=${v1}.repairOperators(fixed)fixed=${v1}.repairReturns(fixed)fixed=${v1}.repairParens(fixed)fixed=${v1}.repairKeywords(fixed)return fixed end
${v1}.executeBlocks=function(code)local blocks={}local current=""local depth={paren=0,bracket=0,brace=0}local inString=false local stringChar=nil local inComment=false for i=1,#code do local char=code:sub(i,i)local nextChar=code:sub(i+1,i+1)local prevChar=i>1 and code:sub(i-1,i-1)or""if not inString and char=="-"and nextChar=="-"then inComment=true end if inComment and char=="\\n"then inComment=false end if not inComment and(char=="\\"or char=="'")and prevChar~="\\\\"then if not inString then inString=true stringChar=char elseif char==stringChar then inString=false end end if not inString and not inComment then if char=="("then depth.paren=depth.paren+1 elseif char==")"then depth.paren=depth.paren-1 elseif char=="["then depth.bracket=depth.bracket+1 elseif char=="]"then depth.bracket=depth.bracket-1 elseif char=="{"then depth.brace=depth.brace+1 elseif char=="}"then depth.brace=depth.brace-1 end end current=current..char if depth.paren==0 and depth.bracket==0 and depth.brace==0 and not inString and not inComment and(char==";"or i==#code)then if current:match("%S")then table.insert(blocks,current)end current=""end end if current:match("%S")then table.insert(blocks,current)end local results={}local success=false for _,block in ipairs(blocks)do if block:match("%S")then local repaired=${v1}.repairComplete(block)local ok,result=pcall(function()local fn=loadstring(repaired)if fn then return fn()end return nil end)if ok then success=true if result then table.insert(results,result)end end end end return success,results end
${v1}.executeLineByLine=function(code)local lines={}for line in string.gmatch(code,"[^\\n]+")do table.insert(lines,line)end local success=false for _,line in ipairs(lines)do if line:match("%S")then local repaired=${v1}.repairComplete(line)local ok=pcall(function()local fn=loadstring(repaired)if fn then fn()success=true end end)end end return success end
${v1}.safeTryAdvanced=function(code)if not code or code==""then return nil end if ${v1}.validate(code)then local ok,result=pcall(function()local fn=loadstring(code)if fn then return fn()end end)if ok then return result end end local repaired=${v1}.repairComplete(code)if ${v1}.validate(repaired)then local ok,result=pcall(function()local fn=loadstring(repaired)if fn then return fn()end end)if ok then return result end end local ok3,results=pcall(function()return ${v1}.executeBlocks(code)end)if ok3 and results then return results end local ok4=pcall(function()return ${v1}.executeLineByLine(code)end)if ok4 then return true end return pcall(function()local fn=loadstring(code)if fn then fn()end end)end
`
}

// ═══════════════════════════════════════════════════════════════
// 🎭 JUNK CODE 100% BIT32 SILENCIOSO
// ═══════════════════════════════════════════════════════════════

function generateSilentJunk(lines) {
  let junk = ""

  const junkPatterns = [
    () => `bit32.bxor(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)})`,
    () => `bit32.band(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)})`,
    () => `bit32.bor(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)})`,
    () => `bit32.lshift(${Math.floor(Math.random()*16)},${Math.floor(Math.random()*8)})`,
    () => `bit32.rshift(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*8)})`,
    () => `bit32.bnot(${Math.floor(Math.random()*256)})`,
  ]

  for (let i = 0; i < lines; i++) {
    const pattern = junkPatterns[Math.floor(Math.random() * junkPatterns.length)]
    junk += pattern() + " "
  }

  return junk
}

// ═══════════════════════════════════════════════════════════════
// 🚀 FUNCIÓN PRINCIPAL - CÓDIGO AL INICIO OFUSCADO
// ═══════════════════════════════════════════════════════════════

function obfuscate(sourceCode) {
  if (!sourceCode) {
    return `${HEADER} local _=function() end _()`
  }

  try {
    const vm = buildVM35KB(sourceCode)
    const antiSyntax = buildGigantAntiSyntax()
    const junk = generateSilentJunk(5000)
    
    const result = `${HEADER} ${vm} ${junk} ${antiSyntax}`
    
    return result.replace(/\s+/g, " ").trim()
  } catch (error) {
    console.error("Error:", error.message)
    return sourceCode
  }
}

module.exports = { obfuscate }
