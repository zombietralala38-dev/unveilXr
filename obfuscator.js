const HEADER = `--[[ 
    protected by vvmer obfuscator 
    Architecture: Custom Bytecode Interpreter (Luraph Style) 
    Control Flow: Aggressive Flattening (Moonveil Style)
]]`

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
  if (Math.random() < 0.65) return n.toString();
  let a = Math.floor(Math.random() * 50) + 5;
  let b = Math.floor(Math.random() * 10) + 2;
  return `((((${n}+${a})*${b})/${b})-${a})`;
}

function mba() {
  let a = Math.floor(Math.random() * 20) + 5;
  let b = Math.floor(Math.random() * 5) + 1;
  return `(((1*${a})+${b})-(${a}+${b})+1)`;
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

function generateJunk(lines = 15) {
  let j = ''
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    if (r < 0.25) j += `local ${generateIlName()}=${heavyMath(Math.floor(Math.random() * 999))} `
    else if (r < 0.45) j += `local ${generateIlName()}=string.char(${heavyMath(Math.floor(Math.random()*100)+50)}) `
    else if (r < 0.65) j += `if not(${heavyMath(1)}==${heavyMath(1)}) then local x=1 end `
    else if (r < 0.85) {
      const tp = generateIlName();
      j += `if type(nil)=="number" then while true do local ${tp}=1 end end `
    } else {
      j += `if type(math.pi)=="string" then local _=1 end `
    }
  }
  return j
}

// Moonveil Style: Control Flow Flattening
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

/** * LURAPH STYLE: Custom Bytecode + Opcode Mutation
 * Implementa una arquitectura donde el código se transforma en instrucciones numéricas.
 */
function buildTrueVM(payloadStr) {
  const STACK = generateIlName(); 
  const INSTR_PTR = generateIlName(); 
  const BYTECODE = generateIlName();
  const KEY = Math.floor(Math.random() * 200) + 50;

  // Mutación de Opcodes: Cada vez que generas el script, los números de las acciones cambian.
  let opcodes = {
    PUSH_STR: Math.floor(Math.random() * 100) + 1,
    EXECUTE: Math.floor(Math.random() * 100) + 101,
    JUNK: Math.floor(Math.random() * 100) + 201
  };

  // Convertimos el payload en una "Instrucción de Bytecode" cifrada
  let encodedPayload = "";
  for(let i = 0; i < payloadStr.length; i++) {
    encodedPayload += String.fromCharCode((payloadStr.charCodeAt(i) + KEY) % 256);
  }

  // Generamos el array de Bytecode (Instrucción -> Valor)
  let bytecodeData = `{${opcodes.JUNK}, ${opcodes.PUSH_STR}, "${encodedPayload}", ${opcodes.EXECUTE}}`;

  let vmCore = `
    local ${BYTECODE} = ${bytecodeData}
    local ${STACK} = ""
    local ${INSTR_PTR} = 1
    
    while ${INSTR_PTR} <= #(${BYTECODE}) do
        local inst = ${BYTECODE}[${INSTR_PTR}]
        
        if inst == ${heavyMath(opcodes.PUSH_STR)} then
            ${INSTR_PTR} = ${INSTR_PTR} + 1
            local data = ${BYTECODE}[${INSTR_PTR}]
            for i = 1, #data do
                ${STACK} = ${STACK} .. string.char((string.byte(data, i) - ${heavyMath(KEY)}) % 256)
            end
        elseif inst == ${heavyMath(opcodes.EXECUTE)} then
            local _f = getfenv()[${runtimeString("loadstring")}](${STACK})
            getfenv()[${runtimeString("assert")}](_f, "VM Error")()
        elseif inst == ${heavyMath(opcodes.JUNK)} then
            ${generateJunk(2)}
        end
        ${INSTR_PTR} = ${INSTR_PTR} + 1
    end
  `;

  return vmCore;
}

function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount); 
  const realIdx = Math.floor(Math.random() * handlerCount);
  const DISPATCH = generateIlName(); 
  let out = `local lM={} ` 
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx) { 
        out += `local ${handlers[i]}=function(lM) ${innerCode} end ` 
    } else { 
        out += `local ${handlers[i]}=function(lM) ${generateJunk(2)} return nil end ` 
    }
  }
  out += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++) { out += `[${heavyMath(i + 1)}]=${handlers[i]},` }
  out += `} `
  let execBlocks = []; 
  for (let i = 0; i < handlers.length; i++) { execBlocks.push(`${DISPATCH}[${heavyMath(i + 1)}](lM)`) }
  out += applyCFF(execBlocks); 
  return out
}

function buildMotherVM(payloadStr) {
  // Capa 1: Bytecode Intérprete (Luraph Style)
  let coreVM = buildTrueVM(payloadStr);
  
  // Capa 2: Moonveil Style (Control Flow Flattening envolviendo al intérprete)
  let intermediateVM = buildSingleVM(coreVM, 3);

  // Capa 3: Mother VM (Capa final de entrada)
  let motherVM = buildSingleVM(intermediateVM, 2);

  return motherVM;
}

function getExtraProtections() {
  const antiSandbox = 
    `if typeof(task)~="table" then while true do end end ` + 
    `if not game or not workspace then while true do end end ` + 
    `local _adT=os.clock() for _=1,50000 do end if os.clock()-_adT>2.0 then while true do end end `;

  const rawTampers = [
    `if math.pi<3.14 or math.pi>3.15 then _err() end`,
    `if type(tostring)~="function" then _err() end`,
    `if type(table.concat)~="function" then _err() end`
  ];

  let codeVaultGuards = "";
  for(let t of rawTampers) {
    const fnName = generateIlName();
    const errName = generateIlName();
    const injectedError = t.replace("_err()", `${errName}("!")`);
    codeVaultGuards += `local ${fnName}=function() local ${errName}=error ${injectedError} end ${fnName}() `;
  }

  return antiSandbox + codeVaultGuards;
}

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'
  const extraProtections = getExtraProtections()
  let payloadToProtect = ""
  
  const isLoadstringRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const match = sourceCode.match(isLoadstringRegex)
  
  if (match) { 
    payloadToProtect = match[1] 
  } else { 
    payloadToProtect = detectAndApplyMappings(sourceCode) 
  }
  
  const finalVM = buildMotherVM(payloadToProtect)
  
  // Retornamos el código limpio de saltos de línea innecesarios pero sin minificar agresivamente
  return `${HEADER}\n${generateJunk(5)}\n${extraProtections}\n${finalVM}`
}

module.exports = { obfuscate }
