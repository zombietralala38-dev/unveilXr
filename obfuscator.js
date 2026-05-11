// ============================================================
//  ADVANCED LUA OBFUSCATOR - Luraph Protection Suite
// ============================================================

// ============================================================
//  CONFIGURATION
// ============================================================
const CONFIG = {
    // VM Configuration
    vm: {
        maxLayers: 25,
        chunkSize: 10,
        fakeChunkMultiplier: 4,
        seedRange: { min: 50, max: 200 }
    },
    
    // Anti-Debug
    antiDebug: {
        enabled: true,
        memoryCheck: true,
        timingCheck: true,
        hookDetection: true
    },
    
    // Anti-Tamper
    antiTamper: {
        enabled: true,
        integrityCheck: true,
        selfModifyProtection: true
    },
    
    // Environment Detection
    envDetection: {
        enabled: true,
        sandboxCheck: true,
        vmDetection: true,
        scriptContextCheck: true
    },
    
    // Obfuscation
    obfuscation: {
        stringEncryption: true,
        controlFlowFlattening: true,
        junkCodeDensity: 100,
        identifierRenaming: true
    }
};

// ============================================================
//  UTILITY FUNCTIONS
// ============================================================
class ObfuscatorUtils {
    static randomName() {
        return "_" + Math.random().toString(36).substring(2, 8) + 
               Math.floor(Math.random() * 1000);
    }
    
    static heavyMath(n) {
        if (Math.random() < 0.8) return n.toString();
        const a = Math.floor(Math.random() * 3000) + 500;
        const b = Math.floor(Math.random() * 50) + 2;
        const c = Math.floor(Math.random() * 800) + 10;
        const d = Math.floor(Math.random() * 20) + 2;
        return `(((((${n}+${a})*${b})/${b})-${a})+((${c}*${d})/${d})-${c})`;
    }
    
    static mbaExpression() {
        const n = Math.random() > 0.5 ? 1 : 2;
        const a = Math.floor(Math.random() * 70) + 15;
        const b = Math.floor(Math.random() * 40) + 8;
        return `((${n}*${a}-${a})/(${b}+1)+${n})`;
    }
    
    static xorEncrypt(str, key) {
        let result = '';
        for (let i = 0; i < str.length; i++) {
            result += String.fromCharCode(str.charCodeAt(i) ^ key);
        }
        return result;
    }
    
    static generateHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
    }
}

// ============================================================
//  ANTI-ENVIRONMENT DETECTION SYSTEM
// ============================================================
class AntiEnvironmentDetection {
    static generate() {
        return `
-- Anti-Environment Detection Layer
local function _checkEnvironment()
    -- Sandbox Detection
    local sandboxIndicators = 0
    
    -- Check 1: Function environment integrity
    local success, env = pcall(function() return getfenv() end)
    if not success or type(env) ~= "table" then
        sandboxIndicators = sandboxIndicators + 1
    end
    
    -- Check 2: Global table integrity
    if getmetatable(_G) ~= nil then
        sandboxIndicators = sandboxIndicators + 1
    end
    
    -- Check 3: Core function availability
    local coreFuncs = {"print", "type", "tostring", "pcall", "error"}
    for _, func in ipairs(coreFuncs) do
        if type(_G[func]) ~= "function" then
            sandboxIndicators = sandboxIndicators + 1
            break
        end
    end
    
    -- Check 4: Script context verification
    local scriptContext = getfenv and getfenv().script
    if not scriptContext then
        sandboxIndicators = sandboxIndicators + 1
    end
    
    -- Check 5: Memory inspection protection
    local memCheck = pcall(function()
        local test = {}
        test[1] = 1
        return test[1] == 1
    end)
    if not memCheck then
        sandboxIndicators = sandboxIndicators + 1
    end
    
    if sandboxIndicators >= 3 then
        return false -- Environment compromised
    end
    
    return true -- Environment safe
end

if not _checkEnvironment() then
    while true do end -- Freeze if environment is hostile
end
`;
    }
}

// ============================================================
//  ANTI-DEBUGGING SYSTEM
// ============================================================
class AntiDebugging {
    static generate() {
        const checks = [];
        
        if (CONFIG.antiDebug.timingCheck) {
            checks.push(`
-- Timing-based debugger detection
local _startTime = tick()
local _loopCounter = 0
for _ = 1, 100000 do
    _loopCounter = _loopCounter + 1
end
local _endTime = tick()
local _executionTime = _endTime - _startTime

-- Debuggers slow down execution significantly
if _executionTime > 1.0 then
    while true do end
end
`);
        }
        
        if (CONFIG.antiDebug.hookDetection) {
            checks.push(`
-- Hook detection for common debugger functions
local _hookCheck1 = debug and debug.gethook
if _hookCheck1 and _hookCheck1() ~= nil then
    while true do end
end

-- Check for instruction-level hooks
local _hookCheck2 = pcall(function()
    return debug.getinfo(1, "L")
end)
if not _hookCheck2 then
    while true do end
end
`);
        }
        
        return checks.join('\n');
    }
}

