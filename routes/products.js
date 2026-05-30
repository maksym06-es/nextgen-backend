const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.nombre as categoria_nombre 
      FROM productos p 
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.activo = 1
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener producto por ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.nombre as categoria_nombre 
      FROM productos p 
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.id = ? AND p.activo = 1
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// Obtener por categoría
router.get('/categoria/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM productos WHERE categoria_id = ? AND activo = 1',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

module.exports = router;