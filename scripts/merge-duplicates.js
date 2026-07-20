/**
 * Script de merge de clientes duplicados
 * 
 * Uso: node scripts/merge-duplicates.js
 * 
 * Merge pairs:
 * 1. Deborah Cristina Santos Bernardes (ID 15) → Deborah cristina santos bernades (ID 95)
 * 2. Ivan Royal Multimarca (ID 33) → IVAN ROYAL MULTMARCA (ID 93)
 * 3. Laysa Pereira (ID 60) → Laysa Perreira (ID 92)
 * 
 * Regra: manter o cliente que TEM telefone, transferir veículos do outro
 */

const path = require('path');
const backendDir = path.resolve(__dirname, '..', 'backend');
const nodeModulesDir = path.join(backendDir, 'node_modules');
module.paths.unshift(nodeModulesDir);

require(path.join(nodeModulesDir, 'dotenv'))
  .config({ path: path.join(backendDir, '.env') });

const sequelize = require(path.join(backendDir, 'config', 'database'));
const db = require(path.join(backendDir, 'models'));

const MERGE_PAIRS = [
  { keepId: 95, removeId: 15 },  // Deborah (95 tem telefone)
  { keepId: 93, removeId: 33 },  // Ivan (93 tem telefone)
  { keepId: 92, removeId: 60 },  // Laysa (92 tem telefone)
];

async function merge() {
  console.log('=== MERGE DE CLIENTES DUPLICADOS ===\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco\n');
  } catch (err) {
    console.error('❌ Erro ao conectar:', err.message);
    process.exit(1);
  }

  let totalMerged = 0;

  for (const pair of MERGE_PAIRS) {
    console.log(`--- Processando par: manter #${pair.keepId} ← remover #${pair.removeId} ---`);

    const keepClient = await db.Client.findByPk(pair.keepId);
    const removeClient = await db.Client.findByPk(pair.removeId);

    if (!keepClient || !removeClient) {
      console.log(`  ⚠️  Cliente(s) não encontrado(s): manter=${!!keepClient} remover=${!!removeClient}`);
      continue;
    }

    console.log(`  Manter: ${keepClient.name} (tel: ${keepClient.phone || '—'})`);
    console.log(`  Remover: ${removeClient.name} (tel: ${removeClient.phone || '—'})`);

    // Step 1: Transfer vehicles
    const vehicles = await db.Vehicle.findAll({ where: { clientId: pair.removeId } });
    if (vehicles.length > 0) {
      await db.Vehicle.update(
        { clientId: pair.keepId },
        { where: { clientId: pair.removeId } }
      );
      console.log(`  🚗 ${vehicles.length} veículo(s) transferido(s): ${vehicles.map(v => v.plate).join(', ')}`);
    } else {
      console.log(`  🚗 Nenhum veículo para transferir`);
    }

    // Step 2: Transfer service orders (try/catch for column mismatch)
    try {
      const orders = await db.ServiceOrder.findAll({ where: { clientId: pair.removeId } });
      if (orders.length > 0) {
        await db.ServiceOrder.update(
          { clientId: pair.keepId },
          { where: { clientId: pair.removeId } }
        );
        console.log(`  📋 ${orders.length} OS(s) transferida(s)`);
      } else {
        console.log(`  📋 Nenhuma OS para transferir`);
      }
    } catch (osErr) {
      console.log(`  📋 Aviso: não foi possível verificar OS (${osErr.message})`);
    }

    // Step 3: Concatenate notes
    const removeNotes = removeClient.notes ? `\n[Duplicata removida] ${removeClient.notes}` : '';
    const keepNotes = keepClient.notes || '';
    const mergedNotes = keepNotes + removeNotes;
    await keepClient.update({ notes: mergedNotes || null });

    // Step 4: Delete the duplicate client
    await removeClient.destroy();
    console.log(`  🗑️  Cliente removido: ${removeClient.name}`);

    totalMerged++;
    console.log(`  ✅ Merge concluído!`);
    console.log('');
  }

  // Final summary
  console.log('=== RESUMO FINAL ===');
  const clientCount = await db.Client.count();
  const vehicleCount = await db.Vehicle.count();
  const orphanVehicles = await db.Vehicle.count({
    where: { clientId: { [db.Sequelize.Op.notIn]: db.Sequelize.literal('(SELECT id FROM Clients)') } }
  });

  console.log(`  Total de merges: ${totalMerged}`);
  console.log(`  Clientes agora: ${clientCount}`);
  console.log(`  Veículos: ${vehicleCount}`);
  console.log(`  Veículos órfãos: ${orphanVehicles}`);

  // Verify: check for remaining duplicates
  console.log('\n🔍 Verificando duplicatas restantes...');
  const allClients = await db.Client.findAll({ attributes: ['id', 'name', 'phone'], raw: true });
  const nameMap = {};
  for (const c of allClients) {
    const key = c.name.toLowerCase().trim().replace(/\s+/g, ' ');
    if (!nameMap[key]) nameMap[key] = [];
    nameMap[key].push(c);
  }
  const remainingDupes = Object.entries(nameMap).filter(([k, v]) => v.length > 1);
  if (remainingDupes.length > 0) {
    console.log('⚠️  Ainda existem duplicatas:');
    remainingDupes.forEach(([name, records]) => {
      console.log(`  ${name}: ${records.map(r => '#' + r.id + (r.phone ? ' tel:' + r.phone : '')).join(', ')}`);
    });
  } else {
    console.log('✅ Nenhuma duplicata encontrada!');
  }

  await sequelize.close();
  console.log('\n🔌 Conexão encerrada.');
}

merge().catch(err => {
  console.error('\n❌ Erro fatal:', err);
  process.exit(1);
});
