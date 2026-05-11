class LuaObfuscator {
    constructor() {
        this.junkChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
        this.mbaMappings = new Map();
        this.initMBAMappings();
    }

    initMBAMappings() {
        // MBA v1 mappings: operaciones equivalentes
        const ops = [
            { orig: "a + b", equiv: "(a - -b)" },
            { orig: "a - b", equiv: "(a + -b)" },
            { orig: "a * b", equiv: "(a / (1/b))" },
            { orig: "a == b", equiv: "not (a ~= b)" },
            { orig: "a ~= b", equiv: "not (a == b)" },
            { orig: "a > b", equiv: "(b < a)" },
            { orig: "a < b", equiv: "(b > a)" },
            { orig: "a >= b", equiv: "not (a < b)" },
            { orig: "a <= b", equiv: "not (a > b)" },
            { orig: "a and b", equiv: "a and b or false" },
            { orig: "a or b", equiv: "a or b and true" }
        ];
        ops.forEach(op => this.mbaMappings.set(op.orig, op.equiv));
    }

    generateRandomName(prefix = "v") {
        let name = prefix;
        for (let i = 0; i < 6; i++) {
            name += this.junkChars[Math.floor(Math.random() * this.junkChars.length)];
        }
        return name;
    }

    encryptString(str) {
        let encrypted = "";
        for (let i = 0; i < str.length; i++) {
            encrypted += "\\" + str.charCodeAt(i).toString(8);
        }
        return `(function() return "${encrypted}" end)()`;
    }

    obfuscateNumber(num) {
        const methods = [
            `(${num})`,
            `(${Math.floor(Math.random() * 1000)} + ${num - Math.floor(Math.random() * 1000)})`,
            `(${num * 2} - ${num})`,
            `(0x${num.toString(16)})`
        ];
        return methods[Math.floor(Math.random() * methods.length)];
    }

    obfuscateString(str) {
        return this.encryptString(str);
    }

    createTableIndirection(table) {
        const keys = [];
        const values = [];
        for (let [k, v] of Object.entries(table)) {
            const newKey = this.generateRandomName("idx");
            keys.push(newKey);
            values.push(`${newKey} = ${JSON.stringify(v)}`);
        }
        return { keys, values };
    }

    swizzleCode(code) {
        const lines = code.split('\n').filter(l => l.trim());
        for (let i = lines.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [lines[i], lines[j]] = [lines[j], lines[i]];
        }
        return lines.join('\n');
    }

    createControlFlowFlattening(code) {
        const blocks = code.split(';').filter(b => b.trim());
        let flattened = `local dispatch = {`;
        for (let i = 0; i < blocks.length; i++) {
            flattened += `\n    [${i}] = function() ${blocks[i]} end,`;
        }
        flattened += `\n}\nlocal pc = 0\nwhile pc < ${blocks.length} do\n    dispatch[pc]()\n    pc = pc + 1\nend`;
        return flattened;
    }

    reverseIf(condition) {
        const reversed = condition.includes("==") ? condition.replace("==", "~=") :
                        condition.includes("~=") ? condition.replace("~=", "==") :
                        condition.includes(">") ? condition.replace(">", "<=") :
                        condition.includes("<") ? condition.replace("<", ">=") :
                        condition.includes(">=") ? condition.replace(">=", "<") :
                        condition.includes("<=") ? condition.replace("<=", ">") :
                        condition;
        
        return `if not (${reversed}) then`;
    }

    addJunkIfs(code) {
        const junkConditions = [
            "1 == 1", "2 > 1", "3 ~= 0", "true", "not false",
            "(1 + 1) == 2", "type('a') == 'string'"
        ];
        
        let junked = "";
        const lines = code.split('\n');
        
        for (let line of lines) {
            if (Math.random() > 0.7 && line.includes("=")) {
                const cond = junkConditions[Math.floor(Math.random() * junkConditions.length)];
                junked += `if ${cond} then\n    ${line}\nend\n`;
            } else {
                junked += line + '\n';
            }
        }
        
        return junked;
    }

    encryptFunctionCalls(code) {
        const funcCallRegex = /(\w+)\s*\(([^)]*)\)/g;
        let encrypted = code.replace(funcCallRegex, (match, func, args) => {
            const fakeFunc = this.generateRandomName("_f");
            return `(function() local ${fakeFunc} = ${func}; return ${fakeFunc}(${args}) end)()`;
        });
        return encrypted;
    }

    applyMBA(code) {
        for (let [orig, equiv] of this.mbaMappings) {
            const regex = new RegExp(orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            if (Math.random() > 0.5) {
                code = code.replace(regex, equiv);
            }
        }
        return code;
    }

    obfuscateLocals(code) {
        const varRegex = /local\s+(\w+)\s*=/g;
        const replacements = new Map();
        
        let obfuscated = code.replace(varRegex, (match, varName) => {
            const newName = this.generateRandomName("l");
            replacements.set(varName, newName);
            return `local ${newName} =`;
        });
        
        for (let [oldName, newName] of replacements) {
            const oldNameRegex = new RegExp(`\\b${oldName}\\b`, 'g');
            obfuscated = obfuscated.replace(oldNameRegex, newName);
        }
        
        return obfuscated;
    }

    createGLookup() {
        return `local _ENV = setmetatable({}, {__index = function(t, k) return _G[k] end})\n`;
    }

    createVMDispatch(instructions) {
        let vm = `local vm = {`;
        for (let i = 0; i < instructions.length; i++) {
            vm += `\n    [${i}] = function() ${instructions[i]} end,`;
        }
        vm += `\n}\nlocal ip = 0\nwhile ip < ${instructions.length} do\n    vm[ip]()\n    ip = ip + 1\nend`;
        return vm;
    }

    wrapWithWPacker(code) {
        const wrapper = `--[[ WPacker v1 ]]\n(function()\n    local w = string.char\n    ${code}\nend)()`;
        return wrapper;
    }

    luaminaPushPull(code) {
        const lines = code.split('\n');
        let result = "local stack = {}\nfunction push(v) table.insert(stack, v) end\nfunction pull() return table.remove(stack) end\n\n";
        
        for (let line of lines) {
            if (line.includes("=")) {
                const parts = line.split('=');
                if (parts.length === 2) {
                    result += `push(${parts[1].trim()})\n${parts[0].trim()} = pull()\n`;
                } else {
                    result += line + '\n';
                }
            } else {
                result += line + '\n';
            }
        }
        return result;
    }

    minify(code) {
        return code.replace(/--.*$/gm, '')      // Remove comments
                   .replace(/\s+/g, ' ')        // Collapse whitespace
                   .replace(/;\s*;/g, ';')      // Remove empty statements
                   .replace(/\(\s*/g, '(')      // Remove spaces after (
                   .replace(/\s*\)/g, ')')      // Remove spaces before )
                   .replace(/\s*=/g, '=')       // Remove spaces around =
                   .replace(/=\s*/g, '=')       // Remove spaces after =
                   .replace(/\s*,\s*/g, ',')    // Remove spaces around commas
                   .trim();
    }

    obfuscate(code, options = {}) {
        let result = code;
        
        if (options.strings) result = this.obfuscateString(result);
        if (options.literals) {
            result = result.replace(/\b(\d+(?:\.\d+)?)\b/g, (match) => this.obfuscateNumber(parseFloat(match)));
        }
        if (options.tableIndirection) {
            // Aplicar indirectción de tablas
            result = result.replace(/(\w+)\[(\w+)\]/g, (match, table, key) => {
                const tempVar = this.generateRandomName("t");
                return `(function() local ${tempVar} = ${table}; return ${tempVar}[${key}] end)()`;
            });
        }
        if (options.swizzle) result = this.swizzleCode(result);
        if (options.cff) result = this.createControlFlowFlattening(result);
        if (options.reverseIf) {
            result = result.replace(/if\s+(.+?)\s+then/g, (match, cond) => this.reverseIf(cond));
        }
        if (options.junkIf) result = this.addJunkIfs(result);
        if (options.encFuncDec) result = this.encryptFunctionCalls(result);
        if (options.mba) result = this.applyMBA(result);
        if (options.locals) result = this.obfuscateLocals(result);
        if (options.gLookup) result = this.createGLookup() + result;
        if (options.vm) {
            const instructions = result.split(';').filter(i => i.trim());
            result = this.createVMDispatch(instructions);
        }
        if (options.wpacker) result = this.wrapWithWPacker(result);
        if (options.luamina) result = this.luaminaPushPull(result);
        if (options.minify) result = this.minify(result);
        
        return result;
    }
}

// Ejemplo de uso
const obfuscator = new LuaObfuscator();

const originalLuaCode = `
local x = 10
local y = 20
local sum = x + y
if sum > 25 then
    print("Sum is greater than 25")
else
    print("Sum is 25 or less")
end
`;

const obfuscated = obfuscator.obfuscate(originalLuaCode, {
    strings: true,
    literals: true,
    tableIndirection: true,
    swizzle: true,
    cff: true,
    reverseIf: true,
    junkIf: true,
    encFuncDec: true,
    mba: true,
    locals: true,
    gLookup: true,
    vm: true,
    wpacker: true,
    luamina: true,
    minify: true
});

console.log("=== ORIGINAL CODE ===");
console.log(originalLuaCode);
console.log("\n=== OBFUSCATED CODE ===");
console.log(obfuscated);
module.exports = { obfuscate };
