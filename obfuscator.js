const HEADER = `--[[ this code it's protected by vvmer obfuscator ]]`

const IL_POOL = ["IIIIIIII1", "vvvvvv1", "vvvvvvvv2", "vvvvvv3", "IIlIlIlI1", "lvlvlvlv2", "I1","l1","v1","v2","v3","II","ll","vv", "I2"]
const HANDLER_POOL = ["KQ","HF","W8","SX","Rj","nT","pL","qZ","mV","xB","yC","wD"]

// ═══════════════════════════════════════════════════════════════════
// FUNCIONES DE CODE VAULT v35 INTEGRADAS
// ═══════════════════════════════════════════════════════════════════

/**
 * Tarpit: Ruta muerta de ejecución costosa para frenar emuladores simbólicos
 */
function tarpit() {
  const styles = [
    'for _=1,999999 do _=_+1 end',
    'local _t={} for _=1,1000 do _t[_]=_*_*_ end',
    'while 0 do _=1 end',
    'pcall(function() error("") end)',
    'table.sort({},function()return 1/0 end)',
    'for _=1,math.huge do break end',
    'local _s=0 for _=1,500000 do _s=_s+math.sin(_) end',
    'local _f=function(...) return select("#",...) end for _=1,10000 do _f(1,2,3,4,5) end'
  ]
  return styles[Math.floor(Math.random() * styles.length)]
}

/**
 * Opaque Predicate: No constant-foldable, depende del runtime
 */
function opaquePredicate() {
  const opTrue = [
    '(not not 1)',
    'not (not true)',
    '(1==1)',
    '({})~=nil',
    '(5>3)',
    'rawequal(nil,nil)',
    'type("")==type("")',
    '#{1,2,3}==3',
    'next({})==nil',
    'pcall(function() return true end)'
  ]
  const opFalse = [
    'rawequal(1,2)',
    '(nil==true)',
    '(1==2)',
    '(5<3)',
    '({})==({})',
    'type(nil)==type(1)',
    'next{1}~=nil',
    'string.byte("")~=nil',
    'pcall(error,"")'
  ]
  if (Math.random() < 0.5) {
    return opTrue[Math.floor(Math.random() * opTrue.length)]
  } else {
    return opFalse[Math.floor(Math.random() * opFalse.length)]
  }
}

/**
 * Silent Key Corruption: Corrupción silenciosa dentro del decode loop
 */
function silentKeyCorruption(Ivar, Kvar, period) {
  const styles = [
    `if ${Ivar}%${period}==0 then ${Kvar}=(${Kvar}+1)%256 end`,
    `if ${Ivar}%${period}==0 then ${Kvar}=(${Kvar}+17)%256 end`,
    `local _sc=${Ivar}%${period} if _sc<1 then ${Kvar}=(${Kvar}+3)%256 end`,
    `if math.fmod(${Ivar},${period})<0.1 then ${Kvar}=(${Kvar}+7)%256 end`
  ]
  if (Math.random() < 0.6) {
    return styles[Math.floor(Math.random() * styles.length)]
  }
  return styles[0]
}

// ═══════════════════════════════════════════════════════════════════

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

/**
 * Genera junk code con técnicas de CodeVault + las originales
 */
