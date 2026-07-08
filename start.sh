#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== CRM Garagem ===${NC}"
echo ""

# Check .env
if [ ! -f "$BACKEND_DIR/.env" ]; then
  if [ -z "$ACCESS_TOKEN_SECRET" ]; then
    echo -e "${YELLOW}.env não encontrado. Criando com chave padrão...${NC}"
    echo "ACCESS_TOKEN_SECRET=$(openssl rand -hex 32)" > "$BACKEND_DIR/.env"
    echo "PORT=5000" >> "$BACKEND_DIR/.env"
  fi
fi

# Kill old processes
cleanup() {
  echo ""
  echo -e "${YELLOW}Parando servidores...${NC}"
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
  wait 2>/dev/null
  echo -e "${GREEN}Servidores parados.${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# Install dependencies if needed
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  echo -e "${YELLOW}Instalando dependências do backend...${NC}"
  cd "$BACKEND_DIR" && npm install --silent
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo -e "${YELLOW}Instalando dependências do frontend...${NC}"
  cd "$FRONTEND_DIR" && npm install --silent
fi

# Sync database
echo -e "${YELLOW}Sincronizando banco de dados...${NC}"
cd "$BACKEND_DIR"
node -e "
const db = require('./models');
db.sequelize.sync()
  .then(() => { console.log('✓ Banco sincronizado'); process.exit(0); })
  .catch(e => { console.error('Erro no banco:', e.message); process.exit(1); });
" 2>&1

# Start backend
echo -e "${YELLOW}Iniciando backend (porta 5000)...${NC}"
cd "$BACKEND_DIR"
node server.js &
BACKEND_PID=$!
sleep 2

# Check backend
if kill -0 "$BACKEND_PID" 2>/dev/null; then
  echo -e "${GREEN}✓ Backend rodando em http://localhost:5000${NC}"
else
  echo -e "${RED}Erro ao iniciar backend${NC}"
  exit 1
fi

# Start frontend
echo -e "${YELLOW}Iniciando frontend (porta 3000)...${NC}"
cd "$FRONTEND_DIR"
npx vite --host &
FRONTEND_PID=$!
sleep 3

if kill -0 "$FRONTEND_PID" 2>/dev/null; then
  echo -e "${GREEN}✓ Frontend rodando em http://localhost:3000${NC}"
else
  echo -e "${RED}Erro ao iniciar frontend${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}==============================${NC}"
echo -e "${GREEN}  CRM Garagem está no ar!     ${NC}"
echo -e "${GREEN}  Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}  Backend:  http://localhost:5000${NC}"
echo -e "${GREEN}==============================${NC}"
echo ""
echo "Pressione Ctrl+C para parar ambos servidores."

# Wait for either process
wait
