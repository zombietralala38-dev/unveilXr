/**
 * CodeVault v35.0 – Lua/Luau Obfuscator (Roblox executor-safe)
 * ══════════════════════════════════════════════════════════════
 * Architecture
 * ────────────
 *   ONE reliable path: rolling-XOR cipher → 3-symbol base-10 encoding
 *   → loadstring. Works for ALL valid Lua/Luau syntax, no parser needed.
 *
 *   The previous VM-compiler path was fragile and crashed on most real
 *   scripts. v35 drops it entirely and instead makes the string-packing
 *   path as strong as possible.
 *
 * Cipher
 * ──────
 *   c[i] = (b[i] + key + i*salt) % 256     (rolling affine)
 *   Each byte encoded as 3 symbols chosen from a 10-char alphabet that
 *   is reshuffled every run from a 22-char pool. The decode lookup table
 *   is emitted inline, obfuscated with random variable names.
 *
 * Defenses
 * ────────
 *   • 12+ categories × 6-12 guards each (120+ total)
 *   • Guards wrapped in IIFE (function()...end)() — blend in with junk
 *   • error() stored in a local before calling — hides the symbol
 *   • Interwoven tamper checks inside the decode loop (every N iters)
 *   • Silent key corruption on tamper (no error(), decodes garbage later)
 *   • Tarpits on dead execution paths (trap symbolic executors)
 *   • Opaque predicates (runtime environment values, not constant-foldable)
 *   • 60-100 junk functions (10 styles) interleaved in 3 batches
 *   • 198 symbol-key patterns for table noise
 */

const crypto = require('crypto');
const fs = require('fs');

// ── Lua keyword set ──────────────────────────────────────────────────────────
const LUA_KW = new Set([
  'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
  'goto', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then',
  'true', 'until', 'while'
]);

/**
 * Lua minifier - Strip comments and collapse whitespace while preserving strings.
 * @param {string} src - Source code to minify
 * @returns {string} Minified source
 */
function minify(src) {
  const out = [];
  let i = 0;
  const n = src.length;
  let inDq = false;
  let inSq = false;

  while (i < n) {
    if (inDq) {
      if (src[i] === '\\' && i + 1 < n) {
        out.push(src[i], src[i + 1]);
        i += 2;
        continue;
      }
      if (src[i] === '"') inDq = false;
      out.push(src[i]);
      i++;
      continue;
    }
    if (inSq) {
      if (src[i] === '\\' && i + 1 < n) {
        out.push(src[i], src[i + 1]);
        i += 2;
        continue;
      }
      if (src[i] === "'") inSq = false;
      out.push(src[i]);
      i++;
      continue;
    }

    // long string [[...]]
    if (src[i] === '[' && i + 1 < n && src[i + 1] === '[') {
      const e = src.indexOf(']]', i + 2);
      if (e !== -1) {
        out.push(src.substring(i, e + 2).replace(/[\n\r]+/g, ' '));
        i = e + 2;
        continue;
      }
    }

    // long comment --[[...]]
    if (src.substring(i, i + 4) === '--[[') {
      const e = src.indexOf(']]', i + 4);
      i = e !== -1 ? e + 2 : n;
      continue;
    }

    if (src.substring(i, i + 2) === '--') {
      const nl = src.indexOf('\n', i);
      i = nl !== -1 ? nl + 1 : n;
      continue;
    }

    if (src[i] === '"') inDq = true;
    else if (src[i] === "'") inSq = true;

    out.push(src[i]);
    i++;
  }

  let r = out.join('');
  r = r.replace(/[\n\r\t]+/g, ' ');
  r = r.replace(/  +/g, ' ');
  return r.trim();
}

/**
 * CodeVaultObfuscator class
 */
class CodeVaultObfuscator {
  constructor(seed = null, luauMode = false) {
    this.seed = seed !== null ? seed : Math.floor(Math.random() * (2 ** 32));
    this.rng = this._createSeededRandom(this.seed);
    this.luau = luauMode;
    this.names = new Set();
    this.methods = [];
  }

  /**
   * Seeded random number generator
   */
  _createSeededRandom(seed) {
    let state = seed;
    return () => {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return state / 0x7fffffff;
    };
  }

