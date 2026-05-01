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
  PermissionFlagsBits,
} = require("discord.js");
const { fetch } = require("undici");
const { obfuscate } = require("./obfuscator.js");

// ─────────────────────────────────────────────── Config ─────────────────────
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const SUPPORT_USER_ID = process.env.SUPPORT_USER_ID || "1474472773467242599";
const PREFIX = [".", "!"];

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
const COLOR_YELLOW = 0xeab308;
const COLOR_GRAY = 0x6b7280;

// ─────────────────────────────────────────────── Anti-Spam Tracking ───────
const channelCreationTracker = new Map(); // { userId: [timestamps] }
const messageSpamTracker = new Map(); // { userId: [timestamps] }
const deletedChannelsTracker = new Map(); // { guildId: { channelData, timestamps } }
const mutedUsers = new Map(); // { userId: timeout }

const CHANNEL_SPAM_LIMIT = 1; // 1 canal = límite
const CHANNEL_SPAM_TIME = 5000; // en 5 segundos
const MESSAGE_SPAM_LIMIT = 3; // 3 mensajes
const MESSAGE_SPAM_TIME = 5000; // en 5 segundos
const MUTE_DURATION = 15 * 60 * 1000; // 15 minutos
const DELETED_CHANNELS_THRESHOLD = 3; // 3 o más canales
const DELETED_CHANNELS_TIME = 3000; // en 3 segundos

// ─────────────────────────────────────────────── Storage ────────────────────
const DATA_DIR = path.resolve(__dirname, "data");
const INDEX_FILE = path.join(DATA_DIR, "index.json");
const STATS_FILE = path.join(DATA_DIR, "stats.json");
const WELCOME_CONFIG_FILE = path.join(DATA_DIR, "welcome_config.json");

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
  { obfuscations: 0, fetches: 0, lookups: 0, supportRequests: 0, spamActions: 0 },
  loadJson(STATS_FILE, {}),
);
let welcomeConfig = loadJson(WELCOME_CONFIG_FILE, {});

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

function setWelcomeChannel(guildId, channelId) {
  welcomeConfig[guildId] = channelId;
  saveJson(WELCOME_CONFIG_FILE, welcomeConfig);
  console.log(`✅ Welcome channel set for ${guildId}: ${channelId}`);
}

