// ─── Polyfill: File global para Node.js < 20 ───────────────────────────────
if (typeof File === "undefined") {
  const { File: NodeFile } = require("buffer");
  global.File = NodeFile;
}
// ────────────────────────────────────────────────────────────────────────────

const fs = require("node:fs");
const path = require("node:path");
const {
  AttachmentBuilder,
  ChannelType,
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

// ─────────────────────────────────────────────── Config ─────────────────────
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const SUPPORT_USER_ID = process.env.SUPPORT_USER_ID || "1474472773467242599";

if (!TOKEN || !CLIENT_ID) {
  console.error("Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID environment variables.");
  process.exit(1);
}

const FOOTER_MESSAGE =
  "Thanks for using me, I'm made by 5000 lines of code we're only a group of developers. " +
  "If you need some support copy the id and DM some admin or see the error.";

const COLOR_BLUE = 0x3b82f6;
const COLOR_RED = 0xef4444;
const COLOR_GREEN = 0x22c55e;

// ─────────────────────────────────────────────── Storage ────────────────────
const DATA_DIR = path.resolve(__dirname, "data");
const INDEX_FILE = path.join(DATA_DIR, "index.json");
const STATS_FILE = path.join(DATA_DIR, "stats.json");

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
let stats = Object.assign(
  { obfuscations: 0, fetches: 0, lookups: 0, supportRequests: 0 },
  loadJson(STATS_FILE, {}),
);

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

function getEntry(id) {
  return entries[id];
}

function bumpStat(key) {
  stats[key] = (stats[key] || 0) + 1;
  saveJson(STATS_FILE, stats);
}

// ─────────────────────────────────────────────── Lua check ──────────────────
const LUA_MARKERS = [
  /\blocal\b/,
  /\bprint\b/,
  /\bloadstring\b/,
  /\bfunction\b/,
  /\bend\b/,
  /\bthen\b/,
  /\brequire\b/,
  /\bpcall\b/,
];

function looksLikeLua(rawSrc) {
  const src = (rawSrc || "").trim();
  if (!src) return { ok: false, reason: "Empty source" };
  for (const re of LUA_MARKERS) if (re.test(src)) return { ok: true };
  return { ok: false, reason: "No Lua keywords detected" };
}

// ─────────────────────────────────────────────── Support sessions ───────────
const supportSessions = new Map();

function startSession(session) {
  supportSessions.set(session.userId, session);
}

function getSession(userId) {
  return supportSessions.get(userId);
}

function updateSession(userId, patch) {
  const cur = supportSessions.get(userId);
  if (!cur) return undefined;
  const next = Object.assign({}, cur, patch);
  supportSessions.set(userId, next);
  return next;
}

function clearSession(userId) {
  supportSessions.delete(userId);
}

// ─────────────────────────────────────────────── Helpers ────────────────────
function formatDuration(ms) {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

async function readAttachmentText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download attachment: ${res.status} ${res.statusText}`);
  return await res.text();
}

function buildErrorEmbed(title, description, extraFields = []) {
  return new EmbedBuilder()
    .setColor(COLOR_RED)
    .setTitle(title)
    .setDescription(description)
    .addFields(extraFields)
    .setFooter({ text: FOOTER_MESSAGE });
}

// ─────────────────────────────────────────────── Slash command defs ─────────
const commandDefs = [
  new SlashCommandBuilder()
    .setName("obf")
    .setDescription("Obfuscate Lua code or an attached .lua/.txt file")
    .addStringOption((o) => o.setName("code").setDescription("Raw Lua code to obfuscate").setRequired(false))
    .addAttachmentOption((o) => o.setName("file").setDescription("A .lua or .txt file to obfuscate").setRequired(false))
    .toJSON(),
  new SlashCommandBuilder()
    .setName("obfuscate")
    .setDescription("Obfuscate Lua code or an attached .lua/.txt file")
    .addStringOption((o) => o.setName("code").setDescription("Raw Lua code to obfuscate").setRequired(false))
    .addAttachmentOption((o) => o.setName("file").setDescription("A .lua or .txt file to obfuscate").setRequired(false))
    .toJSON(),
  new SlashCommandBuilder()
    .setName("get")
    .setDescription("Fetch a URL and return its content as file.txt")
    .addStringOption((o) => o.setName("url").setDescription("The URL to fetch (raw text endpoints work best)").setRequired(true))
    .toJSON(),
  new SlashCommandBuilder()
    .setName("id_get")
    .setDescription("Retrieve a previously generated file by its ID")
    .addStringOption((o) => o.setName("id").setDescription("The 8-digit ID returned by /obf or /obfuscate").setRequired(true))
    .toJSON(),
  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Show total obfuscations, fetches and lookups handled by the bot")
    .toJSON(),
  new SlashCommandBuilder()
    .setName("support")
    .setDescription("Open a support ticket — the bot will DM you to collect details")
    .toJSON(),
];

// ─────────────────────────────────────────────── Discord client ──────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// ─────────────────────────────────────────────── Handlers ───────────────────
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
          "No input provided",
          "Please provide Lua code via the `code` option or attach a `.lua`/`.txt` file.",
          [
            { name: "Status", value: "rejected", inline: true },
            { name: "Time", value: formatDuration(elapsed), inline: true },
          ],
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
      const allowedExt = name.endsWith(".lua") || name.endsWith(".txt");
      const allowedMime = !fileOption.contentType || /text|lua|octet-stream/i.test(fileOption.contentType);
      if (!allowedExt && !allowedMime) throw new Error("File must be a .lua or .txt file.");
      source = await readAttachmentText(fileOption.url);
    }
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    return await interaction.editReply({
      embeds: [
        buildErrorEmbed("Could not read input", err.message || String(err), [
          { name: "Status", value: "rejected", inline: true },
          { name: "Time", value: formatDuration(elapsed), inline: true },
        ]),
      ],
    });
  }

  const luaCheck = looksLikeLua(source);
  if (!luaCheck.ok) {
    const elapsed = Date.now() - startedAt;
    return await interaction.editReply({
      embeds: [
        buildErrorEmbed(
          "Not Lua code",
          `This doesn't look like Lua code. Reason: ${luaCheck.reason}`,
          [
            { name: "Status", value: "rejected", inline: true },
            { name: "Time", value: formatDuration(elapsed), inline: true },
          ],
        ),
      ],
    });
  }

  try {
    const obfuscated = obfuscate(source);
    const id = generateUniqueId(8);
    const now = Date.now();
    const entry = {
      id,
      createdAt: now,
      content: obfuscated,
      fileName: "obfuscated.lua",
      kind: "Lua",
    };
    saveEntry(entry);
    bumpStat("obfuscations");

    const elapsed = Date.now() - startedAt;
    const attachment = new AttachmentBuilder(Buffer.from(obfuscated, "utf8"), { name: "obfuscated.lua" });
    const previewSource = obfuscated.slice(0, 1500);
    const preview = `\`\`\`\n${previewSource}${obfuscated.length > previewSource.length ? "\n..." : ""}\n\`\`\``;
    const previewField = preview.length <= 1024 ? preview : preview.slice(0, 1020) + "```";

    const embed = new EmbedBuilder()
      .setColor(COLOR_GREEN)
      .setTitle("Obfuscation successful")
      .addFields(
        { name: "Status", value: "accepted", inline: true },
        { name: "ID", value: `\`${id}\``, inline: true },
        { name: "Size", value: `${obfuscated.length} bytes`, inline: true },
        { name: "Time", value: formatDuration(elapsed), inline: true },
        { name: "Compression", value: `${((1 - obfuscated.length / source.length) * 100).toFixed(1)}%`, inline: true },
        { name: "Preview", value: previewField },
      )
      .setDescription(FOOTER_MESSAGE)
      .setFooter({ text: FOOTER_MESSAGE });

    await interaction.editReply({ embeds: [embed], files: [attachment] });
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    const embed = buildErrorEmbed("Obfuscation failed", err.message || String(err), [
      { name: "Status", value: "rejected", inline: true },
      { name: "Time", value: formatDuration(elapsed), inline: true },
    ]);
    await interaction.editReply({ embeds: [embed] });
  }
}