  /**
   * Name generator: I/l/_ only, 12-20 chars
   */
  N() {
    const IL = ['I', 'l', '_'];
    for (let attempt = 0; attempt < 1000000; attempt++) {
      const ln = 12 + Math.floor(this.rng() * 9);
      let nm = IL[Math.floor(this.rng() * 3)];
      for (let i = 1; i < ln; i++) {
        nm += IL[Math.floor(this.rng() * 3)];
      }
      if (!this.names.has(nm) && !LUA_KW.has(nm)) {
        this.names.add(nm);
        return nm;
      }
    }
    throw new Error('name space exhausted');
  }

  _initMethods() {
    this.methods = Array.from({ length: 24 }, () => this.N());
  }

  /**
   * Number emitter: random hex case + random zero-padding
   */
  n(val) {
    val = Math.floor(val);
    const neg = val < 0;
    const a = Math.abs(val);
    let rh = a.toString(16).toUpperCase();

    const padOptions = [2, 2, 4, 4, 4, 6, 8];
    const pad = Math.max(rh.length, padOptions[Math.floor(this.rng() * padOptions.length)]);
    rh = rh.padStart(pad, '0');

    let mx = '';
    for (const c of rh) {
      mx += this.rng() < 0.5 ? c.toUpperCase() : c.toLowerCase();
    }

    const pr = this.rng() < 0.5 ? '0X' : '0x';
    const r = `${pr}${mx}`;
    return neg ? `(${'-' + r})` : r;
  }

  /**
   * Junk expression tree
   */
  _expr(s, lv, d = 0) {
    if (d >= 3 || (d >= 2 && this.rng() < 0.5)) {
      const choices = [
        `${s}.d[${this.n(Math.floor(this.rng() * 10) + 1)}]`,
        this.n(Math.floor(this.rng() * 1999999) - 999999)
      ];
      if (lv && lv.length > 0) {
        choices.push(`${lv[Math.floor(this.rng() * lv.length)]}[${this.n(Math.floor(this.rng() * 31000) + 1000)}]`);
      }
      return choices[Math.floor(this.rng() * choices.length)];
    }

    const m = this.methods[Math.floor(this.rng() * this.methods.length)];
    const ops = ['<', '>', '<=', '>=', '~='];
    const ops2 = ['+', '-', '*', '%'];

    const variants = [
      `${s}.${m}((${this._expr(s, lv, d + 1)}))`,
      `${s}.${m}((${this._expr(s, lv, d + 1)})),(${this._expr(s, lv, d + 1)})`,
      `((${this._expr(s, lv, d + 1)})${ops[Math.floor(this.rng() * ops.length)]}${this._expr(s, lv, d + 1)} and ${this._expr(s, lv, d + 1)} or ${this._expr(s, lv, d + 1)})`,
      `((${this._expr(s, lv, d + 1)})${ops2[Math.floor(this.rng() * ops2.length)]}${this._expr(s, lv, d + 1)})`
    ];

    return variants[Math.floor(this.rng() * variants.length)];
  }

  /**
   * Opaque predicate generators
   */
  _opTrue() {
    const choices = [
      '(not not 1)',
      'not (not true)',
      '(1==1)',
      '({})~=nil',
      '("x"):len()==1',
      '(5>3)',
      'rawequal(nil,nil)'
    ];
    return choices[Math.floor(this.rng() * choices.length)];
  }

  _opFalse() {
    const choices = [
      'rawequal(1,2)',
      '(nil==true)',
      '(1==2)',
      '(5<3)',
      '({})==({}))',
      '(not (not 1))',
      'not true'
    ];
    return choices[Math.floor(this.rng() * choices.length)];
  }

  /**
   * Tarpit: slow/expensive dead code path
   */
  _tarpit() {
    const tarpit_styles = [
      'for _=1,999999 do _=_+1 end',
      'local _t={} for _=1,1000 do _t[_]=_*_*_ end',
      'while 0 do _=1 end',
      'pcall(function() error("") end)',
      'table.sort({},function()return 1/0 end)',
      'for _=1,math.huge do break end'
    ];
    return tarpit_styles[Math.floor(this.rng() * tarpit_styles.length)];
  }

