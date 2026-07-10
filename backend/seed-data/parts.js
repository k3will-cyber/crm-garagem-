// Estoque inicial de peças — organizado por categoria
// SKU format: CAT-NNN (Categoria + número sequencial)
// Descrições deixadas em branco para edição futura pelo usuário

const partsData = [
  // ==========================================
  // 1. ÓLEOS E LUBRIFICANTES
  // ==========================================
  { name: 'Óleo Motor 5W30 Sintético 1L', sku: 'OLE-001', price: 45.90, stockQuantity: 20, minStockLevel: 5, supplier: 'Lubrax', description: '' },
  { name: 'Óleo Motor 5W30 Sintético 4L', sku: 'OLE-002', price: 159.90, stockQuantity: 15, minStockLevel: 3, supplier: 'Lubrax', description: '' },
  { name: 'Óleo Motor 10W40 Semissintético 1L', sku: 'OLE-003', price: 35.90, stockQuantity: 24, minStockLevel: 6, supplier: 'Petrobras', description: '' },
  { name: 'Óleo Motor 10W40 Semissintético 4L', sku: 'OLE-004', price: 119.90, stockQuantity: 18, minStockLevel: 4, supplier: 'Petrobras', description: '' },
  { name: 'Óleo Motor 15W40 Mineral 1L', sku: 'OLE-005', price: 29.90, stockQuantity: 12, minStockLevel: 4, supplier: 'Ipiranga', description: '' },
  { name: 'Óleo Motor 15W40 Mineral 4L', sku: 'OLE-006', price: 99.90, stockQuantity: 10, minStockLevel: 3, supplier: 'Ipiranga', description: '' },
  { name: 'Óleo Motor 0W20 Sintético 1L', sku: 'OLE-007', price: 55.90, stockQuantity: 8, minStockLevel: 3, supplier: 'Mobil', description: '' },
  { name: 'Óleo Motor 0W20 Sintético 4L', sku: 'OLE-008', price: 189.90, stockQuantity: 6, minStockLevel: 2, supplier: 'Mobil', description: '' },
  { name: 'Óleo Câmbio Automático ATF 1L', sku: 'OLE-009', price: 48.90, stockQuantity: 10, minStockLevel: 3, supplier: 'Petrobras', description: '' },
  { name: 'Óleo Câmbio Automático ATF 4L', sku: 'OLE-010', price: 169.90, stockQuantity: 6, minStockLevel: 2, supplier: 'Petrobras', description: '' },
  { name: 'Óleo Câmbio Manual 75W90 1L', sku: 'OLE-011', price: 42.90, stockQuantity: 8, minStockLevel: 2, supplier: 'Ipiranga', description: '' },
  { name: 'Fluído de Freio DOT4 500ml', sku: 'OLE-012', price: 25.90, stockQuantity: 15, minStockLevel: 5, supplier: 'Radiador', description: '' },
  { name: 'Fluído de Freio DOT5.1 500ml', sku: 'OLE-013', price: 35.90, stockQuantity: 8, minStockLevel: 3, supplier: 'Radiador', description: '' },
  { name: 'Aditivo Arrefecimento Puro 1L', sku: 'OLE-014', price: 22.90, stockQuantity: 20, minStockLevel: 5, supplier: 'Radiador', description: '' },
  { name: 'Aditivo Arrefecimento Pronto Uso 1L', sku: 'OLE-015', price: 18.90, stockQuantity: 25, minStockLevel: 6, supplier: 'Radiador', description: '' },
  { name: 'Graxa Automotiva Geral 500g', sku: 'OLE-016', price: 15.90, stockQuantity: 10, minStockLevel: 3, supplier: 'Ipiranga', description: '' },

  // ==========================================
  // 2. FILTROS
  // ==========================================
  { name: 'Filtro de Óleo — Motor 1.0/1.4', sku: 'FIL-001', price: 19.90, stockQuantity: 30, minStockLevel: 8, supplier: 'Mann-Filter', description: '' },
  { name: 'Filtro de Óleo — Motor 1.6/1.8', sku: 'FIL-002', price: 22.90, stockQuantity: 25, minStockLevel: 7, supplier: 'Mann-Filter', description: '' },
  { name: 'Filtro de Óleo — Motor 2.0', sku: 'FIL-003', price: 28.90, stockQuantity: 20, minStockLevel: 5, supplier: 'Mann-Filter', description: '' },
  { name: 'Filtro de Ar — Motor 1.0', sku: 'FIL-004', price: 29.90, stockQuantity: 15, minStockLevel: 5, supplier: 'Mann-Filter', description: '' },
  { name: 'Filtro de Ar — Motor 1.6', sku: 'FIL-005', price: 32.90, stockQuantity: 15, minStockLevel: 5, supplier: 'Mann-Filter', description: '' },
  { name: 'Filtro de Ar — Motor 2.0', sku: 'FIL-006', price: 38.90, stockQuantity: 12, minStockLevel: 4, supplier: 'Mann-Filter', description: '' },
  { name: 'Filtro de Combustível — Injeção', sku: 'FIL-007', price: 35.90, stockQuantity: 12, minStockLevel: 4, supplier: 'Mann-Filter', description: '' },
  { name: 'Filtro de Combustível — Carburado', sku: 'FIL-008', price: 18.90, stockQuantity: 10, minStockLevel: 3, supplier: 'Mann-Filter', description: '' },
  { name: 'Filtro de Cabine/Pólen — Universal', sku: 'FIL-009', price: 25.90, stockQuantity: 15, minStockLevel: 5, supplier: 'Mann-Filter', description: '' },
  { name: 'Filtro de Cabine/Pólen — Premium', sku: 'FIL-010', price: 38.90, stockQuantity: 10, minStockLevel: 3, supplier: 'Mann-Filter', description: '' },

  // ==========================================
  // 3. FREIOS
  // ==========================================
  { name: 'Pastilha de Freio Dianteira — Popular', sku: 'FRE-001', price: 59.90, stockQuantity: 20, minStockLevel: 5, supplier: 'Fras-le', description: '' },
  { name: 'Pastilha de Freio Dianteira — Sedan', sku: 'FRE-002', price: 72.90, stockQuantity: 18, minStockLevel: 5, supplier: 'Fras-le', description: '' },
  { name: 'Pastilha de Freio Dianteira — SUV/Picape', sku: 'FRE-003', price: 89.90, stockQuantity: 12, minStockLevel: 4, supplier: 'Fras-le', description: '' },
  { name: 'Pastilha de Freio Traseira — Popular', sku: 'FRE-004', price: 55.90, stockQuantity: 15, minStockLevel: 4, supplier: 'Fras-le', description: '' },
  { name: 'Pastilha de Freio Traseira — Sedan', sku: 'FRE-005', price: 68.90, stockQuantity: 12, minStockLevel: 3, supplier: 'Fras-le', description: '' },
  { name: 'Disco de Freio Dianteiro — Popular', sku: 'FRE-006', price: 89.90, stockQuantity: 10, minStockLevel: 3, supplier: 'Fras-le', description: '' },
  { name: 'Disco de Freio Dianteiro — Sedan', sku: 'FRE-007', price: 109.90, stockQuantity: 8, minStockLevel: 3, supplier: 'Fras-le', description: '' },
  { name: 'Disco de Freio Dianteiro — SUV/Picape', sku: 'FRE-008', price: 139.90, stockQuantity: 6, minStockLevel: 2, supplier: 'Fras-le', description: '' },
  { name: 'Disco de Freio Traseiro — Popular', sku: 'FRE-009', price: 79.90, stockQuantity: 8, minStockLevel: 2, supplier: 'Fras-le', description: '' },
  { name: 'Lona de Freio Traseira — Kit', sku: 'FRE-010', price: 69.90, stockQuantity: 10, minStockLevel: 3, supplier: 'Fras-le', description: '' },
  { name: 'Cilindro de Roda Traseiro', sku: 'FRE-011', price: 35.90, stockQuantity: 10, minStockLevel: 3, supplier: 'Fras-le', description: '' },
  { name: 'Mangueira de Freio Universal', sku: 'FRE-012', price: 22.90, stockQuantity: 15, minStockLevel: 4, supplier: 'Fras-le', description: '' },

  // ==========================================
  // 4. IGNIÇÃO
  // ==========================================
  { name: 'Vela de Ignição — Padrão (Kit 4)', sku: 'IGN-001', price: 32.90, stockQuantity: 20, minStockLevel: 6, supplier: 'NGK', description: '' },
  { name: 'Vela de Ignição — Iridium (Kit 4)', sku: 'IGN-002', price: 79.90, stockQuantity: 12, minStockLevel: 4, supplier: 'NGK', description: '' },
  { name: 'Vela de Ignição — Platinum (Kit 4)', sku: 'IGN-003', price: 59.90, stockQuantity: 10, minStockLevel: 3, supplier: 'NGK', description: '' },
  { name: 'Cabo de Vela — Jogo Universal', sku: 'IGN-004', price: 45.90, stockQuantity: 10, minStockLevel: 3, supplier: 'Bosch', description: '' },
  { name: 'Bobina de Ignição — Padrão', sku: 'IGN-005', price: 89.90, stockQuantity: 6, minStockLevel: 2, supplier: 'Bosch', description: '' },
  { name: 'Bobina de Ignição — Dupla', sku: 'IGN-006', price: 129.90, stockQuantity: 5, minStockLevel: 2, supplier: 'Bosch', description: '' },

  // ==========================================
  // 5. ILUMINAÇÃO
  // ==========================================
  { name: 'Lâmpada Farol Alto/Baixo H7', sku: 'ILU-001', price: 15.90, stockQuantity: 20, minStockLevel: 6, supplier: 'Philips', description: '' },
  { name: 'Lâmpada Farol Alto/Baixo H4', sku: 'ILU-002', price: 18.90, stockQuantity: 20, minStockLevel: 6, supplier: 'Philips', description: '' },
  { name: 'Lâmpada Farol Alto/Baixo H11', sku: 'ILU-003', price: 22.90, stockQuantity: 15, minStockLevel: 5, supplier: 'Philips', description: '' },
  { name: 'Lâmpada Super Blue H7 5000K', sku: 'ILU-004', price: 39.90, stockQuantity: 10, minStockLevel: 3, supplier: 'Philips', description: '' },
  { name: 'Lâmpada Super Blue H4 5000K', sku: 'ILU-005', price: 42.90, stockQuantity: 10, minStockLevel: 3, supplier: 'Philips', description: '' },
  { name: 'Lâmpada Seta/2L Simples', sku: 'ILU-006', price: 6.90, stockQuantity: 30, minStockLevel: 10, supplier: 'Philips', description: '' },
  { name: 'Lâmpada Freio/Farolete', sku: 'ILU-007', price: 8.90, stockQuantity: 25, minStockLevel: 8, supplier: 'Philips', description: '' },
  { name: 'Lâmpada Placa/Interna', sku: 'ILU-008', price: 5.90, stockQuantity: 20, minStockLevel: 6, supplier: 'Philips', description: '' },
  { name: 'Lâmpada LED T10 CanBus', sku: 'ILU-009', price: 18.90, stockQuantity: 15, minStockLevel: 5, supplier: 'Philips', description: '' },
  { name: 'Lâmpada LED T20 12V', sku: 'ILU-010', price: 22.90, stockQuantity: 12, minStockLevel: 4, supplier: 'Philips', description: '' },
  { name: 'Farol Dianteiro — Universal', sku: 'ILU-011', price: 89.90, stockQuantity: 5, minStockLevel: 2, supplier: 'Fanal', description: '' },
  { name: 'Farolete Dianteiro — Universal', sku: 'ILU-012', price: 45.90, stockQuantity: 6, minStockLevel: 2, supplier: 'Fanal', description: '' },

  // ==========================================
  // 6. CORREIAS
  // ==========================================
  { name: 'Correia Dentada — Motor 1.0', sku: 'COR-001', price: 49.90, stockQuantity: 8, minStockLevel: 2, supplier: 'Gates', description: '' },
  { name: 'Correia Dentada — Motor 1.6', sku: 'COR-002', price: 59.90, stockQuantity: 8, minStockLevel: 2, supplier: 'Gates', description: '' },
  { name: 'Correia Dentada — Motor 2.0', sku: 'COR-003', price: 72.90, stockQuantity: 6, minStockLevel: 2, supplier: 'Gates', description: '' },
  { name: 'Correia Alternador — Universal', sku: 'COR-004', price: 25.90, stockQuantity: 12, minStockLevel: 4, supplier: 'Gates', description: '' },
  { name: 'Correia Alternador — Elite', sku: 'COR-005', price: 35.90, stockQuantity: 10, minStockLevel: 3, supplier: 'Gates', description: '' },
  { name: 'Correia Acessórios — Poli-V', sku: 'COR-006', price: 42.90, stockQuantity: 8, minStockLevel: 2, supplier: 'Gates', description: '' },
  { name: 'Kit Correia Dentada + Tensores — 1.0', sku: 'COR-007', price: 159.90, stockQuantity: 4, minStockLevel: 1, supplier: 'Gates', description: '' },
  { name: 'Kit Correia Dentada + Tensores — 1.6', sku: 'COR-008', price: 189.90, stockQuantity: 4, minStockLevel: 1, supplier: 'Gates', description: '' },

  // ==========================================
  // 7. BATERIAS
  // ==========================================
  { name: 'Bateria 45Ah — Carros 1.0', sku: 'BAT-001', price: 249.90, stockQuantity: 8, minStockLevel: 2, supplier: 'Moura', description: '' },
  { name: 'Bateria 60Ah — Carros 1.4/1.6', sku: 'BAT-002', price: 289.90, stockQuantity: 8, minStockLevel: 2, supplier: 'Moura', description: '' },
  { name: 'Bateria 75Ah — SUV/Picapes', sku: 'BAT-003', price: 359.90, stockQuantity: 5, minStockLevel: 1, supplier: 'Moura', description: '' },
  { name: 'Bateria 40Ah — Carros 1.0 (Polo-Plus)', sku: 'BAT-004', price: 229.90, stockQuantity: 6, minStockLevel: 2, supplier: 'Heliar', description: '' },
  { name: 'Bateria 50Ah — Carros 1.0/1.4', sku: 'BAT-005', price: 259.90, stockQuantity: 6, minStockLevel: 2, supplier: 'Heliar', description: '' },
  { name: 'Bateria 70Ah — SUV/Picapes (Heavy Duty)', sku: 'BAT-006', price: 389.90, stockQuantity: 4, minStockLevel: 1, supplier: 'Heliar', description: '' },
  { name: 'Bateria Estacionária 20Ah', sku: 'BAT-007', price: 159.90, stockQuantity: 3, minStockLevel: 1, supplier: 'Moura', description: '' },

  // ==========================================
  // 8. SUSPENSÃO
  // ==========================================
  { name: 'Amortecedor Dianteiro — Popular', sku: 'SUS-001', price: 139.90, stockQuantity: 6, minStockLevel: 2, supplier: 'Cofap', description: '' },
  { name: 'Amortecedor Dianteiro — Sedan', sku: 'SUS-002', price: 169.90, stockQuantity: 6, minStockLevel: 2, supplier: 'Cofap', description: '' },
  { name: 'Amortecedor Traseiro — Popular', sku: 'SUS-003', price: 119.90, stockQuantity: 6, minStockLevel: 2, supplier: 'Cofap', description: '' },
  { name: 'Amortecedor Traseiro — Sedan', sku: 'SUS-004', price: 149.90, stockQuantity: 6, minStockLevel: 2, supplier: 'Cofap', description: '' },
  { name: 'Kit Amortecedor + Mola — Diant. Popular', sku: 'SUS-005', price: 289.90, stockQuantity: 3, minStockLevel: 1, supplier: 'Cofap', description: '' },
  { name: 'Kit Amortecedor + Mola — Tras. Popular', sku: 'SUS-006', price: 259.90, stockQuantity: 3, minStockLevel: 1, supplier: 'Cofap', description: '' },
  { name: 'Terminal de Direção — Universal', sku: 'SUS-007', price: 29.90, stockQuantity: 12, minStockLevel: 4, supplier: 'Nakata', description: '' },
  { name: 'Pivô de Suspensão — Universal', sku: 'SUS-008', price: 35.90, stockQuantity: 10, minStockLevel: 3, supplier: 'Nakata', description: '' },
  { name: 'Barra Estabilizadora — Dianteira', sku: 'SUS-009', price: 38.90, stockQuantity: 8, minStockLevel: 2, supplier: 'Nakata', description: '' },
  { name: 'Coxim do Amortecedor — Universal', sku: 'SUS-010', price: 22.90, stockQuantity: 10, minStockLevel: 3, supplier: 'Nakata', description: '' },
  { name: 'Mola Helicoidal — Dianteira', sku: 'SUS-011', price: 89.90, stockQuantity: 5, minStockLevel: 2, supplier: 'Cofap', description: '' },
  { name: 'Mola Helicoidal — Traseira', sku: 'SUS-012', price: 79.90, stockQuantity: 5, minStockLevel: 2, supplier: 'Cofap', description: '' },

  // ==========================================
  // 9. ARREFECIMENTO
  // ==========================================
  { name: 'Radiador — Carro Popular', sku: 'REF-001', price: 219.90, stockQuantity: 4, minStockLevel: 1, supplier: 'Mando', description: '' },
  { name: 'Radiador — Sedan', sku: 'REF-002', price: 259.90, stockQuantity: 3, minStockLevel: 1, supplier: 'Mando', description: '' },
  { name: 'Ventoinha Elétrica — Universal 16"', sku: 'REF-003', price: 119.90, stockQuantity: 4, minStockLevel: 1, supplier: 'Mando', description: '' },
  { name: 'Sensor de Temperatura', sku: 'REF-004', price: 22.90, stockQuantity: 10, minStockLevel: 3, supplier: 'Bosch', description: '' },
  { name: 'Válvula Termostática', sku: 'REF-005', price: 28.90, stockQuantity: 8, minStockLevel: 2, supplier: 'Bosch', description: '' },
  { name: 'Mangueira Radiador — Superior Universal', sku: 'REF-006', price: 22.90, stockQuantity: 10, minStockLevel: 3, supplier: 'Gates', description: '' },
  { name: 'Mangueira Radiador — Inferior Universal', sku: 'REF-007', price: 22.90, stockQuantity: 10, minStockLevel: 3, supplier: 'Gates', description: '' },
  { name: 'Bomba d\'Água — Motor Popular', sku: 'REF-008', price: 69.90, stockQuantity: 5, minStockLevel: 2, supplier: 'Bosch', description: '' },
  { name: 'Bomba d\'Água — Motor 1.6', sku: 'REF-009', price: 79.90, stockQuantity: 5, minStockLevel: 2, supplier: 'Bosch', description: '' },
  { name: 'Tampa Radiador — Universal', sku: 'REF-010', price: 12.90, stockQuantity: 15, minStockLevel: 5, supplier: 'Mando', description: '' },

  // ==========================================
  // 10. DIVERSOS (Elétrica, Limpeza, Outros)
  // ==========================================
  { name: 'Palheta do Limpador — 18" Universal', sku: 'DIV-001', price: 18.90, stockQuantity: 15, minStockLevel: 5, supplier: 'Bosch', description: '' },
  { name: 'Palheta do Limpador — 22" Universal', sku: 'DIV-002', price: 22.90, stockQuantity: 15, minStockLevel: 5, supplier: 'Bosch', description: '' },
  { name: 'Palheta do Limpador — 24" Universal', sku: 'DIV-003', price: 24.90, stockQuantity: 12, minStockLevel: 4, supplier: 'Bosch', description: '' },
  { name: 'Fusível 10A — Standard', sku: 'DIV-004', price: 1.90, stockQuantity: 50, minStockLevel: 20, supplier: 'Bosch', description: '' },
  { name: 'Fusível 15A — Standard', sku: 'DIV-005', price: 1.90, stockQuantity: 50, minStockLevel: 20, supplier: 'Bosch', description: '' },
  { name: 'Fusível 20A — Standard', sku: 'DIV-006', price: 1.90, stockQuantity: 40, minStockLevel: 15, supplier: 'Bosch', description: '' },
  { name: 'Fusível 30A — Standard', sku: 'DIV-007', price: 2.50, stockQuantity: 30, minStockLevel: 10, supplier: 'Bosch', description: '' },
  { name: 'Fusível 50A — Standard', sku: 'DIV-008', price: 3.50, stockQuantity: 20, minStockLevel: 8, supplier: 'Bosch', description: '' },
  { name: 'Kit Fusíveis Sortidos (10 peças)', sku: 'DIV-009', price: 14.90, stockQuantity: 15, minStockLevel: 5, supplier: 'Bosch', description: '' },
  { name: 'Relógio Sinaleiro/Pisca — Universal', sku: 'DIV-010', price: 15.90, stockQuantity: 10, minStockLevel: 3, supplier: 'Bosch', description: '' },
  { name: 'Sensor de Ré — Universal', sku: 'DIV-011', price: 19.90, stockQuantity: 8, minStockLevel: 2, supplier: 'Bosch', description: '' },
  { name: 'Chicote Elétrico — Universal (2m)', sku: 'DIV-012', price: 12.90, stockQuantity: 10, minStockLevel: 3, supplier: 'Bosch', description: '' },
  { name: 'Desengripante Spray 200ml', sku: 'DIV-013', price: 9.90, stockQuantity: 20, minStockLevel: 6, supplier: 'WD-40', description: '' },
  { name: 'Lubrificante Spray 200ml', sku: 'DIV-014', price: 12.90, stockQuantity: 15, minStockLevel: 5, supplier: 'WD-40', description: '' },
  { name: 'Silicone Spray 200ml', sku: 'DIV-015', price: 11.90, stockQuantity: 12, minStockLevel: 4, supplier: 'WD-40', description: '' },
  { name: 'Limpa Contato Spray 200ml', sku: 'DIV-016', price: 14.90, stockQuantity: 12, minStockLevel: 4, supplier: 'WD-40', description: '' },
  { name: 'Cola de Vedação — Silicone Preto', sku: 'DIV-017', price: 8.90, stockQuantity: 15, minStockLevel: 5, supplier: 'Tekbond', description: '' },
  { name: 'Cola de Vedação — Silicone Transparente', sku: 'DIV-018', price: 8.90, stockQuantity: 15, minStockLevel: 5, supplier: 'Tekbond', description: '' },
  { name: 'Fita Isolante — Rolo 20m', sku: 'DIV-019', price: 6.90, stockQuantity: 20, minStockLevel: 6, supplier: '3M', description: '' },
  { name: 'Fita Auto-Fusão — Rolo 10m', sku: 'DIV-020', price: 12.90, stockQuantity: 10, minStockLevel: 3, supplier: '3M', description: '' },
  { name: 'Abraçadeira Nylon Sortida (Kit 50)', sku: 'DIV-021', price: 8.90, stockQuantity: 15, minStockLevel: 5, supplier: '3M', description: '' },
  { name: 'Lona Protetora — Assento (Kit 100)', sku: 'DIV-022', price: 19.90, stockQuantity: 10, minStockLevel: 3, supplier: 'Profissional', description: '' },
  { name: 'Capa Volante — Universal', sku: 'DIV-023', price: 15.90, stockQuantity: 10, minStockLevel: 3, supplier: 'Profissional', description: '' },
  { name: 'Limpador de Vidros 500ml', sku: 'DIV-024', price: 7.90, stockQuantity: 15, minStockLevel: 5, supplier: 'Vonixx', description: '' },
];

module.exports = partsData;
