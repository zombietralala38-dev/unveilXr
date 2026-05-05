// ═══════════════════════════════════════════════════════════
//  OFUSCADOR COMPLETO - WATERMARK EDITION
//  "I really like Rick and Morty"
// ═══════════════════════════════════════════════════════════
const fs = require('fs');

let seed = 0xBEEF;
function nextRand() {
    seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF;
    return seed / 0x7FFFFFFF;
}
function randInt(max) { return (nextRand() * max) | 0; }

const ABC = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
function rndName(len = 6) {
    let s = '';
    for (let i = 0; i < len; i++) s += ABC[randInt(ABC.length)];
    return s;
}

function heavyMath(n) {
    if (nextRand() < 0.8) return String(n);
    let a = randInt(3000) + 500, b = randInt(50) + 2, c = randInt(800) + 10, d = randInt(20) + 2;
    return `(((((${n}+${a})*${b})/${b})-${a})+((${c}*${d})/${d})-${c})`;
}

function mba() {
    let n = nextRand() > 0.5 ? 1 : 2, a = randInt(70) + 15, b = randInt(40) + 8;
    return `((${n}*${a}-${a})/(${b}+1)+${n})`;
}

function generateJunk(lines) {
    let j = '';
    for (let i = 0; i < lines; i++) {
        let r = nextRand();
        if (r < 0.2) j += `local ${rndName()}=${heavyMath(randInt(999))} `;
        else if (r < 0.4) j += `local ${rndName()}=string.char(${heavyMath(randInt(255))}) `;
        else if (r < 0.5) j += `if not(${heavyMath(1)}==${heavyMath(1)}) then local _=1 end `;
        else if (r < 0.7) j += `if type(nil)=="number" then while true do local ${rndName()}=1 end end `;
        else if (r < 0.85) j += `do local ${rndName()}={} ${rndName()}["_"]=1 ${rndName()}=nil end `;
        else j += `if type(math.pi)=="string" then local _=1 end `;
    }
    return j;
}

function applyCFF(blocks) {
    let sv = rndName(8), lua = `local ${sv}=${heavyMath(1)} while true do `;
    for (let i = 0; i < blocks.length; i++) {
        lua += (i === 0 ? `if ${sv}==${heavyMath(1)} then ${blocks[i]} ${sv}=${heavyMath(2)} ` :
                `elseif ${sv}==${heavyMath(i+1)} then ${blocks[i]} ${sv}=${heavyMath(i+2)} `);
    }
    lua += `elseif ${sv}==${heavyMath(blocks.length+1)} then break end end `;
    return lua;
}

function buildTrueVM(payloadStr) {
    let STACK = rndName(6), KEY = rndName(6), ORDER = rndName(6), SALT = rndName(6);
    let seedVal = randInt(200) + 50, saltVal = randInt(250) + 1;
    let vmCore = `local ${STACK}={} local ${KEY}=${heavyMath(seedVal)} local ${SALT}=${heavyMath(saltVal)} `;
    let chunkSize = 15, realChunks = [];
    for (let i = 0; i < payloadStr.length; i += chunkSize) realChunks.push(payloadStr.slice(i, i + chunkSize));
    let poolVars = [], realOrder = [], totalChunks = realChunks.length * 3, currentReal = 0, globalIndex = 0;
    for (let i = 0; i < totalChunks; i++) {
        let memName = rndName(7);
        poolVars.push(memName);
        if (currentReal < realChunks.length && (nextRand() > 0.5 || (totalChunks - i) === (realChunks.length - currentReal))) {
            realOrder.push(i + 1);
            let chunk = realChunks[currentReal], encryptedBytes = [];
            for (let j = 0; j < chunk.length; j++) {
                encryptedBytes.push(heavyMath((chunk.charCodeAt(j) + seedVal + (globalIndex * saltVal)) % 256));
                globalIndex++;
            }
            vmCore += `local ${memName}={${encryptedBytes.join(',')}} `;
            currentReal++;
        } else {
            let fakeBytes = [];
            for (let j = 0; j < randInt(20) + 5; j++) fakeBytes.push(heavyMath(randInt(255)));
            vmCore += `local ${memName}={${fakeBytes.join(',')}} `;
        }
    }
    vmCore += `local _pool={${poolVars.join(',')}} local ${ORDER}={${realOrder.map(n => heavyMath(n)).join(',')}} `;
    let idxVar = rndName(6), byteVar = rndName(6);
    vmCore += `local _gIdx=0 for _, ${idxVar} in ipairs(${ORDER}) do for _, ${byteVar} in ipairs(_pool[${idxVar}]) do `;
    vmCore += `if type(math.pi)=="string" then ${KEY}=(${KEY}+137)%256 end `;
    vmCore += `table.insert(${STACK}, string.char((${byteVar} - ${KEY} - _gIdx * ${SALT}) % 256)) _gIdx=_gIdx+1 end end `;
    vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil assert(loadstring(_e))()`;
    return vmCore;
}

function buildSingleVM(innerCode) {
    let handlerCount = randInt(3) + 3, handlers = [];
    for (let i = 0; i < handlerCount; i++) handlers.push(rndName(8));
    let realIdx = randInt(handlerCount), DISPATCH = rndName(8), out = `local lM={} `;
    for (let i = 0; i < handlers.length; i++) {
        out += (i === realIdx ? `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(5)} ${innerCode} end ` :
                `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(3)} return nil end `);
    }
    out += `local ${DISPATCH}={`;
    for (let i = 0; i < handlers.length; i++) out += `[${heavyMath(i+1)}]=${handlers[i]},`;
    out += `} `;
    let execBlocks = [];
    for (let i = 0; i < handlers.length; i++) execBlocks.push(`${DISPATCH}[${heavyMath(i+1)}](lM)`);
    out += applyCFF(execBlocks);
    return out;
}

function buildNestedVM(payloadStr, depth) {
    let vm = buildTrueVM(payloadStr);
    for (let i = 0; i < depth; i++) vm = buildSingleVM(vm);
    return vm;
}

function buildCiegoLocker(codeToLock) {
    let keySource = `(function() local k={} local f=function() end k[1]=tostring(f):byte(1,8) return k[1][1]+(os.clock()*1000)%256 end)()`;
    let encoded = Buffer.from(codeToLock).toString('base64');
    return `local _ciegoKey = ${keySource} local _ciegoStr = "${encoded}" local _dec = {} for i=1,#_ciegoStr do _dec[i] = string.char((string.byte(_ciegoStr,i) - _ciegoKey) % 256) end local _payload = table.concat(_dec) assert(loadstring(_payload))()`;
}

