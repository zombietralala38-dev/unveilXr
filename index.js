// index.js
if (typeof File === "undefined") {
  const { File: NodeFile } = require("buffer");
  global.File = NodeFile;
}

const fs = require("fs");
const path = require("path");
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
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { fetch } = require("undici");
const { obfuscate, TECHNIQUES } = require("./obfuscator.js");

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const ALLOWED_GUILD_ID = "1500583405102825695";
const INVITE_URL = "https://discord.gg/ccTBKtF3h";

if (!TOKEN || !CLIENT_ID) {
  console.error("Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID");
  process.exit(1);
}

const FOOTER_MESSAGE = "⏱️ Time";
const COLOR_RED = 0xef4444;
const COLOR_GREEN = 0x22c55e;
const COLOR_YELLOW = 0xf59e0b;
const COLOR_BLUE = 0x3b82f6;

function formatDuration(ms) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

async function readAttachmentText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (!text.trim()) throw new Error("Empty file");
  return text;
}

function buildErrorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLOR_RED)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: FOOTER_MESSAGE });
}

function buildHelpEmbed() {
  return new EmbedBuilder()
    .setColor(COLOR_BLUE)
    .setTitle("📘 Help & Instructions")
    .setDescription(
      "**Commands:**\n" +
      "• `/obf mode:custom/normal/bad/medium/extreme` + code or file\n" +
      "• Prefix: `.obf mode:normal code:print('hi')` or `!obf` or `?obf`\n\n" +
      "**Modes:**\n" +
      "• `custom` – Choose any combination of the 17 techniques via buttons.\n" +
      "• `bad` – Light obfuscation (watermark, anti‑env, junk).\n" +
      "• `normal` – Adds arithmetic, dead code, identifier renaming.\n" +
      "• `medium` – Adds CFF, XOR, runtime strings, fake chunks.\n" +
      "• `extreme` – All techniques + heavy VM layering.\n\n" +
      "**Available techniques (custom mode):**\n" +
      TECHNIQUES.map((t, i) => `${i+1}. ${t}`).join("\n") +
      `\n\n**Server restricted** – You must be a member of ${INVITE_URL}`
    )
    .setFooter({ text: FOOTER_MESSAGE });
}

const userCustomSelections = new Map();

function getTechniqueButtons(userId, selectedSet = new Set()) {
  const rows = [];
  let row = new ActionRowBuilder();
  let count = 0;
  for (let i = 0; i < TECHNIQUES.length; i++) {
    const isSelected = selectedSet.has(i);
    const btn = new ButtonBuilder()
      .setCustomId(`tech_${i}_${userId}`)
      .setLabel(`${i+1}. ${TECHNIQUES[i].substring(0, 40)}`)
      .setStyle(isSelected ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setEmoji(isSelected ? "✅" : "⬜");
    row.addComponents(btn);
    count++;
    if (count === 5) {
      rows.push(row);
      row = new ActionRowBuilder();
      count = 0;
    }
  }
  if (count > 0) rows.push(row);
  const actionRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder().setCustomId(`confirm_${userId}`).setLabel("✅ Confirm").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`cancel_${userId}`).setLabel("❌ Cancel").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`help_${userId}`).setLabel("❓ Help").setStyle(ButtonStyle.Secondary)
    );
  rows.push(actionRow);
  return rows;
}

