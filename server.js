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
console.log('🔌 MONGODB_URI:', process.env.MONGODB_URI ? '✅ DEFINIDA' : '❌ NÃO DEFINIDA');

// ROTA DE TESTE
app.get('/ping', (req, res) => {
  console.log('✅ Ping recebido!');
  res.json({ 
    status: 'ok', 
    message: 'pong',
    timestamp: new Date().toISOString(),
    mongodb_uri: process.env.MONGODB_URI ? 'definida' : 'indefinida'
  });
});

// ROTA PRINCIPAL
app.get('/', (req, res) => {
  console.log('📄 Servindo index.html');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ROTA PARA TESTAR CONEXÃO COM MONGODB
app.get('/api/teste', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      res.json({ 
        connected: true, 
        message: 'Conectado ao MongoDB',
        database: mongoose.connection.name
      });
    } else {
      res.json({ 
        connected: false, 
        message: 'Não conectado ao MongoDB',
        state: mongoose.connection.readyState
      });
    }
  } catch (error) {
    res.json({ connected: false, error: error.message });
  }
});

// CONEXÃO COM MONGODB
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  console.log('🔄 Tentando conectar ao MongoDB...');
  
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  const db = mongoose.connection;
  
  db.on('error', (err) => {
    console.error('❌ Erro ao conectar ao MongoDB:', err.message);
  });
  
  db.once('open', () => {
    console.log('✅ Conectado ao MongoDB com sucesso!');
    console.log('📊 Banco de dados:', db.name);
    
    // Configurar modelos e rotas APÓS conectar
    setupModelsAndRoutes();
  });
} else {
  console.log('⚠️ MONGODB_URI não definida - rodando sem banco de dados');
  setupModelsAndRoutes();
}

// Função para configurar modelos e rotas
function setupModelsAndRoutes() {
  console.log('📊 Configurando modelos e rotas...');
  
  // Verificar se o mongoose está conectado
  const isConnected = mongoose.connection.readyState === 1;
  
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
  let Usuario = null;
  let Processo = null;
  
  if (isConnected) {
    try {
      Usuario = mongoose.model('Usuario', UsuarioSchema);
      Processo = mongoose.model('Processo', ProcessoSchema);
      console.log('✅ Modelos criados com sucesso');
    } catch (error) {
      console.log('⚠️ Modelos já existem ou erro:', error.message);
      Usuario = mongoose.model('Usuario');
      Processo = mongoose.model('Processo');
    }
  }

  // --- ROTAS DA API ---

  // Carregar dados
  app.get('/api/dados', async (req, res) => {
    console.log('📥 GET /api/dados');
    
    if (!Usuario || !Processo) {
      console.log('⚠️ Retornando dados mockados (sem MongoDB)');
      return res.json({
        usuarios: [
          { id: 1, nome: 'Tiago Abreu', username: 'tiago', senha: btoa('123456'), tipo: 'admin', cor: '#0073ea' },
          { id: 2, nome: 'Maria Julia', username: 'mariajulia', senha: btoa('123456'), tipo: 'admin', cor: '#ffad00' }
        ],
        processos: []
      });
    }
    
    try {
      const usuarios = await Usuario.find();
      const processos = await Processo.find();
      console.log(`✅ Retornando ${usuarios.length} usuários e ${processos.length} processos`);
      res.json({ usuarios, processos });
    } catch (error) {
      console.error('❌ Erro ao buscar dados:', error.message);
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
      console.log(`✅ ${usuarios.length} usuários salvos`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao salvar usuários:', error.message);
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
      console.log(`✅ ${processos.length} processos salvos`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao salvar processos:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Adicionar/atualizar um processo
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
      console.log(`✅ Processo ${processo.numero} salvo`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao salvar processo:', error.message);
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
      console.log(`✅ Processo ${req.params.id} removido`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao deletar processo:', error.message);
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
