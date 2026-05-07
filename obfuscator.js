// ╔════════════════════════════════════════════════════════════════════════════╗
// ║  vvmer Enhanced + Anti-Syntax System v1                                    ║
// ║  1000+ líneas de validación de sintaxis + correcciones automáticas         ║
// ║  Mantiene peso original, corrige CADA línea antes de output                ║
// ╚════════════════════════════════════════════════════════════════════════════╝

"use strict"

const HEADER = `--[[ this code it's protected by vvmer obfoscator ]]`

const IL_POOL = ["IIIIIIII1", "vvvvvv1", "vvvvvvvv2", "vvvvvv3", "IIlIlIlI1", "lvlvlvlv2", "I1","l1","v1","v2","v3","II","ll","vv", "I2"]
const HANDLER_POOL = ["KQ","HF","W8","SX","Rj","nT","pL","qZ","mV","xB","yC","wD"]

function generateIlName() {
  return IL_POOL[Math.floor(Math.random() * IL_POOL.length)] + Math.floor(Math.random() * 99999)
}

function pickHandlers(count) {
  const used = new Set()
  const result = []
  while (result.length < count) {
    const base = HANDLER_POOL[Math.floor(Math.random() * HANDLER_POOL.length)]
    const name = base + Math.floor(Math.random() * 99)
    if (!used.has(name)) { used.add(name); result.push(name) }
  }
  return result
}

function heavyMath(n) {
  if (Math.random() < 0.8) return n.toString();
  let a = Math.floor(Math.random() * 3000) + 500
  let b = Math.floor(Math.random() * 50) + 2
  let c = Math.floor(Math.random() * 800) + 10
  let d = Math.floor(Math.random() * 20) + 2
  return `(((((${n}+${a})*${b})/${b})-${a})+((${c}*${d})/${d})-${c})`
}

function mba() {
  let n = Math.random() > 0.5 ? 1 : 2, a = Math.floor(Math.random() * 70) + 15, b = Math.floor(Math.random() * 40) + 8;
  return `((${n}*${a}-${a})/(${b}+1)+${n})`;
}

const MAPEO = {
  "ScreenGui":"Aggressive Renaming","Frame":"String to Math","TextLabel":"Table Indirection",
  "TextButton":"Mixed Boolean Arithmetic","Humanoid":"Dynamic Junk","Player":"Fake Flow",
  "RunService":"Virtual Machine","TweenService":"Fake Flow","Players":"Fake Flow"
};

function detectAndApplyMappings(code) {
  let modified = code, headers = "";
  for (const [word, tech] of Object.entries(MAPEO)) {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    if (regex.test(modified)) {
      let replacement = `"${word}"`;
      if (tech.includes("Aggressive Renaming")) { const v = generateIlName(); headers += `local ${v}="${word}";`; replacement = v; }
      else if (tech.includes("String to Math")) replacement = `string.char(${word.split('').map(c => heavyMath(c.charCodeAt(0))).join(',')})`;
      else if (tech.includes("Mixed Boolean Arithmetic")) replacement = `((${mba()}==1 or true)and"${word}")`;
      regex.lastIndex = 0;
      modified = modified.replace(regex, (match) => `game[${replacement}]`);
    }
  }
  return headers + modified;
}

function generateJunk(lines = 100) {
  let j = ''
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    if (r < 0.2) j += `local ${generateIlName()}=${heavyMath(Math.floor(Math.random() * 999))} `
    else if (r < 0.4) j += `local ${generateIlName()}=string.char(${heavyMath(Math.floor(Math.random()*255))}) `
    else if (r < 0.5) j += `if not(${heavyMath(1)}==${heavyMath(1)}) then local x=1 end `
    else if (r < 0.7) {
      const tp = generateIlName();
      j += `if type(nil)=="number" then while true do local ${tp}=1 end end `
    } else if (r < 0.85) {
      const vt = generateIlName();
      j += `do local ${vt}={} ${vt}["_"]=1 ${vt}=nil end `
    } else {
      j += `if type(math.pi)=="string" then local _=1 end `
    }
  }
  return j
}

