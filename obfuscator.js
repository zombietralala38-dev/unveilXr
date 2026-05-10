// ------------------------------------------------------------
//  Seak Obfuscator - v4 (Custom VM, sin XOR en bytecode)
// ------------------------------------------------------------
const HEADER = `--[[ this code it's protected by Seak obfuscator ]]`

const ANTI_ENV_LOGGER_SNIPPET = `local q=bit32.bxor local t_=game.Players.LocalPlayer local h=t_.CameraMinZoomDistance local g,o_,k,p,l_,n_,d_;n_,d_={},function(c,a_,r_)n_[a_]=q(r_,1752)-q(c,35158)return n_[a_]end;l_=n_[27372]or d_(24643,27372,119719)while l_~=19904 do if l_>=33475 then if l_<46624 then if l_<=41315 then if l_<34725 then l_=n_[-17633]or d_(14697,-17633,64295)continue elseif l_>34725 then if o_ then l_=n_[-3212]or d_(8399,-3212,96739)continue end l_=n_[22829]or d_(34757,22829,14329)else o_,l_=k,41315 end else o_,l_=g,54690 end elseif l_>=54690 then if l_<=57644 then if l_>54690 then o_,l_=g,3661 else l_,k=46624,o_ end else l_,k=n_[-31843]or d_(14262,-31843,96594),pcall(function()local j,m,b_,s_;b_,m={},function(i_,e_,f_)b_[i_]=q(e_,52903)-q(f_,44226)return b_[i_]end;s_=b_[-5612]or m(-5612,115149,24558)repeat if s_<=7230 then j,s_=-5,b_[-30116]or m(-30116,121660,56548)else t_.CameraMinZoomDistance,s_=j,b_[17256]or m(17256,63019,46886)continue end until s_==7336 end)end elseif l_>46624 then k,l_=t_.CameraMinZoomDistance,1999 else k,l_=print(k),n_[-25054]or d_(31046,-25054,95243)end elseif l_>23608 then if l_>28143 then g,l_=p,57644 elseif l_<=25653 then o_,l_=k,28143 else if not o_ then l_=n_[-1606]or d_(4233,-1606,44788)continue end l_=23608 end elseif l_<=3661 then if l_<3491 then l_,k=25653,k~=h elseif l_>3491 then l_,k=n_[21609]or d_(25456,21609,96019),o_ else g,l_=p,n_[-27119]or d_(2776,-27119,79075)end elseif l_>8846 then p,l_='detected',n_[12006]or d_(32140,12006,90182)else p,l_='pass',3491 end end`

function randomName() {
  return "_" + Math.random().toString(36).substring(2, 8) + Math.floor(Math.random() * 1000)
}

function pickHandlers(count) {
  const used = new Set()
  const result = []
  while (result.length < count) {
    const name = randomName() + Math.floor(Math.random() * 99)
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
      if (tech.includes("Aggressive Renaming")) { const v = randomName(); headers += `local ${v}="${word}";`; replacement = v; }
      else if (tech.includes("String to Math")) replacement = `string.char(${word.split('').map(c => heavyMath(c.charCodeAt(0))).join(',')})`;
      else if (tech.includes("Mixed Boolean Arithmetic")) replacement = `((${mba()}==1 or true)and"${word}")`;
      regex.lastIndex = 0;
      modified = modified.replace(regex, (match) => `game[${replacement}]`);
    }
  }
  return headers + modified;
}

function generateSingleJunkLine() {
  const r = Math.random()
  if (r < 0.2) return `local ${randomName()}=${heavyMath(Math.floor(Math.random() * 999))} `
  else if (r < 0.35) return `local ${randomName()}=string.char(${heavyMath(Math.floor(Math.random()*255))}) `
  else if (r < 0.5) return `if not(${heavyMath(1)}==${heavyMath(1)}) then local x=1 end `
  else if (r < 0.7) {
    const tp = randomName();
    return `if type(nil)=="number" then while true do local ${tp}=1 end end `
  } else if (r < 0.85) {
    const vt = randomName();
    return `do local ${vt}={} ${vt}["_"]=1 ${vt}=nil end `
  } else {
    return `if type(math.pi)=="string" then while true do end end `
  }
}

function generateJunk(lines = 100) {
  let j = ''
  for (let i = 0; i < lines; i++) j += generateSingleJunkLine()
  return j
}