function generateJunk(lines = 100) {
  let j = ''
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    if (r < 0.15) j += `local ${generateIlName()}=${heavyMath(Math.floor(Math.random() * 999))} `
    else if (r < 0.3) j += `local ${generateIlName()}=string.char(${heavyMath(Math.floor(Math.random()*255))}) `
    else if (r < 0.45) j += `if not(${heavyMath(1)}==${heavyMath(1)}) then local x=1 end `
    else if (r < 0.6) {
      // CODE VAULT: Tarpit en ruta muerta
      const tp = generateIlName();
      j += `if ${opaquePredicate()} then ${tarpit()} end `
    } else if (r < 0.75) {
      // CODE VAULT: Symbol Waterfall Noise
      const vt = generateIlName();
      j += `do local ${vt}={} ${vt}["_"]=1 ${vt}=nil end `
    } else if (r < 0.88) {
      // CODE VAULT: Opaque Predicate
      j += `if ${opaquePredicate()} then local _=1 end `
    } else {
      // Guardia de integridad falsa
      j += `if type(math.pi)=="string" then ${tarpit()} end `
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

/**
 * Corrupción de textos: ofusca cualquier string en partes
 */
function textCorruptor(str) {
  const parts = [];
  let remaining = str;
  while (remaining.length > 0) {
    const chunkSize = Math.floor(Math.random() * 5) + 3;
    const chunk = remaining.slice(0, Math.min(chunkSize, remaining.length));
    const encChunk = chunk.split('').map(c => heavyMath(c.charCodeAt(0))).join(',');
    parts.push(`string.char(${encChunk})`);
    remaining = remaining.slice(chunkSize);
  }
  return parts.join('..');
}

/**
 * ANTI-ENV LOGGER ULTRA OFUSCADO Y DIVIDIDO
 * Detecta entornos de logging/debugging y sale con mensaje subliminal
 */
function buildAntiEnvLogger() {
  // Mensaje subliminal "I really like Rick and Morty" - dividido y ofuscado
  const secretParts = [
    [73, 32, 114, 101, 97],
    [108, 108, 121, 32, 108],
    [105, 107, 101, 32, 82],
    [105, 99, 107, 32, 97],
    [110, 100, 32, 77, 111],
    [114, 116, 121]
  ];
  
  const blockVars = [];
  let buildCode = '';
  
  // Construir el mensaje en múltiples bloques
  for (let i = 0; i < secretParts.length; i++) {
    const bv = generateIlName();
    const bd = generateIlName();
    blockVars.push(bv);
    buildCode += `local ${bv}={(function()local ${bd}={${secretParts[i].join(',')}} `;
    buildCode += `for ${generateIlName()}=1,#${bd} do ${bd}[${generateIlName()}]=string.char(${bd}[${generateIlName()}]) end `;
    buildCode += `return table.concat(${bd})end)()} `;
  }
  
  const finalMsgVar = generateIlName();
  buildCode += `local ${finalMsgVar}=${blockVars.join('..')} `;
  
  // Función print10 ultra ofuscada
  const p10name = generateIlName();
  const loopVar = generateIlName();
  buildCode += `local function ${p10name}() for ${loopVar}=1,${heavyMath(10)} do print(${finalMsgVar}) end end `;
  
  // Lista de funciones a verificar - ofuscada
  const funcListVar = generateIlName();
  const funcNames = ['print','rawget','setmetatable','tostring','pcall','type','error','select','next','pairs','ipairs','xpcall','coroutine.resume','coroutine.create','string.dump','string.byte','debug.getinfo'];
  
  buildCode += `local ${funcListVar}={${funcNames.map(f => runtimeString(f)).join(',')}} `;
  
  // Función crash ofuscada
  const crashName = generateIlName();
  buildCode += `local function ${crashName}() ${p10name}() os.exit(0) end `;
  
  // Checks divididos en múltiples bloques con tarpits y predicates
  const checkBlocks = [];
  
  // Check 1: string.dump sobre funciones
  const cv1 = generateIlName();
  checkBlocks.push(`
    local ${cv1}=pcall
    for _,${generateIlName()} in ipairs(${funcListVar}) do
      local ${generateIlName()}=${cv1}(string.dump,${generateIlName()})
      if ${generateIlName()} then
        if ${opaquePredicate()} then ${crashName}() end
      end
    end
  `);
  
  // Check 2: debug.getupvalue
  checkBlocks.push(`
    if debug and debug.getupvalue then
      for _,${generateIlName()} in ipairs(${funcListVar}) do
        if debug.getupvalue(${generateIlName()},1)~=nil then
          if ${opaquePredicate()} or true then ${crashName}() end
        end
      end
    end
  `);
  
  // Check 3: debug y metatables
  checkBlocks.push(`
    if debug then
      if type(debug.getinfo)~="function" then ${crashName}() end
      if pcall(string.dump,debug.getinfo) then
        if not ${opaquePredicate()} then ${tarpit()} end
        ${crashName}()
      end
    else
      ${crashName}()
    end
    if pcall(string.dump,string.dump) then ${crashName}() end
    if getmetatable(_G)~=nil then ${crashName}() end
  `);
  
  // Check 4: Entradas sospechosas en _G
  checkBlocks.push(`
    for k,v in pairs(_G) do
      if type(k)=="string" and (k:match("^__") or k=="jit") then
        ${crashName}()
      end
    end
  `);
  
  // Check 5: loadstring
  checkBlocks.push(`
    local ${generateIlName()},${generateIlName()}=pcall(function() return loadstring end)
    if ${generateIlName()} and type(${generateIlName()})=="function" then
      if pcall(string.dump,${generateIlName()}) then ${crashName}() end
    end
  `);
  
  // Check 6: coroutine
  checkBlocks.push(`
    local ${generateIlName()}=coroutine.create(function() return ${finalMsgVar} end)
    local ${generateIlName()},${generateIlName()}=coroutine.resume(${generateIlName()})
    if not ${generateIlName()} or ${generateIlName()}~=${finalMsgVar} then ${crashName}() end
  `);
  
  // Check 7: getfenv (no-luau)
  checkBlocks.push(`
    if getfenv and pcall(function() getfenv() end) then
      local ${generateIlName()}=getfenv()
      if type(${generateIlName()})~="table" then ${crashName}() end
    end
  `);
  
  // Check 8: newproxy
  checkBlocks.push(`
    if newproxy and pcall(newproxy) then
      local ${generateIlName()}=newproxy(true)
      if getmetatable(${generateIlName()}) then ${crashName}() end
    end
  `);
  
  // Envolver checks en bloques con junk y tarpits
  const allChecks = [];
  for (const block of checkBlocks) {
    allChecks.push(`do ${generateJunk(3)} ${block} ${generateJunk(2)} end`);
  }
  
  buildCode += allChecks.join(' ');
  buildCode += `${p10name}() `; // Llamada final
  
  return buildCode;
}

/**
 * VM con Rolling XOR Affine Cipher + Silent Key Corruption (CodeVault Style)
 */
function buildTrueVM(payloadStr) {
  const STACK = generateIlName(); const KEY = generateIlName(); const ORDER = generateIlName()
  const SALT = generateIlName();
  
  const seed = Math.floor(Math.random() * 200) + 50
  const saltVal = Math.floor(Math.random() * 250) + 1
  
  let vmCore = `local ${STACK}={} local ${KEY}=${heavyMath(seed)} local ${SALT}=${heavyMath(saltVal)} `
  const chunkSize = 15; let realChunks = [];
  for(let i = 0; i < payloadStr.length; i += chunkSize) { realChunks.push(payloadStr.slice(i, i + chunkSize)); }
  let poolVars = []; let realOrder = [];
  let totalChunks = realChunks.length * 3; let currentReal = 0; let globalIndex = 0;
  
  for(let i = 0; i < totalChunks; i++) {
    let memName = generateIlName(); poolVars.push(memName);
    if (currentReal < realChunks.length && (Math.random() > 0.5 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1);
      let chunk = realChunks[currentReal]; let encryptedBytes = [];
      for(let j = 0; j < chunk.length; j++) { 
        let enc = (chunk.charCodeAt(j) + seed + (globalIndex * saltVal)) % 256;
        encryptedBytes.push(heavyMath(enc)); 
        globalIndex++;
      }
      vmCore += `local ${memName}={${encryptedBytes.join(',')}} `;
      currentReal++;
    } else {
      let fakeBytes = []; let fakeLen = Math.floor(Math.random() * 20) + 5;
      for(let j = 0; j < fakeLen; j++) { fakeBytes.push(heavyMath(Math.floor(Math.random() * 255))); }
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `;
    }
  }
  
  vmCore += `local _pool={${poolVars.join(',')}} local ${ORDER}={${realOrder.map(n => heavyMath(n)).join(',')}} `;
  const idxVar = generateIlName(); const byteVar = generateIlName();
  
  // Decode loop con Silent Key Corruption de CodeVault
  vmCore += `local _gIdx=0 for _, ${idxVar} in ipairs(${ORDER}) do for _, ${byteVar} in ipairs(_pool[${idxVar}]) do `;
  // Múltiples silent corruptions interwoven
  vmCore += silentKeyCorruption("_gIdx", KEY, Math.floor(Math.random() * 7) + 7) + ' ';
  vmCore += silentKeyCorruption("_gIdx", KEY, Math.floor(Math.random() * 11) + 5) + ' ';
  vmCore += `table.insert(${STACK}, string.char(math.floor((${byteVar} - ${KEY} - _gIdx * ${SALT}) % 256))) _gIdx=_gIdx+1 end end `;
  
  vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `;
  const ASSERT = `getfenv()[${runtimeString("assert")}]`;
  const LOADSTRING = `getfenv()[${runtimeString("loadstring")}]`;
  const GAME = `getfenv()[${runtimeString("game")}]`;
  const HTTPGET = runtimeString("HttpGet");
  if (payloadStr.includes("http")) { vmCore += `${ASSERT}(${LOADSTRING}(${GAME}[${HTTPGET}](${GAME}, _e)))() ` } 
  else { vmCore += `${ASSERT}(${LOADSTRING}(_e))() ` }
  return vmCore
}

/**
 * Custom VM anidada estilo CodeVault con múltiples capas
 */
function buildCustomNestedVM(payloadStr, depth = 5) {
  let currentVM = payloadStr;
  
  for (let layer = 0; layer < depth; layer++) {
    const layerKey = Math.floor(Math.random() * 200) + 30;
    const layerSalt = Math.floor(Math.random() * 200) + 20;
    const layerStack = generateIlName();
    const layerKeyVar = generateIlName();
    const layerSaltVar = generateIlName();
    const layerIdx = generateIlName();
    const layerByte = generateIlName();
    
    // Codificar el código actual
    const encoded = [];
    for (let i = 0; i < currentVM.length; i++) {
      const e = (currentVM.charCodeAt(i) + layerKey + i * layerSalt) % 256;
      encoded.push(e);
    }
    
    // Separar en chunks con decoys
    const realChunks = [];
    const decoyChunks = [];
    const chunkSize = 12;
    
    for (let i = 0; i < encoded.length; i += chunkSize) {
      realChunks.push(encoded.slice(i, Math.min(i + chunkSize, encoded.length)));
    }
    
    // Generar decoys del mismo tamaño
    for (let i = 0; i < realChunks.length * 2; i++) {
      const fakeLen = chunkSize + Math.floor(Math.random() * 5);
      const fake = [];
      for (let j = 0; j < fakeLen; j++) {
        fake.push(Math.floor(Math.random() * 256));
      }
      decoyChunks.push(fake);
    }
    
    // Intercalar reales y decoys
    const allChunks = [];
    const chunkOrder = [];
    let realInserted = 0;
    
    for (let i = 0; i < decoyChunks.length + realChunks.length; i++) {
      if (realInserted < realChunks.length && Math.random() > 0.6) {
        allChunks.push(realChunks[realInserted]);
        chunkOrder.push(i + 1);
        realInserted++;
      } else if (i - realInserted < decoyChunks.length) {
        allChunks.push(decoyChunks[i - realInserted]);
      } else {
        allChunks.push(realChunks[realInserted]);
        chunkOrder.push(i + 1);
        realInserted++;
      }
    }
    
    // Construir VM
    const chunkVars = [];
    let newVM = `local ${layerStack}={} local ${layerKeyVar}=${heavyMath(layerKey)} local ${layerSaltVar}=${heavyMath(layerSalt)} `;
    
    for (let i = 0; i < allChunks.length; i++) {
      const cv = generateIlName();
      chunkVars.push(cv);
      const bytes = allChunks[i].map(b => heavyMath(b)).join(',');
      newVM += `local ${cv}={${bytes}} `;
    }
    
    const chunkPoolVar = generateIlName();
    const orderVar = generateIlName();
    newVM += `local ${chunkPoolVar}={${chunkVars.join(',')}} `;
    newVM += `local ${orderVar}={${chunkOrder.map(n => heavyMath(n)).join(',')}} `;
    
    // Loop de decodificación con tarpits y silent corruption
    const gIdx = generateIlName();
    newVM += `local ${gIdx}=0 `;
    newVM += `for _,${generateIlName()} in ipairs(${orderVar}) do `;
    newVM += `for _,${generateIlName()} in ipairs(${chunkPoolVar}[${generateIlName()}]) do `;
    // Silent corruption
    newVM += silentKeyCorruption(gIdx, layerKeyVar, Math.floor(Math.random() * 7) + 7) + ' ';
    // Opaque predicate con tarpit
    newVM += `if ${opaquePredicate()} then ${tarpit()} end `;
    newVM += `table.insert(${layerStack},string.char(math.floor((${generateIlName()}-${layerKeyVar}-${gIdx}*${layerSaltVar})%256))) `;
    newVM += `${gIdx}=${gIdx}+1 end end `;
    
    // Ejecutar el resultado decodificado
    newVM += `local ${generateIlName()}=table.concat(${layerStack}) `;
    newVM += `local ${generateIlName()}=loadstring(${generateIlName()}) `;
    newVM += `if ${generateIlName()} then ${generateIlName()}() end `;
    
    currentVM = newVM;
  }
  
  return currentVM;
}

/**
 * Debug VM Machine: VM que verifica integridad del entorno de ejecución
 */
function buildDebugVM(innerCode) {
  const debugChecks = [];
  
  // Check 1: Verificar que ciertas funciones existen
  debugChecks.push(`
    local _df={${['type','pcall','error','string.char','table.concat','math.floor','loadstring','getfenv','assert'].map(f => runtimeString(f)).join(',')}}
    for _,${generateIlName()} in ipairs(_df) do
      if type(_G[${generateIlName()}])~="function" then
        if ${opaquePredicate()} then ${tarpit()} end
      end
    end
  `);
  
  // Check 2: Anti-tamper
  debugChecks.push(`
    local ${generateIlName()}=pcall
    local ${generateIlName()},${generateIlName()}=${generateIlName()}(string.dump,print)
    if ${generateIlName()} then
      ${tarpit()}
    end
  `);
  
  // Check 3: Verificar bytecode integrity
  debugChecks.push(`
    if string.byte("A")~=65 then ${tarpit()} end
    if math.pi<3.14 or math.pi>3.15 then ${tarpit()} end
  `);
  
  const vmName = generateIlName();
  let vm = `local function ${vmName}() `;
  vm += generateJunk(10) + ' ';
  vm += debugChecks.join(' ') + ' ';
  vm += innerCode + ' ';
  vm += generateJunk(5) + ' ';
  vm += `end `;
  vm += `if ${opaquePredicate()} or not ${opaquePredicate()} then ${vmName}() end`;
  
  return vm;
}

/**
 * Single VM wrapper con handlers
 */
function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount); const realIdx = Math.floor(Math.random() * handlerCount);
  const DISPATCH = generateIlName(); let out = `local lM={} ` 
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx) { out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(5)} ${innerCode} end ` } 
    else { out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(3)} return nil end ` }
  }
  out += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++) { out += `[${heavyMath(i + 1)}]=${handlers[i]},` }
  out += `} `
  let execBlocks = []; for (let i = 0; i < handlers.length; i++) { execBlocks.push(`${DISPATCH}[${heavyMath(i + 1)}](lM)`) }
  out += applyCFF(execBlocks); return out
}

/**
 * VM ultra anidada combinando todas las técnicas
 */
function build18xVM(payloadStr) {
  // Primero debug VM
  let vm = buildDebugVM(buildTrueVM(payloadStr));
  
  // Luego custom nested VM 
  vm = buildCustomNestedVM(vm, 3);
  
  // Finalmente 14 capas de single VM
  for (let i = 0; i < 14; i++) {
    vm = buildSingleVM(vm, Math.floor(Math.random() * 2) + 3); 
  }
  return vm;
}

/**
 * Protecciones extra con todas las técnicas integradas
 */
function getExtraProtections() {
  const antiDebuggers = buildAntiEnvLogger();
  
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

  return antiDebuggers + ' ' + codeVaultGuards;
}

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'
  
  let payloadToProtect = ""
  const isLoadstringRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const match = sourceCode.match(isLoadstringRegex)
  if (match) { 
    payloadToProtect = textCorruptor(match[1])
  } else { 
    payloadToProtect = detectAndApplyMappings(sourceCode) 
  }
  
  const extraProtections = getExtraProtections()
  const finalVM = build18xVM(payloadToProtect)
  const result = `${HEADER} ${generateJunk(50)} ${extraProtections} ${finalVM}`
  return result.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate }
