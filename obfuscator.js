// ============================================================
//  LURAPH-STYLE ULTRA OBFUSCATOR v4 - NO CRYPTO
//  CUSTOM VM MACHINE WITH STRING-BASED OPCODES
// ============================================================

class RealObfuscator {
    
    // ==================== UTILIDADES ====================
    static randomName(len = 6) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '_';
        for (let i = 0; i < len; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }
    
    static randomOpcode() {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        return letters[Math.floor(Math.random() * 26)] +
               letters[Math.floor(Math.random() * 26)] +
               letters[Math.floor(Math.random() * 26)];
    }
    
    static heavyMath(n, depth = 0) {
        if (depth > 3 || Math.random() < 0.4) return n.toString();
        const a = Math.floor(Math.random() * 5000) + 1000;
        const b = Math.floor(Math.random() * 50) + 2;
        const c = Math.floor(Math.random() * 1000) + 100;
        const d = Math.floor(Math.random() * 30) + 2;
        const type = Math.floor(Math.random() * 6);
        
        switch(type) {
            case 0: return `(((${this.heavyMath(n, depth+1)}+${a})*${b}/${b})-${a})`;
            case 1: return `(((${c}*${d}/${d})-${c})+${this.heavyMath(n, depth+1)})`;
            case 2: return `(bit32.bxor(${this.heavyMath(n, depth+1)}, ${Math.floor(Math.random()*255)}))`;
            case 3: return `((${this.heavyMath(n, depth+1)}<<${Math.floor(Math.random()*3)+1})>>${Math.floor(Math.random()*3)+1})`;
            case 4: return `(bit32.band(${this.heavyMath(n, depth+1)}, ${Math.floor(Math.random()*255)}))`;
            default: return `(math.floor(${this.heavyMath(n, depth+1)}+0.5))`;
        }
    }
    
    // ==================== MEJORA 1: STRING ENCRYPTION ====================
    static encryptString(str) {
        const key = Math.floor(Math.random() * 200) + 50;
        const result = [];
        for (let i = 0; i < str.length; i++) {
            let code = str.charCodeAt(i);
            code = code ^ ((key + i) & 0xFF);
            code = ((code << 3) | ((code >> 5) & 0x07)) & 0xFF;
            result.push(code);
        }
        return { data: result, key: key };
    }
    
    static generateStringDecryptor(encrypted, key, varName) {
        const bytes = encrypted.join(',');
        return `
local function ${varName}()
    local key = ${key}
    local bytes = {${bytes}}
    local result = {}
    for i = 1, #bytes do
        local b = bytes[i]
        b = ((b >> 3) | ((b & 0x07) << 5)) & 0xFF
        result[i] = string.char(bit32.bxor(b, (key + i - 1) % 256))
    end
    return table.concat(result)
end
`;
    }
    
    // ==================== MEJORA 2: CUSTOM VM MACHINE ====================
    static generateCustomOpcodes() {
        const used = new Set();
        const ops = ['PUSH', 'POP', 'ADD', 'SUB', 'MUL', 'DIV', 'JMP', 'CALL', 'RET', 'LOADK', 'XOR', 'MOV', 'CMP', 'JE', 'JNE', 'HALT'];
        const opcodes = {};
        
        for (const op of ops) {
            let newOp;
            do {
                newOp = this.randomOpcode();
            } while (used.has(newOp));
            used.add(newOp);
            opcodes[op] = newOp;
        }
        
        return opcodes;
    }
    
    static compileToBytecode(luaCode, opcodes) {
        const bytecode = [];
        const constants = [];
        const constMap = new Map();
        
        const addConstant = (val) => {
            if (constMap.has(val)) return constMap.get(val);
            const idx = constants.length;
            constMap.set(val, idx);
            constants.push(val);
            return idx;
        };
        
        // Parsear código Lua básico
        const lines = luaCode.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // local x = valor
            const assignMatch = trimmed.match(/local\s+(\w+)\s*=\s*(.+)/);
            if (assignMatch) {
                const value = assignMatch[2].trim();
                if (/^\d+$/.test(value)) {
                    const idx = addConstant(parseInt(value));
                    bytecode.push({op: opcodes.LOADK, args: [idx]});
                    bytecode.push({op: opcodes.PUSH, args: []});
                } else if (/^["'].*["']$/.test(value)) {
                    const idx = addConstant(value.slice(1, -1));
                    bytecode.push({op: opcodes.LOADK, args: [idx]});
                    bytecode.push({op: opcodes.PUSH, args: []});
                }
            }
            
            // print("texto")
            const printMatch = trimmed.match(/print\((.+)\)/);
            if (printMatch) {
                let arg = printMatch[1].trim();
                if (/^["'].*["']$/.test(arg)) {
                    const idx = addConstant(arg.slice(1, -1));
                    bytecode.push({op: opcodes.LOADK, args: [idx]});
                    bytecode.push({op: opcodes.PUSH, args: []});
                } else if (/^\d+$/.test(arg)) {
                    const idx = addConstant(parseInt(arg));
                    bytecode.push({op: opcodes.LOADK, args: [idx]});
                    bytecode.push({op: opcodes.PUSH, args: []});
                }
                bytecode.push({op: opcodes.CALL, args: [1]});
            }
        }
        
        bytecode.push({op: opcodes.HALT, args: []});
        return { bytecode, constants };
    }
    
    static generateVMRunner(opcodes, bytecode, constants) {
        const vmName = this.randomName();
        const pcName = this.randomName();
        const stackName = this.randomName();
        const constName = this.randomName();
        const bcName = this.randomName();
        
        // Ofuscar opcodes (guardar como números ofuscados)
        const opcodeMap = {};
        for (const [key, val] of Object.entries(opcodes)) {
            const obfuscated = [];
            for (let i = 0; i < val.length; i++) {
                obfuscated.push(this.heavyMath(val.charCodeAt(i)));
            }
            opcodeMap[key] = `{${obfuscated.join(',')}}`;
        }
        
        // Ofuscar bytecode
        const obfuscatedBytecode = bytecode.map(instr => {
            return `{op=${opcodeMap[Object.keys(opcodes).find(k => opcodes[k] === instr.op)] || '{0}'},args={${(instr.args || []).map(a => this.heavyMath(a)).join(',')}}}`;
        }).join(',');
        
        // Ofuscar constantes
        const obfuscatedConsts = constants.map(c => {
            if (typeof c === 'number') return this.heavyMath(c);
            if (typeof c === 'string') {
                const encrypted = this.encryptString(c);
                return `(function() local k=${encrypted.key} local b={${encrypted.data.join(',')}} local r={} for i=1,#b do local v=b[i] v=((v>>3)|((v&7)<<5))&255 r[i]=string.char(bit32.bxor(v,(k+i-1)%256)) end return table.concat(r) end)()`;
            }
            return c;
        }).join(',');
        
        return `
--[[ CUSTOM VM MACHINE - LURAPH STYLE ]]
--[[ OPCODES: ${JSON.stringify(opcodes)} ]]

local ${vmName} = {}
local ${pcName} = 1
local ${stackName} = {}
local ${constName} = {${obfuscatedConsts}}
local ${bcName} = {${obfuscatedBytecode}}

local function ${this.randomName()}_decode(opBytes)
    local op = ''
    for _,b in ipairs(opBytes) do
        op = op .. string.char(b)
    end
    return op
end

while true do
    local instr = ${bcName}[${pcName}]
    if not instr then break end
    
    local op = ${this.randomName()}_decode(instr.op)
    local args = instr.args
    
    ${pcName} = ${pcName} + 1
    
    if op == "${opcodes.PUSH}" then
        local val = ${stackName}[#${stackName}]
        table.insert(${stackName}, val)
        
    elseif op == "${opcodes.POP}" then
        table.remove(${stackName})
        
    elseif op == "${opcodes.ADD}" then
        local b = table.remove(${stackName})
        local a = table.remove(${stackName})
        table.insert(${stackName}, a + b)
        
    elseif op == "${opcodes.SUB}" then
        local b = table.remove(${stackName})
        local a = table.remove(${stackName})
        table.insert(${stackName}, a - b)
        
    elseif op == "${opcodes.MUL}" then
        local b = table.remove(${stackName})
        local a = table.remove(${stackName})
        table.insert(${stackName}, a * b)
        
    elseif op == "${opcodes.DIV}" then
        local b = table.remove(${stackName})
        local a = table.remove(${stackName})
        table.insert(${stackName}, a / b)
        
    elseif op == "${opcodes.XOR}" then
        local b = table.remove(${stackName})
        local a = table.remove(${stackName})
        table.insert(${stackName}, bit32.bxor(a, b))
        
    elseif op == "${opcodes.LOADK}" then
        local idx = args[1] + 1
        table.insert(${stackName}, ${constName}[idx] or idx)
        
    elseif op == "${opcodes.CALL}" then
        local argc = args[1] or 0
        local func = table.remove(${stackName})
        local argv = {}
        for i = 1, argc do
            table.insert(argv, 1, table.remove(${stackName}))
        end
        local results = {func(table.unpack(argv))}
        for i = #results, 1, -1 do
            table.insert(${stackName}, results[i])
        end
        
    elseif op == "${opcodes.JMP}" then
        local target = args[1] or 1
        ${pcName} = target
        
    elseif op == "${opcodes.HALT}" then
        break
    end
end
`;
    }
    
    // ==================== MEJORA 3: ANTI-DEBUG REAL ====================
    static generateAntiDebug() {
        return `
--[[ ANTI-DEBUG REAL ]]
local _st = os.clock()
local _lc = 0
for _ = 1, 200000 do _lc = _lc + 1 end
if os.clock() - _st > 0.5 then while true do end end

local _hook = pcall(function()
    if debug and debug.gethook then
        local h = debug.gethook()
        if h then error() end
    end
end)
if not _hook then while true do end end

local _dbg = false
pcall(function()
    debug.sethook(function() _dbg = true end, "l")
    for i = 1, 1000 do end
    debug.sethook()
end)
if _dbg then while true do end end
`;
    }
    
    // ==================== MEJORA 4: JUNK CODE CON DEPENDENCIAS ====================
    static generateJunkWithDependencies() {
        const vars = [];
        const lines = [];
        
        for (let i = 0; i < 50; i++) {
            const varName = this.randomName();
            vars.push(varName);
            lines.push(`local ${varName} = ${this.heavyMath(Math.floor(Math.random() * 1000))}`);
        }
        
        // Dependencia cruzada - todas las variables se usan en una operación final
        const sumVar = this.randomName();
        lines.push(`local ${sumVar} = ${vars.map(v => v).join(' + ')}`);
        lines.push(`if ${sumVar} == -1 then print("impossible") end`);
        
        return lines.join('\n');
    }
    
    // ==================== MEJORA 5: CONTROL FLOW FLATTENING ====================
    static flattenControlFlow(code) {
        const stateVar = this.randomName();
        const blocks = Math.floor(Math.random() * 10) + 15;
        
        let flattened = `local ${stateVar} = ${this.heavyMath(1)}\nwhile true do\n`;
        
        // Dividir código en bloques imaginarios
        const codeBlocks = [];
        const lines = code.split('\n');
        const blockSize = Math.max(1, Math.floor(lines.length / blocks));
        
        for (let i = 0; i < lines.length; i += blockSize) {
            codeBlocks.push(lines.slice(i, i + blockSize).join('\n'));
        }
        
        for (let i = 0; i < codeBlocks.length; i++) {
            const nextState = i === codeBlocks.length - 1 ? codeBlocks.length + 1 : i + 2;
            flattened += `if ${stateVar} == ${this.heavyMath(i + 1)} then\n`;
            flattened += `    ${codeBlocks[i]}\n`;
            flattened += `    ${stateVar} = ${this.heavyMath(nextState)}\n`;
            flattened += `else`;
        }
        
        flattened += `\n    ${stateVar} == ${this.heavyMath(codeBlocks.length + 1)} then break\n`;
        flattened += `end\nend\n`;
        
        return flattened;
    }
    
    // ==================== MEJORA 6: STRING POOLING ====================
    static generateStringPool(strings) {
        const poolName = this.randomName();
        const pool = {};
        
        for (const str of strings) {
            const encrypted = this.encryptString(str);
            pool[str] = `(function() local k=${encrypted.key} local b={${encrypted.data.join(',')}} local r={} for i=1,#b do local v=b[i] v=((v>>3)|((v&7)<<5))&255 r[i]=string.char(bit32.bxor(v,(k+i-1)%256)) end return table.concat(r) end)()`;
        }
        
        return `local ${poolName} = {${Object.values(pool).join(',')}}`;
    }
    
    // ==================== OFUSCADOR PRINCIPAL ====================
    static obfuscate(sourceCode) {
        if (!sourceCode || sourceCode.trim() === '') {
            return '-- No source code provided';
        }
        
        // Extraer payload real (si es loadstring(game:HttpGet(...)))
        let payload = sourceCode;
        const httpGetMatch = sourceCode.match(/loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i);
        if (httpGetMatch) {
            payload = `loadstring(game:HttpGet("${httpGetMatch[1]}"))()`;
        }
        
        // Generar opcodes custom
        const opcodes = this.generateCustomOpcodes();
        
        // Compilar a bytecode de VM
        const { bytecode, constants } = this.compileToBytecode(payload, opcodes);
        
        // Generar VM runner
        let vmCode = this.generateVMRunner(opcodes, bytecode, constants);
        
        // Aplicar Control Flow Flattening a la VM
        vmCode = this.flattenControlFlow(vmCode);
        
        // Añadir anti-debug
        const antiDebug = this.generateAntiDebug();
        
        // Añadir junk code con dependencias
        const junkPre = this.generateJunkWithDependencies();
        const junkPost = this.generateJunkWithDependencies();
        
        // String pool para strings comunes
        const commonStrings = ['print', 'loadstring', 'pcall', 'table', 'string', 'bit32'];
        const stringPool = this.generateStringPool(commonStrings);
        
        // Ensamblar todo
        const header = `--[[ OBFUSCATED WITH LURAPH-STYLE PROTECTOR v4 ]]\n--[[ CUSTOM VM MACHINE ACTIVE ]]\n--[[ ANTI-DEBUG ACTIVE ]]\n\n`;
        
        return header + antiDebug + '\n' + stringPool + '\n' + junkPre + '\n' + vmCode + '\n' + junkPost;
    }
}

// ==================== EXPORT ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { obfuscate: RealObfuscator.obfuscate.bind(RealObfuscator) };
}
