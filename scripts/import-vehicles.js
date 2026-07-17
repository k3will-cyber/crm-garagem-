/**
 * Script de importação de veículos e proprietários
 * 
 * Uso: node scripts/import-vehicles.js
 * 
 * Lê os dados de veículos do WhatsApp (colados abaixo) e:
 * 1. Cria clientes para cada proprietário (se não existir)
 * 2. Cria registros de veículos associados aos clientes
 */

const path = require('path');

// Resolve all paths absolutely from the backend directory
const backendDir = path.resolve(__dirname, '..', 'backend');
const nodeModulesDir = path.join(backendDir, 'node_modules');

// Override Node's module resolution to look in backend's node_modules first
module.paths.unshift(nodeModulesDir);

// Directly require dotenv from backend's node_modules
require(path.join(nodeModulesDir, 'dotenv'))
  .config({ path: path.join(backendDir, '.env') });

// Use absolute paths for all backend modules
const sequelize = require(path.join(backendDir, 'config', 'database'));
const db = require(path.join(backendDir, 'models'));

// ─── RAW DATA FROM WHATSAPP ───────────────────────────────────────
// Format: plate, brand model, year • color, owner, oilChange, km
const RAW_VEHICLES = [
  // Page 1
  { plate: 'JEO6062', brand: 'VW', model: 'Gol g2', year: 1997, color: 'Vermelho', owner: 'Lucas Oliveira', oilChange: null, km: 255365 },
  { plate: 'OQE8H28', brand: 'Fiat', model: 'Bravo', year: 2013, color: 'Branco', owner: 'Luiz Eduardo', oilChange: null, km: 231142 },
  { plate: 'ETB4322', brand: 'Peugeot', model: '307', year: 2011, color: 'Prata', owner: 'Rodrigo Diego Apolinário Vieira', oilChange: '10/01/2027', km: 245129 },
  { plate: 'OZW2D70', brand: 'VW', model: 'Up', year: 2015, color: 'Branco', owner: 'Thiago Serafim', oilChange: null, km: 0 },
  { plate: 'PAM3E36', brand: 'Fiat', model: 'Uno', year: 2016, color: 'Vermelha', owner: 'Cleidson Cláudio', oilChange: null, km: 160717 },
  { plate: 'EGG8508', brand: 'Honda', model: 'Fit', year: 2008, color: 'Prata', owner: 'Paulo Henrique Sousa', oilChange: null, km: 142322 },
  { plate: 'JHB7B98', brand: 'VW', model: 'Fox', year: 2008, color: 'Preta', owner: 'Sarah Khetley Pereira Monteiro da Silva', oilChange: null, km: 249691 },
  { plate: 'JGI6F44', brand: 'Ford', model: 'Fiesta', year: 2004, color: 'Cinza', owner: 'Keli Mota', oilChange: null, km: 251988 },
  { plate: 'JFV9141', brand: 'Ford', model: 'Fiesta', year: 2006, color: 'Prata', owner: 'Leandro Batista', oilChange: null, km: 333400 },
  { plate: 'JKQ5854', brand: 'VW', model: 'Gol g4', year: 2013, color: 'Vermelho', owner: 'Claudiomar Delfino', oilChange: null, km: 158620 },

  // Page 2
  { plate: 'HLL3810', brand: 'Fiat', model: 'Palio', year: 2014, color: 'Prata', owner: 'Douglas Santos', oilChange: null, km: 161933 },
  { plate: 'OVU2291', brand: 'Volkswagen', model: 'UP 1.0', year: 2014, color: 'Prata', owner: 'Letícia Silva', oilChange: null, km: 209219 },
  { plate: 'LVT2G05', brand: 'Fiat', model: 'Siena 1.0', year: 2002, color: 'Prata', owner: 'Dayane Lins Rezende', oilChange: null, km: 297800 },
  { plate: 'PVM2F45', brand: 'Renault', model: 'Sandero 1.0', year: 2016, color: 'Prata', owner: 'Antonio Carlos', oilChange: null, km: 272187 },
  { plate: 'JGN0572', brand: 'VW', model: 'Gol g4 Trend', year: 2014, color: 'Preto', owner: 'Deborah Cristina Santos Bernardes', oilChange: '23/12/2026', km: 270842 },
  { plate: 'JHI9878', brand: 'VW', model: 'G5', year: 2008, color: 'Prata', owner: 'Gabriel Trindade', oilChange: null, km: 178321 },
  { plate: 'JHQ5725', brand: 'Fiat', model: 'Fiorino', year: 2007, color: 'Branca', owner: 'Jivanildo de Lima Guerra', oilChange: null, km: 178300 },
  { plate: 'JHN2J18', brand: 'Volkswagen', model: 'Polo Sedan', year: 2008, color: 'Preta', owner: 'Vanessa Santos', oilChange: null, km: 254646 },
  { plate: 'JHB3974', brand: 'VW', model: 'Gol G5', year: 2009, color: 'Prata', owner: 'Guilherme Carvalho', oilChange: null, km: 275068 },
  { plate: 'JHC2194', brand: 'VW', model: 'Gol G4', year: 2007, color: 'Branco', owner: 'Valdean', oilChange: null, km: 0 },

  // Page 3
  { plate: 'JGK9917', brand: 'Fiat', model: 'Uno', year: 2006, color: 'Prata', owner: 'Gilberto Barbosa', oilChange: null, km: 328842 },
  { plate: 'NGS2115', brand: 'Peugeot', model: '206', year: 2006, color: 'Prata', owner: 'Cheila Silva', oilChange: '10/12/2026', km: 153951 },
  { plate: 'JIU4656', brand: 'GM', model: 'Celta', year: 2010, color: 'Preta', owner: 'Suiamy', oilChange: '10/12/2026', km: 338434 },
  { plate: 'JKB5C48', brand: 'GM', model: 'Celta', year: 2013, color: 'Branco', owner: 'Jane Cleia Alves da Silva', oilChange: null, km: 0 },
  { plate: 'JKK5D70', brand: 'Fiat', model: 'Palio Weekend 1.8 E Torq', year: 2014, color: 'Cinza', owner: 'Maria Karoline Gonçalves Veras', oilChange: null, km: 300000 },
  { plate: 'HCW5H43', brand: 'VW', model: 'Gol G4', year: 2006, color: 'Prata', owner: 'Gutierri', oilChange: null, km: 0 },
  { plate: 'PQS4236', brand: 'Fiat', model: 'Palio', year: 2015, color: 'Prata', owner: 'Juan', oilChange: null, km: 272408 },
  { plate: 'JGN6955', brand: 'Ford', model: 'Ford K', year: 2004, color: 'Preta', owner: 'Roberto Augusto', oilChange: null, km: 245050 },
  { plate: 'KEI4G09', brand: 'Fiat', model: 'Palio', year: 2003, color: 'Cinza', owner: 'Ana Patricia', oilChange: null, km: 269295 },
  { plate: 'JHP5339', brand: 'Volkswagen', model: 'Polo', year: 2008, color: null, owner: 'Jonatan', oilChange: null, km: 235349 },

  // Page 4
  { plate: 'JJG0H55', brand: 'Fiat', model: 'Uno', year: 2011, color: 'Branco', owner: 'Pedro Amorim', oilChange: null, km: 277384 },
  { plate: 'JHZ7C17', brand: 'Fiat', model: 'Fiorino', year: 2010, color: 'Branca', owner: 'Vitin Distribuidora', oilChange: null, km: 279040 },
  { plate: 'JHN6588', brand: 'Honda', model: 'CRV', year: 2008, color: 'Preta', owner: 'Ivan Royal Multimarca', oilChange: null, km: 404219 },
  { plate: 'KKJ9423', brand: 'GM', model: 'Celta', year: 2004, color: 'Vermelho', owner: 'Robson Renato', oilChange: null, km: 216575 },
  { plate: 'NHB9091', brand: 'GM', model: 'Celta', year: 2007, color: 'Preto', owner: 'Antonio Lucas Dutra', oilChange: '28/11/2026', km: 198746 },
  { plate: 'MIK3372', brand: 'Volkswagen', model: 'Fox Trend 1.0', year: 2011, color: 'Preta', owner: 'Raimundo Nonato', oilChange: null, km: 286586 },
  { plate: 'JIH8D84', brand: 'Volkswagen', model: 'Gol G5 1.0', year: 2010, color: 'Preto', owner: 'Marcelo Alves', oilChange: '27/11/2026', km: 0 },
  { plate: 'NLI7916', brand: 'Volkswagen', model: 'Gol G4 1.0', year: 2009, color: 'Vermelho', owner: 'Sergio Valentim', oilChange: null, km: 456444 },
  { plate: 'KBW4259', brand: 'Volkswagen', model: 'Gol Quadrado', year: 1988, color: 'Branco', owner: 'Mateus Ribeiro', oilChange: '20/11/2026', km: 5000000 },
  { plate: 'JJD4694', brand: 'Fiat', model: 'Palio', year: 1997, color: 'Prata', owner: 'Baltasar', oilChange: null, km: 347254 },

  // Page 5
  { plate: 'JKE9F93', brand: 'Chevrolet', model: 'Cruze 1.8 Ecotec', year: 2012, color: 'Branca', owner: 'Ivan Royal Multimarca', oilChange: null, km: 182356 },
  { plate: 'JFK5E25', brand: 'Fiat', model: 'Uno Mille', year: 1998, color: 'Vermelho', owner: 'Deivid Gomes', oilChange: '18/11/2026', km: 426866 },
  { plate: 'JIB5104', brand: 'Volkswagen', model: 'Polo', year: 2010, color: 'Preta', owner: 'Edilson Luiz', oilChange: null, km: 217739 },
  { plate: 'JEW1786', brand: 'Chevrolet', model: 'Corsa Wind', year: 1996, color: 'Azul', owner: 'Marcus Vinicius', oilChange: null, km: 137408 },
  { plate: 'QDL1A63', brand: 'Fiat', model: 'Grand Siena', year: 2012, color: 'Branco', owner: 'Adriano Almeida', oilChange: null, km: 134518 },
  { plate: 'PRT5041', brand: 'Fiat', model: 'Grand Siena', year: 2019, color: 'Vermelho', owner: 'Leonidas de Oliveira', oilChange: null, km: 107728 },
  { plate: 'OVT4567', brand: 'Fiat', model: 'Uno Vivace', year: 2014, color: 'Branco', owner: 'Bruno Ronny', oilChange: null, km: 209794 },
  { plate: 'RMO8B73', brand: 'Hyundai', model: 'Hb20', year: 2021, color: 'Branco', owner: 'Gladson do Nascimento Carvalho', oilChange: '15/07/2026', km: 99534 },
  { plate: 'JFX5243', brand: 'Chevrolet', model: 'Astra', year: 2002, color: 'Azul', owner: 'Jose Adriano de Sousa', oilChange: null, km: 260000 },
  { plate: 'NKV9302', brand: 'Volkswagen', model: 'Gol', year: 2008, color: 'Prata', owner: 'Suelma Matos', oilChange: null, km: 325433 },

  // Page 6
  { plate: 'JHZ3157', brand: 'Chevrolet', model: 'Classic', year: 2009, color: 'Vermelho', owner: 'Jose Airton', oilChange: null, km: 178000 },
  { plate: 'EVI5886', brand: 'Peugeot', model: '307', year: 2010, color: 'Prata', owner: 'Edimilson Jose', oilChange: null, km: 186000 },
  { plate: 'RED8D88', brand: 'Volkswagen', model: 'Gol G8 1.0 3C', year: 2020, color: 'Branco', owner: 'Sávio Gonçalves', oilChange: null, km: 132369 },
  { plate: 'PBO6193', brand: 'Chevrolet', model: 'Onix', year: 2018, color: 'Branco', owner: 'Luiz Elligton', oilChange: '05/11/2026', km: 77000 },
  { plate: 'AJQ3H02', brand: 'VW', model: 'Gol G2', year: 2001, color: 'Prata', owner: 'Pedro Lucas', oilChange: null, km: 300700 },
  { plate: 'NVX2727', brand: 'Chevrolet', model: 'Classic', year: 2011, color: 'Preto', owner: 'Diego Amorin', oilChange: null, km: 169337 },
  { plate: 'QUE4E41', brand: 'Chevrolet', model: 'Onix', year: 2019, color: 'Branco', owner: 'Jairo Romulo', oilChange: null, km: 171000 },
  { plate: 'NWB3702', brand: 'Volkswagen', model: 'Gol', year: 2010, color: 'Vermelho', owner: 'Tatiane de Moura', oilChange: null, km: 164179 },
  { plate: 'PBB6563', brand: 'Ford', model: 'EcoSport', year: 2017, color: 'Branca', owner: 'Paulo Cruzes', oilChange: null, km: 338166 },
  { plate: 'JGR7063', brand: 'Ford', model: 'Fiesta', year: 2007, color: 'Prata', owner: 'Tiago Francoar', oilChange: '15/10/2026', km: 288290 },

  // Page 7
  { plate: 'JFA7006', brand: 'Fiat', model: 'Palio 1.0 Fire', year: 2013, color: 'Preto', owner: 'Laysa Pereira', oilChange: null, km: 272685 },
  { plate: 'JHY7567', brand: 'Volkswagen', model: 'Golf Sportline', year: 2009, color: 'Amarelo', owner: 'Xandy Flayk', oilChange: null, km: 261310 },
  { plate: 'DYA6214', brand: 'Citroen', model: 'C3', year: 2007, color: 'Preto', owner: 'Claudiomar Delfino', oilChange: null, km: 100000 },
  { plate: 'JIW7355', brand: 'Volkswagen', model: 'Polo', year: 2008, color: 'Prata', owner: 'Maria Aparecida', oilChange: '13/10/2026', km: 153000 },
  { plate: 'JEQ1131', brand: 'Chevrolet', model: 'Chevette', year: 1989, color: 'Verde', owner: 'Deivid Gomes', oilChange: '10/10/2026', km: 70041 },
  { plate: 'JIH7849', brand: 'Fiat', model: 'Palio', year: 2012, color: 'Branco', owner: 'Henrique Carvalho', oilChange: null, km: 150358 },
  { plate: 'OZY8D31', brand: 'Volkswagen', model: 'Voyage', year: 2015, color: 'Preto', owner: 'Lucas Muniz', oilChange: null, km: 2074000 },
  { plate: 'OMN6G78', brand: 'Fiat', model: 'Palio', year: 2014, color: 'Preto', owner: 'Benisson Nascimento', oilChange: null, km: 262157 },
  { plate: 'SGY0B02', brand: 'Fiat', model: 'Pulse', year: 2023, color: 'Cinza', owner: 'Lucian Mafara', oilChange: null, km: 202000 },
  { plate: 'JHP5107', brand: 'VW', model: 'Gol G5', year: 2010, color: 'Vermelha', owner: 'Lua Raniere', oilChange: null, km: 218190 },

  // Page 8
  { plate: 'JHT1E04', brand: 'Volkswagen', model: 'Fox', year: 2009, color: 'Vermelha', owner: 'Adriano Almeida', oilChange: null, km: 118929 },
  { plate: 'PAN9076', brand: 'Fiat', model: 'Palio', year: 2015, color: 'Branco', owner: 'Andreia Dutra', oilChange: null, km: 197900 },
  { plate: 'JID3J07', brand: 'Volkswagen', model: 'Saveiro', year: 2009, color: 'Branca', owner: 'Thayllon Pimentel', oilChange: null, km: 310000 },
  { plate: 'GWA7613', brand: 'VW', model: 'Gol G2', year: 1997, color: 'Vermelho', owner: 'Lorrany Adrielly', oilChange: null, km: 470202 },
  { plate: 'IWM5G27', brand: 'Fiat', model: 'Punto', year: 2016, color: 'Branca', owner: 'Gilberte Avila', oilChange: null, km: 150987 },
  { plate: 'PBI8926', brand: 'Fiat', model: 'Argo', year: 2018, color: 'Preto', owner: 'Deivid Alves', oilChange: null, km: 214427 },
  { plate: 'JEF6312', brand: 'VW', model: 'Gol G2', year: 1996, color: 'Branco', owner: 'Luiz Otavio', oilChange: null, km: 4477700 },
  { plate: 'HSG0392', brand: 'Fiat', model: 'Palio', year: 2006, color: 'Prata', owner: 'Luiz Fernando', oilChange: '05/10/2026', km: 358559 },
  { plate: 'JJK7E52', brand: 'VW', model: 'Gol G5', year: 2013, color: 'Branco', owner: 'Eduardo Medeiros', oilChange: null, km: 212000 },
  { plate: 'OVP4019', brand: 'Fiat', model: 'Uno', year: 2014, color: 'Vermelha', owner: 'Douglas Antonio', oilChange: null, km: 203898 },

  // Page 9
  { plate: 'JIM0228', brand: 'Renault', model: 'Sandero', year: 2013, color: 'Prata', owner: 'Wallison Parreira', oilChange: null, km: 242000 },
  { plate: 'HR7462', brand: 'Chevrolet', model: 'Meriva', year: 2003, color: 'Preto', owner: 'Diego Amorin', oilChange: null, km: 20000 },
  { plate: 'PIF5H92', brand: 'VW', model: 'Voyage 1.0', year: 2015, color: 'Branca', owner: 'William de Araujo', oilChange: null, km: 168000 },
  { plate: 'JHE5398', brand: 'VW', model: 'Fox', year: 2008, color: 'Vermelha', owner: 'Francisco Lopes', oilChange: null, km: 187183 },
  { plate: 'HTD7D67', brand: 'Fiat', model: 'Linea', year: 2009, color: 'Preto', owner: 'Elizabethe Abreu', oilChange: null, km: 150138 },
  { plate: 'LAT3196', brand: 'Chevrolet', model: 'Corsa', year: 1995, color: 'Vinho', owner: 'Talita', oilChange: null, km: 311088 },
  { plate: 'SYZ6G14', brand: 'Peugeot', model: '208', year: 2024, color: null, owner: 'Xavier', oilChange: null, km: 56380 },
  { plate: 'JIR2238', brand: 'Fiat', model: 'Gol G5', year: 2012, color: 'Cinza', owner: 'Larissa Sousa', oilChange: '16/09/2026', km: 229548 },
  { plate: 'JFW9784', brand: 'Chevrolet', model: 'Corsa Classic', year: 2001, color: 'Prata', owner: 'Auricia Maria de Sa', oilChange: '13/09/2026', km: 297205 },
  { plate: 'NGV7B64', brand: 'GM', model: 'Celta', year: 2007, color: 'Prata', owner: 'Lucas Gomes de Souza', oilChange: null, km: 184476 },

  // Page 10
  { plate: 'NVR1927', brand: 'Chevrolet', model: 'Classic LS', year: 2011, color: 'Preto', owner: 'Yan Ribeiro', oilChange: null, km: 250874 },
  { plate: 'JHT', brand: 'Volkswagen', model: 'Gol G4', year: 2008, color: 'Branco', owner: 'Alisson', oilChange: '27/08/2026', km: 0 },
  { plate: 'NKX7B87', brand: 'Ford', model: 'Fiesta', year: 2009, color: 'Vermelho', owner: 'Cleverson Favaro', oilChange: null, km: 232453 },
  { plate: 'HEB2199', brand: 'Fiat', model: 'Palio', year: 2006, color: 'Prata', owner: 'Williham', oilChange: null, km: 193445 },
  { plate: 'JGH5541', brand: 'Volkswagen', model: 'Gol G4 1.0', year: 2008, color: 'Branca', owner: 'Paulo Henrique', oilChange: null, km: 293691 },
  { plate: 'OML1H64', brand: 'Chevrolet', model: 'Onix LT', year: 2013, color: 'Preto', owner: 'Sarah Khetley Pereira Monteiro da Silva', oilChange: null, km: 236049 },
];

