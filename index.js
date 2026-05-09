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
  console.error("Faltan DISCORD_BOT_TOKEN o DISCORD_CLIENT_ID en las variables de entorno.");
  process.exit(1);
}

const FOOTER_MESSAGE = "⏱️ Tiempo";
const COLOR_BLUE = 0x3b82f6;
const COLOR_RED = 0xef4444;
const COLOR_GREEN = 0x22c55e;

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function readAttachmentText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
  const text = await res.text();
  if (!text.trim()) throw new Error("El archivo está vacío");
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
    .setDescription("Ofusca código Lua")
    .addStringOption(o => o.setName("code").setDescription("Código Lua directo").setRequired(false))
    .addAttachmentOption(o => o.setName("file").setDescription("Archivo .lua o .txt").setRequired(false))
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
      embeds: [buildErrorEmbed("Sin entrada", `Proporciona código o un archivo .lua/.txt\n\`${formatDuration(elapsed)}\``)],
    });
  }

  let source = "";
  try {
    if (codeOption) {
      source = codeOption;
    } else if (fileOption) {
      const name = (fileOption.name || "").toLowerCase();
      if (!name.endsWith(".lua") && !name.endsWith(".txt")) {
        throw new Error("Solo se permiten archivos .lua o .txt");
      }
      source = await readAttachmentText(fileOption.url);
    }
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    return await interaction.editReply({
      embeds: [buildErrorEmbed("Error al leer", `${err.message}\n\`${formatDuration(elapsed)}\``)],
    });
  }

  try {
    const obfuscated = obfuscate(source);
    const elapsed = Date.now() - startedAt;
    const attachment = new AttachmentBuilder(Buffer.from(obfuscated, "utf8"), { name: "ofuscado.lua" });
    const preview = obfuscated.slice(0, 300);

    const embed = new EmbedBuilder()
      .setColor(COLOR_GREEN)
      .setTitle("✅ Ofuscación exitosa")
      .addFields(
        { name: "Tamaño", value: `${obfuscated.length} bytes`, inline: true },
        { name: "Tiempo", value: `\`${formatDuration(elapsed)}\``, inline: true },
        { name: "Vista previa", value: `\`\`\`lua\n${preview}${obfuscated.length > 300 ? "..." : ""}\n\`\`\`` }
      )
      .setFooter({ text: FOOTER_MESSAGE });

    await interaction.editReply({ embeds: [embed], files: [attachment] });
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    await interaction.editReply({
      embeds: [buildErrorEmbed("Falló la ofuscación", `${err.message}\n\`${formatDuration(elapsed)}\``)],
    });
  }
}

client.once(Events.ClientReady, c => {
  console.log(`✅ Bot conectado como ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  try {
    if (interaction.commandName === "obf") {
      await handleObfuscate(interaction);
    }
  } catch (err) {
    console.error("Error en interacción:", err);
    const embed = buildErrorEmbed("Error interno", err.message);
    if (interaction.replied || interaction.deferred) {
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
    console.error("❌ Error al registrar comandos:", err);
  }
}

client.login(TOKEN);
registerCommands(); 