function getWelcomeChannel(guildId) {
  return welcomeConfig[guildId];
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

// ─────────────────────────────────────────────── Anti-Spam Functions ───────

function trackChannelCreation(userId) {
  const now = Date.now();
  if (!channelCreationTracker.has(userId)) {
    channelCreationTracker.set(userId, []);
  }
  const timestamps = channelCreationTracker.get(userId);
  timestamps.push(now);
  
  // Limpiar timestamps antiguos
  const filtered = timestamps.filter(t => now - t < CHANNEL_SPAM_TIME);
  channelCreationTracker.set(userId, filtered);
  
  return filtered.length;
}

function trackMessageSpam(userId) {
  const now = Date.now();
  if (!messageSpamTracker.has(userId)) {
    messageSpamTracker.set(userId, []);
  }
  const timestamps = messageSpamTracker.get(userId);
  timestamps.push(now);
  
  // Limpiar timestamps antiguos
  const filtered = timestamps.filter(t => now - t < MESSAGE_SPAM_TIME);
  messageSpamTracker.set(userId, filtered);
  
  return filtered.length;
}

function trackDeletedChannel(guildId, channelData) {
  const now = Date.now();
  if (!deletedChannelsTracker.has(guildId)) {
    deletedChannelsTracker.set(guildId, []);
  }
  const channels = deletedChannelsTracker.get(guildId);
  channels.push({ ...channelData, deletedAt: now });
  
  // Limpiar canales antiguos
  const filtered = channels.filter(ch => now - ch.deletedAt < DELETED_CHANNELS_TIME);
  deletedChannelsTracker.set(guildId, filtered);
  
  return filtered;
}

async function muteUser(member, duration = MUTE_DURATION) {
  try {
    await member.timeout(duration, "Anti-spam: Rapid messaging/mentions detected");
    const embed = new EmbedBuilder()
      .setColor(COLOR_BLUE)
      .setTitle("You have been muted")
      .setDescription(`**Reason:** Rapid messaging or mentions detected\n**Duration:** 15 minutes`)
      .setFooter({ text: FOOTER_MESSAGE });
    
    await member.user.send({ embeds: [embed] }).catch(() => {});
    return true;
  } catch (err) {
    console.error("Error muting user:", err.message);
    return false;
  }
}

async function deleteChannelsCreatedBy(guild, userId) {
  try {
    const channels = await guild.channels.fetch();
    const userChannels = channels.filter(ch => ch.ownerId === userId);
    
    const deletedCount = userChannels.size;
    for (const [, channel] of userChannels) {
      try {
        await channel.delete("Anti-spam: Rapid channel creation detected");
        console.log(`   🗑️  Deleted channel: ${channel.name} (created by ${userId})`);
      } catch (err) {
        console.error(`   ❌ Error deleting channel ${channel.name}:`, err.message);
      }
    }
    return deletedCount;
  } catch (err) {
    console.error("Error deleting channels:", err.message);
    return 0;
  }
}

async function reconstructDeletedChannels(guild, deletedChannels) {
  try {
    const reconstructed = [];
    for (const channelData of deletedChannels) {
      try {
        const newChannel = await guild.channels.create({
          name: channelData.name,
          type: channelData.type,
          topic: channelData.topic || undefined,
          nsfw: channelData.nsfw || false,
        });
        reconstructed.push(newChannel);
        console.log(`   ✅ Reconstructed channel: ${newChannel.name}`);
      } catch (err) {
        console.error(`   ❌ Error reconstructing channel:`, err.message);
      }
    }
    return reconstructed;
  } catch (err) {
    console.error("Error in reconstruction:", err.message);
    return [];
  }
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
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show help information about the bot commands")
    .toJSON(),
];

// ─────────────────────────────────────────────── Discord client ──────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User],
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
      { name: "Spam actions", value: stats.spamActions.toString(), inline: true },
      { name: "Total operations", value: total.toString(), inline: true },
      { name: "Response time", value: formatDuration(elapsed), inline: true },
    )
    .setDescription(FOOTER_MESSAGE)
    .setFooter({ text: FOOTER_MESSAGE });

  await interaction.editReply({ embeds: [embed] });
}

