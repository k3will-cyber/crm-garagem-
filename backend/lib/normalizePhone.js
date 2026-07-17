/**
 * Normaliza um número de telefone para comparação e armazenamento.
 *
 * Regras:
 *  - Mantém apenas dígitos.
 *  - Se o resultado tiver 10 ou 11 dígitos (DDD + número BR) e não começar
 *    com "55", prefixa "55" para garantir formato E.164 nacional.
 *  - Se vazio, nulo, ou tamanho inválido (< 8 dígitos), retorna null.
 *
 * @param {string|number|null|undefined} phone
 * @returns {string|null}
 */
function normalizePhone(phone) {
  if (phone === null || phone === undefined) return null;

  const digits = String(phone).replace(/\D+/g, '');

  if (!digits) return null;

  // Muito curto pra ser útil
  if (digits.length < 8) return null;

  // Se tem DDD+numero BR (10 ou 11) e não tem código de país, prefixa 55
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) {
    return '55' + digits;
  }

  return digits;
}

module.exports = normalizePhone;
module.exports.normalizePhone = normalizePhone;
module.exports.default = normalizePhone;
