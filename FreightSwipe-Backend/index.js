const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const generateToken = (user) => jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.post('/auth/signup', async (req, res) => {
  const { email, password, role } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'Email already exists' });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hash, role }
  });

  res.json({ token: generateToken(user), user });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  res.json({ token: generateToken(user), user });
});

app.post('/swipe', authMiddleware, async (req, res) => {
  const { targetUserId, direction } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!['right', 'left'].includes(direction)) {
    return res.status(400).json({ error: 'Invalid swipe direction' });
  }

  // Ensure users aren't swiping on themselves
  if (userId === targetUserId) {
    return res.status(400).json({ error: "You can't swipe on yourself." });
  }

  // Check for existing match attempt
  const existingMatch = await prisma.match.findFirst({
    where: {
      truckerId: userRole === 'TRUCKER' ? userId : targetUserId,
      shipperId: userRole === 'SHIPPER' ? userId : targetUserId,
    }
  });

  // If both users swiped right, it's a match
  if (existingMatch) {
    if (existingMatch.status === 'PENDING' && direction === 'right') {
      const updated = await prisma.match.update({
        where: { id: existingMatch.id },
        data: { status: 'MATCHED' }
      });
      return res.json({ matched: true, match: updated });
    }
    return res.json({ matched: false, message: 'Already swiped or rejected' });
  }

  // New swipe attempt
  const newMatch = await prisma.match.create({
    data: {
      truckerId: userRole === 'TRUCKER' ? userId : targetUserId,
      shipperId: userRole === 'SHIPPER' ? userId : targetUserId,
      status: direction === 'right' ? 'PENDING' : 'REJECTED'
    }
  });

  res.json({ matched: false, match: newMatch });
});

app.post('/trucker/verify', authMiddleware, async (req, res) => {
  const { vehicleType, licenseId } = req.body;
  if (req.user.role !== 'TRUCKER') return res.status(403).json({ error: 'Only truckers allowed' });

  const profile = await prisma.truckerProfile.create({
    data: {
      userId: req.user.id,
      vehicleType,
      licenseId
    }
  });
  res.json(profile);
});

// Load Routes
app.post('/loads', authMiddleware, async (req, res) => {
  const { origin, destination, weight, budget, deadline, description } = req.body;
  const load = await prisma.load.create({
    data: {
      shipperId: req.user.id,
      origin,
      destination,
      weight,
      budget,
      deadline,
      description
    }
  });
  res.json(load);
});

app.get('/loads', authMiddleware, async (req, res) => {
  const loads = await prisma.load.findMany({
    where: {
      status: 'PENDING'
    }
  });
  res.json(loads);
});

// Match Routes
app.post('/matches', authMiddleware, async (req, res) => {
  const { loadId, status } = req.body;
  const load = await prisma.load.findUnique({ where: { id: loadId } });
  if (!load) return res.status(404).json({ error: 'Load not found' });

  const match = await prisma.match.create({
    data: {
      loadId,
      truckerId: req.user.id,
      shipperId: load.shipperId,
      status
    }
  });
  res.json(match);
});

// User Routes
app.get('/users', authMiddleware, async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.get('/health', (req, res) => res.send('OK'));

// Confirm Matches for Logged-In Users
app.get('/matches', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  const matches = await prisma.match.findMany({
    where: {
      status: 'MATCHED',
      OR: [
        { truckerId: userId },
        { shipperId: userId }
      ]
    },
    include: {
      trucker: { select: { id: true, name: true, email: true, role: true } },
      shipper: { select: { id: true, name: true, email: true, role: true } },
      load: true // Optional: only if you want load info in matches
    }
  });

  res.json(matches);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
