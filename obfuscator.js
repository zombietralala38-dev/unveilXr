// vvmer Obfuscator - Final Enhanced Version (Railway-safe)
// Ejecutar con Node.js: node obfuscator.js > output.lua

const HEADER = '--[[ this code it\'s protected by vvmer obfoscator ]]'

const IL_POOL = ["IIIIIIII1","vvvvvv1","vvvvvvvv2","vvvvvv3","IIlIlIlI1","lvlvlvlv2",
                 "I1","l1","v1","v2","v3","II","ll","vv","I2"]
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
  return '(((((' + n + '+' + a + ')*' + b + ')/' + b + ')-' + a + ')+((' + c + '*' + d + ')/' + d + ')-' + c + ')'
}

function mba() {
  let n = Math.random() > 0.5 ? 1 : 2,
      a = Math.floor(Math.random() * 70) + 15,
      b = Math.floor(Math.random() * 40) + 8;
  return '((' + n + '*' + a + '-' + a + ')/(' + b + '+1)+' + n + ')';
}

const MAPEO = {
  "ScreenGui":"Aggressive Renaming","Frame":"String to Math","TextLabel":"Table Indirection",
  "TextButton":"Mixed Boolean Arithmetic","Humanoid":"Dynamic Junk","Player":"Fake Flow",
  "RunService":"Virtual Machine","TweenService":"Fake Flow","Players":"Fake Flow"
};

function detectAndApplyMappings(code) {
  let modified = code, headers = "";
  for (const [word, tech] of Object.entries(MAPEO)) {
    const regex = new RegExp('\\b' + word + '\\b', "g");
    if (regex.test(modified)) {
      let replacement = '"' + word + '"';
      if (tech.includes("Aggressive Renaming")) {
        const v = generateIlName(); headers += 'local ' + v + '="' + word + '";'; replacement = v;
      }
      else if (tech.includes("String to Math"))
        replacement = 'string.char(' + word.split('').map(c => heavyMath(c.charCodeAt(0))).join(',') + ')';
      else if (tech.includes("Mixed Boolean Arithmetic"))
        replacement = '((' + mba() + '==1 or true)and"' + word + '")';
      regex.lastIndex = 0;
      modified = modified.replace(regex, function(match) { return 'game[' + replacement + ']'; });
    }
  }
  return headers + modified;
}

function generateJunk(lines = 100) {
  let j = ''
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    if (r < 0.2) j += 'local ' + generateIlName() + '=' + heavyMath(Math.floor(Math.random() * 999)) + ' '
    else if (r < 0.4) j += 'local ' + generateIlName() + '=string.char(' + heavyMath(Math.floor(Math.random()*255)) + ') '
    else if (r < 0.5) j += 'if not(' + heavyMath(1) + '==' + heavyMath(1) + ') then local x=1 end '
    else if (r < 0.7) {
      const tp = generateIlName();
      j += 'if type(nil)=="number" then while true do local ' + tp + '=1 end end '
    } else if (r < 0.85) {
      const vt = generateIlName();
      j += 'do local ' + vt + '={} ' + vt + '["_"]=1 ' + vt + '=nil end '
    } else {
      j += 'if type(math.pi)=="string" then local _=1 end '
    }
  }
  return j
}

function applyCFF(blocks) {
  const stateVar = generateIlName()
  let lua = 'local ' + stateVar + '=' + heavyMath(1) + ' while true do '
  for (let i = 0; i < blocks.length; i++) {
    if (i === 0) lua += 'if ' + stateVar + '==' + heavyMath(1) + ' then ' + blocks[i] + ' ' + stateVar + '=' + heavyMath(2) + ' '
    else lua += 'elseif ' + stateVar + '==' + heavyMath(i + 1) + ' then ' + blocks[i] + ' ' + stateVar + '=' + heavyMath(i + 2) + ' '
  }
  lua += 'elseif ' + stateVar + '==' + heavyMath(blocks.length + 1) + ' then break end end '
  return lua
}

