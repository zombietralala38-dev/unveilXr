import { 
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
  type ChatInputCommandInteraction, 
  type Message, 
  type User 
} from "discord.js";
import { fetch } from "undici";
import { createRequire } from "node:module";
import http from "node:http";

// Importaciones de módulos locales
import { commandDefs } from "./commands.js";
import { bumpStat, generateUniqueId, getEntry, getStats, saveEntry } from "./storage.js";
import { looksLikeLua } from "./luaCheck.js";
import { clearSession, getSession, startSession, updateSession } from "./support.js";

const require = createRequire(import.meta.url);
// Carga del obfuscador (asumiendo que exporta una función o clase usable)
const { obfuscate } = require("./obfuscator.js") as {
  obfuscate: (src: string) => string;
};

// ───────────────────────────── Configuración ─────────────────────────────
const FOOTER_MESSAGE = "Thx for use me, im made by 5000 lines of code we only a group of developers. If you need some support copy the id and dm some admin or see the error.";
const COLOR_BLUE = 0x3b82f6;
const COLOR_RED = 0xef4444;
const COLOR_GREEN = 0x22c55e;
const SUPPORT_USER_ID = process.env.SUPPORT_USER_ID || "1474472773467242599";

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID environment variables.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.DirectMessages, 
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.Message],
});

// ───────────────────────────── Helpers ─────────────────────────────
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

async function readAttachmentText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download attachment: ${res.status} ${res.statusText}`);
  return await res.text();
}

function buildErrorEmbed(title: string, description: string, extraFields: Array<{ name: string; value: string; inline?: boolean }> = []) {
  return new EmbedBuilder()
    .setColor(COLOR_RED)
    .setTitle(title)
    .setDescription(description)
    .addFields(extraFields)
    .setFooter({ text: FOOTER_MESSAGE });
}

// ───────────────────────────── Handlers ─────────────────────────────
async function handleObfuscate(interaction: ChatInputCommandInteraction): Promise<void> {
  const startedAt = Date.now();
  await interaction.deferReply();

  const codeOption = interaction.options.getString("code");
  const fileOption = interaction.options.getAttachment("file");

  if (!codeOption && !fileOption) {
    const elapsed = Date.now() - startedAt;
    return await interaction.editReply({ 
      embeds: [buildErrorEmbed("No input provided", "Please provide Lua code via the `code` option or attach a `.lua`/`.txt` file.", [
        { name: "Status", value: "rejected", inline: true }, 
        { name: "Time", value: formatDuration(elapsed), inline: true }
      ])] 
    });
  }

  let source = "";
  try {
    if (codeOption) {
      source = codeOption;
    } else if (fileOption) {
      const name = (fileOption.name || "").toLowerCase();
      if (!name.endsWith(".lua") && !name.endsWith(".txt")) throw new Error("File must be a .lua or .txt file.");
      source = await readAttachmentText(fileOption.url);
    }
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    const message = err instanceof Error ? err.message : String(err);
    return await interaction.editReply({ 
      embeds: [buildErrorEmbed("Could not read input", message, [
        { name: "Status", value: "rejected", inline: true }, 
        { name: "Time", value: formatDuration(elapsed), inline: true }
      ])] 
    });
  }

  const check = looksLikeLua(source);
  if (!check.ok) {
    const elapsed = Date.now() - startedAt;
    return await interaction.editReply({ 
      embeds: [buildErrorEmbed("Invalid input", "I think this is not lua or have some syntax error.", [
        { name: "Status", value: "rejected", inline: true }, 
        { name: "Reason", value: check.reason || "Unknown", inline: true }, 
        { name: "Time", value: formatDuration(elapsed), inline: true }
      ])] 
    });
  }

  let obfuscated: string;
  try {
    obfuscated = obfuscate(source);
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    const message = err instanceof Error ? err.message : String(err);
    return await interaction.editReply({ 
      embeds: [buildErrorEmbed("Obfuscation failed", message, [
        { name: "Status", value: "failed", inline: true }, 
        { name: "Time", value: formatDuration(elapsed), inline: true }
      ])] 
    });
  }

  const id = await generateUniqueId(8);
  const fileName = `${Math.floor(10000 + Math.random() * 90000)}.txt`;

  await saveEntry({ id, fileName, content: obfuscated, createdAt: Date.now(), authorId: interaction.user.id, kind: "obfuscated" });
  await bumpStat("obfuscations");

  const elapsed = Date.now() - startedAt;
  const attachment = new AttachmentBuilder(Buffer.from(obfuscated, "utf8"), { name: fileName });

  const embed = new EmbedBuilder()
    .setColor(COLOR_GREEN)
    .setTitle("Obfuscation complete")
    .addFields([
      { name: "Status", value: "accepted", inline: true }, 
      { name: "ID", value: `\`${id}\``, inline: true }, 
      { name: "Time", value: formatDuration(elapsed), inline: true }, 
      { name: "File", value: fileName, inline: true }
    ])
    .setDescription(FOOTER_MESSAGE)
    .setFooter({ text: FOOTER_MESSAGE });

  await interaction.editReply({ embeds: [embed], files: [attachment] });
}

