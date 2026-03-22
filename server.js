const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// STRING DE CONEXÃO CORRETA
const MONGODB_URI = 'mongodb+srv://tiagoabreuenge_db_user:S1gpoc%40207042@tiagocluster.wi6sszn.mongodb.net/projetos?retryWrites=true&w=majority&appName=TiagoCluster';

console.log('🚀 Servidor Workspace Pro iniciando...');

// ROTA DE TESTE
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'pong', timestamp: new Date().toISOString() });
});

// ROTA PRINCIPAL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// CONEXÃO COM MONGODB
console.log('🔄 Conectando ao MongoDB...');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('❌ Erro ao conectar:', err.message);
});

db.once('open', async () => {
  console.log('✅ Conectado ao MongoDB!');
  console.log('📊 Banco de dados:', db.db.databaseName);
  
  // Listar coleções para debug
  const collections = await db.db.listCollections().toArray();
  console.log('📁 Coleções disponíveis:', collections.map(c => c.name));
  
  setupModelsAndRoutes();
});

function setupModelsAndRoutes() {
  // ESQUEMAS - USANDO OS NOMES CORRETOS DAS COLEÇÕES
  const UsuarioSchema = new mongoose.Schema({
    id: String,
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

  const ProjetoSchema = new mongoose.Schema({
    id: Number,
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

  // IMPORTANTE: Forçar os nomes das coleções existentes
  const Usuario = mongoose.model('Usuario', UsuarioSchema, 'usuarios');
  const Projeto = mongoose.model('Projeto', ProjetoSchema, 'projetos');

  // ROTA PARA CARREGAR DADOS
  app.get('/api/dados', async (req, res) => {
    console.log('📥 GET /api/dados');
    
    try {
      const usuarios = await Usuario.find();
      const projetos = await Projeto.find();
      console.log(`✅ Encontrados: ${usuarios.length} usuários, ${projetos.length} projetos`);
      
      // Log dos primeiros para debug
      if (usuarios.length > 0) console.log('👤 Primeiro usuário:', usuarios[0].name);
      if (projetos.length > 0) console.log('📋 Primeiro projeto:', projetos[0].name);
      
      res.json({ team: usuarios, boards: projetos });
    } catch (error) {
      console.error('❌ Erro ao buscar dados:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ROTA PARA SALVAR EQUIPE
  app.post('/api/equipe', async (req, res) => {
    console.log('📥 POST /api/equipe');
    
    try {
      const { team } = req.body;
      await Usuario.deleteMany({});
      await Usuario.insertMany(team);
      console.log(`✅ ${team.length} usuários salvos`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ROTA PARA SALVAR PROJETOS
  app.post('/api/boards', async (req, res) => {
    console.log('📥 POST /api/boards');
    
    try {
      const { boards } = req.body;
      await Projeto.deleteMany({});
      await Projeto.insertMany(boards);
      console.log(`✅ ${boards.length} projetos salvos`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ROTA PARA SALVAR PROJETO INDIVIDUAL
  app.post('/api/board', async (req, res) => {
    console.log('📥 POST /api/board');
    
    try {
      const board = req.body;
      await Projeto.findOneAndUpdate(
        { id: board.id },
        board,
        { upsert: true, new: true }
      );
      console.log(`✅ Projeto ${board.name} salvo`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ROTA PARA REMOVER PROJETO
  app.delete('/api/board/:id', async (req, res) => {
    console.log('📥 DELETE /api/board');
    
    try {
      await Projeto.deleteOne({ id: parseInt(req.params.id) });
      console.log(`✅ Projeto ${req.params.id} removido`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  console.log('✅ Rotas configuradas com sucesso!');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