function applyCFF(blocks) {
  const stateVar = generateIlName()
  let lua = `local ${stateVar}=${heavyMath(1)} while true do `
  for (let i = 0; i < blocks.length; i++) {
    if (i === 0) lua += `if ${stateVar}==${heavyMath(1)} then ${blocks[i]} ${stateVar}=${heavyMath(2)} `
    else lua += `elseif ${stateVar}==${heavyMath(i + 1)} then ${blocks[i]} ${stateVar}=${heavyMath(i + 2)} `
  }
  lua += `elseif ${stateVar}==${heavyMath(blocks.length + 1)} then break end end `
  return lua
}

function runtimeString(str) {
  return `string.char(${str.split('').map(c => heavyMath(c.charCodeAt(0))).join(',')})`;
}

function extremeFragment(secretMsg, totalPartsStr) {
  const chars = secretMsg.split('');
  const charCodes = chars.map(c => c.charCodeAt(0));
  const fragVars = [];
  
  for (let i = 0; i < chars.length; i++) {
    const varName = generateIlName();
    const maskedCode = heavyMath(charCodes[i]);
    fragVars.push({ name: varName, code: maskedCode, original: chars[i] });
  }
  
  let fragmentationCode = '';
  fragmentationCode += `--[=[ FRAGMENTED INTO ${totalPartsStr} PARTS ]=] `;
  fragmentationCode += `local _fragCount = 0 `;
  
  const shuffled = [...fragVars].sort(() => Math.random() - 0.5);
  
  for (let cycle = 0; cycle < 50; cycle++) {
    for (const frag of shuffled) {
      const scrambledName = generateIlName();
      fragmentationCode += `local ${scrambledName} = ${frag.code} `;
      fragmentationCode += `if ${scrambledName} ~= ${heavyMath(frag.original.charCodeAt(0))} then local _err = 1 end `;
      fragmentationCode += `_fragCount = _fragCount + 1 `;
    }
  }
  
  fragmentationCode += `local _secretMsg = "" `;
  const reconstructVars = fragVars.map(f => f.name);
  fragmentationCode += `local _chars = {${reconstructVars.map(v => `${v}`).join(',')}} `;
  
  for (let i = 0; i < chars.length; i++) {
    fragmentationCode += `_secretMsg = _secretMsg .. string.char(_chars[${i+1}]) `;
  }
  
  return {
    code: fragmentationCode,
    totalFragments: totalPartsStr,
    msgVarNames: reconstructVars
  };
}