async function handleGet(interaction: ChatInputCommandInteraction): Promise<void> {
  const startedAt = Date.now();
  await interaction.deferReply();
  const url = interaction.options.getString("url", true);

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    const elapsed = Date.now() - startedAt;
    return await interaction.editReply({ 
      embeds: [buildErrorEmbed("Invalid URL", "The provided value is not a valid URL.", [
        { name: "Status", value: "rejected", inline: true }, 
        { name: "Time", value: formatDuration(elapsed), inline: true }
      ])] 
    });
  }

  if (!/^https?:$/.test(parsed.protocol)) {
    const elapsed = Date.now() - startedAt;
    return await interaction.editReply({ 
      embeds: [buildErrorEmbed("Unsupported protocol", "Only http and https URLs are supported.", [
        { name: "Status", value: "rejected", inline: true }, 
        { name: "Time", value: formatDuration(elapsed), inline: true }
      ])] 
    });
  }

  let body: string;
  try {
    const res = await fetch(parsed.toString(), { headers: { "User-Agent": "DiscordObfuscatorBot/1.0" } });
    if (!res.ok) throw new Error(`Remote returned status ${res.status} ${res.statusText}`);
    body = await res.text();
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    const message = err instanceof Error ? err.message : String(err);
    return await interaction.editReply({ 
      embeds: [buildErrorEmbed("Fetch failed", message, [
        { name: "Status", value: "failed", inline: true }, 
        { name: "Time", value: formatDuration(elapsed), inline: true }
      ])] 
    });
  }

  const id = await generateUniqueId(8);
  await saveEntry({ id, fileName: "file.txt", content: body, createdAt: Date.now(), authorId: interaction.user.id, kind: "fetched" });
  await bumpStat("fetches");

  const elapsed = Date.now() - startedAt;
  const attachment = new AttachmentBuilder(Buffer.from(body, "utf8"), { name: "file.txt" });

  const embed = new EmbedBuilder()
    .setColor(COLOR_BLUE)
    .setTitle("URL fetched")
    .addFields([
      { name: "Status", value: "accepted", inline: true }, 
      { name: "ID", value: `\`${id}\``, inline: true }, 
      { name: "Time", value: formatDuration(elapsed), inline: true }, 
      { name: "Source", value: parsed.toString().slice(0, 1000) }
    ])
    .setDescription(FOOTER_MESSAGE)
    .setFooter({ text: FOOTER_MESSAGE });

  await interaction.editReply({ embeds: [embed], files: [attachment] });
}

async function handleIdGet(interaction: ChatInputCommandInteraction): Promise<void> {
  const startedAt = Date.now();
  await interaction.deferReply();
  const id = interaction.options.getString("id", true).trim();

  const entry = await getEntry(id);
  if (!entry) {
    const elapsed = Date.now() - startedAt;
    return await interaction.editReply({ 
      embeds: [buildErrorEmbed("ID not found", "No file is stored under that ID.", [
        { name: "Status", value: "rejected", inline: true }, 
        { name: "ID", value: `\`${id}\``, inline: true }, 
        { name: "Time", value: formatDuration(elapsed), inline: true }
      ])] 
    });
  }

  await bumpStat("lookups");
  const elapsed = Date.now() - startedAt;
  const attachment = new AttachmentBuilder(Buffer.from(entry.content, "utf8"), { name: entry.fileName });
  const previewSource = entry.content.slice(0, 1500);
  const preview = `\`\`\`\n${previewSource}${entry.content.length > previewSource.length ? "\n..." : ""}\n\`\`\``;

  const embed = new EmbedBuilder()
    .setColor(COLOR_BLUE)
    .setTitle("Stored file")
    .addFields([
      { name: "Status", value: "accepted", inline: true }, 
      { name: "ID", value: `\`${entry.id}\``, inline: true }, 
      { name: "Kind", value: entry.kind, inline: true }, 
      { name: "File", value: entry.fileName, inline: true }, 
      { name: "Time", value: formatDuration(elapsed), inline: true }, 
      { name: "Created", value: `<t:${Math.floor(entry.createdAt / 1000)}:R>`, inline: true }, 
      { name: "Preview", value: preview.length <= 1024 ? preview : preview.slice(0, 1020) + "```" }
    ])
    .setDescription(FOOTER_MESSAGE)
    .setFooter({ text: FOOTER_MESSAGE });

  await interaction.editReply({ embeds: [embed], files: [attachment] });
}

async function handleStats(interaction: ChatInputCommandInteraction): Promise<void> {
  const startedAt = Date.now();
  await interaction.deferReply();
  const stats = await getStats();
  const total = stats.obfuscations + stats.fetches + stats.lookups;
  const elapsed = Date.now() - startedAt;

  const embed = new EmbedBuilder()
    .setColor(COLOR_BLUE)
    .setTitle("Bot statistics")
    .addFields([
      { name: "Obfuscations", value: stats.obfuscations.toString(), inline: true }, 
      { name: "URL fetches", value: stats.fetches.toString(), inline: true }, 
      { name: "ID lookups", value: stats.lookups.toString(), inline: true }, 
      { name: "Support tickets", value: stats.supportRequests.toString(), inline: true }, 
      { name: "Total operations", value: total.toString(), inline: true }, 
      { name: "Response time", value: formatDuration(elapsed), inline: true }
    ])
    .setDescription(FOOTER_MESSAGE)
    .setFooter({ text: FOOTER_MESSAGE });

  await interaction.editReply({ embeds: [embed] });
}