function applyCFF(blocks) {
  const stateVar = randomName()
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

function getExtraProtections() {
  const antiDebuggers = `
    if getmetatable(_G)~=nil then while true do end end 
    if type(print)~="function" then while true do end end
  `
  const rawTampers = [
    `if math.pi<3.14 or math.pi>3.15 then _err() end`,
    `if bit32 and bit32.bxor(10,5)~=15 then _err() end`,
    `if type(tostring)~="function" then _err() end`,
    `if not string.match("chk","^c.*k$") then _err() end`,
    `if type(coroutine.create)~="function" then _err() end`,
    `if type(table.concat)~="function" then _err() end`,
    `local _tm1=tick() local _tm2=tick() if _tm2<_tm1 then _err() end`,
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
  ]
  let codeVaultGuards = ""
  for(let t of rawTampers) {
    const fnName = randomName(), errName = randomName()
    codeVaultGuards += `local ${fnName}=function() local ${errName}=error ${t.replace("_err()", `${errName}("!")`)} end ${fnName}() `
  }
  return antiDebuggers + codeVaultGuards
}

function buildAntiEnvProtection() {
  const antiEnvCode = `local _r,_n={},0 local function _push(v) _n=_n+1;_r[_n]=v and 1 or 0 end do local p=true pcall(function() local ts=game:GetService("TweenService") if not ts then return end local f=Instance.new("Frame") local tw=ts:Create(f,TweenInfo.new(0.1),{Size=UDim2.new(1,0,1,0)}) local t=os.clock() tw:Play() tw.Completed:Wait() if math.abs(os.clock()-t-0.1)>0.05 then p=false end f:Destroy() end) _push(p) end do local p=true pcall(function() local s=Instance.new("Sound") if pcall(function() s.PlaybackLoudness=99 end) then p=false end s:Destroy() end) _push(p) end do local p=true pcall(function() if not Instance then return end local f=Instance.new("Frame") if typeof(f)~="Instance" then p=false end f:Destroy() end) _push(p) end do local p=true pcall(function() if not game then return end if game.PlaceId==game.GameId then p=false end end) _push(p) end do local p=true pcall(function() local tb=Instance.new("TextBox") if pcall(function() tb.TextBounds=Vector2.new(1,1) end) then p=false end tb:Destroy() end) _push(p) end local _s=0 for i=1,_n do _s=_s+_r[i] end if _s~=_n then while true do end end`;

  const fragSize = 4 + Math.floor(Math.random() * 3);
  const fragments = [];
  for (let i = 0; i < antiEnvCode.length; i += fragSize) {
    fragments.push(antiEnvCode.slice(i, i + fragSize));
  }

  const tableName = randomName();
  const fragmentLines = [];
  for (const frag of fragments) {
    const bytes = frag.split('').map(c => heavyMath(c.charCodeAt(0)));
    fragmentLines.push(`${tableName}[#${tableName}+1] = string.char(${bytes.join(',')})`);
  }

  const initLine = `local ${tableName} = {}`;
  const reconstructLine = `local _reco = table.concat(${tableName}); assert(loadstring(_reco))();`;

  return { initLine, fragmentLines, reconstructLine };
}

// ----------------------------------------------------------------------
//  NUEVA VM PERSONALIZADA (sin XOR) – generación de bytecode
// ----------------------------------------------------------------------
function buildCustomVMExecution(payloadStr) {
  // 1. El intérprete
  const vmFuncCode = `
local function _VM(bytes, consts)
  local stack = {}
  local sp = 0
  local ip = 1
  local push = function(v) sp = sp + 1; stack[sp] = v end
  local pop  = function() local v = stack[sp]; sp = sp - 1; return v end

  while ip <= #bytes do
    local op = bytes[ip]
    ip = ip + 1
    if op == 1 then
      push(consts[bytes[ip] + 1])
      ip = ip + 1
    elseif op == 2 then
      push(nil)
    elseif op == 3 then
      push(true)
    elseif op == 4 then
      push(false)
    elseif op == 5 then
      push(_G[consts[bytes[ip] + 1]])
      ip = ip + 1
    elseif op == 6 then
      _G[consts[bytes[ip] + 1]] = pop()
      ip = ip + 1
    elseif op == 7 then
      local a, b = pop(), pop()
      push(b + a)
    elseif op == 8 then
      local a, b = pop(), pop()
      push(b - a)
    elseif op == 9 then
      local a, b = pop(), pop()
      push(b * a)
    elseif op == 10 then
      local a, b = pop(), pop()
      push(b / a)
    elseif op == 11 then
      local a, b = pop(), pop()
      push(b == a)
    elseif op == 12 then
      local a, b = pop(), pop()
      push(b ~= a)
    elseif op == 13 then
      local a, b = pop(), pop()
      push(b < a)
    elseif op == 14 then
      local a, b = pop(), pop()
      push(b > a)
    elseif op == 15 then
      local a, b = pop(), pop()
      push(b <= a)
    elseif op == 16 then
      local a, b = pop(), pop()
      push(b >= a)
    elseif op == 17 then
      if not pop() then ip = bytes[ip] + 1 else ip = ip + 1 end
    elseif op == 18 then
      ip = bytes[ip] + 1
    elseif op == 19 then
      local f = pop()
      local n = bytes[ip]; ip = ip + 1
      local args = {}
      for i = n, 1, -1 do args[i] = pop() end
      f(unpack(args, 1, n))
    elseif op == 20 then
      local f = pop()
      local n = bytes[ip]; ip = ip + 1
      local args = {}
      for i = n, 1, -1 do args[i] = pop() end
      local r = {f(unpack(args, 1, n))}
      for i = 1, bytes[ip] do push(r[i]) end
      ip = ip + 1
    elseif op == 21 then
      return
    elseif op == 22 then
      push(-pop())
    elseif op == 23 then
      push(not pop())
    elseif op == 24 then
      local a, b = pop(), pop()
      push(b % a)
    elseif op == 25 then
      local a, b = pop(), pop()
      push(b ^ a)
    elseif op == 26 then
      local a, b = pop(), pop()
      push(b .. a)
    elseif op == 27 then
      push(#pop())
    elseif op == 28 then
      local t = pop()
      local k = pop()
      push(t[k])
    elseif op == 29 then
      local t = pop()
      local k = pop()
      local v = pop()
      t[k] = v
    end
  end
end
`

  // 2. Construir las tablas consts y bytes
  const constSet = new Set()
  for (const ch of payloadStr) {
    constSet.add(ch)
  }
  constSet.add("loadstring")
  // Añadir algunas claves globales que puedan usarse (opcional)
  // constSet.add("assert")  // no necesario

  const constsList = Array.from(constSet)  // orden de inserción, no importa
  const constIndexMap = new Map()
  constsList.forEach((str, idx) => constIndexMap.set(str, idx))  // idx 0-based

  // Generar bytecode
  const bytes = []

  // Empuja cada carácter de la cadena y concatena
  let firstChar = true
  for (const ch of payloadStr) {
    const constIdx = constIndexMap.get(ch)
    bytes.push(1, constIdx)  // PUSH_CONST
    if (!firstChar) {
      bytes.push(26)  // CONCAT
    }
    firstChar = false
  }

  // Ahora la pila tiene la cadena completa.
  // Empuja _G["loadstring"]
  const loadIdx = constIndexMap.get("loadstring")
  bytes.push(5, loadIdx)   // PUSH_GLOBAL

  // Llama loadstring con 1 argumento y espera 1 resultado
  bytes.push(20, 1, 1)    // CALL_RET nargs=1, nresults=1

  // La pila ahora tiene la función compilada.
  // Llámala con 0 argumentos (ejecuta el código)
  bytes.push(19, 0)        // CALL nargs=0

  // Opcional: RETURN
  bytes.push(21)

  // 3. Convertir a código Lua ofuscado
  // Consts: array de strings ofuscadas con string.char(...)
  const constsStr = constsList.map(str => {
    if (str.length === 1) {
      return `string.char(${heavyMath(str.charCodeAt(0))})`
    } else {
      // Para la cadena "loadstring", también la ofuscamos carácter a carácter
      const chars = str.split('').map(c => heavyMath(c.charCodeAt(0))).join(',')
      return `string.char(${chars})`
    }
  }).join(', ')

  // Bytes: array de números ofuscados con heavyMath
  const bytesStr = bytes.map(num => heavyMath(num)).join(', ')

  // 4. Código completo que ejecuta la VM
  const finalCode = `
${vmFuncCode}
local _bytes = {${bytesStr}}
local _consts = {${constsStr}}
_VM(_bytes, _consts)
`

  // Envolver en una capa falsa (opcional) para mezclar con el estilo existente
  const wrapped = buildSingleVM(finalCode, 3)  // Un par de funciones falsas alrededor
  return wrapped
}

// Función auxiliar para envolver en un VM falso (igual que antes)
function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount)
  const realIdx = Math.floor(Math.random() * handlerCount)
  const DISPATCH = randomName()
  let out = `local lM={} `
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx)
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(8)} ${innerCode} end `
    else
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(4)} return nil end `
  }
  out += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++)
    out += `[${heavyMath(i + 1)}]=${handlers[i]},`
  out += `} `
  let execBlocks = []
  for (let i = 0; i < handlers.length; i++)
    execBlocks.push(`${DISPATCH}[${heavyMath(i + 1)}](lM)`)
  out += applyCFF(execBlocks)
  return out
}