async function handleHelp(interaction) {
  const startedAt = Date.now();
  await interaction.deferReply();
  const elapsed = Date.now() - startedAt;

  const embed = new EmbedBuilder()
    .setColor(COLOR_YELLOW)
    .setTitle("📚 Bot Help")
    .setDescription("Use the commands below:")
    .addFields(
      {
        name: "Slash Commands",
        value: "`/obf` - Obfuscate Lua code\n`/get` - Fetch a URL content\n`/id_get` - Retrieve a file by ID\n`/stats` - Show bot statistics\n`/support` - Open a support ticket\n`/help` - Show this help message",
        inline: false,
      },
      {
        name: "Text Commands",
        value: "`.help` - Show help\n`.stats` - Show statistics\n`!set [#channel]` - Set welcome channel",
        inline: false,
      },
      {
        name: "🛡️ Anti-Spam Protection",
        value: 
          "⏱️ **Rapid Channel Creation:** Delete all channels if 1+ created in 5s\n" +
          "⏱️ **Message Spam:** Mute for 15min if 3+ mentions/messages in 5s\n" +
          "⏱️ **Channel Deletion:** Reconstruct if 3+ channels deleted in 3s & ban offender",
        inline: false,
      },
    )
    .addFields(
      { name: "Response Time", value: formatDuration(elapsed), inline: true },
    )
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

// ─────────────────────────────────────────────── Text Command Handler ───────
async function handleTextCommand(message) {
  if (message.author.bot) return;
  if (!message.content) return;

  // Check for prefix
  let prefix = null;
  for (const p of PREFIX) {
    if (message.content.startsWith(p)) {
      prefix = p;
      break;
    }
  }

  if (!prefix || prefix === "/") return; // Slash commands handled differently

  const content = message.content.slice(prefix.length).trim();
  const args = content.split(/\s+/);
  const command = args[0].toLowerCase();
  const restArgs = args.slice(1);

  try {
    switch (command) {
      case "set":
        // Set welcome channel to specified channel or current
        if (!message.guild) {
          const embed = buildErrorEmbed(
            "Guild command only",
            "This command can only be used in a server.",
          );
          return await message.reply({ embeds: [embed] });
        }

        let targetChannelId = message.channelId;
        
        // Si menciona un canal, usarlo
        const channelMentions = message.mentions.channels;
        if (channelMentions.size > 0) {
          targetChannelId = channelMentions.first().id;
        }

        setWelcomeChannel(message.guild.id, targetChannelId);
        const successEmbed = new EmbedBuilder()
          .setColor(COLOR_GREEN)
          .setTitle("✅ Welcome messages ENABLED")
          .setDescription(`Welcome messages will now be sent in <#${targetChannelId}>`)
          .addFields(
            { name: "Message format", value: "Hello @username\nThank you for joining our server; you are part of the beginning of a community.", inline: false },
            { name: "Status", value: "🟢 Active 24/7", inline: true },
            { name: "Skip bots", value: "✅ Yes", inline: true },
          )
          .setFooter({ text: FOOTER_MESSAGE });
        return await message.reply({ embeds: [successEmbed] });

      case "help":
        const helpEmbed = new EmbedBuilder()
          .setColor(COLOR_YELLOW)
          .setTitle("📚 Bot Help")
          .setDescription("Use the commands below:")
          .addFields(
            {
              name: "Slash Commands",
              value: "`/obf` - Obfuscate Lua code\n`/get` - Fetch a URL content\n`/id_get` - Retrieve a file by ID\n`/stats` - Show bot statistics\n`/support` - Open a support ticket\n`/help` - Show this help message",
              inline: false,
            },
            {
              name: "Text Commands",
              value: "`.help` - Show help\n`.stats` - Show statistics\n`!set [#channel]` - Set welcome channel",
              inline: false,
            },
            {
              name: "🛡️ Anti-Spam Protection",
              value: 
                "⏱️ **Rapid Channel Creation:** Delete all channels if 1+ created in 5s\n" +
                "⏱️ **Message Spam:** Mute for 15min if 3+ mentions/messages in 5s\n" +
                "⏱️ **Channel Deletion:** Reconstruct if 3+ channels deleted in 3s & ban offender",
              inline: false,
            },
          )
          .setFooter({ text: FOOTER_MESSAGE });
        return await message.reply({ embeds: [helpEmbed] });

      case "stats":
        const total = stats.obfuscations + stats.fetches + stats.lookups;
        const statsEmbed = new EmbedBuilder()
          .setColor(COLOR_BLUE)
          .setTitle("Bot statistics")
          .addFields(
            { name: "Obfuscations", value: stats.obfuscations.toString(), inline: true },
            { name: "URL fetches", value: stats.fetches.toString(), inline: true },
            { name: "ID lookups", value: stats.lookups.toString(), inline: true },
            { name: "Support tickets", value: stats.supportRequests.toString(), inline: true },
            { name: "Spam actions", value: stats.spamActions.toString(), inline: true },
            { name: "Total operations", value: total.toString(), inline: true },
          )
          .setDescription(FOOTER_MESSAGE)
          .setFooter({ text: FOOTER_MESSAGE });
        return await message.reply({ embeds: [statsEmbed] });

      default:
        return;
    }
  } catch (err) {
    console.error("Text command error:", err);
    const errorEmbed = buildErrorEmbed("Command error", err.message || "Unknown error");
    await message.reply({ embeds: [errorEmbed] }).catch(() => undefined);
  }
}

// ─────────────────────────────────────────────── Welcome Messages (24/7) ────
client.on(Events.GuildMemberAdd, async (member) => {
  console.log(`\n👤 New member detected: ${member.user.username}#${member.user.discriminator} (ID: ${member.id}, Bot: ${member.user.bot})`);
  
  // Skip bots
  if (member.user.bot) {
    console.log(`   ⏭️  Skipping bot member`);
    return;
  }

  const welcomeChannelId = getWelcomeChannel(member.guild.id);
  
  if (!welcomeChannelId) {
    console.log(`   ℹ️  No welcome channel configured for ${member.guild.name}`);
    return;
  }

  try {
    const channel = await member.guild.channels.fetch(welcomeChannelId);
    if (!channel) {
      console.log(`   ❌ Channel not found: ${welcomeChannelId}`);
      return;
    }
    
    if (!channel.isTextBased()) {
      console.log(`   ❌ Channel is not text-based`);
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(COLOR_GREEN)
      .setTitle(`Hello ${member.user.username}`)
      .setDescription("Thank you for joining our server; you are part of the beginning of a community.")
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setFooter({ text: FOOTER_MESSAGE });

    await channel.send({ 
      content: `<@${member.id}>`,
      embeds: [embed] 
    });
    
    console.log(`   ✅ Welcome message sent to ${channel.name}`);
  } catch (err) {
    console.error(`   ❌ Error sending welcome message:`, err.message);
  }
});

// ─────────────────────────────────────────────── Anti-Spam: Channel Creation ─
client.on(Events.ChannelCreate, async (channel) => {
  if (!channel.guild) return;
  
  const ownerId = channel.ownerId;
  if (!ownerId) return;

  const creationCount = trackChannelCreation(ownerId);
  
  console.log(`\n📢 Channel created: ${channel.name} (by ${ownerId})`);
  console.log(`   📊 Creation count in 5s: ${creationCount}`);

  if (creationCount > CHANNEL_SPAM_LIMIT) {
    console.log(`   ⚠️  SPAM DETECTED: Rapid channel creation (${creationCount} in 5s)`);
    console.log(`   🗑️  Deleting all channels created by ${ownerId}...`);
    
    const deleted = await deleteChannelsCreatedBy(channel.guild, ownerId);
    console.log(`   ✅ Deleted ${deleted} channels`);
    
    bumpStat("spamActions");

    // Notify in a log channel if available
    try {
      const owner = await channel.guild.fetchOwner();
      if (owner) {
        const notifEmbed = new EmbedBuilder()
          .setColor(COLOR_RED)
          .setTitle("🚨 Anti-Spam Action")
          .setDescription(`Detected rapid channel creation by <@${ownerId}>`)
          .addFields(
            { name: "Channels deleted", value: deleted.toString(), inline: true },
            { name: "Time window", value: `${CHANNEL_SPAM_TIME}ms`, inline: true },
          )
          .setFooter({ text: FOOTER_MESSAGE });
        
        await owner.send({ embeds: [notifEmbed] }).catch(() => {});
      }
    } catch (err) {
      console.error("Error notifying owner:", err.message);
    }
  }
});

// ─────────────────────────────────────────────── Anti-Spam: Message Spam ────
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  
  // Check for mentions or rapid messaging
  const hasMentions = message.mentions.has(message.client.user) || message.mentions.users.size > 0;
  
  if (hasMentions || true) { // Track all messages
    const spamCount = trackMessageSpam(message.author.id);
    
    if (spamCount >= MESSAGE_SPAM_LIMIT && hasMentions) {
      console.log(`\n⚠️  MESSAGE SPAM DETECTED: ${message.author.tag} (ID: ${message.author.id})`);
      console.log(`   📊 Messages/mentions in 5s: ${spamCount}`);
      console.log(`   🔇 Muting user for ${MUTE_DURATION / 60000} minutes...`);
      
      try {
        const member = await message.guild.members.fetch(message.author.id);
        const muted = await muteUser(member);
        
        if (muted) {
          console.log(`   ✅ User muted successfully`);
          bumpStat("spamActions");
          
          // Send notification to channel
          const muteEmbed = new EmbedBuilder()
            .setColor(COLOR_BLUE)
            .setTitle("You have been muted")
            .setDescription(`**Reason:** Rapid messaging or mentions detected\n**Duration:** 15 minutes`)
            .setFooter({ text: FOOTER_MESSAGE });
          
          await message.reply({ embeds: [muteEmbed] }).catch(() => {});
        }
      } catch (err) {
        console.error(`   ❌ Error muting user:`, err.message);
      }
    }
  }
  
  // Handle regular commands
  handleSupportDm(message).catch((err) => console.error("DM handler error:", err));
  handleTextCommand(message).catch((err) => console.error("Text command error:", err));
});