// ============================================================
//  JUNK CODE GENERATOR
// ============================================================
class JunkCodeGenerator {
    static generateLine() {
        const r = Math.random();
        if (r < 0.2) {
            return `local ${ObfuscatorUtils.randomName()}=${ObfuscatorUtils.heavyMath(Math.floor(Math.random() * 999))}`;
        } else if (r < 0.35) {
            return `local ${ObfuscatorUtils.randomName()}=string.char(${ObfuscatorUtils.heavyMath(Math.floor(Math.random()*255))})`;
        } else if (r < 0.5) {
            return `if not(${ObfuscatorUtils.heavyMath(1)}==${ObfuscatorUtils.heavyMath(1)}) then local x=1 end`;
        } else if (r < 0.7) {
            const tp = ObfuscatorUtils.randomName();
            return `if type(nil)=="number" then while true do local ${tp}=1 end end`;
        } else if (r < 0.85) {
            const vt = ObfuscatorUtils.randomName();
            return `do local ${vt}={} ${vt}["_"]=1 ${vt}=nil end`;
        } else {
            return `if type(math.pi)=="string" then while true do end end`;
        }
    }
    
    static generateArray(count) {
        const arr = [];
        for (let i = 0; i < count; i++) {
            arr.push(this.generateLine());
        }
        return arr;
    }
}

// ============================================================
//  STRING ENCRYPTION SYSTEM
// ============================================================
class StringEncryption {
    static encryptString(str) {
        const key = Math.floor(Math.random() * 255);
        const encrypted = ObfuscatorUtils.xorEncrypt(str, key);
        const bytes = [];
        
        for (let i = 0; i < encrypted.length; i++) {
            bytes.push(ObfuscatorUtils.heavyMath(encrypted.charCodeAt(i)));
        }
        
        return {
            decrypt: `(function() local _t={${bytes.join(',')}} local _r="" for _,v in ipairs(_t) do _r=_r..string.char(bit32.bxor(v,${key})) end return _r end)()`,
            encrypted: encrypted
        };
    }
}

