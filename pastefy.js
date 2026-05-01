// pastefy.js - Configuración y funciones para Pastefy API

const { fetch } = require("undici");

const PASTEFY_CONFIG = {
  API_URL: "https://pastefy.app/api/v2/paste",
  API_KEY: process.env.PASTEFY_API_KEY,
  EXPIRATION: 2592000, // 30 días
  DEFAULT_SYNTAX: "lua",
};

/**
 * Crea un paste en Pastefy
 * @param {string} code - Código a subir
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<string>} - URL del paste
 */
async function createPaste(code, options = {}) {
  if (!PASTEFY_CONFIG.API_KEY) {
    throw new Error("PASTEFY_API_KEY environment variable not set");
  }

  if (!code || typeof code !== "string") {
    throw new Error("Code must be a non-empty string");
  }

  try {
    const payload = {
      content: code,
      expiration: options.expiration || PASTEFY_CONFIG.EXPIRATION,
      syntax: options.syntax || PASTEFY_CONFIG.DEFAULT_SYNTAX,
    };

    const response = await fetch(PASTEFY_CONFIG.API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PASTEFY_CONFIG.API_KEY}`,
        "User-Agent": "Discord-Bot/2.3",
      },
      body: JSON.stringify(payload),
      timeout: 10000, // 10 segundos de timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseText = await response.text();
    if (!responseText) {
      throw new Error("Empty response from Pastefy API");
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      throw new Error(`Failed to parse Pastefy response: ${parseErr.message}`);
    }

    if (!data.id) {
      throw new Error("No paste ID in Pastefy response");
    }

    const pasteUrl = `${PASTEFY_CONFIG.API_URL}/${data.id}/raw`;
    return {
      id: data.id,
      url: pasteUrl,
      fullUrl: `https://pastefy.app/paste/${data.id}`,
      rawUrl: pasteUrl,
    };
  } catch (err) {
    throw new Error(`Pastefy API error: ${err.message}`);
  }
}

/**
 * Genera un loadstring de Roblox desde una URL de paste
 * @param {string} pasteUrl - URL del paste
 * @returns {string} - Loadstring listo para ejecutar
 */
function generateLoadstring(pasteUrl) {
  if (!pasteUrl || typeof pasteUrl !== "string") {
    throw new Error("Paste URL must be a non-empty string");
  }

  return `loadstring(game:HttpGet("${pasteUrl}"))()`;
}

/**
 * Crea un paste y genera el loadstring en una sola función
 * @param {string} code - Código Lua a subir
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} - Objeto con loadstring y URLs
 */
async function createLoadstring(code, options = {}) {
  const pasteData = await createPaste(code, options);
  const loadstring = generateLoadstring(pasteData.rawUrl);

  return {
    loadstring,
    pasteId: pasteData.id,
    pasteUrl: pasteData.fullUrl,
    rawUrl: pasteData.rawUrl,
    expiresIn: options.expiration || PASTEFY_CONFIG.EXPIRATION,
  };
}

/**
 * Valida que la configuración de Pastefy sea correcta
 * @returns {Object} - Estado de validación
 */
function validateConfig() {
  const errors = [];

  if (!PASTEFY_CONFIG.API_KEY) {
    errors.push("PASTEFY_API_KEY not set in environment variables");
  } else if (PASTEFY_CONFIG.API_KEY.length < 20) {
    errors.push("PASTEFY_API_KEY seems too short (invalid format?)");
  }

  if (!PASTEFY_CONFIG.API_URL) {
    errors.push("PASTEFY_API_URL not configured");
  }

  return {
    valid: errors.length === 0,
    errors,
    config: {
      apiUrl: PASTEFY_CONFIG.API_URL,
      hasApiKey: !!PASTEFY_CONFIG.API_KEY,
      apiKeyLength: PASTEFY_CONFIG.API_KEY?.length || 0,
      expiration: PASTEFY_CONFIG.EXPIRATION,
      defaultSyntax: PASTEFY_CONFIG.DEFAULT_SYNTAX,
    },
  };
}

/**
 * Obtiene información sobre la configuración de Pastefy
 * @returns {Object} - Información de configuración
 */
function getConfig() {
  return {
    apiUrl: PASTEFY_CONFIG.API_URL,
    expiration: PASTEFY_CONFIG.EXPIRATION,
    expirationDays: PASTEFY_CONFIG.EXPIRATION / 86400,
    defaultSyntax: PASTEFY_CONFIG.DEFAULT_SYNTAX,
    hasApiKey: !!PASTEFY_CONFIG.API_KEY,
    apiKeyPreview: PASTEFY_CONFIG.API_KEY ? 
      `${PASTEFY_CONFIG.API_KEY.substring(0, 10)}...${PASTEFY_CONFIG.API_KEY.substring(PASTEFY_CONFIG.API_KEY.length - 5)}` : 
      "NOT SET",
  };
}

/**
 * Cambia dinámicamente la API Key (útil para testing)
 * @param {string} newKey - Nueva API Key
 */
function setApiKey(newKey) {
  if (!newKey || typeof newKey !== "string") {
    throw new Error("API Key must be a non-empty string");
  }
  PASTEFY_CONFIG.API_KEY = newKey;
}

module.exports = {
  createPaste,
  generateLoadstring,
  createLoadstring,
  validateConfig,
  getConfig,
  setApiKey,
  PASTEFY_CONFIG,
};
