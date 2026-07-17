const { Op, literal } = require('sequelize');
const normalizePhone = require('../lib/normalizePhone');

/**
 * Monta o WHERE para casar telefone já normalizado no DB,
 * tolerando strings com espaços/traços/+ salvas antes.
 */
function buildPhoneWhere(norm) {
  if (!norm) return null;
  return literal(
    "REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(\"phone\",''), ' ', ''), '-', ''), '+', ''), '.', '') LIKE '%" +
    norm.replace(/'/g, "''") +
    "%'"
  );
}

/**
 * Busca por telefone normalizado em Client e Lead.
 */
async function findByNormalizedPhone(phone) {
  const norm = normalizePhone(phone);
  if (!norm) return { client: null, lead: null, normalized: null };

  const where = buildPhoneWhere(norm);

  const [client, lead] = await Promise.all([
    require('../models').Client.findOne({ where }),
    require('../models').Lead.findOne({ where })
  ]);

  return { client, lead, normalized: norm };
}

/**
 * Aplica um campo ao model somente se a coluna existir no DB.
 */
function safeSet(instance, field, value) {
  if (value === undefined || value === null || value === '') return;
  try {
    if (instance.rawAttributes && instance.rawAttributes[field]) {
      instance.set(field, value);
    } else if (instance.rawAttributes && instance.rawAttributes[field.toLowerCase()]) {
      instance.set(field.toLowerCase(), value);
    }
  } catch (e) {
    // ignora coluna opcional
  }
}

/**
 * Faz upsert de Client baseado em telefone normalizado.
 */
async function upsertClient(data = {}) {
  const { Client } = require('../models');
  const norm = normalizePhone(data.phone);

  if (!norm) {
    const err = new Error('Telefone é obrigatório para dedup');
    err.code = 'PHONE_REQUIRED';
    throw err;
  }

  const existing = await Client.findOne({ where: buildPhoneWhere(norm) });

  if (existing) {
    const updates = {};
    const fieldsToConsider = [
      'name', 'whatsapp', 'email', 'source', 'notes',
      'address', 'status', 'cpfCnpj', 'birthDate', 'phone'
    ];
    for (const f of fieldsToConsider) {
      if (data[f] === undefined || data[f] === null || data[f] === '') continue;
      const current = existing.get(f);
      const isEmpty =
        current === null ||
        current === undefined ||
        (typeof current === 'string' && current.trim() === '');
      if (isEmpty) {
        updates[f] = data[f];
      }
    }
    if (Object.keys(updates).length > 0) {
      for (const [k, v] of Object.entries(updates)) {
        safeSet(existing, k, v);
      }
      try {
        await existing.save();
      } catch (e) {
        console.warn('[dedupeClient] save parcial ignorado:', e.message);
      }
    }
    return { client: existing, merged: true, normalized: norm };
  }

  const payload = {
    name: data.name || 'Sem nome',
    phone: data.phone || norm,
    email: data.email || null,
    notes: data.notes || null,
    address: data.address || null
  };
  const newClient = Client.build(payload);
  const optionalFields = ['whatsapp', 'source', 'status', 'cpfCnpj', 'birthDate'];
  for (const f of optionalFields) {
    if (data[f] !== undefined && data[f] !== null && data[f] !== '') {
      safeSet(newClient, f, data[f]);
    }
  }
  await newClient.save();
  return { client: newClient, merged: false, normalized: norm };
}

module.exports = {
  normalizePhone,
  findByNormalizedPhone,
  upsertClient,
  buildPhoneWhere,
  safeSet
};
