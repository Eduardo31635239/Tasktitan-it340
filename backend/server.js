import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB on Database VM
mongoose.connect('mongodb://database:27017/tasktitan')
  .then(() => console.log('Connected to MongoDB on Database VM'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema (with MFA secret)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mfaSecret: { type: String },  // Stores base32 secret for TOTP
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

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, 'your_jwt_secret', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashedPassword });
  await user.save();
  res.status(201).json({ message: 'User registered' });
});

// Login (returns JWT after password check)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '1h' });
  res.json({ token });
});

// Setup MFA - Generate secret + QR code URL
app.post('/api/auth/mfa/setup', authenticateToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  const secret = totp.utils.randomSecret();  // base32 secret
  user.mfaSecret = secret;
  await user.save();

  const otpauth = totp.authenticator.encode(secret, { issuer: 'TaskTitan', label: user.email });
  qrcode.toDataURL(otpauth, (err, url) => {
    if (err) return res.status(500).json({ message: 'QR generation failed' });
    res.json({ qrCodeUrl: url, secret });  // Frontend displays QR + backup secret
  });
});

// Verify MFA code (enable MFA after success, or require on login)
app.post('/api/auth/mfa/verify', authenticateToken, async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user.id);
  const isValid = totp.check(token, user.mfaSecret);
  if (isValid) {
    res.json({ message: 'MFA verified successfully' });
    // Optionally mark MFA enabled permanently here
  } else {
    res.status(401).json({ message: 'Invalid MFA code' });
  }
});

// Task CRUD (protected)
app.get('/api/tasks', authenticateToken, async (req, res) => {
  const tasks = await Task.find({ userId: req.user.id });
  res.json(tasks);
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  const task = new Task({ ...req.body, userId: req.user.id });
  await task.save();
  res.status(201).json(task);
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    req.body,
    { new: true }
  );
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json(task);
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json({ message: 'Task deleted' });
});

app.get('/', (req, res) => {
  res.send('Backend is ALIVE! Task Titan API reachable.');
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