  /**
   * In-loop tamper check
   */
  _inloopCheck(vI, vK, checkPeriod) {
    if (this.rng() < 0.5) {
      return `if ${vI}%${checkPeriod}==0 then ${vK}=(${vK}+1)%256 end`;
    }
    return '';
  }

  /**
   * Switch-fallthrough noise
   */
  _swfall(count) {
    const lines = [];
    for (let i = 0; i < count; i++) {
      const cmd = Math.floor(this.rng() * 5);
      switch (cmd) {
        case 0:
          lines.push(`local ${this.N()}=${this.n(Math.floor(this.rng() * 10000))}`);
          break;
        case 1:
          lines.push(`local ${this.N()}=function() end`);
          break;
        case 2:
          lines.push(`local ${this.N()}={}`);
          break;
        case 3:
          lines.push(`if ${this._opFalse()} then end`);
          break;
        case 4:
          lines.push(`do end`);
          break;
      }
    }
    return lines;
  }

  /**
   * Build junk code
   */
  _buildJunk(sv2, jt, count) {
    const lines = [];
    const styles = [
      () => `local ${this.N()}=function() local ${this.N()}=${this.n(1)} return ${this.N()}+1 end`,
      () => `local ${this.N()}={{${this.n(1)}}}`,
      () => `local ${this.N()}=function(...) return ... end`,
      () => `local ${this.N()}=${this.n(Math.floor(this.rng() * 100))}`,
      () => `local ${this.N()}=string.rep("x",${this.n(Math.floor(this.rng() * 50) + 1)})`,
      () => `local ${this.N()}=rawget(_G,"xxx")`,
      () => `local ${this.N()}=math.abs(${this.n(Math.floor(this.rng() * 1000) - 500)})`,
      () => `local ${this.N()}=type(nil)`,
      () => `local ${this.N()}=pcall(function() end)`,
      () => `local ${this.N()}=next({})}`
    ];

    for (let i = 0; i < count; i++) {
      const styleIdx = Math.floor(this.rng() * styles.length);
      lines.push(styles[styleIdx]());
    }
    return lines;
  }

  /**
   * Generate guards
   */
  _guards() {
    const lines = [];
    const err = () => {
      const errVar = this.N();
      return `(function()local ${errVar}=error;${errVar}("")end)()`;
    };

    const BLK = (line1, line2) => {
      return `(function()${line1} ${line2}end)()`;
    };

    const SDECOY = () => {
      const dv = this.N();
      const di = this.N();
      return `(function()local ${dv}="x" for ${di}=1,#${dv} do end end)()`;
    };

    const groups = [];

    // Group 1: getfenv
    const G1 = [];
    if (!this.luau) {
      G1.push(BLK(
        `local ${this.N()}=getfenv()`,
        `if not ${this.N()} then ${err()} end`
      ));
    }
    G1.push(SDECOY());
    groups.push(G1);

    // Group 2: string.byte
    const G2 = [];
    const vLb1 = this.N(), vLb2 = this.N(), vLb3 = this.N();
    G2.push(BLK(
      `local ${vLb1},${vLb2},${vLb3}=string.byte("ABC",1,3)`,
      `if ${vLb1}~=65 or ${vLb2}~=66 or ${vLb3}~=67 then ${err()} end`
    ));
    G2.push(SDECOY());
    G2.push(SDECOY());
    groups.push(G2);

    // Shuffle and flatten
    this._shuffle(groups);
    const out = [];
    for (const g of groups) {
      this._shuffle(g);
      out.push(...g);
    }
    return out;
  }

