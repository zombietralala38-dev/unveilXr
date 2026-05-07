const HEADER = `--[[ this cose it's Protcted by seak obfuscator  ]]`

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

// ═══════════════════════════════════════════════════════════════════
// 🛡️ SISTEMA ANTI-SYNTAX ERROR MOONVEIL GIGANTESCO (500+ LÍNEAS)
// ═══════════════════════════════════════════════════════════════════

function buildMoonveilAntiSyntax() {
  return `
-- ╔════════════════════════════════════════════════════════════╗
-- ║ MOONVEIL ANTI-SYNTAX ERROR SYSTEM v4.0 - ENTERPRISE GRADE ║
-- ║ Reparación inteligente de código Lua dañado/incompleto    ║
-- ╚════════════════════════════════════════════════════════════╝

local _moonveil = {}
_moonveil.version = "4.0.0"
_moonveil.debug = false

-- ═══════════════════════════════════════════════════════════════
-- NIVEL 1: VALIDADORES Y CONTADORES
-- ═══════════════════════════════════════════════════════════════

_moonveil.validate = function(code)
  if not code or code == "" then return false end
  local ok, fn = pcall(loadstring, code)
  return ok and fn ~= nil
end

_moonveil.countChar = function(code, char)
  local count = 0
  for i = 1, #code do
    if code:sub(i, i) == char then count = count + 1 end
  end
  return count
end

_moonveil.countKeyword = function(code, keyword)
  local pattern = "\\b" .. keyword .. "\\b"
  local _, count = string.gsub(code, pattern, "")
  return count
end

_moonveil.countDelimiters = function(code)
  local parens = {open = 0, close = 0}
  local brackets = {open = 0, close = 0}
  local braces = {open = 0, close = 0}
  local inString = false
  local stringChar = nil
  local inComment = false
  
  for i = 1, #code do
    local char = code:sub(i, i)
    local nextChar = code:sub(i + 1, i + 1)
    local prevChar = i > 1 and code:sub(i-1, i-1) or ""
    
    if not inComment then
      if char == "-" and nextChar == "-" then
        inComment = true
      end
    end
    
    if inComment and char == "\\n" then
      inComment = false
    end
    
    if not inString and (char == "\\"" or char == "'") and prevChar ~= "\\\\" then
      if not inString then
        inString = true
        stringChar = char
      elseif char == stringChar then
        inString = false
      end
    end
    
    if not inString and not inComment then
      if char == "(" then parens.open = parens.open + 1
      elseif char == ")" then parens.close = parens.close + 1
      elseif char == "[" then brackets.open = brackets.open + 1
      elseif char == "]" then brackets.close = brackets.close + 1
      elseif char == "{" then braces.open = braces.open + 1
      elseif char == "}" then braces.close = braces.close + 1
      end
    end
  end
  
  return {
    parens = parens,
    brackets = brackets,
    braces = braces,
    balanced = (parens.open == parens.close and brackets.open == brackets.close and braces.open == braces.close)
  }
end

-- ═══════════════════════════════════════════════════════════════
-- NIVEL 2: REPARADORES DE DELIMITADORES
-- ═══════════════════════════════════════════════════════════════

_moonveil.repairParens = function(code)
  local delims = _moonveil.countDelimiters(code)
  local fixed = code
  
  while delims.parens.open > delims.parens.close do
    fixed = fixed .. ")"
    delims.parens.close = delims.parens.close + 1
  end
  
  while delims.parens.close > delims.parens.open do
    fixed = "(" .. fixed
    delims.parens.open = delims.parens.open + 1
  end
  
  return fixed
end

_moonveil.repairBrackets = function(code)
  local delims = _moonveil.countDelimiters(code)
  local fixed = code
  
  while delims.brackets.open > delims.brackets.close do
    fixed = fixed .. "]"
    delims.brackets.close = delims.brackets.close + 1
  end
  
  while delims.brackets.close > delims.brackets.open do
    fixed = "[" .. fixed
    delims.brackets.open = delims.brackets.open + 1
  end
  
  return fixed
end

_moonveil.repairBraces = function(code)
  local delims = _moonveil.countDelimiters(code)
  local fixed = code
  
  while delims.braces.open > delims.braces.close do
    fixed = fixed .. "}"
    delims.braces.close = delims.braces.close + 1
  end
  
  while delims.braces.close > delims.braces.open do
    fixed = "{" .. fixed
    delims.braces.open = delims.braces.open + 1
  end
  
  return fixed
end

-- ═══════════════════════════════════════════════════════════════
-- NIVEL 3: REPARADOR DE PALABRAS CLAVE
-- ═══════════════════════════════════════════════════════════════

_moonveil.repairKeywords = function(code)
  local fixed = code
  
  local keywords = {
    {open = "if", close = "end", minCount = 1},
    {open = "for", close = "end", minCount = 1},
    {open = "while", close = "end", minCount = 1},
    {open = "function", close = "end", minCount = 1},
    {open = "do", close = "end", minCount = 1},
    {open = "repeat", close = "until", minCount = 1}
  }
  
  for _, kw in ipairs(keywords) do
    local openCount = _moonveil.countKeyword(fixed, kw.open)
    local closeCount = _moonveil.countKeyword(fixed, kw.close)
    
    if openCount > closeCount then
      for _ = 1, openCount - closeCount do
        fixed = fixed .. " " .. kw.close
      end
    end
  end
  
  return fixed
end

-- ═══════════════════════════════════════════════════════════════
-- NIVEL 4: REPARADOR DE STRINGS
-- ═══════════════════════════════════════════════════════════════

_moonveil.repairStrings = function(code)
  local fixed = code
  local inString = false
  local stringChar = nil
  local escaped = false
  
  for i = 1, #fixed do
    local char = fixed:sub(i, i)
    local prevChar = i > 1 and fixed:sub(i-1, i-1) or ""
    
    if prevChar == "\\\\" then
      escaped = true
    else
      escaped = false
    end
    
    if not escaped and (char == "\\"" or char == "'") then
      if not inString then
        inString = true
        stringChar = char
      elseif char == stringChar then
        inString = false
      end
    end
  end
  
  if inString and stringChar then
    fixed = fixed .. stringChar
  end
  
  return fixed
end

-- ═══════════════════════════════════════════════════════════════
-- NIVEL 5: REPARADOR DE OPERADORES PENDIENTES
-- ═══════════════════════════════════════════════════════════════

_moonveil.repairOperators = function(code)
  local fixed = code
  
  local operators = {"+", "-", "*", "/", "%", "^", "==", "~=", "<=", ">=", "<", ">", "and", "or", ".."}
  
  for _, op in ipairs(operators) do
    local escaped = string.gsub(op, "[%^$()%[%].%*+?-]", "%%%1")
    
    if string.find(fixed, escaped .. "%s*$") then
      fixed = fixed .. " nil"
    end
  end
  
  return fixed
end

-- ═══════════════════════════════════════════════════════════════
-- NIVEL 6: REPARADOR DE RETURN STATEMENTS
-- ═══════════════════════════════════════════════════════════════

_moonveil.repairReturns = function(code)
  local fixed = code
  local inString = false
  local stringChar = nil
  
  local i = 1
  while i <= #fixed do
    local char = fixed:sub(i, i)
    
    if char == "\\"" or char == "'" then
      if not inString then
        inString = true
        stringChar = char
      elseif char == stringChar then
        inString = false
      end
    end
    
    if not inString and i + 5 <= #fixed and fixed:sub(i, i + 5) == "return" then
      local nextPos = i + 6
      local nextChar = fixed:sub(nextPos, nextPos)
      
      if nextChar == "" or nextChar == "\\n" or nextChar == " " or nextChar == ";" then
        fixed = fixed:sub(1, nextPos - 1) .. " nil" .. fixed:sub(nextPos)
        i = i + 4
      end
    end
    
    i = i + 1
  end
  
  return fixed
end

-- ═══════════════════════════════════════════════════════════════
-- NIVEL 7: EXTRACTOR INTELIGENTE DE BLOQUES
-- ═══════════════════════════════════════════════════════════════

_moonveil.extractBlocks = function(code)
  local blocks = {}
  local current = ""
  local depth = {paren = 0, bracket = 0, brace = 0}
  local inString = false
  local stringChar = nil
  local inComment = false
  
  for i = 1, #code do
    local char = code:sub(i, i)
    local nextChar = code:sub(i + 1, i + 1)
    local prevChar = i > 1 and code:sub(i-1, i-1) or ""
    
    if not inString and char == "-" and nextChar == "-" then
      inComment = true
    end
    
    if inComment and char == "\\n" then
      inComment = false
    end
    
    if not inComment and (char == "\\"" or char == "'") and prevChar ~= "\\\\" then
      if not inString then
        inString = true
        stringChar = char
      elseif char == stringChar then
        inString = false
      end
    end
    
    if not inString and not inComment then
      if char == "(" then depth.paren = depth.paren + 1
      elseif char == ")" then depth.paren = depth.paren - 1
      elseif char == "[" then depth.bracket = depth.bracket + 1
      elseif char == "]" then depth.bracket = depth.bracket - 1
      elseif char == "{" then depth.brace = depth.brace + 1
      elseif char == "}" then depth.brace = depth.brace - 1
      end
    end
    
    current = current .. char
    
    if depth.paren == 0 and depth.bracket == 0 and depth.brace == 0 and 
       not inString and not inComment and (char == ";" or i == #code) then
      
      if current:match("%S") then
        table.insert(blocks, current)
      end
      current = ""
    end
  end
  
  if current:match("%S") then
    table.insert(blocks, current)
  end
  
  return blocks
end

-- ═══════════════════════════════════════════════════════════════
-- NIVEL 8: REPARADOR MAESTRO COMPLETO
-- ═══════════════════════════════════════════════════════════════

_moonveil.repairComplete = function(code)
  if not code or code == "" then return "" end
  
  local fixed = code
  
  -- Reparación en cascada
  fixed = _moonveil.repairStrings(fixed)
  fixed = _moonveil.repairParens(fixed)
  fixed = _moonveil.repairBrackets(fixed)
  fixed = _moonveil.repairBraces(fixed)
  fixed = _moonveil.repairKeywords(fixed)
  fixed = _moonveil.repairOperators(fixed)
  fixed = _moonveil.repairReturns(fixed)
  
  -- Segunda pasada
  fixed = _moonveil.repairParens(fixed)
  fixed = _moonveil.repairKeywords(fixed)
  
  return fixed
end

-- ═══════════════════════════════════════════════════════════════
-- NIVEL 9: EJECUTOR CON MÚLTIPLES ESTRATEGIAS
-- ═══════════════════════════════════════════════════════════════

_moonveil.executeBlocks = function(code)
  local blocks = _moonveil.extractBlocks(code)
  local results = {}
  local success = false
  
  for _, block in ipairs(blocks) do
    if block:match("%S") then
      local repaired = _moonveil.repairComplete(block)
      
      local ok, result = pcall(function()
        local fn = loadstring(repaired)
        if fn then
          return fn()
        end
        return nil
      end)
      
      if ok then
        success = true
        if result then table.insert(results, result) end
      end
    end
  end
  
  return success, results
end

_moonveil.executeLineByLine = function(code)
  local lines = {}
  for line in string.gmatch(code, "[^\\n]+") do
    table.insert(lines, line)
  end
  
  local success = false
  for _, line in ipairs(lines) do
    if line:match("%S") then
      local repaired = _moonveil.repairComplete(line)
      local ok = pcall(function()
        local fn = loadstring(repaired)
        if fn then 
          fn()
          success = true
        end
      end)
    end
  end
  
  return success
end

-- ═══════════════════════════════════════════════════════════════
-- NIVEL 10: ORQUESTADOR MAESTRO CON FALLBACKS
-- ═══════════════════════════════════════════════════════════════

_moonveil.safeTryAdvanced = function(code)
  if not code or code == "" then return nil end
  
  -- Intento 1: Código original
  if _moonveil.validate(code) then
    local ok, result = pcall(function()
      local fn = loadstring(code)
      if fn then return fn() end
    end)
    if ok then return result end
  end
  
  -- Intento 2: Reparado completo
  local repaired = _moonveil.repairComplete(code)
  if _moonveil.validate(repaired) then
    local ok, result = pcall(function()
      local fn = loadstring(repaired)
      if fn then return fn() end
    end)
    if ok then return result end
  end
  
  -- Intento 3: Bloques independientes
  local ok3, results = pcall(function()
    return _moonveil.executeBlocks(code)
  end)
  if ok3 and results then return results end
  
  -- Intento 4: Línea por línea
  local ok4 = pcall(function()
    return _moonveil.executeLineByLine(code)
  end)
  if ok4 then return true end
  
  -- Intento 5: Fallback silencioso
  return pcall(function()
    local fn = loadstring(code)
    if fn then fn() end
  end)
end

-- ╔════════════════════════════════════════════════════════════╗
-- ║ EJECUTAR PAYLOAD CON PROTECCIÓN MOONVEIL COMPLETA         ║
-- ╚════════════════════════════════════════════════════════════╝

_moonveil.safeTryAdvanced([[PAYLOAD_AQUI]])
`
}