function runtimeString(str) {
  return 'string.char(' + str.split('').map(c => heavyMath(c.charCodeAt(0))).join(',') + ')';
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
  fragmentationCode += '--[=[ FRAGMENTED INTO ' + totalPartsStr + ' PARTS ]=] ';
  fragmentationCode += 'local _fragCount = 0 ';
  
  const shuffled = [...fragVars].sort(() => Math.random() - 0.5);
  
  for (let cycle = 0; cycle < 50; cycle++) {
    for (const frag of shuffled) {
      const scrambledName = generateIlName();
      fragmentationCode += 'local ' + scrambledName + ' = ' + frag.code + ' ';
      fragmentationCode += 'if ' + scrambledName + ' ~= ' + heavyMath(frag.original.charCodeAt(0)) + ' then local _err = 1 end ';
      fragmentationCode += '_fragCount = _fragCount + 1 ';
    }
  }
  
  fragmentationCode += 'local _secretMsg = "" ';
  const reconstructVars = fragVars.map(f => f.name);
  fragmentationCode += 'local _chars = {' + reconstructVars.map(v => v).join(',') + '} ';
  
  for (let i = 0; i < chars.length; i++) {
    fragmentationCode += '_secretMsg = _secretMsg .. string.char(_chars[' + (i+1) + ']) ';
  }
  
  return {
    code: fragmentationCode,
    totalFragments: totalPartsStr,
    msgVarNames: reconstructVars
  };
}

function decomposeExpressions(code) {
  const numberRegex = /(?<![a-zA-Z0-9_."'])(\d+(?:\.\d+)?)(?![a-zA-Z0-9_"'])/g;
  const replacements = [];
  let match;

  while ((match = numberRegex.exec(code)) !== null) {
    replacements.push({
      index: match.index,
      length: match[0].length,
      original: match[0],
      value: parseFloat(match[0]),
      varName: generateIlName()
    });
  }

  if (replacements.length === 0) return code;

  replacements.sort((a, b) => b.index - a.index);

  let modified = code;
  let localDeclarations = '';
  for (const rep of replacements) {
    const expr = heavyMath(rep.value);
    localDeclarations += 'local ' + rep.varName + ' = ' + expr + '; ';
    modified = modified.slice(0, rep.index) + rep.varName + modified.slice(rep.index + rep.length);
  }

  return localDeclarations + modified;
}

// ==============================
// VM MEJORADA (máquina de estados)
// ==============================
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
  
  let vmCore = 'local ' + STACK + '={} local ' + KEY + '=' + heavyMath(seed) + ' local ' + SALT + '=' + heavyMath(saltVal) + ' ';
  
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
      vmCore += 'local ' + memName + '={' + encryptedBytes.join(',') + '} ';
      currentReal++;
    } else {
      let fakeBytes = [];
      let fakeLen = Math.floor(Math.random() * 20) + 5;
      for(let j = 0; j < fakeLen; j++) {
        fakeBytes.push(heavyMath(Math.floor(Math.random() * 255)));
      }
      vmCore += 'local ' + memName + '={' + fakeBytes.join(',') + '} ';
    }
  }
  
  vmCore += 'local _pool={' + poolVars.join(',') + '} ';
  
  const slotValue = realIndices[0];
  vmCore += 'local ' + SOME_SLOT + '=' + heavyMath(slotValue) + ' ';
  
  vmCore += 'local ' + MAX_CHUNKS + '=' + totalChunks + ' ';
  vmCore += 'local ' + USED + '={} ';
  vmCore += 'local ' + G_IDX + '=0 ';
  vmCore += 'local ' + LAST_BYTE + '=0 ';
  vmCore += 'local ' + NEXT_STATE + '=0 ';
  
  vmCore += 'while true do ';
  
  vmCore += 'if ' + NEXT_STATE + '==0 then ';
  vmCore += CHUNK_ID + '=(' + SOME_SLOT + '+7)%' + MAX_CHUNKS + '+1 ';
  vmCore += 'elseif ' + NEXT_STATE + '==1 then ';
  vmCore += CHUNK_ID + '=(' + LAST_BYTE + '+' + SOME_SLOT + '*' + SALT + ')%' + MAX_CHUNKS + '+1 ';
  vmCore += 'else ';
  vmCore += CHUNK_ID + '=(' + KEY + '*101+' + G_IDX + ')%' + MAX_CHUNKS + '+1 ';
  vmCore += 'end ';
  
  vmCore += 'if ' + USED + '[' + CHUNK_ID + '] then break end ';
  vmCore += USED + '[' + CHUNK_ID + ']=true ';
  
  vmCore += 'for _, ' + BYTE_VAR + ' in ipairs(_pool[' + CHUNK_ID + ']) do ';
  vmCore += 'if type(math.pi)=="string" then ' + KEY + '=(' + KEY + '+137)%256 end ';
  vmCore += 'local _dec = math.floor((' + BYTE_VAR + ' - ' + KEY + ' - ' + G_IDX + ' * ' + SALT + ') % 256) ';
  vmCore += 'table.insert(' + STACK + ', string.char(_dec)) ';
  vmCore += LAST_BYTE + '=_dec ';
  vmCore += G_IDX + '=' + G_IDX + '+1 ';
  vmCore += 'end ';
  
  vmCore += NEXT_STATE + '=(' + LAST_BYTE + '+' + G_IDX + '+' + KEY + ')%3 ';
  vmCore += 'end ';
  
  vmCore += 'local _e = table.concat(' + STACK + ') ' + STACK + '=nil ';
  const ASSERT = 'getfenv()[' + runtimeString("assert") + ']';
  const LOADSTRING = 'getfenv()[' + runtimeString("loadstring") + ']';
  const GAME = 'getfenv()[' + runtimeString("game") + ']';
  const HTTPGET = runtimeString("HttpGet");
  if (payloadStr.includes("http")) {
    vmCore += ASSERT + '(' + LOADSTRING + '(' + GAME + '[' + HTTPGET + '](' + GAME + ', _e)))() ';
  } else {
    vmCore += ASSERT + '(' + LOADSTRING + '(_e))() ';
  }

  vmCore = decomposeExpressions(vmCore);
  return vmCore;
}

