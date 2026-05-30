const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// REGISTRO
router.post('/register', async (req, res) => {
  const { nombre, apellidos, email, password } = req.body;

  if (!nombre || !email || !password)
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });

  try {
    const [existing] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.status(409).json({ error: 'Este email ya está registrado' });

    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO usuarios (nombre, apellidos, email, password_hash) VALUES (?, ?, ?, ?)',
      [nombre, apellidos || '', email, hash]
    );
    res.json({ message: 'Usuario registrado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email y contraseña requeridos' });

  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (rows.length === 0)
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });

    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });

    const token = jwt.sign(
      { id: rows[0].id, rol: rows[0].rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, usuario: { id: rows[0].id, nombre: rows[0].nombre, rol: rows[0].rol } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;