async function handleGet(interaction) {
  const startedAt = Date.now();
  await interaction.deferReply();
  const url = interaction.options.getString("url", true).trim();

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    const elapsed = Date.now() - startedAt;
    return await interaction.editReply({
      embeds: [
        buildErrorEmbed("Invalid URL", "The URL must start with http:// or https://", [
          { name: "Status", value: "rejected", inline: true },
          { name: "Time", value: formatDuration(elapsed), inline: true },
        ]),
      ],
    });
  }

  try {
    const content = await readAttachmentText(url);
    const id = generateUniqueId(8);
    const now = Date.now();
    const entry = {
      id,
      createdAt: now,
      content,
      fileName: "fetched.txt",
      kind: "Raw text",
    };
    saveEntry(entry);
    bumpStat("fetches");

    const elapsed = Date.now() - startedAt;
    const attachment = new AttachmentBuilder(Buffer.from(content, "utf8"), { name: "fetched.txt" });
    const previewSource = content.slice(0, 1500);
    const preview = `\`\`\`\n${previewSource}${content.length > previewSource.length ? "\n..." : ""}\n\`\`\``;
    const previewField = preview.length <= 1024 ? preview : preview.slice(0, 1020) + "```";

    const embed = new EmbedBuilder()
      .setColor(COLOR_GREEN)
      .setTitle("Fetch successful")
      .addFields(
        { name: "Status", value: "accepted", inline: true },
        { name: "ID", value: `\`${id}\``, inline: true },
        { name: "URL", value: `[Link](${url})`, inline: true },
        { name: "Size", value: `${content.length} bytes`, inline: true },
        { name: "Time", value: formatDuration(elapsed), inline: true },
        { name: "Preview", value: previewField },
      )
      .setDescription(FOOTER_MESSAGE)
      .setFooter({ text: FOOTER_MESSAGE });

    await interaction.editReply({ embeds: [embed], files: [attachment] });
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    const embed = buildErrorEmbed("Could not fetch URL", err.message || String(err), [
      { name: "Status", value: "rejected", inline: true },
      { name: "URL", value: `\`${url}\``, inline: true },
      { name: "Time", value: formatDuration(elapsed), inline: true },
    ]);
    await interaction.editReply({ embeds: [embed] });
  }
}

