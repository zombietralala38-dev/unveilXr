if (typeof File === "undefined") {
  const { File: NodeFile } = require("buffer");
  global.File = NodeFile;
}

const fs = require("node:fs");
const path = require("node:path");
const {
  AttachmentBuilder,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js");
const { fetch } = require("undici");
const { obfuscate } = require("./obfuscator.js");

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID environment variables.");
  process.exit(1);
}

const FOOTER_MESSAGE = "⏱️ Time";
const COLOR_BLUE = 0x3b82f6;
const COLOR_RED = 0xef4444;
const COLOR_GREEN = 0x22c55e;

const DATA_DIR = path.resolve(__dirname, "data");
const INDEX_FILE = path.join(DATA_DIR, "index.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function saveJson(file, data) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

ensureDataDir();
let entries = loadJson(INDEX_FILE, {});

function randomDigits(n) {
  let out = "";
  for (let i = 0; i < n; i++) out += Math.floor(Math.random() * 10).toString();
  return out;
}

function generateUniqueId(length) {
  let id = randomDigits(length);
  while (entries[id]) id = randomDigits(length);
  return id;
}

function saveEntry(entry) {
  entries[entry.id] = entry;
  saveJson(INDEX_FILE, entries);
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function readAttachmentText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error: ${res.status}`);
  return await res.text();
}

function buildErrorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLOR_RED)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: FOOTER_MESSAGE });
}

const LUA_MARKERS = [
  /\blocal\b/,
  /\bprint\b/,
  /\bfunction\b/,
  /\bend\b/,
  /\brequire\b/,
];

function looksLikeLua(rawSrc) {
  const src = (rawSrc || "").trim();
  if (!src) return { ok: false };
  for (const re of LUA_MARKERS) if (re.test(src)) return { ok: true };
  return { ok: false };
}

const commandDefs = [
  new SlashCommandBuilder()
    .setName("obf")
    .setDescription("Obfuscate Lua code")
    .addStringOption((o) => o.setName("code").setDescription("Lua code").setRequired(false))
    .addAttachmentOption((o) => o.setName("file").setDescription(".lua or .txt file").setRequired(false))
    .toJSON(),
];

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages],
  partials: [Partials.Channel],
});

async function handleObfuscate(interaction) {
  const startedAt = Date.now();
  await interaction.deferReply();

  const codeOption = interaction.options.getString("code");
  const fileOption = interaction.options.getAttachment("file");

  if (!codeOption && !fileOption) {
    const elapsed = Date.now() - startedAt;
    return await interaction.editReply({
      embeds: [
        buildErrorEmbed(
          "Sin entrada",
          `Usa \`code\` o carga un archivo .lua/.txt\n\`${formatDuration(elapsed)}\``
        ),
      ],
    });
  }

  let source = "";
  try {
    if (codeOption) {
      source = codeOption;
    } else if (fileOption) {
      const name = (fileOption.name || "").toLowerCase();
      if (!name.endsWith(".lua") && !name.endsWith(".txt")) throw new Error("Solo .lua o .txt");
      source = await readAttachmentText(fileOption.url);
    }
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    return await interaction.editReply({
      embeds: [buildErrorEmbed("Error lectura", `${err.message}\n\`${formatDuration(elapsed)}\``)],
    });
  }

  const luaCheck = looksLikeLua(source);
  if (!luaCheck.ok) {
    const elapsed = Date.now() - startedAt;
    return await interaction.editReply({
      embeds: [buildErrorEmbed("No es Lua", `No parece código Lua\n\`${formatDuration(elapsed)}\``)],
    });
  }

  try {
    const obfuscated = obfuscate(source);
    const id = generateUniqueId(8);
    const entry = {
      id,
      createdAt: Date.now(),
      content: obfuscated,
      fileName: "obfuscated.lua",
    };
    saveEntry(entry);

    const elapsed = Date.now() - startedAt;
    const attachment = new AttachmentBuilder(Buffer.from(obfuscated, "utf8"), { name: "obfuscated.lua" });
    const previewSource = obfuscated.slice(0, 500);
    const preview = `\`\`\`lua\n${previewSource}${obfuscated.length > previewSource.length ? "\n..." : ""}\n\`\`\``;

    const embed = new EmbedBuilder()
      .setColor(COLOR_GREEN)
      .setTitle("✅ Obfuscación exitosa")
      .addFields(
        { name: "ID", value: `\`${id}\``, inline: true },
        { name: "Tamaño", value: `${obfuscated.length} bytes`, inline: true },
        { name: "Tiempo", value: `\`${formatDuration(elapsed)}\``, inline: true },
        { name: "Preview", value: preview.length <= 1024 ? preview : "Código muy largo" }
      )
      .setFooter({ text: FOOTER_MESSAGE });

    await interaction.editReply({ embeds: [embed], files: [attachment] });
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    await interaction.editReply({
      embeds: [buildErrorEmbed("Error", `${err.message}\n\`${formatDuration(elapsed)}\``)],
    });
  }
}

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot conectado como ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  try {
    if (interaction.commandName === "obf") {
      await handleObfuscate(interaction);
    }
  } catch (err) {
    console.error("Error:", err);
    const embed = buildErrorEmbed("Error", err.message);
    if (interaction.replied) {
      await interaction.editReply({ embeds: [embed] }).catch(() => {});
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
    }
  }
});

async function registerCommands() {
  try {
    console.log("📝 Registrando comandos...");
    const rest = new REST({ version: "10" }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commandDefs });
    console.log("✅ Comandos registrados");
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

client.login(TOKEN);
registerCommands();
