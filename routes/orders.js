const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
};

router.post('/', verificarToken, async (req, res) => {
  const { items, direccion_envio } = req.body;
  try {
    let total = 0;
    for (const item of items) {
      const [rows] = await db.query('SELECT precio FROM productos WHERE id = ?', [item.producto_id]);
      total += rows[0].precio * item.cantidad;
    }
    const [pedido] = await db.query(
      'INSERT INTO pedidos (usuario_id, total, direccion_envio) VALUES (?, ?, ?)',
      [req.usuario.id, total, direccion_envio]
    );
    for (const item of items) {
      const [rows] = await db.query('SELECT precio FROM productos WHERE id = ?', [item.producto_id]);
      await db.query(
        'INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [pedido.insertId, item.producto_id, item.cantidad, rows[0].precio]
      );
    }
    res.json({ message: 'Pedido creado correctamente', pedido_id: pedido.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear pedido' });
  }
});

router.get('/mios', verificarToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY fecha DESC',
      [req.usuario.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

module.exports = router;