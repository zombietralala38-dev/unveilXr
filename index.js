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
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { fetch } = require("undici");
const { obfuscate } = require("./obfuscator.js");

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("Faltan DISCORD_BOT_TOKEN o DISCORD_CLIENT_ID");
  process.exit(1);
}

const FOOTER_MESSAGE = "⏱️ Time";
const COLOR_RED = 0xef4444;
const COLOR_GREEN = 0x22c55e;

const obfuscatedStore = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, { expiresAt }] of obfuscatedStore.entries()) {
    if (now > expiresAt) obfuscatedStore.delete(key);
  }
}, 60000);

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function readAttachmentText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return await res.text();
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
    .setDescription("Ofusca código Lua")
    .addStringOption((o) => o.setName("code").setDescription("Código Lua").setRequired(false))
    .addAttachmentOption((o) => o.setName("file").setDescription("Archivo .lua o .txt").setRequired(false))
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
      embeds: [buildErrorEmbed("No input provided", `Provide code or upload .lua/.txt file\n\`${formatDuration(elapsed)}\``)],
    });
  }

  let source = "";
  try {
    if (codeOption) {
      source = codeOption;
    } else if (fileOption) {
      const name = (fileOption.name || "").toLowerCase();
      if (!name.endsWith(".lua") && !name.endsWith(".txt")) {
        throw new Error("Only .lua or .txt files allowed");
      }
      source = await readAttachmentText(fileOption.url);
    }
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    return await interaction.editReply({
      embeds: [buildErrorEmbed("Read error", `${err.message}\n\`${formatDuration(elapsed)}\``)],
    });
  }

  if (!source || source.trim().length === 0) {
    const elapsed = Date.now() - startedAt;
    return await interaction.editReply({
      embeds: [buildErrorEmbed("Empty code", "Cannot obfuscate empty code.\n\`${formatDuration(elapsed)}\``)],
    });
  }

  try {
    const obfuscated = obfuscate(source);
    const elapsed = Date.now() - startedAt;

    const storeId = `copy_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    obfuscatedStore.set(storeId, {
      code: obfuscated,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // ✅ Botón con etiqueta en inglés "Copy full code"
    const copyButton = new ButtonBuilder()
      .setCustomId(storeId)
      .setLabel("📋 Copy full code")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(copyButton);

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

    await interaction.editReply({
      embeds: [embed],
      files: [attachment],
      components: [row],
    });
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    await interaction.editReply({
      embeds: [buildErrorEmbed("Obfuscation failed", `${err.message}\n\`${formatDuration(elapsed)}\``)],
    });
  }
}

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand() && interaction.commandName === "obf") {
    await handleObfuscate(interaction);
    return;
  }

  if (interaction.isButton()) {
    const storeId = interaction.customId;
    const stored = obfuscatedStore.get(storeId);

    if (!stored) {
      return interaction.reply({
        content: "❌ Code no longer available. Run `/obf` again.",
        ephemeral: true,
      });
    }

    const { code } = stored;
    obfuscatedStore.delete(storeId);

    const attachment = new AttachmentBuilder(Buffer.from(code, "utf8"), { name: "obfuscated.lua" });

    await interaction.reply({
      content: "📄 **Full obfuscated code** (attached file):",
      files: [attachment],
      ephemeral: true,
    });
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
