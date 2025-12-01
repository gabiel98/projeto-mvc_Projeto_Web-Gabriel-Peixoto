// middleware/auth.js
// Um "segurança" que verifica se o "crachá" (sessão) existe
function isAuth(req, res, next) {
  if (req.session && req.session.userId) {
    // Tem crachá válido. Pode passar (next)
    return next();
  } else {
    // Não tem crachá. Volta pro Login
    return res.redirect('/login');
  }
}

module.exports = isAuth;
