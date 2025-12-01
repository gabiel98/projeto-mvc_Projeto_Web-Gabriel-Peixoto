// controllers/userController.js
// -------------------------------
// Concentra a lógica que responde às requisições HTTP relacionadas
// a usuários. Cada função corresponde a uma ação do CRUD.

const User = require('../models/User');
const bcrypt = require('bcryptjs'); // biblioteca para hash/compare de senhas
const mongoose = require('mongoose');

const userController = {
    /**
     * GET /users
     * Busca todos os usuários no banco e renderiza a view `usersList`.
     */
    getAllUsers: async (req, res) => {
        try {
            // .lean() converte os documentos para objetos JS simples (mais leve)
            const users = await User.find().lean();
            res.render('usersList', { usuarios: users });
        } catch (error) {
            console.error('Erro em getAllUsers:', error);
            res.status(500).send('Erro ao buscar usuários: ' + error.message);
        }
    },

    /**
     * GET /users/new
     * Exibe o formulário para criar um novo usuário.
     */
    getNewUserForm: (req, res) => {
        // Passa query para que a view possa exibir mensagens de erro simples
        res.render('formUsuario', { query: req.query });
    },

    /**
     * POST /users
     * Cria um novo usuário a partir dos dados do formulário.
     */
    createNewUser: async (req, res) => {
        try {
            // Desestrutura os campos do formulário (nomes usados na view)
            let {
                nome_usuario: nome,
                email_usuario: email,
                cargo_usuario: cargo,
                senha_usuario: senha
            } = req.body;

            // Normaliza email para evitar duplicidade por case/espacos
            if (email) email = email.toLowerCase().trim();

            // 1. Validação mínima
            if (!email || !senha || !nome) {
                return res.redirect('/users/new?erro=falta_email_ou_senha');
            }

            // 2. Hashing da senha (bcrypt) — saltRounds = 10
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(senha, saltRounds);

            // 3. Criar usuário no banco salvando o HASH em `password`
            const createdUser = await User.create({
                nome,
                email,
                cargo,
                password: hashedPassword
            });

            // Log no terminal para auditoria/desenvolvimento
            console.log(`[${new Date().toISOString()}] Novo usuário criado: email=${email} id=${createdUser._id}`);

            // Após cadastro, manda para o login (fluxo comum)
            return res.redirect('/login');
        } catch (error) {
            console.error('Erro em createNewUser:', error);
            // Tratamento simples para chave única (email já cadastrado)
            if (error && error.code === 11000) {
                return res.redirect('/users/new?erro=email_ja_cadastrado');
            }
            return res.status(500).send('Erro ao criar usuário: ' + error.message);
        }
    },

    

    /**
     * GET /perfil
     * Mostra a página de perfil do usuário usando o nome armazenado na sessão.
     */
    getPerfil: (req, res) => {
        // O nome "magicamente" está disponível aqui!
        const nomeDoUsuario = req.session.nome;
        if (nomeDoUsuario) {
            res.render('perfil', { nome: nomeDoUsuario });
        } else {
            // Se não tem sessão, não está logado
            res.redirect('/login');
        }
    },


    /**
     * GET /users/:id/edit
     * Exibe o formulário de edição com os dados do usuário preenchidos.
     */
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

    /**
     * POST /users/:id/update
     * Aplica as alterações do formulário no documento do MongoDB.
     */
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

    /**
     * POST /users/:id/delete
     * Remove o usuário do banco.
     */
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