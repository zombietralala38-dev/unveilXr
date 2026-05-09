// Ensure File is defined in Node.js environment
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
  console.error("Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID in environment variables.");
  process.exit(1);
}

const FOOTER_MESSAGE = "⏱️ Time";
const COLOR_BLUE = 0x3b82f6;
const COLOR_RED = 0xef4444;
const COLOR_GREEN = 0x22c55e;

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function readAttachmentText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  const text = await res.text();
  if (!text.trim()) throw new Error("The file is empty");
  return text;
}

function buildErrorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLOR_RED)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: FOOTER_MESSAGE });
}

const commandDefs = [
  new SlashCommandBuilder()
    .setName("obf")
    .setDescription("Obfuscates Lua code")
    .addStringOption(o => o.setName("code").setDescription("Direct Lua code").setRequired(false))
    .addAttachmentOption(o => o.setName("file").setDescription(".lua or .txt file").setRequired(false))
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
      embeds: [buildErrorEmbed("No input", `Provide code or a .lua/.txt file\n\`${formatDuration(elapsed)}\``)],
    });
  }

  let source = "";
  try {
    if (codeOption) {
      source = codeOption;
    } else if (fileOption) {
      const name = (fileOption.name || "").toLowerCase();
      if (!name.endsWith(".lua") && !name.endsWith(".txt")) {
        throw new Error("Only .lua or .txt files are allowed");
      }
      source = await readAttachmentText(fileOption.url);
    }
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    return await interaction.editReply({
      embeds: [buildErrorEmbed("Error reading file", `${err.message}\n\`${formatDuration(elapsed)}\``)],
    });
  }

  try {
    const obfuscated = obfuscate(source);
    const elapsed = Date.now() - startedAt;
    const attachment = new AttachmentBuilder(Buffer.from(obfuscated, "utf8"), { name: "obfuscated.lua" });
    const preview = obfuscated.slice(0, 300);

    const embed = new EmbedBuilder()
      .setColor(COLOR_GREEN)
      .setTitle("✅ Obfuscation successful")
      .addFields(
        { name: "Size", value: `${obfuscated.length} bytes`, inline: true },
        { name: "Time", value: `\`${formatDuration(elapsed)}\``, inline: true },
        { name: "Preview", value: `\`\`\`lua\n${preview}${obfuscated.length > 300 ? "..." : ""}\n\`\`\`` }
      )
      .setFooter({ text: FOOTER_MESSAGE });

    await interaction.editReply({ embeds: [embed], files: [attachment] });
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    await interaction.editReply({
      embeds: [buildErrorEmbed("Obfuscation failed", `${err.message}\n\`${formatDuration(elapsed)}\``)],
    });
  }
}

client.once(Events.ClientReady, c => {
  console.log(`✅ Bot connected as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  try {
    if (interaction.commandName === "obf") {
      await handleObfuscate(interaction);
    }
  } catch (err) {
    console.error("Error in interaction:", err);
    const embed = buildErrorEmbed("Internal error", err.message);
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ embeds: [embed] }).catch(() => {});
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
    }
  }
});

async function registerCommands() {
  try {
    console.log("📝 Registering commands...");
    const rest = new REST({ version: "10" }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commandDefs });
    console.log("✅ Commands registered");
  } catch (err) {
    console.error("❌ Error registering commands:", err);
  }
}

client.login(TOKEN);
registerCommands();