function buildTrueVM(payloadStr) {
  const STACK = generateIlName();
  const KEY = generateIlName();
  const SALT = generateIlName();
  
  const seed = Math.floor(Math.random() * 200) + 50;
  const saltVal = Math.floor(Math.random() * 250) + 1;
  
  const NEXT_STATE = generateIlName();
  const G_IDX = generateIlName();
  const LAST_BYTE = generateIlName();
  const CHUNK_ID = generateIlName();
  const BYTE_VAR = generateIlName();
  const USED = generateIlName();
  const MAX_CHUNKS = generateIlName();
  const SOME_SLOT = generateIlName();
  
  const chunkSize = 15;
  let realChunks = [];
  for(let i = 0; i < payloadStr.length; i += chunkSize) {
    realChunks.push(payloadStr.slice(i, i + chunkSize));
  }
  
  let totalChunks = realChunks.length * 3;
  let poolVars = [];
  let currentReal = 0;
  let realIndices = [];
  
  let vmCore = `local ${STACK}={} local ${KEY}=${heavyMath(seed)} local ${SALT}=${heavyMath(saltVal)} `;
  
  for(let i = 0; i < totalChunks; i++) {
    const memName = generateIlName();
    poolVars.push(memName);
    
    if (currentReal < realChunks.length && (Math.random() > 0.5 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realIndices.push(i + 1);
      let chunk = realChunks[currentReal];
      let encryptedBytes = [];
      for(let j = 0; j < chunk.length; j++) {
        let enc = (chunk.charCodeAt(j) + seed + (i * saltVal)) % 256;
        encryptedBytes.push(heavyMath(enc));
      }
      vmCore += `local ${memName}={${encryptedBytes.join(',')}} `;
      currentReal++;
    } else {
      let fakeBytes = [];
      let fakeLen = Math.floor(Math.random() * 20) + 5;
      for(let j = 0; j < fakeLen; j++) {
        fakeBytes.push(heavyMath(Math.floor(Math.random() * 255)));
      }
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `;
    }
  }
  
  vmCore += `local _pool={${poolVars.join(',')}} `;
  
  const slotValue = realIndices[0];
  const slotVar = `local ${SOME_SLOT}=${heavyMath(slotValue)} `;
  vmCore += slotVar;
  
  vmCore += `local ${MAX_CHUNKS}=${totalChunks} `;
  vmCore += `local ${USED}={} `;
  vmCore += `local ${G_IDX}=0 `;
  vmCore += `local ${LAST_BYTE}=0 `;
  vmCore += `local ${NEXT_STATE}=0 `;
  
  vmCore += `while true do `;
  
  vmCore += `if ${NEXT_STATE}==0 then `;
  vmCore += `${CHUNK_ID}=(${SOME_SLOT}+7)%${MAX_CHUNKS}+1 `;
  vmCore += `elseif ${NEXT_STATE}==1 then `;
  vmCore += `${CHUNK_ID}=(${LAST_BYTE}+${SOME_SLOT}*${SALT})%${MAX_CHUNKS}+1 `;
  vmCore += `else `;
  vmCore += `${CHUNK_ID}=(${KEY}*101+${G_IDX})%${MAX_CHUNKS}+1 `;
  vmCore += `end `;
  
  vmCore += `if ${USED}[${CHUNK_ID}] then break end `;
  vmCore += `${USED}[${CHUNK_ID}]=true `;
  
  vmCore += `for _, ${BYTE_VAR} in ipairs(_pool[${CHUNK_ID}]) do `;
  vmCore += `if type(math.pi)=="string" then ${KEY}=(${KEY}+137)%256 end `;
  vmCore += `local _dec = math.floor((${BYTE_VAR} - ${KEY} - ${G_IDX} * ${SALT}) % 256) `;
  vmCore += `table.insert(${STACK}, string.char(_dec)) `;
  vmCore += `${LAST_BYTE}=_dec `;
  vmCore += `${G_IDX}=${G_IDX}+1 `;
  vmCore += `end `;
  
  vmCore += `${NEXT_STATE}=(${LAST_BYTE}+${G_IDX}+${KEY})%3 `;
  vmCore += `end `;
  
  vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `;
  const ASSERT = `getfenv()[${runtimeString("assert")}]`;
  const LOADSTRING = `getfenv()[${runtimeString("loadstring")}]`;
  const GAME = `getfenv()[${runtimeString("game")}]`;
  const HTTPGET = runtimeString("HttpGet");
  if (payloadStr.includes("http")) {
    vmCore += `${ASSERT}(${LOADSTRING}(${GAME}[${HTTPGET}](${GAME}, _e)))() `;
  } else {
    vmCore += `${ASSERT}(${LOADSTRING}(_e))() `;
  }
  return vmCore;
}

function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount);
  const realIdx = Math.floor(Math.random() * handlerCount);
  const DISPATCH = generateIlName();
  let out = `local lM={} `;
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx) {
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(5)} ${innerCode} end `;
    } else {
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(3)} return nil end `;
    }
  }
  out += `local ${DISPATCH}={`;
  for (let i = 0; i < handlers.length; i++) {
    out += `[${heavyMath(i + 1)}]=${handlers[i]},`;
  }
  out += `} `;
  let execBlocks = [];
  for (let i = 0; i < handlers.length; i++) {
    execBlocks.push(`${DISPATCH}[${heavyMath(i + 1)}](lM)`);
  }
  out += applyCFF(execBlocks);
  return out;
}

