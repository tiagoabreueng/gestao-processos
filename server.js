const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// LOGS INICIAIS
console.log('🚀 Servidor iniciando...');
console.log('📁 Diretório atual:', __dirname);
console.log('📦 NODE_ENV:', process.env.NODE_ENV);
console.log('🔌 MONGODB_URI definida?', process.env.MONGODB_URI ? 'SIM' : 'NÃO');

// ROTA DE TESTE (antes de qualquer coisa)
app.get('/ping', (req, res) => {
  console.log('✅ Ping recebido!');
  res.json({ 
    status: 'ok', 
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// ROTA PRINCIPAL (serve o index.html)
app.get('/', (req, res) => {
  console.log('📄 Servindo index.html');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Lê a string de conexão da variável de ambiente
const MONGODB_URI = process.env.MONGODB_URI;

// Conectar ao MongoDB (se a string existir)
if (MONGODB_URI) {
  console.log('🔄 Tentando conectar ao MongoDB...');
  
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log('✅ Conectado ao MongoDB com sucesso!');
    
    // Definir modelos e rotas SOMENTE após conectar
    setupModelsAndRoutes();
    
  }).catch(err => {
    console.error('❌ Erro ao conectar ao MongoDB:', err.message);
    console.log('⚠️ Continuando sem banco de dados...');
    setupModelsAndRoutes(); // Continua mesmo sem banco
  });
} else {
  console.log('⚠️ MONGODB_URI não definida - rodando sem banco de dados');
  setupModelsAndRoutes();
}

// Função para configurar modelos e rotas
function setupModelsAndRoutes() {
  console.log('📊 Configurando modelos e rotas...');
  
  // Esquemas do MongoDB
  const UsuarioSchema = new mongoose.Schema({
    id: Number,
    nome: String,
    username: { type: String, unique: true },
    senha: String,
    tipo: String,
    cor: String
  });

  const ProcessoSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    numero: String,
    titulo: String,
    requerente: String,
    dataChegada: String,
    origem: String,
    prioridade: String,
    prazo: String,
    observacao: String,
    status: String,
    responsavel: Number,
    dataDespacho: String,
    despachadoPara: String
  });

  // Criar modelos apenas se o Mongoose estiver conectado
  const Usuario = mongoose.connection.readyState === 1 ? mongoose.model('Usuario', UsuarioSchema) : null;
  const Processo = mongoose.connection.readyState === 1 ? mongoose.model('Processo', ProcessoSchema) : null;

  // --- ROTAS DA API ---

  // Carregar dados iniciais
  app.get('/api/dados', async (req, res) => {
    console.log('📥 GET /api/dados');
    
    if (!Usuario || !Processo) {
      // Se não tiver banco, retorna dados mockados
      return res.json({
        usuarios: [
          { id: 1, nome: 'Tiago Abreu', username: 'tiago', senha: btoa('123456'), tipo: 'admin', cor: '#0073ea' },
          { id: 2, nome: 'Ana Silva', username: 'ana', senha: btoa('123456'), tipo: 'usuario', cor: '#00ca72' },
          { id: 3, nome: 'Carlos Santos', username: 'carlos', senha: btoa('123456'), tipo: 'usuario', cor: '#a25ddc' }
        ],
        processos: []
      });
    }
    
    try {
      const usuarios = await Usuario.find();
      const processos = await Processo.find();
      res.json({ usuarios, processos });
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Salvar usuários
  app.post('/api/usuarios', async (req, res) => {
    console.log('📥 POST /api/usuarios');
    
    if (!Usuario) {
      return res.json({ success: true, mock: true });
    }
    
    try {
      const { usuarios } = req.body;
      await Usuario.deleteMany({});
      await Usuario.insertMany(usuarios);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Salvar processos
  app.post('/api/processos', async (req, res) => {
    console.log('📥 POST /api/processos');
    
    if (!Processo) {
      return res.json({ success: true, mock: true });
    }
    
    try {
      const { processos } = req.body;
      await Processo.deleteMany({});
      await Processo.insertMany(processos);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Adicionar/atualizar um processo individual
  app.post('/api/processo', async (req, res) => {
    console.log('📥 POST /api/processo');
    
    if (!Processo) {
      return res.json({ success: true, mock: true });
    }
    
    try {
      const processo = req.body;
      await Processo.findOneAndUpdate(
        { id: processo.id },
        processo,
        { upsert: true, new: true }
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Remover processo
  app.delete('/api/processo/:id', async (req, res) => {
    console.log('📥 DELETE /api/processo');
    
    if (!Processo) {
      return res.json({ success: true, mock: true });
    }
    
    try {
      await Processo.deleteOne({ id: parseInt(req.params.id) });
      res.json({ success: true });
    } catch (error) {
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
