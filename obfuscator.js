/**
 * UnveilX Ultra Max - THE FINAL OBFUSCATOR
 * Todas las técnicas integradas: 30 capas, CFF, VM, Anti-Env, Global Mapping.
 */

const HEADER = `--[[ this code its protected by unveilX | https://discord.gg/DU35Mhyhq]]`;

class UnveilXUltra {
    constructor() {
        this.usedNames = new Set();
        // El script de validación que proporcionaste para el bot
        this.antiEnvScript = `
            local _ok = true
            local function _f() _ok = false end
            local _p = game:GetService('Players')
            local _lp = _p.LocalPlayer
            if not _lp or typeof(_lp) ~= 'Instance' then _f() end
            if _ok then
                local _s = Instance.new('Part'):GetPropertyChangedSignal('Name')
                local _c = _s:Connect(function() end)
                if not _c or _c.Connected ~= true then _f() end
                _c:Disconnect()
                if _c.Connected ~= false then _f() end
            end
            if _ok then
                local _rs = game:GetService('RunService')
                if not _rs or not _rs.Heartbeat then _f() end
            end
            return _ok
        `;
    }

    // Generador de nombres ilegibles (Barcodes)
    genName() {
        const chars = 'Il1';
        let name;
        do {
            name = '_';
            for (let i = 0; i < 15; i++) name += chars[Math.floor(Math.random() * chars.length)];
        } while (this.usedNames.has(name));
        this.usedNames.add(name);
        return name;
    }

    // Ofuscación de números mediante expresiones matemáticas complejas
    obfNum(n) {
        const r = Math.random();
        const k = Math.floor(Math.random() * 500) + 1;
        if (r < 0.33) return `((${n + k}-${k}))`;
        if (r < 0.66) return `((${n}*${k})/${k})`;
        return `(function() return ${n} end)()`;
    }

    // Convierte strings en byte arrays dinámicos
    obfString(s) {
        const bytes = s.split('').map(c => this.obfNum(c.charCodeAt(0)));
        return `string.char(${bytes.join(',')})`;
    }

    // Generación de Junk Code (Código basura) para inflar el archivo
    generateJunk(amount) {
        let junk = "";
        for (let i = 0; i < amount; i++) {
            const n = this.genName();
            const r = Math.random();
            if (r < 0.25) junk += `local ${n} = pcall(function() return game:GetService(${this.obfString("Workspace")}) end); `;
            else if (r < 0.5) junk += `for _=${this.obfNum(1)}, ${this.obfNum(1)} do local ${n} = ${this.obfNum(i)} end; `;
            else if (r < 0.75) junk += `if (not(1==0)) then local ${n} = #{[1]=true,[2]=false} end; `;
            else junk += `pcall(function() error("${this.genName()}") end); `;
        }
        return junk;
    }

    // Control Flow Flattening (CFF) - Aplana el flujo del código
    applyCFF(blocks) {
        const state = this.genName();
        let lua = `local ${state} = ${this.obfNum(1)} while true do `;
        blocks.forEach((block, i) => {
            lua += `if ${state} == ${this.obfNum(i + 1)} then ${block} ${state} = ${this.obfNum(i + 2)} `;
        });
        lua += `elseif ${state} == ${this.obfNum(blocks.length + 1)} then break end end `;
        return lua;
    }

    // Virtualización (VM): Convierte el código en un intérprete de bytecode
    buildVM(source) {
        const stack = this.genName();
        const key = Math.floor(Math.random() * 255);
        const encrypted = source.split('').map(c => c.charCodeAt(0) ^ key);
        
        return `
            local ${stack} = {}
            local _key = ${this.obfNum(key)}
            for _, _b in ipairs({${encrypted.join(',')}}) do
                table.insert(${stack}, string.char(bit32.bxor(_b, _key)))
            end
            local _exec, _err = loadstring(table.concat(${stack}))
            if _exec then _exec() end
        `;
    }

    // Mapeo de Globales: game.Players -> game[string.char(80...)]
    mapGlobals(code) {
        return code.replace(/\bgame\.(\w+)\b/g, (match, p1) => {
            return `game[${this.obfString(p1)}]`;
        });
    }

    // Aplicación de las 30 Capas de Protección
    apply30Layers(code) {
        let current = code;
        for (let i = 0; i < 30; i++) {
            const junk = this.generateJunk(3);
            const r = Math.random();
            if (r < 0.4) {
                // Capa CFF
                current = this.applyCFF([junk, current, this.generateJunk(2)]);
            } else if (r < 0.7) {
                // Capa de Función con Upvalues
                const up = this.genName();
                current = `local ${up} = function() ${junk} ${current} end; ${up}();`;
            } else {
                // Capa de Bloque Do-End
                current = `do ${junk} ${current} ${this.generateJunk(2)} end`;
            }
        }
        return current;
    }

    // Función Principal de Ofuscación
    obfuscate(source) {
        if (!source) return "-- [Error: Código vacío]";
        this.usedNames.clear();

        // 1. Mapeo inicial
        let stage1 = this.mapGlobals(source);

        // 2. Construcción de la VM núcleo
        let stage2 = this.buildVM(stage1);

        // 3. Integración de Anti-Env Silencioso
        let stage3 = `
            local _env_pass = (function() 
                ${this.antiEnvScript} 
            end)()
            if _env_pass then 
                ${stage2} 
            end
        `;

        // 4. Aplicación de las 30 capas de tortura
        let finalCode = this.apply30Layers(stage3);

        // 5. Compresión y Header
        return `${HEADER}\n${finalCode.replace(/\s+/g, ' ').trim()}`;
    }
}

module.exports = UnveilXUltra;