// ─────────────────────────────────────────────── Anti-Spam: Channel Deletion ─
client.on(Events.ChannelDelete, async (channel) => {
  if (!channel.guild) return;

  const deletedChannels = trackDeletedChannel(channel.guild.id, {
    id: channel.id,
    name: channel.name,
    type: channel.type,
    topic: channel.topic,
    nsfw: channel.nsfw,
  });

  console.log(`\n🗑️  Channel deleted: ${channel.name}`);
  console.log(`   📊 Deleted channels in 3s: ${deletedChannels.length}`);

  if (deletedChannels.length >= DELETED_CHANNELS_THRESHOLD) {
    console.log(`   ⚠️  MASS DELETION DETECTED: ${deletedChannels.length} channels in 3s`);
    console.log(`   ♻️  Reconstructing channels...`);

    const reconstructed = await reconstructDeletedChannels(channel.guild, deletedChannels);
    console.log(`   ✅ Reconstructed ${reconstructed.length} channels`);

    // Find the user who deleted the channels (from audit log)
    try {
      const auditLogs = await channel.guild.fetchAuditLogs({ type: 'CHANNEL_DELETE', limit: 5 });
      const entry = auditLogs.entries.first();
      
      if (entry && entry.executor) {
        const executor = entry.executor;
        console.log(`   🎯 Offender identified: ${executor.tag} (ID: ${executor.id})`);
        
        // Try to ban or kick the offender
        try {
          const member = await channel.guild.members.fetch(executor.id);
          
          if (member.kickable) {
            await member.kick("Anti-spam: Mass channel deletion detected");
            console.log(`   ✅ User kicked`);
          } else if (member.bannable) {
            await member.ban({ reason: "Anti-spam: Mass channel deletion detected" });
            console.log(`   ✅ User banned`);
          }
          
          bumpStat("spamActions");

          // Notify
          const notifEmbed = new EmbedBuilder()
            .setColor(COLOR_RED)
            .setTitle("🚨 Anti-Spam Action - Mass Deletion")
            .setDescription(`<@${executor.id}> attempted to delete ${deletedChannels.length} channels`)
            .addFields(
              { name: "Action taken", value: member.kickable ? "Kicked" : "Banned", inline: true },
              { name: "Channels reconstructed", value: reconstructed.length.toString(), inline: true },
            )
            .setFooter({ text: FOOTER_MESSAGE });
          
          const owner = await channel.guild.fetchOwner();
          if (owner) {
            await owner.send({ embeds: [notifEmbed] }).catch(() => {});
          }
        } catch (err) {
          console.error(`   ❌ Error taking action:`, err.message);
        }
      }
    } catch (err) {
      console.error(`   ❌ Error fetching audit logs:`, err.message);
    }
  }
});

