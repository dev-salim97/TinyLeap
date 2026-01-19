import express from 'express';
import crypto from 'crypto';
import Config from '../models/Config.js';

const router = express.Router();

const hashPassword = (password: string) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Check if password is set
router.get('/status', async (req, res) => {
  try {
    const passwordConfig = await Config.findOne({ key: 'password' });
    res.json({ isSet: !!passwordConfig });
  } catch (error) {
    res.status(500).json({ message: 'Error checking auth status' });
  }
});

// Verify password
router.post('/verify', async (req, res) => {
  const { password } = req.body;
  try {
    const passwordConfig = await Config.findOne({ key: 'password' });
    if (!passwordConfig) {
      return res.status(404).json({ message: 'Password not set' });
    }
    
    if (passwordConfig.value === hashPassword(password)) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Invalid password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error verifying password' });
  }
});

// Set or change password
router.post('/set', async (req, res) => {
  const { password, oldPassword } = req.body;
  try {
    const passwordConfig = await Config.findOne({ key: 'password' });
    
    // If password exists, require old password to change
    if (passwordConfig) {
      if (!oldPassword || passwordConfig.value !== hashPassword(oldPassword)) {
        return res.status(401).json({ message: 'Invalid old password' });
      }
    }
    
    const hashed = hashPassword(password);
    if (passwordConfig) {
      passwordConfig.value = hashed;
      await passwordConfig.save();
    } else {
      await Config.create({ key: 'password', value: hashed });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error setting password' });
  }
});

export default router;