async function importVehicles() {
  console.log('=== Importador de Veículos e Proprietários ===\n');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados\n');

    // Sync database to create/update tables
    await sequelize.sync();
    console.log('✅ Schema sincronizado\n');
  } catch (err) {
    console.error('❌ Erro ao conectar ao banco:', err.message);
    process.exit(1);
  }

  let clientsCreated = 0;
  let clientsFound = 0;
  let vehiclesCreated = 0;
  let vehiclesSkipped = 0;

  for (const entry of RAW_VEHICLES) {
    try {
      // Step 1: Find or create client
      const ownerName = entry.owner.trim();
      // Case-insensitive client lookup (works with SQLite and PostgreSQL)
      const Client = db.Client;
      let client = await Client.findOne({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('name')),
          ownerName.toLowerCase()
        )
      });

      if (client) {
        clientsFound++;
        console.log(`  📋 Cliente encontrado: ${ownerName} (ID: ${client.id})`);
      } else {
        client = await db.Client.create({
          name: ownerName,
          source: 'import-veiculo',
          notes: `Importado automaticamente como proprietário do veículo ${entry.plate}`
        });
        clientsCreated++;
        console.log(`  ✅ Cliente criado: ${ownerName} (ID: ${client.id})`);
      }

      // Step 2: Check if vehicle plate already exists
      if (entry.plate && entry.plate !== 'JHT') {
        const existing = await db.Vehicle.findOne({ where: { plate: entry.plate } });
        if (existing) {
          vehiclesSkipped++;
          console.log(`  ⏭️  Veículo já existe: ${entry.plate} - ${entry.brand} ${entry.model}`);
          continue;
        }
      }

      // Step 3: Create vehicle
      const fuel = detectFuel(entry.model, entry.brand);
      
      const vehicle = await db.Vehicle.create({
        clientId: client.id,
        plate: entry.plate === 'JHT' ? null : entry.plate, // Incomplete plate
        brand: entry.brand,
        model: entry.model,
        year: entry.year,
        color: entry.color,
        fuel: fuel,
        currentKm: entry.km || 0,
        notes: entry.oilChange ? `Próxima troca de óleo: ${entry.oilChange}` : null
      });

      vehiclesCreated++;
      console.log(`  🚗 Veículo criado: ${entry.plate} - ${entry.brand} ${entry.model} (${entry.year})`);

    } catch (err) {
      console.error(`  ❌ Erro ao importar ${entry.plate} (${entry.owner}): ${err.message}`);
    }
  }

  console.log('\n=== RESUMO DA IMPORTAÇÃO ===');
  console.log(`  📋 Clientes encontrados: ${clientsFound}`);
  console.log(`  ✅ Clientes criados: ${clientsCreated}`);
  console.log(`  🚗 Veículos criados: ${vehiclesCreated}`);
  console.log(`  ⏭️  Veículos ignorados (já existem): ${vehiclesSkipped}`);
  console.log(`  📊 Total de veículos no arquivo: ${RAW_VEHICLES.length}`);
  console.log('');

  await sequelize.close();
  console.log('🔌 Conexão com banco encerrada');
}

function detectFuel(model, brand) {
  const upper = `${brand} ${model}`.toLowerCase();
  if (upper.includes('flex') || upper.includes('1.0') || upper.includes('1.4') || upper.includes('1.6') || upper.includes('1.8') || upper.includes('ecotec') || upper.includes('fire') || upper.includes('1.0 3c') || upper.includes('lt')) return 'flex';
  if (upper.includes('hb20') || upper.includes('onix')) return 'flex';
  if (upper.includes('diesel') || upper.includes('1.8 e torq')) return 'diesel';
  if (upper.includes('hybrid') || upper.includes('hibrido')) return 'hybrid';
  return 'gasoline';
}

importVehicles();
