const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// Lê a string de conexão da variável de ambiente
const MONGODB_URI = process.env.MONGODB_URI;

// Conectar ao MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Conectado ao MongoDB com sucesso!');
}).catch(err => {
  console.error('Erro ao conectar ao MongoDB:', err);
});

// ... resto do código ...
