/**
 * Script de migração: Transferir Leads → Clientes + Correlacionar Veículos
 * 
 * Uso: node scripts/migrate-leads-to-clients.js
 * 
 * Faz:
 * 1. Sincroniza o schema do banco (adiciona colunas novas como driverType)
 * 2. Importa dados de leads (nome, telefone, email) como clientes
 * 3. Correlaciona veículos aos clientes corretos por nome
 * 4. Marca motoristas de aplicativo (UBER/99) automaticamente
 */

const path = require('path');
const backendDir = path.resolve(__dirname, '..', 'backend');
const nodeModulesDir = path.join(backendDir, 'node_modules');
module.paths.unshift(nodeModulesDir);

require(path.join(nodeModulesDir, 'dotenv'))
  .config({ path: path.join(backendDir, '.env') });

const sequelize = require(path.join(backendDir, 'config', 'database'));
const db = require(path.join(backendDir, 'models'));
const { Op } = db.Sequelize;

// ─── RAW LEAD DATA FROM WHATSAPP ─────────────────────────────────
// Format: name, phone, email, source, status, estimatedValue, date
const RAW_LEADS = [
  { name: 'Sarah khetley pereira monteiro da silva', phone: '61995833537', email: 'Sarakhetlen1234@gmail.com', estimatedValue: 500.00 },
  { name: 'SUIAMY', phone: '61996568181', email: null, estimatedValue: 500.00 },
  { name: 'SUELMA MATOS', phone: '61993031369', email: null, estimatedValue: 500.00 },
  { name: 'SERGIO VALENTIM', phone: '61995273087', email: null, estimatedValue: 500.00 },
  { name: 'Robson renato', phone: '61994120980', email: null, estimatedValue: 500.00 },
  { name: 'Raimundo Nonato', phone: '61995805098', email: null, estimatedValue: 500.00 },
  { name: 'Pedro lucas', phone: '61992790991', email: null, estimatedValue: 500.00 },
  { name: 'Pedro amorim', phone: '61993025781', email: null, estimatedValue: 500.00 },
  { name: 'Paulo cruzes', phone: '61994290449', email: null, estimatedValue: 500.00 },
  { name: 'Paulo Henrique sousa', phone: '61991718042', email: null, estimatedValue: 500.00 },
  { name: 'Paulo Henrique', phone: '61982418684', email: null, estimatedValue: 500.00 },
  { name: 'Mateus Ribeiro', phone: '61992268448', email: null, estimatedValue: 500.00 },
  { name: 'Mateus Januario', phone: '61993879770', email: null, estimatedValue: null },
  { name: 'Maria aparecida', phone: '61984766260', email: null, estimatedValue: 500.00 },
  { name: 'Marcus vinicius', phone: '61981087505', email: null, estimatedValue: 500.00 },
  { name: 'Marcelo Alves', phone: '61991421815', email: 'Marceloalves.gama@yahoo.com.br', estimatedValue: 500.00 },
  { name: 'MARIA KAROLINE GONÇALVES VERAS', phone: '61992504801', email: null, estimatedValue: 500.00 },
  { name: 'Luiz Otavio', phone: '61996810715', email: null, estimatedValue: 500.00 },
  { name: 'Luiz Fernando', phone: '61981757105', email: null, estimatedValue: 500.00 },
  { name: 'Luiz Elligton', phone: '61995697482', email: null, estimatedValue: 500.00 },
  { name: 'Lucas Gomes de Souza', phone: '61983724130', email: 'maura35@gmail.com', estimatedValue: 500.00 },
  { name: 'Lorrany Adrielly', phone: '61981862290', email: 'lorranyadriell@gmail.com', estimatedValue: 500.00 },
  { name: 'Letícia Silva', phone: '61991285673', email: null, estimatedValue: 500.00 },
  { name: 'Leandro Batista', phone: '61981459373', email: null, estimatedValue: 500.00 },
  { name: 'Laysa Perreira', phone: '61995664242', email: null, estimatedValue: 500.00 },
  { name: 'Larissa Sousa', phone: '61991694615', email: null, estimatedValue: 500.00 },
  { name: 'LUCAS MUNIZ', phone: '61992834344', email: null, estimatedValue: 500.00 },
  { name: 'LEONIDAS DE OLIVEIRA', phone: '61981398609', email: null, estimatedValue: 500.00 },
  { name: 'Keli Mota', phone: '61986521710', email: null, estimatedValue: 500.00 },
  { name: 'Jane Cleia Alves Da Silva', phone: '61993482622', email: null, estimatedValue: 500.00 },
  { name: 'JUAN', phone: '61994514346', email: null, estimatedValue: 500.00 },
  { name: 'JOSE AIRTON', phone: '61992044156', email: null, estimatedValue: 500.00 },
  { name: 'JOSE ADRIANO DE SOUSA', phone: '61991396165', email: null, estimatedValue: 500.00 },
  { name: 'JIVANILDO DE LIMA GUERRA', phone: '61981371365', email: null, estimatedValue: 500.00 },
  { name: 'JAIRO ROMULO', phone: '61998645687', email: null, estimatedValue: 500.00 },
  { name: 'IVAN ROYAL MULTMARCA', phone: '61993325258', email: null, estimatedValue: 1000.00 },
  { name: 'Henrique Carvalho', phone: '61991610354', email: null, estimatedValue: 500.00 },
  { name: 'Gladson do nascimento Carvalho', phone: '61992064787', email: null, estimatedValue: 500.00 },
  { name: 'GUILHERME CARVALHO', phone: '61993191885', email: null, estimatedValue: 500.00 },
  { name: 'GILBERTO BARBOSA', phone: '61992568569', email: null, estimatedValue: 500.00 },
  { name: 'GILBERTE AVILA', phone: '61991553799', email: null, estimatedValue: 500.00 },
  { name: 'GABRIEL TRINDADE', phone: '61992682777', email: null, estimatedValue: 500.00 },
  { name: 'FRANCISCO LOPES', phone: '61992278105', email: null, estimatedValue: 500.00 },
  { name: 'Eduardo medeiros', phone: '61982013979', email: 'medeiroseduardo2002@gmail.com', estimatedValue: 500.00 },
  { name: 'Edilson luiz', phone: '61992542339', email: null, estimatedValue: 500.00 },
  { name: 'EVANILSON', phone: '61995715564', email: null, estimatedValue: null },
  { name: 'EDIMILSON JOSE', phone: '61993801837', email: null, estimatedValue: 500.00 },
  { name: 'Douglas Antonio', phone: '61991042190', email: 'ddoglasferreira@gmail.com', estimatedValue: 500.00 },
  { name: 'Diego amorin', phone: '61995993039', email: 'migueldiego1301@gmail.com', estimatedValue: 1000.00 },
  { name: 'Deivid gomes', phone: '61995993827', email: null, estimatedValue: 1000.00 },
  { name: 'Deborah cristina santos bernades', phone: '61991431092', email: null, estimatedValue: 500.00 },
  { name: 'Dayane Lins Rezende', phone: '61982267844', email: null, estimatedValue: 500.00 },
  { name: 'DOUGLAS SANTOS', phone: '61993618574', email: null, estimatedValue: 500.00 },
  { name: 'DEIVID ALVES', phone: '61992462979', email: null, estimatedValue: 500.00 },
  { name: 'Cleverson Favaro', phone: '61981202282', email: null, estimatedValue: 500.00 },
  { name: 'Cleidson Cláudio', phone: '61991410060', email: null, estimatedValue: 500.00 },
  { name: 'CLAUDIOMAR DELFINO', phone: '61984772242', email: null, estimatedValue: 1000.00 },
  { name: 'CHEILA SILVA', phone: '61995054658', email: null, estimatedValue: 500.00 },
  { name: 'Bruno Ronny', phone: '61985773309', email: null, estimatedValue: 500.00 },
  { name: 'Benisson Nascimento', phone: '61981826263', email: null, estimatedValue: 500.00 },
  { name: 'BRUNO GELEIA', phone: '61992709367', email: null, estimatedValue: null },
  { name: 'BALTASAR', phone: '61999015366', email: null, estimatedValue: 500.00 },
  { name: 'Auricia Maria de Sa', phone: '61982388378', email: null, estimatedValue: 500.00 },
  { name: 'Antonio lucas dutra', phone: '61994121847', email: null, estimatedValue: 500.00 },
  { name: 'Andreia dutra', phone: '61993495230', email: 'aadultra50@gmail.com', estimatedValue: 500.00 },
  { name: 'Alisson', phone: '61992086408', email: null, estimatedValue: 500.00 },
  { name: 'Adriano Almeida', phone: '61998260946', email: 'adrianoalmeida9275@gmail.com', estimatedValue: 1000.00 },
  { name: 'ANTONIO CARLOS', phone: '61993669417', email: null, estimatedValue: 500.00 },
];

