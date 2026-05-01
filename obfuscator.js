// ============================================================
// LuaObfuscator + Anti‑Env & 30‑capas VM  –  unveilX style
// ============================================================

const HEADER = `--[[ this code its protected by unveilX | https://discord.gg/DU35Mhyhq]]`;

// ----------  Nombres aleatorios  ----------
const usedNames = new Set();
function genName(prefix = '') {
  let name;
  do {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
    name = prefix;
    const len = 5 + Math.floor(Math.random() * 8);
    for (let i = 0; i < len; i++) name += chars[Math.floor(Math.random() * chars.length)];
    name += Math.floor(Math.random() * 99999);
  } while (usedNames.has(name));
  usedNames.add(name);
  return name;
}

// ----------  Expresiones matemáticas ligeras  ----------
function lightMath(n) {
  if (Math.random() < 0.85) return n.toString();
  const a = Math.floor(Math.random() * 21) + 4;
  const b = Math.floor(Math.random() * 7) + 2;
  return `((${n}+${a}-${a})*${b}/${b})`;
}

function runtimeString(s) {
  return `string.char(${s.split('').map(c => lightMath(c.charCodeAt(0))).join(',')})`;
}

// ----------  Mapeo de palabras clave comunes  ----------
const MAPEO = {
  "ScreenGui": "Aggressive Renaming",
  "Frame": "String to Math",
  "TextLabel": "Table Indirection",
  "TextButton": "Mixed Boolean Arithmetic",
  "Humanoid": "Dynamic Junk",
  "Player": "Fake Flow",
  "RunService": "Virtual Machine",
  "TweenService": "Fake Flow",
  "Players": "Fake Flow"
};

function detectAndApplyMappings(code) {
  let modified = code, headers = "";
  for (const [word, tech] of Object.entries(MAPEO)) {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    if (regex.test(modified)) {
      let replacement = `"${word}"`;
      if (tech.includes("Aggressive Renaming")) {
        const v = genName();
        headers += `local ${v}="${word}" `;
        replacement = v;
      } else if (tech.includes("String to Math")) {
        replacement = `string.char(${word.split('').map(c => c.charCodeAt(0)).join(',')})`;
      } else if (tech.includes("Mixed Boolean Arithmetic")) {
        replacement = `((1==1 or true)and"${word}")`;
      }
      regex.lastIndex = 0;
      modified = modified.replace(regex, () => `game[${replacement}]`);
    }
  }
  return headers + modified;
}

// ----------  Generación de bloques basura  ----------
function generateStrongJunk(lines) {
  let block = '';
  for (let i = 0; i < lines; i++) {
    const r = Math.random();
    if (r < 0.15) {
      block += `if pcall(function() return #{1,2,3}==3 end) then local ${genName('_')}=${lightMath(1)} end `;
    } else if (r < 0.3) {
      block += `pcall(function() local ${genName('x')}=#{[1]=true} return ${genName('x')} end) `;
    } else if (r < 0.45) {
      block += `if pcall(function() return type(rawget)=='function' end) then local ${genName('y')}=true end `;
    } else if (r < 0.6) {
      block += `for _=1,${lightMath(1)} do pcall(function() local ${genName('z')}='${genName('')}' end) end `;
    } else if (r < 0.75) {
      block += `pcall(function() error() end) `;
    } else {
      block += `local ${genName('u')}=pcall(function() return math.sqrt(${lightMath(144)}) end) `;
    }
  }
  return block;
}

function junkBlocks(totalLines, blockSize = 30) {
  let full = '';
  for (let i = 0; i < totalLines; i += blockSize) {
    const lines = Math.min(blockSize, totalLines - i);
    full += `do ${generateStrongJunk(lines)} end `;
  }
  return full;
}