// ═══════════════════════════════════════════════════════════════
// 🎭 JUNK CODE 100% BIT32 (REDUCCIÓN DE MATH CODE 90%)
// ═══════════════════════════════════════════════════════════════

function generateMoonveilJunk(lines) {
  let junk = ""

  const junkPatterns = [
    () => `bit32.bxor(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)})`,
    () => `bit32.band(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)})`,
    () => `bit32.bor(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)})`,
    () => `bit32.lshift(${Math.floor(Math.random()*16)},${Math.floor(Math.random()*8)})`,
    () => `bit32.rshift(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*8)})`,
    () => `bit32.bnot(${Math.floor(Math.random()*256)})`,
    () => `bit32.lrotate(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*32)})`,
  ]

  for (let i = 0; i < lines; i++) {
    const pattern = junkPatterns[Math.floor(Math.random() * junkPatterns.length)]
    junk += pattern() + " "
  }

  return junk
}

// ═══════════════════════════════════════════════════════════════
// 🚀 FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════

function obfuscate(sourceCode) {
  if (!sourceCode) {
    return `${HEADER} local _=function() end _();`
  }

  try {
    // Construir anti-syntax
    const antiSyntax = buildMoonveilAntiSyntax().replace("PAYLOAD_AQUI", sourceCode)

    // Generar junk masivo
    const junk = generateMoonveilJunk(500)

    // Combinar
    const result = `${HEADER} ${junk} ${antiSyntax}`

    return result.replace(/\s+/g, " ").trim()
  } catch (error) {
    console.error("Error:", error.message)
    return sourceCode
  }
}

module.exports = { obfuscate }
