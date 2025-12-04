const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    cargo: { type: String },
    password: { type: String, required: true },
    criadoEm: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
