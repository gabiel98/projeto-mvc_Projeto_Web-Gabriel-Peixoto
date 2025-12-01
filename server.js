// server.js
// ----------------
// Entrada da aplicação: configura o Express, conecta ao MongoDB
// (via MONGODB_URI no arquivo `.env`) e registra as rotas.

const express = require('express');
const session = require('express-session');
// Segurança de headers HTTP
const helmet = require('helmet');
// Rate limiter para proteger rotas sensíveis (ex.: login)
const rateLimit = require('express-rate-limit');
const csurf = require('csurf');
const mongoose = require('mongoose');
require('dotenv').config(); // carrega variáveis de ambiente do arquivo .env
const app = express();
const port = process.env.PORT || 3030;

// --- Hardening HTTP headers ---
// Deve ser aplicado antes de rotas e outros middlewares para definir
// cabeçalhos HTTP seguros (Content-Security-Policy, X-Frame-Options, etc.)
app.use(helmet());

// Importa o controller que implementa as ações (GET/POST)
const userController = require('./controllers/userController');
// Controller separado para autenticação (login/logout)
const authController = require('./controllers/authController');
// Importa middleware de autenticação (verifica sessão)
const isAuth = require('./middleware/auth');

// --- Configuração do Express ---
app.set('view engine', 'ejs'); // engine de templates
app.set('views', './views'); // pasta das views

// Middleware: interpreta bodies de formulários (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// --- Sessão ---
// Configura o middleware de sessão antes das rotas para que
// `req.session` esteja disponível em todos os handlers.
app.use(session({
    secret: process.env.SESSION_SECRET || 'minha_chave_secreta_super_dificil',
    resave: false,
    saveUninitialized: false,
    cookie: {
        // Em produção, defina NODE_ENV=production para ativar `secure` (requer HTTPS)
        secure: (process.env.NODE_ENV === 'production'),
        httpOnly: true, // impede acesso via JavaScript no cliente
        sameSite: 'lax', // reduz risco de CSRF mantendo compatibilidade com navegação normal
        maxAge: 3600000 // 1 hora em milissegundos
    }
}));

// --- Rotas ---
// Página inicial (apenas um link para a lista de usuários)
app.get('/', (req, res) => {
    res.send('<h1>Bem-vindo ao Restaurante MVC!</h1><p>Vá para <a href="/users">/users</a> para ver a lista</p>');
});

// Rotas de autenticação
app.get('/login', (req, res) => {
    // Passamos query para exibir erros como ?erro=senha_incorreta
    res.render('login', { query: req.query });
});
// Limite de tentativas de login: 5 tentativas por 1 minuto.
// A 6ª tentativa dentro do mesmo minuto será bloqueada com 429.
const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 5, // número máximo de tentativas permitidas
    message: 'Muitas tentativas de login. Tente novamente em 1 minuto.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`[${new Date().toISOString()}] Bloqueio de login por excesso de tentativas (IP=${req.ip})`);
        return res.status(429).send('Muitas tentativas de login. Tente novamente em 1 minuto.');
    }
});

// CSRF protection: usamos tokens para rotas POST, exceto /login (caso especial)
const csrfProtection = csurf();

// Middleware que aplica CSRF protection exceto para POST /login
function csrfUnlessLogin(req, res, next) {
    if (req.path === '/login' && req.method === 'POST') return next();
    return csrfProtection(req, res, next);
}

// Aplicar o middleware CSRF depois da sessão e antes das rotas que precisam
app.use(csrfUnlessLogin);

// Disponibiliza o token nas views (se presente)
app.use((req, res, next) => {
    try {
        res.locals.csrfToken = req.csrfToken ? req.csrfToken() : '';
    } catch (err) {
        // Pode ocorrer quando a rota foi ignorada; apenas define vazio
        res.locals.csrfToken = '';
    }
    next();
});

app.post('/login', loginLimiter, authController.login);
app.post('/logout', authController.logout);
// Rota para mostrar o perfil do usuário (requer sessão)
app.get('/perfil', isAuth, userController.getPerfil);

// Rotas de usuário (CRUD)
app.get('/users', isAuth, userController.getAllUsers);
app.get('/users/new', userController.getNewUserForm);
app.post('/users', userController.createNewUser);
app.get('/users/:id/edit', isAuth, userController.getEditUserForm);
app.post('/users/:id/update', isAuth, userController.updateUser);
app.post('/users/:id/delete', isAuth, userController.deleteUser);

// --- Conexão com o MongoDB ---
const mongoUri = process.env.MONGODB_URI || '';
if (!mongoUri) {
    console.error('MONGODB_URI não está definido em .env (ex.: MONGODB_URI=mongodb://localhost:27017/projeto_mvc)');
    process.exit(1);
}

// Ajustes e tratamento de erros globais (ajuda durante o desenvolvimento)
mongoose.set('strictQuery', false);
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Conecta ao MongoDB e só inicia o servidor quando a conexão estiver pronta
mongoose.connect(mongoUri)
    .then(() => {
        console.log('Conectado ao MongoDB');
        app.listen(port, () => {
            console.log(`Servidor MVC rodando em http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error('Erro ao conectar no MongoDB:', err.message);
        process.exit(1);
    });




