const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// 🔧 STRING FIXA - CONEXÃO DIRETA
const MONGODB_URI = 'mongodb+srv://tiagoabreuenge_db_user:S1gpoc%40207042@tiagocluster.wi6sszn.mongodb.net/workspacepro?retryWrites=true&w=majority&appName=TiagoCluster';

console.log('🚀 Servidor Workspace Pro iniciando...');
console.log('🔌 MONGODB_URI definida:', MONGODB_URI ? '✅ SIM' : '❌ NÃO');

// ROTA DE TESTE
app.get('/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'pong',
    timestamp: new Date().toISOString(),
    db_connected: mongoose.connection.readyState === 1
  });
});

// ROTA PRINCIPAL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// CONEXÃO COM MONGODB
console.log('🔄 Tentando conectar ao MongoDB...');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('❌ Erro ao conectar:', err.message);
});

db.once('open', () => {
  console.log('✅ Conectado ao MongoDB com sucesso!');
  console.log('📊 Banco de dados:', db.name);
  
  // Configurar modelos e rotas APÓS conectar
  setupModelsAndRoutes();
});

// Função para configurar modelos e rotas
function setupModelsAndRoutes() {
  console.log('📊 Configurando modelos e rotas...');
  
  // Esquemas do MongoDB
  const EquipeSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    username: String,
    name: String,
    password: String,
    color: String,
    role: String,
    email: String,
    phone: String,
    cargo: String,
    type: String,
    firstAccess: Boolean
  });

  const BoardSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    name: String,
    managerId: String,
    groups: [{
      id: String,
      name: String,
      color: String,
      tasks: [{
        id: String,
        title: String,
        ownerId: String,
        status: String,
        priority: String,
        timeline: [String]
      }]
    }]
  });

  const Equipe = mongoose.model('Equipe', EquipeSchema);
  const Board = mongoose.model('Board', BoardSchema);

  // --- ROTAS DA API ---

  // Carregar dados
  app.get('/api/dados', async (req, res) => {
    console.log('📥 GET /api/dados');
    
    try {
      const equipe = await Equipe.find();
      const boards = await Board.find();
      console.log(`✅ Retornando ${equipe.length} membros e ${boards.length} projetos`);
      res.json({ team: equipe, boards: boards });
    } catch (error) {
      console.error('❌ Erro ao buscar dados:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Salvar equipe
  app.post('/api/equipe', async (req, res) => {
    console.log('📥 POST /api/equipe');
    
    try {
      const { team } = req.body;
      await Equipe.deleteMany({});
      await Equipe.insertMany(team);
      console.log(`✅ ${team.length} membros salvos`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao salvar equipe:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Salvar projetos
  app.post('/api/boards', async (req, res) => {
    console.log('📥 POST /api/boards');
    
    try {
      const { boards } = req.body;
      await Board.deleteMany({});
      await Board.insertMany(boards);
      console.log(`✅ ${boards.length} projetos salvos`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao salvar projetos:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Salvar/atualizar um projeto individual
  app.post('/api/board', async (req, res) => {
    console.log('📥 POST /api/board');
    
    try {
      const board = req.body;
      await Board.findOneAndUpdate(
        { id: board.id },
        board,
        { upsert: true, new: true }
      );
      console.log(`✅ Projeto ${board.name} salvo`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao salvar projeto:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Remover projeto
  app.delete('/api/board/:id', async (req, res) => {
    console.log('📥 DELETE /api/board');
    
    try {
      await Board.deleteOne({ id: parseInt(req.params.id) });
      console.log(`✅ Projeto ${req.params.id} removido`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao deletar projeto:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  console.log('✅ Rotas configuradas com sucesso!');
}

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log(`🔍 Teste: http://localhost:${PORT}/ping`);
});