async function handleIdGet(interaction) {
  const startedAt = Date.now();
  await interaction.deferReply();
  const id = interaction.options.getString("id", true).trim();

  const entry = getEntry(id);
  if (!entry) {
    const elapsed = Date.now() - startedAt;
    return await interaction.editReply({
      embeds: [
        buildErrorEmbed("ID not found", "No file is stored under that ID. Make sure you copied it correctly.", [
          { name: "Status", value: "rejected", inline: true },
          { name: "ID", value: `\`${id}\``, inline: true },
          { name: "Time", value: formatDuration(elapsed), inline: true },
        ]),
      ],
    });
  }

  bumpStat("lookups");
  const elapsed = Date.now() - startedAt;
  const attachment = new AttachmentBuilder(Buffer.from(entry.content, "utf8"), { name: entry.fileName });

  const previewSource = entry.content.slice(0, 1500);
  const preview = `\`\`\`\n${previewSource}${entry.content.length > previewSource.length ? "\n..." : ""}\n\`\`\``;
  const previewField = preview.length <= 1024 ? preview : preview.slice(0, 1020) + "```";

  const embed = new EmbedBuilder()
    .setColor(COLOR_BLUE)
    .setTitle("Stored file")
    .addFields(
      { name: "Status", value: "accepted", inline: true },
      { name: "ID", value: `\`${entry.id}\``, inline: true },
      { name: "Kind", value: entry.kind, inline: true },
      { name: "File", value: entry.fileName, inline: true },
      { name: "Time", value: formatDuration(elapsed), inline: true },
      { name: "Created", value: `<t:${Math.floor(entry.createdAt / 1000)}:R>`, inline: true },
      { name: "Preview", value: previewField },
    )
    .setDescription(FOOTER_MESSAGE)
    .setFooter({ text: FOOTER_MESSAGE });

  await interaction.editReply({ embeds: [embed], files: [attachment] });
}

async function handleStats(interaction) {
  const startedAt = Date.now();
  await interaction.deferReply();
  const total = stats.obfuscations + stats.fetches + stats.lookups;
  const elapsed = Date.now() - startedAt;

  const embed = new EmbedBuilder()
    .setColor(COLOR_BLUE)
    .setTitle("Bot statistics")
    .addFields(
      { name: "Obfuscations", value: stats.obfuscations.toString(), inline: true },
      { name: "URL fetches", value: stats.fetches.toString(), inline: true },
      { name: "ID lookups", value: stats.lookups.toString(), inline: true },
      { name: "Support tickets", value: stats.supportRequests.toString(), inline: true },
      { name: "Total operations", value: total.toString(), inline: true },
      { name: "Response time", value: formatDuration(elapsed), inline: true },
    )
    .setDescription(FOOTER_MESSAGE)
    .setFooter({ text: FOOTER_MESSAGE });

  await interaction.editReply({ embeds: [embed] });
}