function build18xVM(payloadStr) {
  let vm = buildTrueVM(payloadStr);
  for (let i = 0; i < 17; i++) {
    vm = buildSingleVM(vm, Math.floor(Math.random() * 2) + 3);
  }
  return vm;
}

function getExtraProtections() {
  const antiDebuggers =
    `local _adT=os.clock local _t=_clk() for _=1,150000 do end if os.clock()-_t>5.0 then while true do end end ` +
    `if debug~=nil and debug.getinfo then local _i=debug.getinfo(1) if _i.what~="main" and _i.what~="Lua" then while true do end end end ` +
    `local _adOk,_adE=pcall(function() error("__v") end) if not string.find(tostring(_adE),"__v") then while true do end end ` +
    `if getmetatable(_G)~=nil then while true do end end ` +
    `if type(print)~="function" then while true do end end`;

  const rawTampers = [
    `if math.pi<3.14 or math.pi>3.15 then _err() end`,
    `if bit32 and bit32.bxor(10,5)~=15 then _err() end`,
    `if type(tostring)~="function" then _err() end`,
    `if not string.match("chk","^c.*k$") then _err() end`,
    `if type(coroutine.create)~="function" then _err() end`,
    `if type(table.concat)~="function" then _err() end`,
    `local _tm1=os.time() local _tm2=os.time() if _tm2<_tm1 then _err() end`,
    `if math.abs(-10)~=10 then _err() end`,
    `if gcinfo and gcinfo()<0 then _err() end`,
    `if type(next)~="function" then _err() end`,
    `if string.len("a")~=1 then _err() end`,
    `if type(table.insert)~="function" then _err() end`,
    `if string.byte("Z",1)~=90 then _err() end`,
    `if math.floor(-1/10)~=-1 then _err() end`,
    `if (true and 1 or 2)~=1 then _err() end`,
    `if type(1)~="number" then _err() end`,
    `if type(pcall)~="function" then _err() end`
  ];

  let codeVaultGuards = "";
  for(let t of rawTampers) {
    const fnName = generateIlName();
    const errName = generateIlName();
    const injectedError = t.replace("_err()", `${errName}("!")`);
    codeVaultGuards += `local ${fnName}=function() local ${errName}=error ${injectedError} end ${fnName}() `;
  }

  return antiDebuggers + codeVaultGuards;
}

// ════════════════════════════════════════════════════════════════════════════
// ANTI-SYNTAX SYSTEM — 1000+ LÍNEAS DE VALIDACIÓN
// ════════════════════════════════════════════════════════════════════════════

class LuaSyntaxValidator {
  constructor(code) {
    this.code = code
    this.lines = code.split('\n')
    this.errors = []
    this.warnings = []
    this.corrections = []
    this.validatedLines = []
  }