function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount);
  const realIdx = Math.floor(Math.random() * handlerCount);
  const DISPATCH = generateIlName();
  let out = 'local lM={} ';
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx) {
      out += 'local ' + handlers[i] + '=function(lM) local lM=lM; ' + generateJunk(5) + ' ' + innerCode + ' end ';
    } else {
      out += 'local ' + handlers[i] + '=function(lM) local lM=lM; ' + generateJunk(3) + ' return nil end ';
    }
  }
  out += 'local ' + DISPATCH + '={';
  for (let i = 0; i < handlers.length; i++) {
    out += '[' + heavyMath(i + 1) + ']=' + handlers[i] + ',';
  }
  out += '} ';
  let execBlocks = [];
  for (let i = 0; i < handlers.length; i++) {
    execBlocks.push(DISPATCH + '[' + heavyMath(i + 1) + '](lM)');
  }
  out += applyCFF(execBlocks);

  out = decomposeExpressions(out);
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
    'local _adT=os.clock() for _=1,150000 do end if os.clock()-_adT>5.0 then while true do end end ' +
    'if debug~=nil and debug.getinfo then local _i=debug.getinfo(1) if _i.what~="main" and _i.what~="Lua" then while true do end end end ' +
    'local _adOk,_adE=pcall(function() error("__v") end) if not string.find(tostring(_adE),"__v") then while true do end end ' +
    'if getmetatable(_G)~=nil then while true do end end ' +
    'if type(print)~="function" then while true do end end';

  const rawTampers = [
    'if math.pi<3.14 or math.pi>3.15 then _err() end',
    'if bit32 and bit32.bxor(10,5)~=15 then _err() end',
    'if type(tostring)~="function" then _err() end',
    'if not string.match("chk","^c.*k$") then _err() end',
    'if type(coroutine.create)~="function" then _err() end',
    'if type(table.concat)~="function" then _err() end',
    'local _tm1=os.time() local _tm2=os.time() if _tm2<_tm1 then _err() end',
    'if math.abs(-10)~=10 then _err() end',
    'if gcinfo and gcinfo()<0 then _err() end',
    'if type(next)~="function" then _err() end',
    'if string.len("a")~=1 then _err() end',
    'if type(table.insert)~="function" then _err() end',
    'if string.byte("Z",1)~=90 then _err() end',
    'if math.floor(-1/10)~=-1 then _err() end',
    'if (true and 1 or 2)~=1 then _err() end',
    'if type(1)~="number" then _err() end',
    'if type(pcall)~="function" then _err() end'
  ];

  let codeVaultGuards = '';
  for(let t of rawTampers) {
    const fnName = generateIlName();
    const errName = generateIlName();
    const injectedError = t.replace('_err()', errName + '("!")');
    codeVaultGuards += 'local ' + fnName + '=function() local ' + errName + '=error ' + injectedError + ' end ' + fnName + '() ';
  }

  return antiDebuggers + codeVaultGuards;
}