// ----------  Máquina virtual de 30 capas  ----------
function buildTrueVM(payloadStr) {
  const STACK = genName();
  const chunkSize = 15;
  const realChunks = [];
  for (let i = 0; i < payloadStr.length; i += chunkSize)
    realChunks.push(payloadStr.slice(i, i + chunkSize));

  const seed = Math.floor(Math.random() * 200) + 50;
  const saltVal = Math.floor(Math.random() * 250) + 1;
  const KEY = genName();
  const SALT = genName();
  const memNames = [];
  let realOrder = [];
  let globalIndex = 0;
  const totalChunks = realChunks.length * 3;
  let currentReal = 0;

  let vmCore = `local ${STACK}={} local ${KEY}=${lightMath(seed)} local ${SALT}=${lightMath(saltVal)} `;

  for (let i = 0; i < totalChunks; i++) {
    const memName = genName();
    memNames.push(memName);
    if (currentReal < realChunks.length && (Math.random() > 0.5 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1);
      const chunk = realChunks[currentReal];
      let encBytes = [];
      for (let j = 0; j < chunk.length; j++) {
        const enc = (chunk.charCodeAt(j) + seed + (globalIndex * saltVal)) % 256;
        encBytes.push(lightMath(enc));
        globalIndex++;
      }
      vmCore += `local ${memName}={${encBytes.join(',')}} `;
      currentReal++;
    } else {
      let fakeBytes = [];
      let fakeLen = Math.floor(Math.random() * 20) + 5;
      for (let j = 0; j < fakeLen; j++) fakeBytes.push(lightMath(Math.floor(Math.random() * 255)));
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `;
    }
  }

  const poolVar = genName('_pool');
  const ORDER = genName('_order');
  const idxVar = genName('_idx');
  const byteVar = genName('_byte');

  vmCore += `local ${poolVar}={${memNames.join(',')}} `;
  vmCore += `local ${ORDER}={${realOrder.map(n => lightMath(n)).join(',')}} `;
  vmCore += `local _gIdx=0 `;
  vmCore += `for _,${idxVar} in ipairs(${ORDER}) do `;
  vmCore += `for _,${byteVar} in ipairs(${poolVar}[${idxVar}]) do `;
  vmCore += `table.insert(${STACK},string.char(math.floor((${byteVar}-${KEY}-_gIdx*${SALT})%256))) `;
  vmCore += `_gIdx=_gIdx+1 end end `;
  vmCore += `local _e=table.concat(${STACK}) ${STACK}=nil `;

  const ASSERT = `getfenv()[${runtimeString("assert")}]`;
  const LOADSTRING = `getfenv()[${runtimeString("loadstring")}]`;
  const GAME = `getfenv()[${runtimeString("game")}]`;
  const HTTPGET = runtimeString("HttpGet");
  if (payloadStr.includes("http"))
    vmCore += `${ASSERT}(${LOADSTRING}(${GAME}[${HTTPGET}](${GAME},_e)))() `;
  else
    vmCore += `${ASSERT}(${LOADSTRING}(_e))() `;

  return vmCore;
}

function applyCFF(blocks, stateVar) {
  let lua = `local ${stateVar}=${lightMath(1)} `;
  lua += `while true do `;
  for (let i = 0; i < blocks.length; i++) {
    if (i === 0) lua += `if ${stateVar}==${lightMath(1)} then ${blocks[i]} ${stateVar}=${lightMath(2)} `;
    else lua += `elseif ${stateVar}==${lightMath(i+1)} then ${blocks[i]} ${stateVar}=${lightMath(i+2)} `;
  }
  lua += `elseif ${stateVar}==${lightMath(blocks.length+1)} then break end end `;
  return lua;
}

function buildSingleVM(innerCode, handlerCount) {
  const handlers = [];
  const used = new Set();
  const bases = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  while (handlers.length < handlerCount) {
    const base = bases[Math.floor(Math.random() * bases.length)];
    const name = base + Math.floor(Math.random() * 99);
    if (!used.has(name)) { used.add(name); handlers.push(name); }
  }

  const realIdx = Math.floor(Math.random() * handlerCount);
  const DISPATCH = genName('d');
  let out = `local lM={} `;
  for (let i = 0; i < handlers.length; i++) {
    const fakeJunk = junkBlocks(2, 5);
    if (i === realIdx)
      out += `local ${handlers[i]}=function(lM) local lM=lM ${fakeJunk} ${innerCode} end `;
    else
      out += `local ${handlers[i]}=function(lM) local lM=lM ${fakeJunk} return nil end `;
  }
  out += `local ${DISPATCH}={`;
  for (let i = 0; i < handlers.length; i++) out += `[${lightMath(i+1)}]=${handlers[i]},`;
  out += `} `;

  const execBlocks = handlers.map((_, i) => `${DISPATCH}[${lightMath(i+1)}](lM)`);
  const stateVar = genName('s');
  out += applyCFF(execBlocks, stateVar);
  return `do ${out} end`;
}

function build30xVM(payload) {
  let vm = buildTrueVM(payload);
  for (let i = 0; i < 29; i++)
    vm = buildSingleVM(vm, Math.floor(Math.random() * 3) + 3);
  return vm;
}

// (Vacía – se pueden añadir protecciones extra aquí)
function megaProtections() {
  return '';
}

// =====================  LuaObfuscator (Anti‑Env)  =====================
class LuaObfuscator {
  constructor() {
    // Script de verificación anti‑env silencioso
    this.antiEnvScript = `
      local _anti_pass = true
      local function fail(msg)
        -- Silently mark as failed
        _anti_pass = false
        return nil
      end

      local ok
      local Players = game:GetService('Players')
      local lp = Players.LocalPlayer
      if typeof(lp) ~= 'Instance' then fail(101) end
      if type(lp.Kick) ~= 'function' then fail(102) end
      ok = pcall(function() lp:Kick('m') end); if not ok then fail(103) end
      ok = pcall(lp.Kick, lp, 'm2'); if not ok then fail(104) end
      ok = pcall(function() lp:Kick() end); if not ok then fail(105) end
      ok = xpcall(function() lp:Kick('x') end, function(e) return e end); if not ok then fail(106) end
      ok = pcall(function() game:GetService('Players').LocalPlayer:Kick('chained') end)
      if not ok then fail(107) end

      local part = Instance.new('Part')
      local sig = part:GetPropertyChangedSignal('Name')
      if typeof(sig) ~= 'RBXScriptSignal' then fail(201) end
      if type(sig.Connect) ~= 'function' then fail(202) end

      local con = sig:Connect(function() end)
      if typeof(con) ~= 'RBXScriptConnection' then fail(203) end
      if con.Connected ~= true then fail(204) end
      if type(con.Disconnect) ~= 'function' then fail(205) end
      con:Disconnect()
      if con.Connected ~= false then fail(206) end

      local con2 = sig:Connect(function() end)
      if con == con2 then fail(207) end
      if con2.Connected ~= true then fail(208) end

      ok = pcall(con2.Disconnect, con2); if not ok then fail(209) end
      if con2.Connected ~= false then fail(210) end

      ok = pcall(function() con2:Disconnect() end); if not ok then fail(211) end

      local con3 = sig:Once(function() end)
      if typeof(con3) ~= 'RBXScriptConnection' then fail(301) end
      if con3.Connected ~= true then fail(302) end
      con3:Disconnect()
      if con3.Connected ~= false then fail(303) end

      local con4 = sig:ConnectParallel(function() end)
      if typeof(con4) ~= 'RBXScriptConnection' then fail(401) end
      if con4.Connected ~= true then fail(402) end
      con4:Disconnect()
      if con4.Connected ~= false then fail(403) end

      local rs = game:GetService('RunService')
      local hb = rs.Heartbeat
      if typeof(hb) ~= 'RBXScriptSignal' then fail(501) end
      local con5 = hb:Connect(function() end)
      if typeof(con5) ~= 'RBXScriptConnection' then fail(502) end
      con5:Disconnect()
      if con5.Connected ~= false then fail(503) end

      local stepped = rs.Stepped
      if typeof(stepped) ~= 'RBXScriptSignal' then fail(504) end
      local con6 = stepped:Connect(function() end)
      if typeof(con6) ~= 'RBXScriptConnection' then fail(505) end
      con6:Disconnect()

      local uis = game:GetService('UserInputService')
      local ib = uis.InputBegan
      if typeof(ib) ~= 'RBXScriptSignal' then fail(506) end
      local con7 = ib:Connect(function() end)
      if typeof(con7) ~= 'RBXScriptConnection' then fail(507) end
      if con7.Connected ~= true then fail(508) end
      con7:Disconnect()
      if con7.Connected ~= false then fail(509) end

      local conA = sig:Connect(function() end)
      local conB = sig:Connect(function() end)
      conA:Disconnect()
      if conA.Connected ~= false then fail(601) end
      if conB.Connected ~= true then fail(602) end
      conB:Disconnect()
      if conB.Connected ~= false then fail(603) end

      if con ~= con then fail(701) end
      local conC = sig:Connect(function() end)
      if conC == con then fail(702) end
      conC:Disconnect()

      if typeof(game) ~= 'Instance' then fail(801) end
      if typeof(workspace) ~= 'Instance' then fail(802) end
      if typeof(part) ~= 'Instance' then fail(803) end
      if typeof(true) ~= 'boolean' then fail(804) end
      if typeof(false) ~= 'boolean' then fail(805) end
      if typeof('a') ~= 'string' then fail(806) end
      if typeof(1) ~= 'number' then fail(807) end
      if typeof(nil) ~= 'nil' then fail(808) end
      if typeof({}) ~= 'table' then fail(809) end

      local ff = Instance.new('ForceField')
      ff.Visible = true
      if ff.Visible ~= true then fail(901) end
      ff.Visible = false
      if ff.Visible ~= false then fail(902) end
      ff.Name = 'Custom'
      if ff.Name ~= 'Custom' then fail(903) end

      local att = Instance.new('Attachment')
      ff.Parent = att
      if ff.Parent ~= att then fail(904) end

      if ff.ClassName ~= 'ForceField' then fail(905) end

      ok = pcall(function() return ff.Parent end); if not ok then fail(1001) end
      ok = pcall(function() ff.Visible = true end); if not ok then fail(1002) end
      local r1, r2 = pcall(function() return ff.ClassName end)
      if not r1 or r2 ~= 'ForceField' then fail(1003) end

      return _anti_pass
    `;
  }

  // Envuelve el código del usuario con la verificación anti‑env
  obfuscate(luaCode) {
    const escapedUserCode = luaCode
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/"/g, '\\"');

    return `
-- Wrapper anti‑env silencioso
(function()
  local anti_ok, anti_pass = pcall(function()
    ${this.antiEnvScript}
  end)

  if not anti_ok or not anti_pass then return end  -- Entorno alterado, salimos

  -- Ejecutamos el payload real
  local user_ok, user_err = pcall(function()
    local fn, err = loadstring("${escapedUserCode}")
    if fn then fn() end
  end)
end)();
`;
  }
}

// =====================  OFUSCADOR PRINCIPAL  =====================
function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR';

  // Extraer URL si es un loader típico
  let payload = "";
  const regex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i;
  const match = sourceCode.match(regex);
  if (match) {
    payload = match[1];
  } else {
    payload = detectAndApplyMappings(sourceCode);
  }

  const protections = megaProtections();
  const junk = junkBlocks(80, 30);
  const vm = build30xVM(payload);

  // Código ofuscado final (sin anti‑env aún)
  const finalPayload = `${protections}\n${junk}\n${vm}`;

  // Envolver con el comprobador de entorno
  const obf = new LuaObfuscator();
  const wrapped = obf.obfuscate(finalPayload);

  return `${HEADER}\n${wrapped}`.replace(/\s+/g, " ").trim();
}

module.exports = { obfuscate };