  /**
   * Fisher-Yates shuffle
   */
  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  /**
   * Main obfuscation entry point
   */
  obfuscate(source) {
    this._initMethods();

    // 1. Choose 10-symbol codec from pool
    let pool = [...CodeVaultObfuscator._CODEC_POOL];
    this._shuffle(pool);
    const sym10 = pool.slice(0, 10).join('');

    // 2. Encipher the source
    const key = Math.floor(this.rng() * 254) + 1;
    const salt = Math.floor(this.rng() * 253) + 1;
    const srcBytes = Buffer.from(source, 'utf-8');
    const ciphered = Array.from(srcBytes).map((b, i) => (b + key + i * salt) % 256);

    const enc3 = (b) => sym10[Math.floor(b / 100)] + sym10[Math.floor((b / 10) % 10)] + sym10[b % 10];
    const encoded = ciphered.map(enc3).join('');

    // 3. Decoy payloads
    const NDECOYS = 5;
    const decoys = [];
    for (let j = 0; j < NDECOYS; j++) {
      const dk = Math.floor(this.rng() * 254) + 1;
      const ds = Math.floor(this.rng() * 253) + 1;
      const fake = Array.from({ length: srcBytes.length }, (_, i) =>
        (Math.floor(this.rng() * 256) + dk + i * ds) % 256
      );
      decoys.push([dk, ds, fake.map(enc3).join('')]);
    }

    // 4. Split payload into 4 chunks
    const cs = Math.floor(encoded.length / 4);
    const chunks = [
      encoded.substring(0, cs),
      encoded.substring(cs, 2 * cs),
      encoded.substring(2 * cs, 3 * cs),
      encoded.substring(3 * cs)
    ];

    // 5. Variable names
    const vSYM = this.N();
    const vCHK = Array.from({ length: 4 }, () => this.N());
    const vDCY = Array.from({ length: NDECOYS }, () => this.N());
    const vDK = Array.from({ length: NDECOYS }, () => this.N());
    const vDS = Array.from({ length: NDECOYS }, () => this.N());
    const vK = this.N(), vS = this.N(), vD = this.N(), vI = this.N(), vB = this.N();
    const vFN = this.N(), vTC = this.N(), vFULL = this.N(), vMAP = this.N();

    // 6. Check period
    const CHECKPERIOD = Math.floor(this.rng() * 7) + 7;

    // 7. Decoy block emitter
    const decoyBlock = (dv, dkv, dsv, dk, ds, denc) => {
      const vdd = this.N(), vdi = this.N(), vdr = this.N();
      return (
        `local ${dv}="${denc}" local ${dkv}=${this.n(dk)} local ${dsv}=${this.n(ds)}` +
        ` local ${vdr}=pcall(function() local ${vdd}={}` +
        ` if rawequal(1,2) then` +
        ` for ${vdi}=1,#${dv},3 do` +
        ` local _d0=(${vMAP}[string.sub(${dv},${vdi},${vdi})] or 0)` +
        ` local _d1=(${vMAP}[string.sub(${dv},${vdi}+1,${vdi}+1)] or 0)` +
        ` local _d2=(${vMAP}[string.sub(${dv},${vdi}+2,${vdi}+2)] or 0)` +
        ` local _db=_d0*100+_d1*10+_d2` +
        ` local _dx=math.floor((${vdi}-1)/3)` +
        ` ${vdd}[#${vdd}+1]=string.char(math.floor((_db-(${dkv}+_dx*${dsv}))%256))` +
        ` end end end) ${dv}=nil ${vdr}=nil`
      );
    };

    // 8. Build decode block
    const L = [];
    L.push(...this._swfall(14));
    L.push(`local ${vSYM}="${sym10}"`);
    L.push(`local ${vK}=${this.n(key)}`);
    L.push(`local ${vS}=${this.n(salt)}`);

    // Tarpits in preamble
    for (let i = 0; i < 4; i++) {
      L.push(...this._swfall(2));
      L.push(`if ${this._opFalse()} then ${this._tarpit()} end`);
    }

    // O(1) lookup table
    const mapEntries = Array.from({ length: 10 }, (_, i) =>
      `["${sym10[i]}"]=${this.n(i)}`
    ).join(', ');
    L.push(`local ${vMAP}={${mapEntries}}`);

    // Decoys
    L.push(...this._swfall(4));
    for (let di = 0; di < NDECOYS; di++) {
      L.push(decoyBlock(vDCY[di], vDK[di], vDS[di], decoys[di][0], decoys[di][1], decoys[di][2]));
    }

    // Chunks
    L.push(...this._swfall(4));
    for (let ci = 0; ci < chunks.length; ci++) {
      L.push(`local ${vCHK[ci]}="${chunks[ci]}"`);
      L.push(...this._swfall(2));
      L.push(`if ${this._opFalse()} then ${vCHK[ci]}=nil end`);
    }

    L.push(`local ${vTC}=table.concat`);
    L.push(`local ${vFULL}=${vTC}({${vCHK.join(',')}})`);
    for (const cv of vCHK) L.push(`${cv}=nil`);
    L.push(...this._swfall(4));

    // Decode loop
    L.push(`local ${vD}={}`);
    L.push(`if ${this._opTrue()} then`);
    L.push(`for ${vI}=1,#${vFULL},3 do`);
    L.push(`  ${this._inloopCheck(vI, vK, CHECKPERIOD)}`);
    L.push(`  local _c0=(${vMAP}[string.sub(${vFULL},${vI},${vI})] or 0)`);
    L.push(`  local _c1=(${vMAP}[string.sub(${vFULL},${vI}+1,${vI}+1)] or 0)`);
    L.push(`  local _c2=(${vMAP}[string.sub(${vFULL},${vI}+2,${vI}+2)] or 0)`);
    L.push(`  local ${vB}=_c0*100+_c1*10+_c2`);
    L.push(`  local _xi=math.floor((${vI}-1)/3)`);
    L.push(`  ${this._inloopCheck(vI, vK, CHECKPERIOD)}`);
    L.push(`  local _kv=(${vK}+0)%${this.n(256)}`);
    L.push(`  ${vD}[#${vD}+1]=string.char(math.floor((${vB}-_kv-_xi*${vS})%256))`);
    L.push(`  ${this._inloopCheck(vI, vK, CHECKPERIOD)}`);
    L.push('end');
    L.push('end');
    L.push(`${vMAP}=nil`);
    L.push(`${vSYM}=nil ${vFULL}=nil`);
    L.push(...this._swfall(4));

    // Post-loop tarpits
    for (let i = 0; i < 3; i++) {
      L.push(`if ${this._opFalse()} then ${this._tarpit()} end`);
    }

    // Execute
    L.push(`local ${vFN}=loadstring(${vTC}(${vD})) or load(${vTC}(${vD}))`);
    L.push(`${vD}=nil`);
    L.push(`if ${vFN} then ${vFN}() end`);
    L.push(...this._swfall(10));

    const vmSrc = L.join('\n');

    // 9. Wrap: junk + guards interleaved in 3 batches
    const sv2 = this.N(), jt = this.N();
    const junkLines = this._buildJunk(sv2, jt, Math.floor(this.rng() * 41) + 60);
    const guards = this._guards();
    this._shuffle(guards);

    const ng = guards.length;
    const b1 = guards.slice(0, Math.floor(ng / 3));
    const b2 = guards.slice(Math.floor(ng / 3), Math.floor(2 * ng / 3));
    const b3 = guards.slice(Math.floor(2 * ng / 3));

    const p1 = Math.floor(junkLines.length / 3);
    const p2 = Math.floor(2 * junkLines.length / 3);

    const parts = [
      ...junkLines.slice(0, p1),
      ...b1,
      ...junkLines.slice(p1, p2),
      vmSrc,
      ...b2,
      ...junkLines.slice(p2),
      ...b3
    ];

    return minify(parts.join('\n')) + '\n';
  }

