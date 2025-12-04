const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  try {
    let { email, senha } = req.body;
    if (email) email = email.toLowerCase().trim();
    const user = await User.findOne({ email });
    if (!user) return res.redirect('/login?erro=usuario');

    const isMatch = await bcrypt.compare(senha, user.password || '');
    if (!isMatch) return res.redirect('/login?erro=senha');

    req.session.userId = user._id;
    req.session.userName = user.nome;
    req.session.nome = user.nome;

    console.log(`[${new Date().toISOString()}] Login: email=${user.email} id=${user._id} ip=${req.ip}`);

    return res.redirect('/users');
  } catch (err) {
    console.error('Erro em authController.login:', err);
    return res.status(500).send('Erro no login');
  }
};

exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Erro ao destruir sessão:', err);
      return res.redirect('/perfil');
    }
    res.clearCookie('connect.sid', { path: '/' });
    return res.redirect('/login');
  });
};
