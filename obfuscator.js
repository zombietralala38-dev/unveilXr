/**
 * UnveilX Obfuscator Engine
 * Sistema de protección multi-capa con Anti-Environment Logging
 * Exporta directamente la función obfuscate()
 */

const HEADER = `--[[ this code its protected by unveilX | https://discord.gg/DU35Mhyhq]]`;

class UnveilXObfuscator {
  constructor() {
    this.usedNames = new Set();
    this.mathSkipProbability = 0.3; // 30% menos de operaciones matemáticas

    this.antiEnvScript = `
      local _anti_pass = true
      local function fail(msg) _anti_pass = false return nil end
      local ok
      local Players = game:GetService('Players')
      local lp = Players.LocalPlayer
      if typeof(lp) ~= 'Instance' then fail(101) end
      if type(lp.Kick) ~= 'function' then fail(102) end
      ok = pcall(function() lp:Kick('m') end); if not ok then fail(103) end
      ok = pcall(lp.Kick, lp, 'm2'); if not ok then fail(104) end
      ok = pcall(function() lp:Kick() end); if not ok then fail(105) end
      ok = xpcall(function() lp:Kick('x') end, function(e) return e end); if not ok then fail(106) end
      ok = pcall(function() game:GetService('Players').LocalPlayer:Kick('chained') end); if not ok then fail(107) end
      local part = Instance.new('Part')
      local sig = part:GetPropertyChangedSignal('Name')
      if typeof(sig) ~= 'RBXScriptSignal' then fail(201) end
      if type(sig.Connect) ~= 'function' then fail(202) end
      local con = sig:Connect(function() end)
      if typeof(con) ~= 'RBXScriptConnection' then fail(203) end
      if con.Connected ~= true then fail(204) end
      con:Disconnect()
      if con.Connected ~= false then fail(206) end
      local rs = game:GetService('RunService')
      if typeof(rs.Heartbeat) ~= 'RBXScriptSignal' then fail(501) end
      local uis = game:GetService('UserInputService')
      if typeof(uis.InputBegan) ~= 'RBXScriptSignal' then fail(506) end
      if typeof(game) ~= 'Instance' then fail(801) end
      return _anti_pass
    `;
  }

  genName(prefix = '') {
    let name;
    do {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
      name = prefix;
      const len = 8 + Math.floor(Math.random() * 10);
      for (let i = 0; i < len; i++) name += chars[Math.floor(Math.random() * chars.length)];
      name += Math.floor(Math.random() * 99999);
    } while (this.usedNames.has(name));
    this.usedNames.add(name);
    return name;
  }

  lightMath(n) {
    // Reducción del 30%: omite ofuscación matemática
    if (Math.random() < this.mathSkipProbability) {
      return n.toString();
    }
    const a = Math.floor(Math.random() * 50) + 5;
    const b = Math.floor(Math.random() * 5) + 2;
    return `((${n}+${a}-${a})*${b}/${b})`;
  }

  generateJunk(count) {
    let junk = '';
    for (let i = 0; i < count; i++) {
      const v = this.genName('j_');
      const r = Math.random();
      if (r < 0.3) junk += `local ${v} = pcall(function() return math.sin(${this.lightMath(10)}) end) `;
      else if (r < 0.6) junk += `if (1==0) then local ${v} = "${this.genName()}" end `;
      else junk += `do local ${v} = #{${this.lightMath(1)}, ${this.lightMath(2)}} end `;
    }
    return junk;
  }

  buildVM(luaPayload) {
    const stackName = this.genName('stack');
    const key = Math.floor(Math.random() * 100) + 20;
    const salt = Math.floor(Math.random() * 10) + 1;

    let encryptedBytes = [];
    for (let i = 0; i < luaPayload.length; i++) {
      encryptedBytes.push(this.lightMath((luaPayload.charCodeAt(i) + key + (i * salt)) % 256));
    }

    return `
      local ${stackName} = {}
      local data = {${encryptedBytes.join(',')}}
      for i, b in ipairs(data) do
        table.insert(${stackName}, string.char((b - ${key} - (i-1) * ${salt}) % 256))
      end
      local _run = loadstring(table.concat(${stackName}))
      ${stackName} = nil
      if _run then _run() end
    `;
  }

  obfuscate(sourceCode) {
    if (!sourceCode) return "-- Error: No source provided";
    this.usedNames.clear();

    const protectedPayload = `
      local _auth = (function() ${this.antiEnvScript} end)()
      if _auth == true then
        local _s, _e = pcall(function()
          ${this.buildVM(sourceCode)}
        end)
      end
    `;

    let finalCode = protectedPayload;
    for (let i = 0; i < 5; i++) {
      finalCode = `(function() ${this.generateJunk(5)} ${finalCode} end)()`;
    }

    return `${HEADER}\n${finalCode.replace(/\s+/g, ' ').trim()}`;
  }
}

// Exportamos directamente la función para que sea compatible con tu bot
const obfuscator = new UnveilXObfuscator();
module.exports = function obfuscate(sourceCode) {
  return obfuscator.obfuscate(sourceCode);
};