// ----------------------------------------------------------------------
//  OFUSCADOR PRINCIPAL
// ----------------------------------------------------------------------
function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'

  const antiEnv = buildAntiEnvProtection()

  const lines = []
  lines.push(antiEnv.initLine)

  const totalJunk = 100
  for (let i = 0; i < totalJunk; i++) {
    lines.push(generateSingleJunkLine())
  }

  for (const stmt of antiEnv.fragmentLines) {
    const pos = Math.floor(Math.random() * (lines.length - 1)) + 1
    lines.splice(pos, 0, stmt)
  }

  lines.push(antiEnv.reconstructLine)

  const combinedJunk = lines.join(' ')

  const antiDebug = `local _t=tick() for _=1,150000 do end if tick()-_t>5.0 then while true do end end `
  const extraProtections = getExtraProtections()

  let payloadToProtect = ""
  const isLoadstringRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const match = sourceCode.match(isLoadstringRegex)
  if (match) { payloadToProtect = match[1] } 
  else { payloadToProtect = detectAndApplyMappings(sourceCode) }

  // Usar la nueva VM personalizada sin XOR
  const vmBlock = buildCustomVMExecution(payloadToProtect)

  // HEADER al principio, luego anti‑env logger, luego el resto
  return `${HEADER}\n${ANTI_ENV_LOGGER_SNIPPET}\n${combinedJunk} ${antiDebug} ${extraProtections} ${vmBlock}`
}

module.exports = { obfuscate }