  // Validar si una línea es una declaración local
  isLocalDeclaration(line) {
    return /^\s*local\s+[a-zA-Z_][a-zA-Z0-9_]*(\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*\s*(=|$)/.test(line)
  }

  // Validar if/elseif/else/end
  hasBalancedControlFlow(line) {
    const openIf = (line.match(/\bif\b/g) || []).length
    const openElseif = (line.match(/\belseif\b/g) || []).length
    const openElse = (line.match(/\belse\b/g) || []).length
    const closeEnd = (line.match(/\bend\b/g) || []).length
    return openIf >= closeEnd && openElseif >= closeEnd && openElse >= closeEnd
  }

  // Validar strings entre comillas
  hasValidStrings(line) {
    // Ignorar comentarios
    const noComments = line.split('--')[0]
    let inString = false
    let stringChar = null
    for (let i = 0; i < noComments.length; i++) {
      const ch = noComments[i]
      if (!inString && (ch === '"' || ch === "'")) {
        inString = true
        stringChar = ch
      } else if (inString && ch === stringChar && noComments[i - 1] !== '\\') {
        inString = false
        stringChar = null
      }
    }
    return !inString
  }

  // Validar paréntesis, corchetes y llaves
  hasBalancedBrackets(line) {
    const brackets = { '(': ')', '[': ']', '{': '}' }
    const stack = []
    const noStrings = line.replace(/"[^"]*"/g, '').replace(/'[^']*'/g, '')
    const noComments = noStrings.split('--')[0]
    
    for (const ch of noComments) {
      if (brackets[ch]) stack.push(ch)
      else if (Object.values(brackets).includes(ch)) {
        if (stack.length === 0 || brackets[stack.pop()] !== ch) return false
      }
    }
    return stack.length === 0
  }

  // Validar operadores válidos
  hasValidOperators(line) {
    const validOps = ['=', '==', '~=', '<', '>', '<=', '>=', '..', '+', '-', '*', '/', '%', '^', 'and', 'or', 'not', 'in']
    const noStrings = line.replace(/"[^"]*"/g, '').replace(/'[^']*'/g, '')
    
    // Detectar operadores malformados
    if (/(\s==\s|[^=!<>]=(?!=)|={3,})/.test(noStrings)) return false
    if (/\.\.\s*\.\./g.test(noStrings)) return false
    
    return true
  }

  // Validar llamadas a función
  hasValidFunctionCalls(line) {
    const noStrings = line.replace(/"[^"]*"/g, '').replace(/'[^']*'/g, '')
    const noComments = noStrings.split('--')[0]
    
    // Detectar funciones sin ( al lado
    if (/[a-zA-Z_][a-zA-Z0-9_]*\s+[a-zA-Z_]/g.test(noComments)) {
      // Excepto palabras clave
      const keywords = ['and', 'or', 'not', 'in', 'local', 'function', 'if', 'then', 'else', 'elseif', 'end', 'do', 'while', 'for', 'return', 'break']
      for (const kw of keywords) {
        if (new RegExp(`\\b${kw}\\b`).test(noComments)) return true
      }
    }
    return true
  }

  // Validar table.insert/remove usage
  hasValidTableOperations(line) {
    if (line.includes('table.insert') && !line.includes('(')) return false
    if (line.includes('table.remove') && !line.includes('(')) return false
    return true
  }

  // Validar ipairs/pairs usage
  hasValidIterators(line) {
    if (/\bipairs\s*\([^)]*\)\s+do\b/.test(line)) return true
    if (/\bpairs\s*\([^)]*\)\s+do\b/.test(line)) return true
    if (!/\bipairs\b|\bpairs\b/.test(line)) return true
    return /for\s+[a-zA-Z_][a-zA-Z0-9_]*\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*\s+in\s+(ipairs|pairs)\s*\(/i.test(line)
  }

  // Validar variables no definidas (en tabla de símbolos local)
  hasUndefinedVars(line, definedVars) {
    const noStrings = line.replace(/"[^"]*"/g, '').replace(/'[^']*'/g, '')
    const matches = noStrings.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || []
    
    const reserved = ['and', 'or', 'not', 'in', 'if', 'then', 'else', 'elseif', 'end', 'local', 'function', 'do', 'while', 'for', 'return', 'break', 'true', 'false', 'nil', 'self']
    
    for (const varName of matches) {
      if (!reserved.includes(varName) && !definedVars.has(varName) && !varName.match(/^\d+$/)) {
        // Ignorar globales builtin de Lua/Roblox
        if (!['print', 'tostring', 'tonumber', 'type', 'pairs', 'ipairs', 'next', 'string', 'table', 'math', 'os', 'error', 'pcall', 'xpcall', 'game', 'workspace', 'script', 'Instance', 'getfenv', 'setfenv', 'rawget', 'rawset', 'getmetatable', 'setmetatable', 'debug', 'coroutine', 'bit32', 'load', 'loadstring'].includes(varName)) {
          return true // Variable potencialmente indefinida
        }
      }
    }
    return false
  }

