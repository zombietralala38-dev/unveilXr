// ------------------------------------------------------------
//  Seak Obfuscator - v5 (VM con handlers repartidos, sin XOR)
// ------------------------------------------------------------
const HEADER = `--[[ this code it's protected by Seak obfuscator ]]`

// Anti-env logger (puedes reemplazar este string por tu versión ofuscada, pero asegúrate de que sea sintácticamente válido)
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
//  NUEVA VM CON HANDLERS REPARTIDOS (sin XOR)
// ----------------------------------------------------------------------
function buildScatteredVM(payloadStr) {
  // 1. Definimos el esqueleto del bucle principal de la VM
  const vmName = randomName()  // nombre de la función VM
  const bytesVar = randomName()
  const constsVar = randomName()
  const stackVar = randomName()
  const spVar = randomName()
  const ipVar = randomName()
  const handlersTableVar = randomName()  // tabla que contendrá las funciones handler

  // 2. Generamos una función handler para cada opcode (1..29)
  const opHandlers = {}
  const handlerNames = []
  const handlerDefs = []  // aquí guardaremos las definiciones de funciones sueltas que esparciremos

  // Función que crea el cuerpo de un handler dado un opcode
  function makeHandlerBody(op) {
    switch(op) {
      case 1: return `local v = ${constsVar}[${bytesVar}[${ipVar}] + 1]; ${spVar} = ${spVar} + 1; ${stackVar}[${spVar}] = v; ${ipVar} = ${ipVar} + 1`
      case 2: return `${spVar} = ${spVar} + 1; ${stackVar}[${spVar}] = nil`
      case 3: return `${spVar} = ${spVar} + 1; ${stackVar}[${spVar}] = true`
      case 4: return `${spVar} = ${spVar} + 1; ${stackVar}[${spVar}] = false`
      case 5: return `local v = _G[${constsVar}[${bytesVar}[${ipVar}] + 1]]; ${spVar} = ${spVar} + 1; ${stackVar}[${spVar}] = v; ${ipVar} = ${ipVar} + 1`
      case 6: return `local v = ${stackVar}[${spVar}]; ${spVar} = ${spVar} - 1; _G[${constsVar}[${bytesVar}[${ipVar}] + 1]] = v; ${ipVar} = ${ipVar} + 1`
      case 7: return `local a = ${stackVar}[${spVar}]; ${spVar} = ${spVar} - 1; local b = ${stackVar}[${spVar}]; ${stackVar}[${spVar}] = b + a`
      case 8: return `local a = ${stackVar}[${spVar}]; ${spVar} = ${spVar} - 1; local b = ${stackVar}[${spVar}]; ${stackVar}[${spVar}] = b - a`
      case 9: return `local a = ${stackVar}[${spVar}]; ${spVar} = ${spVar} - 1; local b = ${stackVar}[${spVar}]; ${stackVar}[${spVar}] = b * a`
      case 10: return `local a = ${stackVar}[${spVar}]; ${spVar} = ${spVar} - 1; local b = ${stackVar}[${spVar}]; ${stackVar}[${spVar}] = b / a`
      case 11: return `local a = ${stackVar}[${spVar}]; ${spVar} = ${spVar} - 1; local b = ${stackVar}[${spVar}]; ${stackVar}[${spVar}] = b == a`
      case 12: return `local a = ${stackVar}[${spVar}]; ${spVar} = ${spVar} - 1; local b = ${stackVar}[${spVar}]; ${stackVar}[${spVar}] = b ~= a`
      case 13: return `local a = ${stackVar}[${spVar}]; ${spVar} = ${spVar} - 1; local b = ${stackVar}[${spVar}]; ${stackVar}[${spVar}] = b < a`
      case 14: return `local a = ${stackVar}[${spVar}]; ${spVar} = ${spVar} - 1; local b = ${stackVar}[${spVar}]; ${stackVar}[${spVar}] = b > a`
      case 15: return `local a = ${stackVar}[${spVar}]; ${spVar} = ${spVar} - 1; local b = ${stackVar}[${spVar}]; ${stackVar}[${spVar}] = b <= a`
      case 16: return `local a = ${stackVar}[${spVar}]; ${spVar} = ${spVar} - 1; local b = ${stackVar}[${spVar}]; ${stackVar}[${spVar}] = b >= a`
      case 17: return `if not ${stackVar}[${spVar}] then ${spVar} = ${spVar} - 1; ${ipVar} = ${bytesVar}[${ipVar}] - 1 else ${spVar} = ${spVar} - 1 end; ${ipVar} = ${ipVar} + 1`
      case 18: return `${ipVar} = ${bytesVar}[${ipVar}]`
      case 19: return `local f = ${stackVar}[${spVar}]; ${spVar} = ${spVar} - 1; local n = ${bytesVar}[${ipVar}]; ${ipVar} = ${ipVar} + 1; local args = {}; for i = n, 1, -1 do args[i] = ${stackVar}[${spVar}]; ${spVar} = ${spVar} - 1 end; f(unpack(args, 1, n))`
      case 20: return `local f = ${stackVar}[${spVar}]; ${spVar} = ${spVar} - 1; local n = ${bytesVar}[${ipVar}]; ${ipVar} = ${ipVar} + 1; local args = {}; for i = n, 1, -1 do args[i] = ${stackVar}[${spVar}]; ${spVar} = ${spVar} - 1 end; local r = {f(unpack(args, 1, n))}; for i = 1, ${bytesVar}[${ipVar}] do ${spVar} = ${spVar} + 1; ${stackVar}[${spVar}] = r[i] end; ${ipVar} = ${ipVar} + 1`
      case 21: return `return`
      case 22: return `${stackVar}[${spVar}] = - ${stackVar}[${spVar}]`
      case 23: return `${stackVar}[${spVar}] = not ${stackVar}[${spVar}]`
      case 24: return `local a = ${stackVar}[${spVar}]; ${spVar} = ${spVar} - 1; local b = ${stackVar}[${spVar}]; ${stackVar}[${spVar}] = b % a`
      case 25: return `local a = ${stackVar}[${spVar}]; ${spVar} = ${spVar} - 1; local b = ${stackVar}[${spVar}]; ${stackVar}[${spVar}] = b ^ a`
      case 26: return `local a = ${stackVar}[${spVar}]; ${spVar} = ${spVar} - 1; local b = ${stackVar}[${spVar}]; ${stackVar}[${spVar}] = b .. a`
      case 27: return `${stackVar}[${spVar}] = # ${stackVar}[${spVar}]`
      case 28: return `local k = ${stackVar}[${spVar}]; ${spVar} = ${spVar} - 1; local t = ${stackVar}[${spVar}]; ${stackVar}[${spVar}] = t[k]`
      case 29: return `local v = ${stackVar}[${spVar}]; ${spVar} = ${spVar} - 1; local k = ${stackVar}[${spVar}]; ${spVar} = ${spVar} - 1; local t = ${stackVar}[${spVar}]; t[k] = v`
      default: return ``
    }
  }

  // Generar un nombre para cada handler y almacenarlo
  const opNames = []
  const opIndices = []
  for (let i = 1; i <= 29; i++) {
    const hName = randomName()
    opNames.push(hName)          // nombre del handler
    opIndices.push(i)            // número de opcode
    const body = makeHandlerBody(i)
    // Cada definición de función se mete en un array que luego esparciremos entre la basura
    handlerDefs.push(`local ${hName} = function() ${body} end`)
  }

  // 3. Construir la parte de constantes y bytes (igual que antes)
  const constSet = new Set(payloadStr)
  constSet.add("loadstring")
  // Añadimos claves globales útiles si se desea
  const constsList = Array.from(constSet)
  const constIndexMap = new Map()
  constsList.forEach((str, idx) => constIndexMap.set(str, idx))

  const bytes = []
  let firstChar = true
  for (const ch of payloadStr) {
    const constIdx = constIndexMap.get(ch)
    bytes.push(1, constIdx)
    if (!firstChar) bytes.push(26)  // concat
    firstChar = false
  }
  const loadIdx = constIndexMap.get("loadstring")
  bytes.push(5, loadIdx)      // push global
  bytes.push(20, 1, 1)        // call con 1 arg y 1 resultado
  bytes.push(19, 0)           // call sin args
  bytes.push(21)              // return

  // Convertir a strings ofuscadas
  const constsStr = constsList.map(str => {
    if (str.length === 1) {
      return `string.char(${heavyMath(str.charCodeAt(0))})`
    } else {
      const chars = str.split('').map(c => heavyMath(c.charCodeAt(0))).join(',')
      return `string.char(${chars})`
    }
  }).join(', ')
  const bytesStr = bytes.map(num => heavyMath(num)).join(', ')

  // 4. Construir el bucle principal que usa la tabla de handlers
  const mainLoop = `
local ${bytesVar} = {${bytesStr}}
local ${constsVar} = {${constsStr}}
local ${stackVar}, ${spVar} = {}, 0
local ${ipVar} = 1
local ${handlersTableVar} = nil  -- se llenará después

local function ${vmName}()
  while ${ipVar} <= #${bytesVar} do
    local op = ${bytesVar}[${ipVar}]
    ${ipVar} = ${ipVar} + 1
    ${handlersTableVar}[op]()   -- despacho
  end
end
`

  // 5. Esparcir las definiciones de los handlers entre la basura
  const junkLines = []
  for (let i = 0; i < 50; i++) {
    junkLines.push(generateSingleJunkLine())
  }

  // Insertamos cada handler en una posición aleatoria de la basura (pero no al principio ni al final)
  for (const def of handlerDefs) {
    const pos = Math.floor(Math.random() * (junkLines.length - 1)) + 1
    junkLines.splice(pos, 0, def)
  }

  // También insertamos la construcción de la tabla de handlers en un lugar aleatorio
  const tableCreation = `local ${handlersTableVar} = {${opIndices.map(i => `[${heavyMath(i)}] = ${opNames[i-1]}`).join(', ')}}`
  junkLines.splice(Math.floor(Math.random() * junkLines.length), 0, tableCreation)

  // Llamada a la VM después de la basura
  junkLines.push(`${vmName}()`)

  const scatteredCode = junkLines.join(' ')

  // 6. Envolver en una capa falsa adicional (usando el mismo sistema de antes)
  return mainLoop + " " + scatteredCode
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

  const vmBlock = buildScatteredVM(payloadToProtect)

  return `${HEADER}\n${ANTI_ENV_LOGGER_SNIPPET}\n${combinedJunk} ${antiDebug} ${extraProtections} ${vmBlock}`
}

module.exports = { obfuscate }