// ─── OWNERS THAT ARE UBER/99 DRIVERS ────────────────────────────
const APP_DRIVERS = {
  'gladson do nascimento carvalho': 'app_uber',
  'sávio gonçalves': 'app_uber',
  'jairo romulo': 'app_uber',
  'yan ribeiro': 'app_uber',
};

/**
 * Normalize name for matching: trim, lowercase, remove extra spaces
 */
function normalizeName(name) {
  return (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Find a client by name (case-insensitive, trimmed)
 */
async function findClientByName(name) {
  const normalized = normalizeName(name);
  const clients = await db.Client.findAll();
  return clients.find(c => normalizeName(c.name) === normalized) || null;
}

async function migrate() {
  console.log('=== MIGRAÇÃO: LEADS → CLIENTES + CORRELAÇÃO DE VEÍCULOS ===\n');

  // Step 1: Authenticate & Sync
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');
  } catch (err) {
    console.error('❌ Erro ao conectar:', err.message);
    process.exit(1);
  }

  // Sync to add any new columns (like driverType)
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Schema sincronizado');
  } catch (err) {
    // If alter fails, fall back to regular sync
    await sequelize.sync();
    console.log('✅ Schema sincronizado (sync regular)');
  }

  // Step 2: Import leads as clients
  console.log('\n📋 IMPORTANDO LEADS COMO CLIENTES...\n');
  let leadsImported = 0;
  let leadsUpdated = 0;
  let leadsCreated = 0;
  let leadsSkipped = 0;

  for (const lead of RAW_LEADS) {
    try {
      // Try to find existing client by normalized name
      let client = await findClientByName(lead.name);

      if (client) {
        // Update existing client with phone/email if missing
        const updates = {};
        if (lead.phone && !client.phone) updates.phone = lead.phone;
        if (lead.email && !client.email) updates.email = lead.email;
        // Always update notes
        const leadNotes = `Lead importado em ${new Date().toLocaleDateString('pt-BR')}${lead.estimatedValue ? ` · Valor estimado: R$ ${lead.estimatedValue.toFixed(2)}` : ''}`;
        updates.notes = client.notes
          ? client.notes + '\n' + leadNotes
          : leadNotes;

        if (Object.keys(updates).length > 0) {
          await client.update(updates);
          leadsUpdated++;
          console.log(`  🔄 Cliente atualizado: ${client.name} → telefone: ${lead.phone || '⏭️'}, email: ${lead.email || '⏭️'}`);
        } else {
          leadsSkipped++;
        }
      } else {
        // Create new client from lead data
        client = await db.Client.create({
          name: lead.name.trim(),
          phone: lead.phone || null,
          email: lead.email || null,
          notes: `Lead importado em ${new Date().toLocaleDateString('pt-BR')}${lead.estimatedValue ? ` · Valor estimado: R$ ${lead.estimatedValue.toFixed(2)}` : ''}`,
          source: 'lead_import'
        });
        leadsCreated++;
        console.log(`  ✅ Novo cliente criado: ${client.name} (tel: ${lead.phone || '—'})`);
      }

      leadsImported++;
    } catch (err) {
      console.error(`  ❌ Erro ao importar lead ${lead.name}: ${err.message}`);
    }
  }

  console.log(`\n📊 LEADS: ${leadsImported} processados · ${leadsUpdated} atualizados · ${leadsCreated} criados · ${leadsSkipped} ignorados`);

  // Step 3: Correlate vehicles to clients by owner name
  console.log('\n🚗 CORRELACIONANDO VEÍCULOS AOS CLIENTES...\n');

  const allVehicles = await db.Vehicle.findAll();
  const allClients = await db.Client.findAll();
  let vehiclesCorrelated = 0;
  let vehiclesAlreadyOk = 0;
  let vehiclesSkipped = 0;

  for (const vehicle of allVehicles) {
    try {
      // Get the current client for this vehicle
      const currentClient = allClients.find(c => c.id === vehicle.clientId);
      if (!currentClient) {
        vehiclesSkipped++;
        continue;
      }

      // Try to find a better matching client by phone if available
      const vehicleOwnerName = normalizeName(currentClient.name);

      // Check if there's another client with the same normalized name but with phone
      // This handles duplicates created by the original import
      const matchingClients = allClients.filter(c => {
        if (c.id === vehicle.clientId) return false; // Skip current
        return normalizeName(c.name) === vehicleOwnerName;
      });

      if (matchingClients.length > 0) {
        // Found a better match (has phone/email) - re-assign vehicle
        const betterClient = matchingClients.find(c => c.phone) || matchingClients[0];
        await vehicle.update({ clientId: betterClient.id });
        vehiclesCorrelated++;
        console.log(`  🔗 ${vehicle.plate} → ${betterClient.name} (era ${currentClient.name})`);

        // Remove the old duplicate client if it has no vehicles anymore
        const remainingVehicles = await db.Vehicle.count({ where: { clientId: currentClient.id } });
        if (remainingVehicles === 0 && !currentClient.phone && !currentClient.email) {
          await currentClient.destroy();
          console.log(`  🗑️  Cliente duplicado removido: ${currentClient.name}`);
        }
      } else {
        vehiclesAlreadyOk++;
      }
    } catch (err) {
      console.error(`  ❌ Erro ao correlacionar veículo ${vehicle.plate}: ${err.message}`);
    }
  }

  console.log(`\n📊 VEÍCULOS: ${allVehicles.length} total · ${vehiclesCorrelated} rec correlacionados · ${vehiclesAlreadyOk} já OK · ${vehiclesSkipped} ignorados`);

  // Step 4: Mark app drivers (UBER/99)
  console.log('\n🚘 MARCANDO MOTORISTAS DE APLICATIVO...\n');
  let appDriversMarked = 0;

  for (const [nameKey, driverType] of Object.entries(APP_DRIVERS)) {
    const client = allClients.find(c => normalizeName(c.name) === nameKey);
    if (client) {
      await client.update({ driverType });
      appDriversMarked++;
      const label = driverType === 'app_uber' ? '🚘 UBER' : '🚘 99';
      console.log(`  ${label}: ${client.name}`);
    }
  }

  console.log(`\n📊 Motoristas de app marcados: ${appDriversMarked}`);

  // Step 5: Final summary
  console.log('\n=== RESUMO FINAL ===');
  const finalClientCount = await db.Client.count();
  const finalVehicleCount = await db.Vehicle.count();
  const clientsWithPhone = await db.Client.count({ where: { phone: { [Op.ne]: null } } });
  const clientsWithEmail = await db.Client.count({ where: { email: { [Op.ne]: null } } });
  const appDrivers = await db.Client.count({ where: { driverType: { [Op.ne]: 'convencional' } } });

  console.log(`  👤 Clientes: ${finalClientCount}`);
  console.log(`  📞 Clientes com telefone: ${clientsWithPhone}`);
  console.log(`  📧 Clientes com email: ${clientsWithEmail}`);
  console.log(`  🚘 Motoristas de app: ${appDrivers}`);
  console.log(`  🚗 Veículos: ${finalVehicleCount}`);

  await sequelize.close();
  console.log('\n🔌 Conexão encerrada. Migração concluída! ✅');
}

migrate().catch(err => {
  console.error('\n❌ Erro fatal:', err);
  process.exit(1);
});