// ─────────────────────────────────────────────── Wiring ─────────────────────
client.once(Events.ClientReady, (c) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Logged in as ${c.user.tag}`);
  console.log(`🔧 Bot is active and listening to:`);
  console.log(`   - Slash commands`);
  console.log(`   - Text commands (. and ! prefix)`);
  console.log(`   - Member join events (24/7)`);
  console.log(`   - Support DMs`);
  console.log(`   - 🛡️  Anti-Spam Protection:`);
  console.log(`      ⏱️  Rapid channel creation (1+ in 5s)`);
  console.log(`      ⏱️  Message spam (3+ mentions in 5s)`);
  console.log(`      ⏱️  Mass channel deletion (3+ in 3s)`);
  console.log(`${'='.repeat(60)}\n`);
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
      case "help":
        await handleHelp(interaction);
        break;
      default:
        await interaction.reply({
          content: "Unknown command",
          ephemeral: true,
        });
    }
  } catch (err) {
    console.error("Interaction error:", err);
    const errorEmbed = buildErrorEmbed("Error", err.message || "Unknown error");
    if (interaction.replied) {
      await interaction.editReply({ embeds: [errorEmbed] }).catch(() => undefined);
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => undefined);
    }
  }
});

// ─────────────────────────────────────────────── Register Commands ─────────
async function registerCommands() {
  try {
    console.log("Registering slash commands...");
    const rest = new REST({ version: "10" }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commandDefs,
    });
    console.log("✅ Slash commands registered successfully");
  } catch (err) {
    console.error("Failed to register commands:", err);
  }
}

// ─────────────────────────────────────────────── Login ────────────────────
client.login(TOKEN);
registerCommands();
