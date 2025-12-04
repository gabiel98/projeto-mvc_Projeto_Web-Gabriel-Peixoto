const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const userController = {
    getAllUsers: async (req, res) => {
        try {
            const users = await User.find().lean();
            res.render('usersList', { usuarios: users });
        } catch (error) {
            console.error('Erro em getAllUsers:', error);
            res.status(500).send('Erro ao buscar usuários: ' + error.message);
        }
    },

    getNewUserForm: (req, res) => {
        res.render('formUsuario', { query: req.query });
    },

    createNewUser: async (req, res) => {
        try {
            let {
                nome_usuario: nome,
                email_usuario: email,
                cargo_usuario: cargo,
                senha_usuario: senha
            } = req.body;

            if (email) email = email.toLowerCase().trim();

            if (!email || !senha || !nome) {
                return res.redirect('/users/new?erro=falta_email_ou_senha');
            }

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(senha, saltRounds);

            const createdUser = await User.create({
                nome,
                email,
                cargo,
                password: hashedPassword
            });

            console.log(`[${new Date().toISOString()}] Novo usuário criado: email=${email} id=${createdUser._id}`);

            return res.redirect('/login');
        } catch (error) {
            console.error('Erro em createNewUser:', error);
            if (error && error.code === 11000) {
                return res.redirect('/users/new?erro=email_ja_cadastrado');
            }
            return res.status(500).send('Erro ao criar usuário: ' + error.message);
        }
    },

    getPerfil: (req, res) => {
        const nomeDoUsuario = req.session.nome;
        if (nomeDoUsuario) {
            res.render('perfil', { nome: nomeDoUsuario });
        } else {
            res.redirect('/login');
        }
    },

    getEditUserForm: async (req, res) => {
        try {
            const id = req.params.id;
            if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).send('ID inválido');
            const user = await User.findById(id).lean();
            if (!user) return res.status(404).send('Usuário não encontrado');
            res.render('editUsuario', { user });
        } catch (error) {
            console.error('Erro em getEditUserForm:', error);
            res.status(500).send('Erro ao carregar formulário de edição');
        }
    },

    updateUser: async (req, res) => {
        try {
            const id = req.params.id;
            if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).send('ID inválido');
            const dadosAtualizados = {
                nome: req.body.nome_usuario,
                cargo: req.body.cargo_usuario
            };
            await User.findByIdAndUpdate(id, dadosAtualizados);
            res.redirect('/users');
        } catch (error) {
            console.error('Erro em updateUser:', error);
            res.status(500).send('Erro ao atualizar usuário');
        }
    },

    deleteUser: async (req, res) => {
        try {
            const id = req.params.id;
            if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).send('ID inválido');
            await User.findByIdAndDelete(id);
            res.redirect('/users');
        } catch (error) {
            console.error('Erro em deleteUser:', error);
            res.status(500).send('Erro ao deletar usuário');
        }
    }
};

module.exports = userController;