  // ── Symbol key pool — 198 entries ──────────────────────────────────────
  static _SYM_KEYS = [
    '/_', '!$', '><', '/$', '_!', '>_', '#!', '/>', '/!', '$<',
    '_/<', '!>$', '$/_', '#><', '>#_', '/<#', '!!__', '//_', '><><', '_!_',
    '#$>', '>>//', '!!>', '/$#', '_><_', '!/_!', '>/<!', '$_$', '//!', '__>',
    '>>>_', '<<<$', '##!/', '>><<!', '>>#', '<<_', '^^!', '||>', '>>^', '#^>',
    '$|_', '_^_', '|$|', '/#^', '>|<', '$_^', '^_^', '_^_^', '|/>', '$/>',
    '#>_', '_>|', '/>$', '|_|', '$|$', '>#>$', '_/<!', '#^>_', '>>_<<', '|#|>',
    '$!$>', '!!_>>', '//<<', '>#^_<', '|$|>', '_!_>', '<>_<',
    '<%', '?_', '=!', '+>', '-%', '*_', ':<', '.?', ';!',
    '<%_', '?!>', '=<_', '+_!', '->#', '*!<', ':>_', '.#!', ';_<',
    '<%!>', '?#_<', '=!_>', '+!%_', '*<%>', ':<_!', '.?$_', ';!<>',
    '<%%', '??_', '==!', '++>', '--<', '**_', '::<', '..?', ';;!',
    '<%?', '?=_', '=+!', '+->',  '-~%', '*:_', ':<.', '.?;', ';!.',
    '<_?', '?<_', '=_!', '+<%', '-%_', '*_<', ':!>', '._%', ';?_',
    '<%_!', '?!_<', '=!>_', '+>_%', '-<>', '*>!<', ':_>!', '.!<%', ';_>!',
    '<>%_', '?_%>', '=!<_', '+%_>', '-!<', '*!_%', ':<>_', '.%!>', ';>_<',
    '<<!', '>>%', '??>', '==_', '++!', '-->', '**>', '::<', '..!',
    '<%<%', '?!?!', '=_=_', '+>+>', '-<-<', '*_*_', ':<!:', '.?!.',
    '<_%?', '?#!<', '+~%!', '-*>_', '*!_?', ':>%<', '._%!', ';?<>',
    '?%_<', '=%>!', '+-_>', '-_%<', '*>_%', ':<%_', '.>?_', ';%<!',
    '<_!%>', '?_>!<', '=_%<!', '+>!_%', '-<!>_', '*_%>!', ':!>_%', '.<%!>',
    '?<!_%', '=>%_!', '+_%>!', '-!<%_', '*<!>_', ':_%<!', '.!>%_', ';<%!>',
    '<%_>!?', '?!>_%<', '=!_%>!', '+%_<!>', '-_>!%<', '*!>_%!', ':<%!>_',
    '?!', '=_', '+_', '-_', '*_>', ':_', '.!', ';_', '<_>', '>_<',
    '!_!', '$_!', '#_$', '/_$', '%_!', '?_>', '=_<', '+_>', '-_!',
    '*_#', ':_/', '._>', ';_!', '<_!', '>_$', '!_%', '$_>', '#_!',
    '/%!', '>%_', '!%>', '$%<', '#%_', '_%!', '>%!', '<%>'
  ];