async function handleObfuscateWithMode(ctx, source, mode, customTechniques = null) {
  const start = Date.now();
  const isInteraction = !!ctx.deferReply;
  if (isInteraction) await ctx.deferReply();

  try {
    let obfuscated;
    if (mode === "custom" && customTechniques) {
      obfuscated = obfuscate(source, { techniques: customTechniques });
    } else {
      obfuscated = obfuscate(source, { level: mode });
    }
    const elapsed = Date.now() - start;
    const attachment = new AttachmentBuilder(Buffer.from(obfuscated, "utf8"), { name: "obfuscated.lua" });
    const preview = obfuscated.slice(0, 300);
    const embed = new EmbedBuilder()
      .setColor(COLOR_GREEN)
      .setTitle("✅ Obfuscation successful")
      .addFields(
        { name: "Mode", value: mode === "custom" ? `Custom (${customTechniques.length} techs)` : mode, inline: true },
        { name: "Size", value: `${obfuscated.length} bytes`, inline: true },
        { name: "Time", value: `\`${formatDuration(elapsed)}\``, inline: true },
        { name: "Preview", value: `\`\`\`lua\n${preview}${obfuscated.length > 300 ? "..." : ""}\n\`\`\`` }
      )
      .setFooter({ text: FOOTER_MESSAGE });
    if (isInteraction) {
      await ctx.editReply({ embeds: [embed], files: [attachment] });
    } else {
      await ctx.reply({ embeds: [embed], files: [attachment] });
    }
  } catch (err) {
    const elapsed = Date.now() - start;
    const errorEmbed = buildErrorEmbed("Obfuscation failed", `${err.message}\n${formatDuration(elapsed)}`);
    if (isInteraction) {
      await ctx.editReply({ embeds: [errorEmbed] });
    } else {
      await ctx.reply({ embeds: [errorEmbed] });
    }
  }
}

// Slash command
const commandDefs = [
  new SlashCommandBuilder()
    .setName("obf")
    .setDescription("Obfuscates Lua code")
    .addStringOption(opt => opt.setName("mode").setDescription("Obfuscation mode").setRequired(true)
      .addChoices(
        { name: "Custom (select techniques)", value: "custom" },
        { name: "Bad", value: "bad" },
        { name: "Normal", value: "normal" },
        { name: "Medium", value: "medium" },
        { name: "Extreme", value: "extreme" }
      ))
    .addStringOption(opt => opt.setName("code").setDescription("Direct Lua code").setRequired(false))
    .addAttachmentOption(opt => opt.setName("file").setDescription(".lua or .txt file").setRequired(false))
    .toJSON(),
];

async function handleSlashObfuscate(interaction) {
  if (interaction.guild.id !== ALLOWED_GUILD_ID) {
    return interaction.reply({ embeds: [buildErrorEmbed("Access Denied", `You must join ${INVITE_URL} first`)], ephemeral: true });
  }
  const mode = interaction.options.getString("mode");
  const code = interaction.options.getString("code");
  const file = interaction.options.getAttachment("file");
  if (!code && !file) {
    return interaction.reply({ embeds: [buildErrorEmbed("No input", "Provide code or a .lua/.txt file")], ephemeral: true });
  }
  let source = "";
  try {
    if (code) source = code;
    else {
      if (!file.name.toLowerCase().endsWith(".lua") && !file.name.toLowerCase().endsWith(".txt"))
        throw new Error("Only .lua or .txt files");
      source = await readAttachmentText(file.url);
    }
  } catch (err) {
    return interaction.reply({ embeds: [buildErrorEmbed("Error reading file", err.message)], ephemeral: true });
  }
  if (mode === "custom") {
    userCustomSelections.set(interaction.user.id, { source, techniques: new Set() });
    const embed = new EmbedBuilder()
      .setColor(COLOR_YELLOW)
      .setTitle("🎛️ Custom Obfuscation")
      .setDescription("Select techniques (click to toggle). Press Confirm when done.")
      .setFooter({ text: "You can select up to all 17" });
    await interaction.reply({ embeds: [embed], components: getTechniqueButtons(interaction.user.id), ephemeral: true });
  } else {
    await handleObfuscateWithMode(interaction, source, mode);
  }
}