async function handleSupport(interaction: ChatInputCommandInteraction): Promise<void> {
  const user = interaction.user;
  const guild = interaction.guild;
  try {
    const dm = await user.createDM();
    const embed = new EmbedBuilder().setColor(COLOR_BLUE).setTitle("Support ticket opened").setDescription("What it's your problem?").setFooter({ text: FOOTER_MESSAGE });
    await dm.send({ embeds: [embed] });
    
    startSession({ 
      userId: user.id, 
      guildId: guild ? guild.id : null, 
      guildName: guild ? guild.name : null, 
      channelId: interaction.channelId || null, 
      step: "awaiting_problem", 
      startedAt: Date.now() 
    });
    
    await bumpStat("supportRequests");
    
    const ack = new EmbedBuilder().setColor(COLOR_BLUE).setTitle("Check your DMs").setDescription("I sent you a private message to collect your support request.").setFooter({ text: FOOTER_MESSAGE });
    await interaction.reply({ embeds: [ack], ephemeral: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const embed = buildErrorEmbed("Could not open DM", "I could not send you a private message. Please enable DMs.\n\n" + message);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

async function notifySupporter(_message: Message, requester: User): Promise<boolean> {
  const session = getSession(requester.id);
  if (!session) return false;
  try {
    const supportUser = await client.users.fetch(SUPPORT_USER_ID);
    const dm = await supportUser.createDM();
    const embed = new EmbedBuilder()
      .setColor(COLOR_BLUE)
      .setTitle("New support ticket")
      .addFields([
        { name: "Ticket ID", value: `\`${session.ticketId || "n/a"}\``, inline: true }, 
        { name: "User", value: `<@${requester.id}> (${requester.tag})`, inline: true }, 
        { name: "Server", value: session.guildName || "Direct message", inline: true }, 
        { name: "Problem", value: (session.problem || "").slice(0, 1024) || "(empty)" }
      ])
      .setDescription(`Please DM <@${requester.id}> to provide support.`)
      .setFooter({ text: FOOTER_MESSAGE });
    await dm.send({ embeds: [embed] });
    return true;
  } catch (err) {
    console.error("Failed to DM support user:", err);
    return false;
  }
}

async function handleSupportDm(message: Message): Promise<void> {
  if (message.author.bot || message.channel.type !== ChannelType.DM) return;
  const session = getSession(message.author.id);
  if (!session) return;

  const content = (message.content || "").trim();
  if (!content) return;

  if (session.step === "awaiting_problem") {
    updateSession(message.author.id, { problem: content, step: "awaiting_id" });
    const embed = new EmbedBuilder().setColor(COLOR_BLUE).setTitle("Got it").setDescription("Send id").setFooter({ text: FOOTER_MESSAGE });
    await message.reply({ embeds: [embed] });
    return;
  }
  if (session.step === "awaiting_id") {
    updateSession(message.author.id, { ticketId: content, step: "done" });
    const embed = new EmbedBuilder().setColor(COLOR_BLUE).setTitle("Thanks").setDescription("Wait, one of our supporters will DM you.").setFooter({ text: FOOTER_MESSAGE });
    await message.reply({ embeds: [embed] });

    const delivered = await notifySupporter(message, message.author);
    const followup = new EmbedBuilder()
      .setColor(COLOR_BLUE)
      .setTitle("Support team notified")
      .setDescription(delivered ? "Notified the support team. Sit tight." : "I could not reach the support team right now. They will follow up shortly.")
      .setFooter({ text: FOOTER_MESSAGE });
    
    await message.author.send({ embeds: [followup] }).catch(() => undefined);
    clearSession(message.author.id);
  }
}

// ───────────────────────────── Eventos ─────────────────────────────
client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;
  try {
    if (commandName === "obf" || commandName === "obfuscate") await handleObfuscate(interaction);
    else if (commandName === "get") await handleGet(interaction);
    else if (commandName === "id_get") await handleIdGet(interaction);
    else if (commandName === "stats") await handleStats(interaction);
    else if (commandName === "sopport") await handleSupport(interaction);
  } catch (e) {
    console.error("Interaction Error:", e);
  }
});

client.on(Events.MessageCreate, (message) => {
  handleSupportDm(message).catch((err) => console.error("DM handler error:", err));
});

// ───────────────────────────── Arranque ─────────────────────────────
const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commandDefs });
    console.log("Successfully reloaded application (/) commands.");
    await client.login(TOKEN);
  } catch (error) {
    console.error(error);
  }
})();

// Health check para Railway
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Bot is alive!");
}).listen(process.env.PORT || 8080);