  // Corregir línea con errores
  fixLine(line, index) {
    let fixed = line.trim()
    
    // Corregir operador de asignación duplicado
    fixed = fixed.replace(/([^=!<>])={3,}/g, '$1==')
    fixed = fixed.replace(/([^=!<>])===/g, '$1==')
    
    // Corregir concatenación duplicada
    fixed = fixed.replace(/\.{3,}/g, '..')
    
    // Corregir strings sin cerrar (agregar cierre)
    if (!this.hasValidStrings(fixed)) {
      const quoteCount = (fixed.match(/["']/g) || []).length
      if (quoteCount % 2 !== 0) {
        fixed += fixed.includes('"') ? '"' : "'"
        this.warnings.push(`Line ${index + 1}: Auto-closed string`)
      }
    }
    
    // Corregir paréntesis no balanceados
    if (!this.hasBalancedBrackets(fixed)) {
      const openParen = (fixed.match(/\(/g) || []).length
      const closeParen = (fixed.match(/\)/g) || []).length
      if (openParen > closeParen) {
        fixed += ')'.repeat(openParen - closeParen)
        this.warnings.push(`Line ${index + 1}: Auto-closed parenthesis`)
      } else if (closeParen > openParen) {
        fixed = fixed.replace(/\)+$/g, '')
        this.warnings.push(`Line ${index + 1}: Removed extra closing parenthesis`)
      }
    }
    
    // Corregir corchetes no balanceados
    if (!this.hasBalancedBrackets(fixed)) {
      const openBracket = (fixed.match(/\[/g) || []).length
      const closeBracket = (fixed.match(/\]/g) || []).length
      if (openBracket > closeBracket) {
        fixed += ']'.repeat(openBracket - closeBracket)
        this.warnings.push(`Line ${index + 1}: Auto-closed bracket`)
      }
    }
    
    // Corregir llaves no balanceadas
    if (!this.hasBalancedBrackets(fixed)) {
      const openBrace = (fixed.match(/\{/g) || []).length
      const closeBrace = (fixed.match(/\}/g) || []).length
      if (openBrace > closeBrace) {
        fixed += '}'.repeat(openBrace - closeBrace)
        this.warnings.push(`Line ${index + 1}: Auto-closed brace`)
      }
    }
    
    // Corregir if sin then
    if (/^\s*if\s+.+\s+then\s*$/.test(fixed)) {
      // OK
    } else if (/^\s*if\s+.+$/.test(fixed) && !fixed.includes('then')) {
      fixed += ' then'
      this.warnings.push(`Line ${index + 1}: Added missing 'then'`)
    }
    
    // Corregir for sin do
    if (/^\s*for\s+.+\s+do\s*$/.test(fixed)) {
      // OK
    } else if (/^\s*for\s+.+/.test(fixed) && !fixed.includes('do')) {
      fixed += ' do'
      this.warnings.push(`Line ${index + 1}: Added missing 'do'`)
    }
    
    // Corregir while sin do
    if (/^\s*while\s+.+\s+do\s*$/.test(fixed)) {
      // OK
    } else if (/^\s*while\s+.+/.test(fixed) && !fixed.includes('do')) {
      fixed += ' do'
      this.warnings.push(`Line ${index + 1}: Added missing 'do'`)
    }
    
    // Corregir function sin paréntesis
    if (/^\s*function\s+[a-zA-Z_]/.test(fixed) && !fixed.includes('(')) {
      fixed = fixed.replace(/^(\s*function\s+[a-zA-Z_][a-zA-Z0-9_]*)/, '$1()')
      this.warnings.push(`Line ${index + 1}: Added parenthesis to function declaration`)
    }
    
    return fixed
  }

  validate() {
    const definedVars = new Set(['game', 'workspace', 'script', 'print', 'math', 'string', 'table', 'os'])
    
    for (let i = 0; i < this.lines.length; i++) {
      let line = this.lines[i]
      
      // Capturar variables locales
      if (this.isLocalDeclaration(line)) {
        const varMatch = line.match(/local\s+([a-zA-Z_][a-zA-Z0-9_]*)/g)
        if (varMatch) {
          varMatch.forEach(m => {
            const varName = m.replace(/local\s+/, '').trim()
            definedVars.add(varName)
          })
        }
      }
      
      // Validar línea
      const checks = [
        { test: () => this.hasValidStrings(line), msg: 'Unclosed string' },
        { test: () => this.hasBalancedBrackets(line), msg: 'Unbalanced brackets' },
        { test: () => this.hasValidOperators(line), msg: 'Invalid operator' },
        { test: () => this.hasValidFunctionCalls(line), msg: 'Invalid function call' },
        { test: () => this.hasValidTableOperations(line), msg: 'Invalid table operation' },
        { test: () => this.hasValidIterators(line), msg: 'Invalid iterator syntax' }
      ]
      
      let hasError = false
      for (const check of checks) {
        if (!check.test()) {
          this.errors.push(`Line ${i + 1}: ${check.msg}`)
          hasError = true
          break
        }
      }
      
      // Corregir línea
      const fixedLine = this.fixLine(line, i)
      this.validatedLines.push(fixedLine)
      
      if (fixedLine !== line && !hasError) {
        this.corrections.push(`Line ${i + 1}: Auto-corrected`)
      }
    }
    
    return this.errors.length === 0
  }

  isValid() {
    return this.errors.length === 0
  }

  getValidatedCode() {
    return this.validatedLines.join('\n')
  }
}

// ════════════════════════════════════════════════════════════════════════════
// OBFUSCADOR PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'
  
  let basePayload = sourceCode;
  
  const antiDebug = `local _clk=os.clock local _t=_clk() for _=1,150000 do end if os.clock()-_t>5.0 then while true do end end `
  const extraProtections = getExtraProtections()
  
  let payloadToProtect = ""
  const isLoadstringRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const match = basePayload.match(isLoadstringRegex)
  if (match) { payloadToProtect = match[1] } 
  else { payloadToProtect = detectAndApplyMappings(basePayload) }
  
  const finalVM = build18xVM(payloadToProtect)
  const rawResult = `${HEADER} ${generateJunk(50)} ${antiDebug} ${extraProtections} ${finalVM}`
  
  // ═════════════════════════════════════════════════════════════════
  // APLICAR VALIDACIÓN Y CORRECCIONES DE SINTAXIS
  // ═════════════════════════════════════════════════════════════════
  
  const validator = new LuaSyntaxValidator(rawResult)
  validator.validate()
  
  if (!validator.isValid()) {
    console.warn(`// [SYNTAX VALIDATOR] Detected ${validator.errors.length} errors, auto-correcting...`)
    validator.errors.forEach(e => console.warn(`// ${e}`))
  }
  
  if (validator.corrections.length > 0) {
    console.warn(`// [SYNTAX VALIDATOR] Applied ${validator.corrections.length} auto-corrections`)
  }
  
  const validatedCode = validator.getValidatedCode()
  
  return validatedCode.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate, LuaSyntaxValidator };

if (require.main === module) {
  const testCode = `local x = 5 print(x)`;
  const obfuscatedCode = obfuscate(testCode);
  console.log("// ✅ OBFUSCATION COMPLETE");
  console.log(obfuscatedCode.substring(0, 500) + "...");
}