// Prefix command
async function handlePrefixObfuscate(message, args) {
  if (message.guild.id !== ALLOWED_GUILD_ID) {
    return message.reply({ embeds: [buildErrorEmbed("Access Denied", `Join ${INVITE_URL} first`)] });
  }
  let mode = "normal";
  let code = null;
  let file = message.attachments.first();
  const newArgs = [];
  for (const arg of args) {
    if (arg.startsWith("mode:")) mode = arg.split(":")[1].toLowerCase();
    else newArgs.push(arg);
  }
  const codeStr = newArgs.join(" ");
  if (codeStr.trim()) code = codeStr;
  if (!code && !file) {
    return message.reply({ embeds: [buildErrorEmbed("No input", "Provide code or attach .lua/.txt")] });
  }
  let source = "";
  try {
    if (code) source = code;
    else {
      if (!file.name.toLowerCase().endsWith(".lua") && !file.name.toLowerCase().endsWith(".txt"))
        throw new Error("Only .lua or .txt files");
      source = await readAttachmentText(file.url);
    }
  } catch (err) {
    return message.reply({ embeds: [buildErrorEmbed("Error reading file", err.message)] });
  }
  if (mode === "custom") {
    userCustomSelections.set(message.author.id, { source, techniques: new Set() });
    const embed = new EmbedBuilder()
      .setColor(COLOR_YELLOW)
      .setTitle("🎛️ Custom Obfuscation")
      .setDescription("Select techniques (click buttons). Confirm when ready.")
      .setFooter({ text: "Custom mode" });
    await message.reply({ embeds: [embed], components: getTechniqueButtons(message.author.id) });
  } else {
    await handleObfuscateWithMode(message, source, mode);
  }
}

// Button interactions
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages],
  partials: [Partials.Channel],
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;
  const userId = interaction.user.id;
  const customId = interaction.customId;

  if (customId === `help_${userId}`) {
    return interaction.reply({ embeds: [buildHelpEmbed()], ephemeral: true });
  }
  if (customId.startsWith("tech_")) {
    const techIndex = parseInt(customId.split("_")[1]);
    const stored = userCustomSelections.get(userId);
    if (!stored) return interaction.reply({ content: "Session expired. Run command again.", ephemeral: true });
    const set = stored.techniques;
    if (set.has(techIndex)) set.delete(techIndex);
    else set.add(techIndex);
    stored.techniques = set;
    userCustomSelections.set(userId, stored);
    const embed = new EmbedBuilder()
      .setColor(COLOR_YELLOW)
      .setTitle("🎛️ Custom Obfuscation")
      .setDescription(`Selected: ${set.size}/${TECHNIQUES.length} techniques. Confirm to obfuscate.`)
      .setFooter({ text: "Click again to toggle" });
    await interaction.update({ embeds: [embed], components: getTechniqueButtons(userId, set) });
    return;
  }
  if (customId === `confirm_${userId}`) {
    const stored = userCustomSelections.get(userId);
    if (!stored) return interaction.reply({ content: "Session expired.", ephemeral: true });
    if (stored.techniques.size === 0)
      return interaction.reply({ content: "Select at least one technique.", ephemeral: true });
    await handleObfuscateWithMode(interaction, stored.source, "custom", Array.from(stored.techniques));
    userCustomSelections.delete(userId);
    return;
  }
  if (customId === `cancel_${userId}`) {
    userCustomSelections.delete(userId);
    await interaction.update({ content: "Cancelled.", embeds: [], components: [] });
    return;
  }
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;
  const prefixes = [".", "!", "?"];
  let used = null;
  for (const p of prefixes) {
    if (message.content.startsWith(p)) { used = p; break; }
  }
  if (!used) return;
  const args = message.content.slice(used.length).trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();
  if (cmd === "obf") await handlePrefixObfuscate(message, args);
  else if (cmd === "help") {
    if (message.guild.id !== ALLOWED_GUILD_ID)
      return message.reply({ embeds: [buildErrorEmbed("Access Denied", `Join ${INVITE_URL}`)] });
    await message.reply({ embeds: [buildHelpEmbed()] });
  }
});

client.once(Events.ClientReady, c => console.log(`✅ Bot online as ${c.user.tag}`));

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "obf") await handleSlashObfuscate(interaction);
});

async function registerCommands() {
  try {
    console.log("📝 Registering slash commands...");
    const rest = new REST({ version: "10" }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commandDefs });
    console.log("✅ Commands registered");
  } catch (err) {
    console.error("❌ Error registering commands:", err);
  }
}

client.login(TOKEN);
registerCommands();