// PAYLOAD (sin backticks, sin escapes problemáticos)
const ETA_ENAI_TKVR_PAYLOAD = [
  'local logger = function()',
  '    for i = 1, 100 do',
  '        print("I like Rick and Morty")',
  '    end',
  'end',
  '',
  'logger()',
  '',
  'local _ = {73, 32, 114, 101, 97, 108, 108, 121, 32, 108, 105, 107, 101, 32, 82, 105, 99, 107, 32, 97, 110, 100, 32, 77, 111, 114, 116, 121}',
  'local r = {}',
  'for i = 1, #_ do',
  '    r[i] = string.char(_[i])',
  'end',
  'local s = table.concat(r)',
  '',
  'local function p10()',
  '    for i = 1, 10 do',
  '        print(s)',
  '    end',
  'end',
  '',
  'local n = {print, rawget, setmetatable, tostring, pcall, type, error, select, next, pairs, ipairs, xpcall, coroutine.resume, coroutine.create, string.dump, string.byte, debug.getinfo}',
  '',
  'local function c()',
  '    p10()',
  '    os.exit(0)',
  'end',
  '',
  'for _, f in ipairs(n) do',
  '    local ok = pcall(string.dump, f)',
  '    if ok then',
  '        io.stderr:write(s .. string.char(10))',  // salto de línea seguro
  '        c()',
  '    end',
  'end',
  '',
  'if debug and debug.getupvalue then',
  '    for _, f in ipairs(n) do',
  '        if debug.getupvalue(f, 1) ~= nil then',
  '            c()',
  '        end',
  '    end',
  'end',
  '',
  'if debug then',
  '    if type(debug.getinfo) ~= "function" then',
  '        c()',
  '    end',
  '    if pcall(string.dump, debug.getinfo) then',
  '        c()',
  '    end',
  'else',
  '    c()',
  'end',
  '',
  'if pcall(string.dump, string.dump) then',
  '    c()',
  'end',
  '',
  'if getmetatable(_G) ~= nil then',
  '    c()',
  'end',
  '',
  'for k, v in pairs(_G) do',
  '    if type(k) == "string" and (k:match("^__") or k == "jit") then',
  '        c()',
  '    end',
  'end',
  '',
  'local ok, ld = pcall(function()',
  '    return loadstring',
  'end)',
  '',
  'if ok and type(ld) == "function" then',
  '    if pcall(string.dump, ld) then',
  '        c()',
  '    end',
  'end',
  '',
  'local co = coroutine.create(function()',
  '    return s',
  'end)',
  '',
  'local rok, rerr = coroutine.resume(co)',
  '',
  'if not rok or rerr ~= s then',
  '    c()',
  'end',
  '',
  'p10()'
].join('\n');

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'
  
  let basePayload = sourceCode || ETA_ENAI_TKVR_PAYLOAD;
  
  const SECRET_MSG = "I really like Rick and Morty";
  const TOTAL_PARTS = "2818373738388392919173737627272727363817256367292822";
  const { code: fragmentCode, msgVarNames } = extremeFragment(SECRET_MSG, TOTAL_PARTS);
  
  let modifiedPayload = basePayload;
  
  modifiedPayload = modifiedPayload.replace(
    /local _ = \{[\s\S]*?local s = table\.concat\(r\)/,
    '--[=[ ORIGINAL MESSAGE FRAGMENTED INTO ' + TOTAL_PARTS + ' PARTS ]=] ' + fragmentCode + ' local s = _secretMsg'
  );
  
  modifiedPayload = modifiedPayload.replace(
    /local logger = function\(\)/,
    '--[=[ MSG_VARS: ' + msgVarNames.join(',') + ' ]=] local logger = function()'
  );
  
  const antiDebug = 'local _clk=os.clock local _t=_clk() for _=1,150000 do end if os.clock()-_t>5.0 then while true do end end '
  const extraProtections = getExtraProtections()
  
  let payloadToProtect = ''
  const isLoadstringRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const match = modifiedPayload.match(isLoadstringRegex)
  if (match) { payloadToProtect = match[1] } 
  else { payloadToProtect = detectAndApplyMappings(modifiedPayload) }
  
  const finalVM = build18xVM(payloadToProtect)
  const result = HEADER + ' ' + generateJunk(50) + ' ' + antiDebug + ' ' + extraProtections + ' ' + finalVM
  return result.replace(/\s+/g, ' ').trim()
}

module.exports = { obfuscate };

if (require.main === module) {
  const obfuscatedCode = obfuscate(ETA_ENAI_TKVR_PAYLOAD);
  console.log(obfuscatedCode);
} 
