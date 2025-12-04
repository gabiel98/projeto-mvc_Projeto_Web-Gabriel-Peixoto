const mongoose = require('mongoose');

// models/User.js
// ----------------
// Este arquivo define o schema e o model Mongoose para usuários.
// O model é usado pelo controller para criar/consultar/atualizar/excluir
// documentos na coleção `users` do MongoDB.

// Definimos a estrutura do documento (Schema).
// Aqui temos três campos:
// - nome: string obrigatório
// - cargo: string obrigatório
// - criadoEm: data, preenchida automaticamente com Date.now
const userSchema = new mongoose.Schema({
	nome: { type: String, required: true },
	// Identificador único do usuário
	email: { type: String, required: true, unique: true },
	cargo: { type: String },
	// Aqui guardaremos o HASH da senha (campo obrigatório)
	password: { type: String, required: true },
	criadoEm: { type: Date, default: Date.now }
});

// Criamos o Model (classe) que encapsula a coleção `users`.
// A convenção do Mongoose é pluralizar o nome ('User' -> 'users').
const User = mongoose.model('User', userSchema);

// Exportamos o model para ser usado nos controllers
module.exports = User;
