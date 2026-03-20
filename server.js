const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// 🔧 FIXO - CONEXÃO DIRETA (remova depois que o Railway funcionar)
const MONGODB_URI = 'mongodb+srv://admin_processos:Esgr-207042@gestaoprocessos.ciymuyb.mongodb.net/processos?retryWrites=true&w=majority&appName=gestaoprocessos';

console.log('🚀 Servidor iniciando...');
console.log('📁 Diretório atual:', __dirname);
console.log('🔌 MONGODB_URI:', MONGODB_URI ? '✅ DEFINIDA' : '❌ NÃO DEFINIDA');

// ROTA DE TESTE
app.get('/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'pong',
    timestamp: new Date().toISOString(),
    mongodb_uri: MONGODB_URI ? 'definida' : 'indefinida'
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
  console.error('❌ Erro ao conectar ao MongoDB:', err.message);
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

  const Usuario = mongoose.model('Usuario', UsuarioSchema);
  const Processo = mongoose.model('Processo', ProcessoSchema);

  // --- ROTAS DA API ---

  // Carregar dados
  app.get('/api/dados', async (req, res) => {
    console.log('📥 GET /api/dados');
    
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
