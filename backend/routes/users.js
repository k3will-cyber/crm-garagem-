const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticateToken, authorize } = require('../middleware/auth');
const db = require('../models');

// Get all users (admin and manager only)
router.get('/', authenticateToken, authorize('admin', 'manager'), async (req, res) => {
  try {
    const users = await db.User.findAll({
      attributes: { exclude: ['password'] },
      order: [['role', 'ASC'], ['name', 'ASC']]
    });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get user by ID
router.get('/:id', authenticateToken, authorize('admin', 'manager'), async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create user (admin only)
router.post('/', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role, phone, specialty } = req.body;

    // Check if user exists
    let user = await db.User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await db.User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'technician',
      phone,
      specialty
    });

    const userData = user.toJSON();
    delete userData.password;

    res.status(201).json(userData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update user (admin only)
router.put('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const { name, email, password, role, phone, specialty, isActive } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (specialty !== undefined) updateData.specialty = specialty;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    await user.update(updateData);

    const userData = user.toJSON();
    delete userData.password;

    res.json(userData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Prevent deleting yourself
    if (user.id === req.user.user.id) {
      return res.status(400).json({ msg: 'Cannot delete your own account' });
    }

    await user.update({ isActive: false });
    res.json({ msg: 'User deactivated' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Reset password of a specific user (admin only)
router.put('/:id/reset-password', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    const user = await db.User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await user.update({ password: hashedPassword });

    // Invalidate any pending password reset tokens for this user
    await db.PasswordResetToken.update(
      { used: true },
      { where: { userId: user.id, used: false } }
    );

    res.json({ msg: 'Password reset successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get mechanics/technicians (for assignment)
router.get('/role/technicians', authenticateToken, async (req, res) => {
  try {
    const technicians = await db.User.findAll({
      where: { role: 'technician', isActive: true },
      attributes: ['id', 'name', 'specialty'],
      order: [['name', 'ASC']]
    });
    res.json(technicians);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