function buildSelfLoveLocker(innerCode) {
    let hashValue = innerCode.length % 256;
    return `local _self = debug.getinfo(1,"S").source local _hash = 0 for i=1,#_self do _hash = (_hash + string.byte(_self,i)) % 256 end if _hash ~= ${heavyMath(hashValue)} then while true do end end ${innerCode}`;
}

function generateAntiEnvParted(splits) {
    let baseAntiEnv = `if type(print)~="function" then while true do end end if debug and debug.getinfo then local _i=debug.getinfo(1) if _i.what~="main" then while true do end end end if getmetatable(_G) then while true do end end if pcall(string.dump,string.dump) then while true do end end`;
    let chunkLen = Math.ceil(baseAntiEnv.length / splits), chunks = [];
    for (let i = 0; i < baseAntiEnv.length; i += chunkLen) chunks.push(baseAntiEnv.slice(i, i + chunkLen));
    while (chunks.length < splits) chunks.push(`local ${rndName()}=nil `);
    let globalTableName = rndName(8), finalCode = `local ${globalTableName} = {} `;
    chunks.forEach((chunk, idx) => {
        let encryptedChunk = chunk.split('').map(c => (c.charCodeAt(0) + idx + 42) % 256);
        let chunkVar = rndName(6);
        finalCode += `local ${chunkVar} = {${encryptedChunk.join(',')}} `;
        finalCode += `local ${rndName()} = {} for _,v in ipairs(${chunkVar}) do table.insert(${rndName()}, string.char((v - ${idx} - 42) % 256)) end `;
        finalCode += `${globalTableName}[${idx+1}] = table.concat(${rndName()}) `;
    });
    finalCode += `local _antiEnv = table.concat(${globalTableName}) local _af = loadstring(_antiEnv) if _af then _af() else while true do end end `;
    return buildTrueVM(finalCode);
}

function padToSize(baseCode, targetBytes) {
    let current = baseCode.length, missing = targetBytes - current;
    if (missing <= 0) return baseCode;
    let padding = '';
    while (missing > 100) {
        padding += `local ${rndName(5)}=${heavyMath(randInt(999))};`;
        missing = targetBytes - (baseCode + padding).length;
    }
    while ((baseCode + padding).length < targetBytes) padding += '--';
    return baseCode + padding;
}

function obfuscate(sourceCode, options = {}) {
    let {
        targetSizeBytes = 18000,
        vmDepth = 2,
        ciego = true,
        selfLove = true,
        antiEnvSplits = 10
    } = options;

    if (!sourceCode) return '-- error: empty script';

    let protectedPayload = sourceCode;
    let antiEnvCode = generateAntiEnvParted(antiEnvSplits);

    if (ciego) protectedPayload = buildCiegoLocker(protectedPayload);
    if (selfLove) protectedPayload = buildSelfLoveLocker(protectedPayload);

    let mainVM = buildNestedVM(protectedPayload, vmDepth);
    
    // WATERMARK - SIEMPRE PRESENTE
    let watermark = `--[=[WATERMARK: I really like Rick and Morty - Protected by Lua Overlord 3000]=] `;

    let finalBase = `${watermark} ${antiEnvCode} ${mainVM}`;
    let sizedCode = padToSize(finalBase, targetSizeBytes);

    // WATERMARK OCULTO DENTRO DEL CÓDIGO (no se ve a simple vista)
    let hiddenWM = `local _wm=${heavyMath(87)},${heavyMath(65)},${heavyMath(84)},${heavyMath(69)},${heavyMath(82)},${heavyMath(77)},${heavyMath(65)},${heavyMath(82)},${heavyMath(75)} `;
    
    return hiddenWM + sizedCode;
}

module.exports = { obfuscate };

// EJECUCIÓN DIRECTA
if (require.main === module) {
    let inputFile = process.argv[2];
    if (!inputFile) {
        console.log('Uso: node obfuscator.js script.lua [targetSize:18000] [vmDepth:2]');
        process.exit(1);
    }
    let targetSize = parseInt(process.argv[3]) || 18000;
    let vmDepth = parseInt(process.argv[4]) || 2;
    let sourceCode = fs.readFileSync(inputFile, 'utf8');
    let ofuscado = obfuscate(sourceCode, {
        targetSizeBytes: targetSize,
        vmDepth: vmDepth,
        ciego: true,
        selfLove: true,
        antiEnvSplits: 10
    });
    console.log(`Tamaño final: ${ofuscado.length} bytes`);
    fs.writeFileSync('output.lua', ofuscado);
    console.log('Guardado en output.lua');
    console.log('WATERMARK: I really like Rick and Morty');
}