// ============================================================
//  VIRTUAL MACHINE SYSTEM (ETR-Style)
// ============================================================
class VirtualMachine {
    static buildBase(payloadStr) {
        const STACK = ObfuscatorUtils.randomName();
        const KEY = ObfuscatorUtils.randomName();
        const ORDER = ObfuscatorUtils.randomName();
        const seed = Math.floor(Math.random() * 
                    (CONFIG.vm.seedRange.max - CONFIG.vm.seedRange.min)) + 
                    CONFIG.vm.seedRange.min;
        
        let vmCore = `local _pool={} local ${STACK}={} local ${KEY}=${ObfuscatorUtils.heavyMath(seed)} `;
        
        // Split payload into chunks and encrypt
        const realChunks = [];
        for (let i = 0; i < payloadStr.length; i += CONFIG.vm.chunkSize) {
            realChunks.push(payloadStr.slice(i, i + CONFIG.vm.chunkSize));
        }
        
        const realOrder = [];
        const totalChunks = realChunks.length * CONFIG.vm.fakeChunkMultiplier;
        let currentReal = 0;
        let globalIndex = 0;
        
        for (let i = 0; i < totalChunks; i++) {
            const shouldBeReal = currentReal < realChunks.length && 
                    (Math.random() > 0.6 || 
                    (totalChunks - i) === (realChunks.length - currentReal));
            
            if (shouldBeReal) {
                realOrder.push(i + 1);
                const chunk = realChunks[currentReal];
                const encryptedBytes = [];
                
                for (let j = 0; j < chunk.length; j++) {
                    const enc = chunk.charCodeAt(j) ^ ((seed + globalIndex) & 0xFF);
                    encryptedBytes.push(ObfuscatorUtils.heavyMath(enc));
                    globalIndex++;
                }
                vmCore += `_pool[${ObfuscatorUtils.heavyMath(i + 1)}]={${encryptedBytes.join(',')}} `;
                currentReal++;
            } else {
                const fakeBytes = [];
                for (let j = 0; j < Math.floor(Math.random() * 25) + 5; j++) {
                    fakeBytes.push(ObfuscatorUtils.heavyMath(Math.floor(Math.random() * 255)));
                }
                vmCore += `_pool[${ObfuscatorUtils.heavyMath(i + 1)}]={${fakeBytes.join(',')}} `;
            }
        }
        
        vmCore += `local ${ORDER}={${realOrder.map(n => ObfuscatorUtils.heavyMath(n)).join(',')}} `;
        const idxVar = ObfuscatorUtils.randomName();
        const byteVar = ObfuscatorUtils.randomName();
        
        vmCore += `local _gIdx=0 for _, ${idxVar} in ipairs(${ORDER}) do for _, ${byteVar} in ipairs(_pool[${idxVar}]) do `;
        vmCore += `table.insert(${STACK}, string.char(bit32.bxor(${byteVar}, (${KEY} + _gIdx) % 256))) _gIdx=_gIdx+1 end end `;
        vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `;
        vmCore += `assert(loadstring(_e))() `;
        
        return vmCore;
    }
    
    static buildLayer(innerCode, handlerCount) {
        const handlers = [];
        for (let i = 0; i < handlerCount; i++) {
            handlers.push(ObfuscatorUtils.randomName());
        }
        
        const realIdx = Math.floor(Math.random() * handlerCount);
        const DISPATCH = ObfuscatorUtils.randomName();
        
        let out = `local lM={} `;
        for (let i = 0; i < handlers.length; i++) {
            if (i === realIdx) {
                out += `local ${handlers[i]}=function(lM) local lM=lM; ${JunkCodeGenerator.generateArray(3).join(' ')} ${innerCode} end `;
            } else {
                out += `local ${handlers[i]}=function(lM) local lM=lM; ${JunkCodeGenerator.generateArray(2).join(' ')} return nil end `;
            }
        }
        
        out += `local ${DISPATCH}={`;
        for (let i = 0; i < handlers.length; i++) {
            out += `[${ObfuscatorUtils.heavyMath(i + 1)}]=${handlers[i]},`;
        }
        out += `} `;
        
        // CFF dispatcher
        const stateVar = ObfuscatorUtils.randomName();
        out += `local ${stateVar}=${ObfuscatorUtils.heavyMath(1)} while true do `;
        for (let i = 0; i < handlers.length; i++) {
            if (i === 0) {
                out += `if ${stateVar}==${ObfuscatorUtils.heavyMath(1)} then ${DISPATCH}[${ObfuscatorUtils.heavyMath(1)}](lM) ${stateVar}=${ObfuscatorUtils.heavyMath(2)} `;
            } else {
                out += `elseif ${stateVar}==${ObfuscatorUtils.heavyMath(i + 1)} then ${DISPATCH}[${ObfuscatorUtils.heavyMath(i + 1)}](lM) ${stateVar}=${ObfuscatorUtils.heavyMath(i + 2)} `;
            }
        }
        out += `elseif ${stateVar}==${ObfuscatorUtils.heavyMath(handlers.length + 1)} then break end end `;
        
        return out;
    }
    
    static buildFull(payloadStr, layers = 25) {
        let vm = this.buildBase(payloadStr);
        for (let i = 0; i < layers; i++) {
            vm = this.buildLayer(vm, Math.floor(Math.random() * 2) + 3);
        }
        return vm;
    }
}

// ============================================================
//  ANTI-ENV LOGGER (CUSTOM MESSAGE)
// ============================================================
class AntiEnvLogger {
    static generate() {
        return `
local p = game.Players.LocalPlayer
local c = p and p.Character
local anim = c and c:FindFirstChild("Animate")
local dummy = Instance.new("LocalScript")
local ok, bad = false, false

if anim and pcall(function() return anim:IsA("LocalScript") end) then
    ok = true
end

if not pcall(function() return dummy:IsA("LocalScript") end) then
    bad = true
end

if not (ok and not bad) then
    print("يعلم الله أنك تحاول سرقة الشفرة، وانظر، لا ينبغي لك تهديد الناس؛ الله يعلم ما في قلبك.")
    while true do end
end
`;
    }
}

// ============================================================
//  MAIN OBFUSCATOR
// ============================================================
class LuraphObfuscator {
    static obfuscate(sourceCode) {
        if (!sourceCode) return '--ERROR: No source code provided';
        
        const HEADER = `--[[ this code it's protected by Seak obfuscator ]]`;
        
        // Extract payload from loadstring(HttpGet) pattern
        let payload = "";
        const isLoadstringRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i;
        const match = sourceCode.match(isLoadstringRegex);
        
        if (match) {
            payload = `loadstring(game:HttpGet("${match[1]}"))()`;
        } else {
            payload = sourceCode;
        }
        
        // Combine anti-env logger with payload
        const combinedCode = AntiEnvLogger.generate() + " " + payload;
        
        // Build VM with anti-env inside
        const vmCode = VirtualMachine.buildFull(combinedCode, CONFIG.vm.maxLayers);
        
        // Generate junk for camouflage
        const junk = JunkCodeGenerator.generateArray(CONFIG.obfuscation.junkCodeDensity).join(' ');
        
        // Add anti-debugging
        const antiDebug = AntiDebugging.generate();
        
        // Assemble final output
        return `${HEADER}\n${junk}\n${antiDebug}\n${vmCode}`;
    }
}

// ============================================================
//  EXPORT
// ============================================================
module.exports = { obfuscate: LuraphObfuscator.obfuscate };