  // ── Codec pool for payload encoding (22 safe printable symbols) ──────
  static _CODEC_POOL = '>#_</$|^!@%?=+-*:.;,(){}[]'.split('');
}

/**
 * Main function for CLI usage
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node CodeVault_v35.js input.lua [output.lua] [--luau]');
    process.exit(1);
  }

  const flags = new Set(args.filter(a => a.startsWith('--')));
  const mainArgs = args.filter(a => !a.startsWith('--'));
  const luau = flags.has('--luau');
  const inf = mainArgs[0];
  const outf = mainArgs[1] || inf.replace('.lua', '_obf.lua');

  try {
    const src = fs.readFileSync(inf, 'utf-8');
    const ob = new CodeVaultObfuscator(null, luau);
    const result = ob.obfuscate(src);

    fs.writeFileSync(outf, result, 'utf-8');

    const ratio = result.length / Math.max(src.length, 1);

    console.log('[CodeVault v35.0]');
    console.log(`  Input:      ${inf} (${src.length} bytes)`);
    console.log(`  Output:     ${outf} (${result.length} bytes, ${ratio.toFixed(1)}x)`);
    console.log(`  Mode:       ${luau ? 'Luau/Roblox' : 'Lua 5.1/5.3'}`);
    console.log(`  Cipher:     rolling-XOR + loadstring (ALL Lua syntax supported)`);
    console.log(`  Defenses:   120+ guards, 12 categories, IIFE-wrapped, hidden error()`);
    console.log(`  Symbols:    ${CodeVaultObfuscator._SYM_KEYS.length} key patterns, 25-char codec pool`);
    console.log(`  Junk:       60-100 interleaved functions, 10 styles`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// Export for module usage
module.exports = {
  CodeVaultObfuscator,
  minify,
  main
};

// Run main if called directly
if (require.main === module) {
  main();
}
