const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const csurf = require('csurf');
const mongoose = require('mongoose');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3030;

app.use(helmet());

const userController = require('./controllers/userController');
const authController = require('./controllers/authController');
const isAuth = require('./middleware/auth');

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'minha_chave_secreta_super_dificil',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: (process.env.NODE_ENV === 'production'),
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 3600000
    }
}));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login', { query: req.query });
});

const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: 'Muitas tentativas de login. Tente novamente em 1 minuto.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`[${new Date().toISOString()}] Bloqueio de login por excesso de tentativas (IP=${req.ip})`);
        return res.status(429).send('Muitas tentativas de login. Tente novamente em 1 minuto.');
    }
});

const csrfProtection = csurf();

function csrfUnlessLogin(req, res, next) {
    if (req.path === '/login' && req.method === 'POST') return next();
    return csrfProtection(req, res, next);
}

app.use(csrfUnlessLogin);

app.use((req, res, next) => {
    try {
        res.locals.csrfToken = req.csrfToken ? req.csrfToken() : '';
    } catch (err) {
        res.locals.csrfToken = '';
    }
    next();
});

app.post('/login', loginLimiter, authController.login);
app.post('/logout', authController.logout);
app.get('/perfil', isAuth, userController.getPerfil);

app.get('/users', isAuth, userController.getAllUsers);
app.get('/users/new', userController.getNewUserForm);
app.post('/users', userController.createNewUser);
app.get('/users/:id/edit', isAuth, userController.getEditUserForm);
app.post('/users/:id/update', isAuth, userController.updateUser);
app.post('/users/:id/delete', isAuth, userController.deleteUser);

const mongoUri = process.env.MONGODB_URI || '';
if (!mongoUri) {
    console.error('MONGODB_URI não está definido em .env');
    process.exit(1);
}

mongoose.set('strictQuery', false);
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

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