async function handleSupport(interaction) {
  const user = interaction.user;
  const guild = interaction.guild;

  try {
    const dm = await user.createDM();
    const embed = new EmbedBuilder()
      .setColor(COLOR_BLUE)
      .setTitle("Support ticket opened")
      .setDescription("What is your problem?")
      .setFooter({ text: FOOTER_MESSAGE });
    await dm.send({ embeds: [embed] });

    startSession({
      userId: user.id,
      guildId: guild ? guild.id : null,
      guildName: guild ? guild.name : null,
      channelId: interaction.channelId || null,
      step: "awaiting_problem",
      startedAt: Date.now(),
    });

    bumpStat("supportRequests");

    const ack = new EmbedBuilder()
      .setColor(COLOR_BLUE)
      .setTitle("Check your DMs")
      .setDescription("I sent you a private message to collect your support request.")
      .setFooter({ text: FOOTER_MESSAGE });
    await interaction.reply({ embeds: [ack], ephemeral: true });
  } catch (err) {
    const embed = buildErrorEmbed(
      "Could not open DM",
      "I could not send you a private message. Please enable DMs from server members and try again.\n\n" +
        (err.message || String(err)),
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

async function notifySupporter(message, requester) {
  const session = getSession(requester.id);
  if (!session) return false;
  try {
    const supportUser = await client.users.fetch(SUPPORT_USER_ID);
    const dm = await supportUser.createDM();
    const embed = new EmbedBuilder()
      .setColor(COLOR_BLUE)
      .setTitle("New support ticket")
      .addFields(
        { name: "Ticket ID", value: `\`${session.ticketId || "n/a"}\``, inline: true },
        { name: "User", value: `<@${requester.id}> (${requester.tag})`, inline: true },
        { name: "User ID", value: `\`${requester.id}\``, inline: true },
        { name: "Server", value: session.guildName || "Direct message", inline: true },
        { name: "Provided ID", value: `\`${session.ticketId || "n/a"}\``, inline: true },
        { name: "Problem", value: (session.problem || "").slice(0, 1024) || "(empty)" },
      )
      .setDescription(`Please DM <@${requester.id}> to provide support.`)
      .setFooter({ text: FOOTER_MESSAGE });
    await dm.send({ embeds: [embed] });
    return true;
  } catch (err) {
    console.error("Failed to DM support user:", err);
    return false;
  }
}

async function handleSupportDm(message) {
  if (message.author.bot) return;
  if (message.channel.type !== ChannelType.DM) return;
  const session = getSession(message.author.id);
  if (!session) return;
  const content = (message.content || "").trim();
  if (!content) return;

  if (session.step === "awaiting_problem") {
    updateSession(message.author.id, { problem: content, step: "awaiting_id" });
    const embed = new EmbedBuilder()
      .setColor(COLOR_BLUE)
      .setTitle("Got it")
      .setDescription("Send ID")
      .setFooter({ text: FOOTER_MESSAGE });
    await message.reply({ embeds: [embed] });
    return;
  }

  if (session.step === "awaiting_id") {
    updateSession(message.author.id, { ticketId: content, step: "done" });
    const embed = new EmbedBuilder()
      .setColor(COLOR_BLUE)
      .setTitle("Thanks")
      .setDescription("Wait, someone from supporters will DM you and support you.")
      .setFooter({ text: FOOTER_MESSAGE });
    await message.reply({ embeds: [embed] });

    const delivered = await notifySupporter(message, message.author);

    const followup = new EmbedBuilder()
      .setColor(COLOR_BLUE)
      .setTitle("Support team notified")
      .setDescription(
        delivered
          ? "Notified the support team. Sit tight, they will reach out."
          : "I could not reach the support team right now. They will follow up shortly.",
      )
      .setFooter({ text: FOOTER_MESSAGE });
    await message.author.send({ embeds: [followup] }).catch(() => undefined);

    clearSession(message.author.id);
  }
}

// ─────────────────────────────────────────────── Wiring ─────────────────────
client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, (message) => {
  handleSupportDm(message).catch((err) => console.error("DM handler error:", err));
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  try {
    switch (interaction.commandName) {
      case "obf":
      case "obfuscate":
        await handleObfuscate(interaction);
        break;
      case "get":
        await handleGet(interaction);
        break;
      case "id_get":
        await handleIdGet(interaction);
        break;
      case "stats":
        await handleStats(interaction);
        break;
      case "support":
        await handleSupport(interaction);
        break;
      default:
        await interaction.reply({ content: "Unknown command.", ephemeral: true });
    }
  } catch (err) {
    console.error("Command handler error:", err);
    const embed = buildErrorEmbed("Unexpected error", err.message || String(err));
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ embeds: [embed] }).catch(() => undefined);
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => undefined);
    }
  }
});

async function main() {
  console.log(`Registering ${commandDefs.length} slash commands...`);
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commandDefs });
  console.log("Slash commands registered.");
  await client.login(TOKEN);
}

main().catch((err) => {
  console.error("Bot startup failed:", err);
  process.exit(1);
});
