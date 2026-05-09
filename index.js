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
const axios = require("axios"); // Para conectar con SEAN API
const { obfuscate } = require("./obfuscator.js");

// CONFIGURACIÓN DEL SISTEMA SEAN (Variables de Entorno)
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const SEAN_API_URL = process.env.SEAN_API_URL; 
const SEAN_API_KEY = process.env.SEAN_API_KEY;

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ Faltan credenciales del bot en las variables de entorno.");
  process.exit(1);
}

const FOOTER_MESSAGE = "🛡️ SEAN SYSTEM ARMOR";
const COLOR_RED = 0xef4444;
const COLOR_GREEN = 0x00d2ff; // Azul SEAN

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
    .setDescription("Ofusca código Lua con protección SEAN")
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
      embeds: [buildErrorEmbed("Sin entrada", `Proporciona código o un archivo.\n\`${formatDuration(elapsed)}\``)],
    });
  }

  let source = "";
  let fileName = "script_ofuscado.lua";

  try {
    if (codeOption) {
      source = codeOption;
      fileName = "direct_code.lua";
    } else if (fileOption) {
      const name = (fileOption.name || "").toLowerCase();
      if (!name.endsWith(".lua") && !name.endsWith(".txt")) {
        throw new Error("Solo se permiten archivos .lua o .txt");
      }
      source = await readAttachmentText(fileOption.url);
      fileName = fileOption.name;
    }
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    return await interaction.editReply({
      embeds: [buildErrorEmbed("Error al leer", `${err.message}\n\`${formatDuration(elapsed)}\``)],
    });
  }

  try {
    // 1. Ofuscar el código
    const obfuscated = obfuscate(source);
    const elapsed = Date.now() - startedAt;
    
    let seanId = "No Sincronizado";
    let loadstringUrl = "Configura SEAN_API_URL en Railway";

    // 2. Enviar a la Web SEAN SYSTEM
    if (SEAN_API_URL && SEAN_API_KEY) {
        try {
            const res = await axios.post(SEAN_API_URL, {
                scriptName: fileName,
                obfuscatedCode: obfuscated
            }, {
                headers: { 'x-api-key': SEAN_API_KEY }
            });
            
            if (res.data.success) {
                seanId = res.data.id;
                // Construir la URL del loadstring basada en la URL de tu API
                const baseUrl = SEAN_API_URL.replace('/api/upload', '');
                loadstringUrl = `loadstring(game:HttpGet("${baseUrl}/api/scripts"))()`;
            }
        } catch (apiErr) {
            console.error("Error API SEAN:", apiErr.message);
            seanId = "Error de Conexión";
        }
    }

    const attachment = new AttachmentBuilder(Buffer.from(obfuscated, "utf8"), { name: `SEAN_${fileName}` });
    const preview = obfuscated.slice(0, 200);

    const embed = new EmbedBuilder()
      .setColor(COLOR_GREEN)
      .setTitle("🛡️ SEAN SYSTEM - PROTECCIÓN ACTIVA")
      .addFields(
        { name: "🆔 ID de Script", value: `\`${seanId}\``, inline: true },
        { name: "⏱️ Tiempo", value: `\`${formatDuration(elapsed)}\``, inline: true },
        { name: "📊 Tamaño", value: `\`${obfuscated.length} bytes\``, inline: true },
        { name: "🚀 Loadstring para Ejecutor", value: `\`\`\`lua\n${loadstringUrl}\n\`\`\`` }
      )
      .setDescription(`**Vista Previa:**\n\`\`\`lua\n${preview}...\n\`\`\``)
      .setFooter({ text: "SEAN SYSTEM | Powered by Railway" });

    await interaction.editReply({ embeds: [embed], files: [attachment] });

  } catch (err) {
    const elapsed = Date.now() - startedAt;
    await interaction.editReply({
      embeds: [buildErrorEmbed("Falló la ofuscación", `${err.message}\n\`${formatDuration(elapsed)}\``)],
    });
  }
}

client.once(Events.ClientReady, c => {
  console.log(`✅ SEAN Bot conectado como ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "obf") {
      await handleObfuscate(interaction);
  }
});

async function registerCommands() {
  try {
    const rest = new REST({ version: "10" }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commandDefs });
    console.log("✅ Comandos de SEAN registrados correctamente.");
  } catch (err) {
    console.error("❌ Error al registrar comandos:", err);
  }
}

client.login(TOKEN);
registerCommands();
