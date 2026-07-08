# 🚗 CRM Garagem

Sistema de CRM completo para oficinas mecânicas e garagens. Gerencia clientes, leads, ordens de serviço, peças em estoque e tipos de serviço.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 19 + Vite 8 + React Router |
| **Backend** | Node.js + Express 5 |
| **ORM** | Sequelize 6 |
| **Banco (dev)** | SQLite |
| **Banco (prod)** | PostgreSQL |
| **Ícones** | Lucide React |
| **Auth** | JWT + bcryptjs |

---

## 🚀 Desenvolvimento Local

### Pré-requisitos

- Node.js 20+
- npm

### 1. Clone e instale dependências

```bash
git clone <seu-repositorio>
cd crm-garagem

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure o .env do backend

```bash
cd backend
echo "ACCESS_TOKEN_SECRET=$(openssl rand -hex 32)" > .env
echo "PORT=5000" >> .env
```

### 3. Inicie os servidores

**Opção A — Script único:**
```bash
chmod +x start.sh
./start.sh
```

**Opção B — Separadamente:**

Terminal 1 — Backend:
```bash
cd backend
node server.js
# → http://localhost:5000
```

Terminal 2 — Frontend:
```bash
cd frontend
npx vite
# → http://localhost:3000
```

### 4. Acesse

Abra [http://localhost:3000](http://localhost:3000) e cadastre um usuário na tela de login.

---

## 🌐 Deploy em Produção

O CRM possui dois componentes que precisam ser deployados separadamente:

| Componente | Serviço Recomendado | Plano Grátis |
|------------|---------------------|:------------:|
| **Frontend** (React/Vite) | [Netlify](https://netlify.com) | ✅ Sim |
| **Backend** (Express API) | [Render](https://render.com) ou [Railway](https://railway.app) | ✅ Sim |
| **Banco** (PostgreSQL) | [Supabase](https://supabase.com), [Neon](https://neon.tech) ou [Render Postgres](https://render.com/docs/databases) | ✅ Sim |

### Visão Geral da Arquitetura

```
┌──────────────┐       ┌──────────────┐       ┌────────────┐
│   Navegador   │ ───►  │   Netlify    │ ───►  │   Backend  │
│  (usuário)    │       │  (frontend)  │       │ (Render/   │
│               │       │              │       │  Railway)  │
│               │       │  proxy /api/*│       │     │      │
│               │       │              │       │     ▼      │
│               │       │              │       ┌────────────┐
│               │       │              │       │ PostgreSQL │
└──────────────┘       └──────────────┘       └────────────┘
```

O frontend no Netlify faz proxy das chamadas `/api/*` para o backend, ou pode chamá-lo diretamente via `VITE_API_URL`.

---

### Passo 1 — Banco de Dados (PostgreSQL)

Escolha um provedor de PostgreSQL gratuito:

#### Opção A: Supabase (recomendado)

1. Crie conta em [supabase.com](https://supabase.com)
2. Clique em **New project**
3. Escolha um nome (ex: `crm-garagem`) e uma senha forte
4. Após criar, vá em **Project Settings → Database → Connection string**
5. Copie a `URI` — será algo como:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[REF].supabase.co:5432/postgres
   ```

#### Opção B: Neon

1. Crie conta em [neon.tech](https://neon.tech)
2. Crie um projeto e copie a `DATABASE_URL` fornecida

---

### Passo 2 — Backend no Render

> Se preferir Railway, pule para a **[seção alternativa](#alternativa-deploy-do-backend-no-railway)**.

1. Crie conta em [render.com](https://render.com) (login com GitHub)
2. No dashboard, clique em **New + → Web Service**
3. Conecte seu repositório GitHub
4. Configure:

   | Campo | Valor |
   |-------|-------|
   | **Name** | `crm-garagem-backend` |
   | **Root Directory** | `backend` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `node server.js` |
   | **Plan** | **Free** |

5. Em **Environment Variables**, adicione:

   | Variável | Valor |
   |----------|-------|
   | `DATABASE_URL` | A URL do PostgreSQL do passo 1 |
   | `ACCESS_TOKEN_SECRET` | `openssl rand -hex 32` (gere uma chave) |
   | `NODE_ENV` | `production` |

6. Clique em **Create Web Service**
7. Após o deploy, o Render fornecerá uma URL como:
   ```
   https://crm-garagem-backend.onrender.com
   ```

> ⚠️ No plano Free, o backend "dorme" após 15 minutos sem uso. A primeira requisição após o período leva ~30 segundos para "acordar".

---

### Alternativa: Deploy do Backend no Railway

1. Crie conta em [railway.app](https://railway.app) (login com GitHub)
2. Instale a CLI: `npm install -g @railway/cli`
3. No dashboard, clique em **New Project → Deploy from GitHub repo**
4. Selecione seu repositório
5. Railway detecta automaticamente o `railway.json` já configurado no projeto
6. Adicione um banco PostgreSQL:
   - No projeto Railway, clique em **New → Database → Add PostgreSQL**
   - A variável `DATABASE_URL` é injetada automaticamente
7. Adicione as outras variáveis de ambiente:
   - `ACCESS_TOKEN_SECRET` — gere com `openssl rand -hex 32`
   - `NODE_ENV` = `production`
8. Railway fará o deploy automaticamente

---

### Passo 3 — Frontend no Netlify

1. Crie conta em [netlify.com](https://netlify.com) (login com GitHub)
2. Clique em **Add new site → Import an existing project**
3. Conecte seu repositório GitHub
4. Configure:

   | Campo | Valor |
   |-------|-------|
   | **Base directory** | (deixe vazio — o `netlify.toml` já define) |
   | **Build command** | `cd frontend && npm install && npm run build` |
   | **Publish directory** | `frontend/dist` |

5. Em **Environment Variables**, adicione:

   | Variável | Valor |
   |----------|-------|
   | `VITE_API_URL` | (opcional) URL do backend, ex: `https://crm-garagem-backend.onrender.com/api` |

   > Se não definir `VITE_API_URL`, o Netlify usará o proxy configurado no `netlify.toml` para redirecionar `/api/*` para o backend. Escolha **uma** das abordagens.

6. Clique em **Deploy site**
7. Após o deploy, atualize a URL do backend no arquivo `netlify.toml`:

   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://SEU-BACKEND.onrender.com/api/:splat"   # ← Altere aqui
     status = 200
     force = true
   ```

   Ou configure via variável de ambiente `VITE_API_URL` (sem precisar alterar o `netlify.toml`).

8. Netlify fornecerá uma URL como:
   ```
   https://crm-garagem.netlify.app
   ```

---

### Passo 4 — Verificar o Deploy

Após o deploy, teste os endpoints:

```bash
# Testar backend
curl https://SEU-BACKEND.onrender.com/
# → {"message":"CRM API is running"}

# Registrar primeiro usuário
curl -X POST https://SEU-BACKEND.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@email.com","password":"123456"}'
# → {"token":"eyJ..."}

# Testar frontend
curl https://SEU-SITE.netlify.app/
# → <!DOCTYPE html>...
```

---

## 🛠️ Estrutura do Projeto

```
crm-garagem/
├── backend/
│   ├── config/
│   │   └── database.js      # Conexão SQLite (dev) / PostgreSQL (prod)
│   ├── models/
│   │   ├── index.js          # Carregador de modelos
│   │   ├── User.js           # Usuários (auth)
│   │   ├── Client.js         # Clientes
│   │   ├── Lead.js           # Leads
│   │   ├── ServiceOrder.js   # Ordens de serviço
│   │   ├── ServiceOrderItem.js
│   │   ├── ServiceType.js    # Tipos de serviço
│   │   └── Part.js           # Peças
│   ├── routes/
│   │   ├── auth.js
│   │   ├── clients.js
│   │   ├── leads.js
│   │   ├── serviceOrders.js
│   │   ├── serviceTypes.js
│   │   └── parts.js
│   ├── middleware/auth.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/              # Serviços de API (axios)
│   │   ├── components/       # Layout, ProtectedRoute
│   │   ├── contexts/         # AuthContext
│   │   ├── pages/            # Login, Dashboard, CRUDs
│   │   ├── App.jsx           # Rotas
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Estilos globais
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── netlify.toml              # Config Netlify
├── Procfile                  # Config Render
├── railway.json              # Config Railway
├── start.sh                  # Script dev local
├── .gitignore
└── README.md
```

---

## 🔧 Manutenção

### Atualizar modelos do banco

O Sequelize sincroniza os models automaticamente ao iniciar:
- **Dev (SQLite):** `sync()` — cria tabelas se não existirem
- **Prod (PostgreSQL):** Mesmo comportamento — tabelas criadas automaticamente

Para alterar a estrutura de uma tabela existente em produção, use **migrations** do Sequelize (consulte a [documentação oficial](https://sequelize.org/docs/v6/other-topics/migrations/)).

### Resetar banco (apenas dev)

```bash
rm backend/database.sqlite*
```

Na próxima inicialização, as tabelas serão recriadas.

---

## 📋 Rotas da API

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Registrar usuário |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Dados do usuário logado |

### Clientes
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/clients` | Listar todos |
| GET | `/api/clients/:id` | Buscar por ID |
| POST | `/api/clients` | Criar |
| PUT | `/api/clients/:id` | Atualizar |
| DELETE | `/api/clients/:id` | Excluir |

### Leads
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/leads` | Listar todos |
| POST | `/api/leads` | Criar |
| PUT | `/api/leads/:id` | Atualizar |
| DELETE | `/api/leads/:id` | Excluir |
| POST | `/api/leads/:id/convert` | Converter em cliente |

### Ordens de Serviço
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/service-orders` | Listar todas |
| POST | `/api/service-orders` | Criar (com peças) |
| PUT | `/api/service-orders/:id` | Atualizar |
| DELETE | `/api/service-orders/:id` | Excluir |
| PATCH | `/api/service-orders/:id/status` | Atualizar status |
| GET | `/api/service-orders/dashboard/stats` | Estatísticas |

### Peças
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/parts` | Listar todas |
| POST | `/api/parts` | Criar |
| PUT | `/api/parts/:id` | Atualizar |
| DELETE | `/api/parts/:id` | Excluir |
| GET | `/api/parts/low-stock` | Estoque baixo |

### Tipos de Serviço
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/service-types` | Listar todos |
| POST | `/api/service-types` | Criar |
| PUT | `/api/service-types/:id` | Atualizar |
| DELETE | `/api/service-types/:id` | Excluir |

---

## 🧪 Testes

Para rodar os testes (quando implementados):

```bash
cd backend
npm test

cd frontend
npm test
```

---

## 📄 Licença

MIT
