// ============================================================
//  ADVANCED LUA OBFUSCATOR - Luraph Protection Suite v2
// ============================================================

// ============================================================
//  CONFIGURATION
// ============================================================
const CONFIG = {
    vm: {
        maxLayers: 25,
        chunkSize: 10,
        fakeChunkMultiplier: 4,
        seedRange: { min: 50, max: 200 }
    },
    antiDebug: {
        enabled: true,
        timingCheck: true,
        hookDetection: true
    },
    obfuscation: {
        junkCodeDensity: 100
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
    
    static xorEncrypt(str, key) {
        let result = '';
        for (let i = 0; i < str.length; i++) {
            result += String.fromCharCode(str.charCodeAt(i) ^ key);
        }
        return result;
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
            return `local ${ObfuscatorUtils.randomName()}=${ObfuscatorUtils.heavyMath(Math.floor(Math.random()*255))}`;
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
//  VIRTUAL MACHINE SYSTEM
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
//  ANTI-ENV LOGGER (SIMPLIFICADO SIN FUNCIONES BLOQUEADAS)
// ============================================================
class AntiEnvLogger {
    static generate() {
        return `
local _p = game and game.Players and game.Players.LocalPlayer
local _c = _p and _p.Character
local _anim = _c and _c.FindFirstChild and _c:FindFirstChild("Animate")
local _dummy = pcall(function() return Instance.new("LocalScript") end)
local _ok = false
local _bad = false

if _anim then
    local _success, _result = pcall(function() return _anim.IsA and _anim:IsA("LocalScript") end)
    if _success and _result then
        _ok = true
    end
end

if not _dummy then
    _bad = true
end

if not (_ok and not _bad) then
    while true do end
end
`;
    }
}

// ============================================================
//  ANTI-DEBUGGING SYSTEM (SIMPLIFICADO)
// ============================================================
class AntiDebugging {
    static generate() {
        return `
-- Anti-debugging check
local _startTime = tick()
local _loopCounter = 0
for _ = 1, 100000 do
    _loopCounter = _loopCounter + 1
end
local _endTime = tick()
if _endTime - _startTime > 1.0 then
    while true do end
end

-- Hook detection
local _hookCheck = pcall(function()
    if debug and debug.gethook then
        return debug.gethook()
    end
    return nil
end)
if _hookCheck and _hookCheck ~= nil then
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
