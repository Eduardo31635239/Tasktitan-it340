import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB on Database VM
mongoose.connect('mongodb://database:27017/tasktitan')
  .then(() => console.log('Connected to MongoDB on Database VM'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mfaSecret: { type: String }  // null if MFA not set up
});
const User = mongoose.model('User', userSchema);

// Task Schema
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['To-Do', 'In Progress', 'Done'], default: 'To-Do' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});
const Task = mongoose.model('Task', taskSchema);

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, 'tasktitan_secret_key', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login with MFA check
app.post('/api/auth/login', async (req, res) => {
  const { email, password, mfaToken } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // If MFA secret exists, require mfaToken
    if (user.mfaSecret) {
      if (!mfaToken) {
        return res.status(401).json({ message: 'MFA code required' });
      }
      const isValid = authenticator.check(mfaToken, user.mfaSecret);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid MFA code' });
      }
    }

    const token = jwt.sign({ id: user._id }, 'tasktitan_secret_key', { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
});

// MFA Setup (generate secret + QR)
app.post('/api/auth/mfa/setup', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const secret = authenticator.generateSecret();
    user.mfaSecret = secret;
    await user.save();

    const otpauth = authenticator.keyuri(user.email, 'TaskTitan', secret);
    qrcode.toDataURL(otpauth, (err, url) => {
      if (err) return res.status(500).json({ message: 'QR generation failed' });
      res.json({ qrCodeUrl: url });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'MFA setup failed' });
  }
});

// MFA Verify (optional separate verify if needed)
app.post('/api/auth/mfa/verify', authenticateToken, async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const isValid = authenticator.check(token, user.mfaSecret);
    if (isValid) {
      res.json({ message: 'MFA verified' });
    } else {
      res.status(401).json({ message: 'Invalid MFA code' });
    }
  } catch (err) {
    res.status(500).json({ message: 'MFA verify failed' });
  }
});

// Task routes (protected)
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const task = new Task({ ...req.body, userId: req.user.id });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete task' });
  }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
});
