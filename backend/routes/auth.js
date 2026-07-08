const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');
const { authenticateToken } = require('../middleware/auth');
require('dotenv').config();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userRole = role || 'technician';

    // Check if user exists
    let user = await db.User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = await db.User.create({
      name,
      email,
      password: hashedPassword,
      role: userRole
    });

    // Create JWT
    const payload = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    let user = await db.User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Create JWT
    const payload = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Forgot password — generates a reset token
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    // Check if user exists
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal whether email exists for security
      return res.json({ msg: 'If this email exists in our system, a reset link has been sent.' });
    }

    // Invalidate any existing tokens for this user
    await db.PasswordResetToken.update(
      { used: true },
      { where: { userId: user.id, used: false } }
    );

    // Create new token (valid for 1 hour)
    const token = db.PasswordResetToken.generateToken();
    await db.PasswordResetToken.create({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    // Build reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${token}`;

    // Try to send email via Resend if configured
    try {
      const { Resend } = require('resend');
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const resend = new Resend(apiKey);
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'CRM Garagem <noreply@crmgaragem.com.br>',
          to: user.email,
          subject: '🔐 Recuperação de Senha — CRM Garagem',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f3f4f6; }
                .container { max-width: 560px; margin: 0 auto; padding: 24px 16px; }
                .card { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .header { text-align: center; margin-bottom: 24px; }
                .header h1 { font-size: 24px; color: #111827; margin: 0; }
                .header p { color: #6b7280; margin: 8px 0 0; }
                .btn { display: inline-block; background: #2563eb; color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 24px 0; }
                .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
                .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px; }
                .alert { background: #fef2f2; color: #991b1b; padding: 12px 16px; border-radius: 8px; font-size: 13px; margin: 16px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="card">
                  <div class="header">
                    <h1>🔐 Recuperação de Senha</h1>
                    <p>Recebemos uma solicitação para redefinir sua senha</p>
                  </div>

                  <div style="text-align: center;">
                    <a href="${resetUrl}" class="btn">Redefinir Senha</a>
                  </div>

                  <p style="text-align: center; color: #6b7280; font-size: 14px;">
                    Ou cole este link no navegador:<br />
                    <span style="color: #2563eb; font-size: 13px; word-break: break-all;">${resetUrl}</span>
                  </p>

                  <hr class="divider" />

                  <p style="color: #6b7280; font-size: 13px; text-align: center;">
                    Este link expira em <strong>1 hora</strong>.
                  </p>

                  <div class="alert">
                    Se você não solicitou esta redefinição, ignore este email.
                  </div>
                </div>
                <div class="footer">
                  <p>CRM Garagem</p>
                </div>
              </div>
            </body>
            </html>
          `
        });
        console.log(`[Auth] Reset email sent to ${user.email}`);
      }
    } catch (emailErr) {
      console.log('[Auth] Failed to send reset email:', emailErr.message);
      // Non-blocking — token was still created
    }

    // Always return the token in the response so it can be used
    // directly in dev/testing scenarios
    res.json({
      msg: 'If this email exists in our system, a reset link has been sent.',
      token // included for development/testing convenience
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Reset password — validates token and updates password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    // Find valid token
    const resetToken = await db.PasswordResetToken.findOne({
      where: { token, used: false },
      include: [{ model: db.User, as: 'user' }]
    });

    if (!resetToken) {
      return res.status(400).json({ msg: 'Invalid or expired reset token' });
    }

    if (resetToken.isExpired()) {
      return res.status(400).json({ msg: 'Reset token has expired' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password
    await db.User.update(
      { password: hashedPassword },
      { where: { id: resetToken.userId } }
    );

    // Mark token as used
    await resetToken.update({ used: true });

    res.json({ msg: 'Password reset successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;