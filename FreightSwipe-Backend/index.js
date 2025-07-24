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
    console.log('Authenticated user:', req.user.id, req.user.role);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.post('/auth/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'Email already exists' });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash: hash, role }
  });

  res.json({ token: generateToken(user), user });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
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
      shipperId: req.user.id
    }
  });
  res.json(loads);
});

app.get('/loads/available', authMiddleware, async (req, res) => {
  if (req.user.role !== 'TRUCKER') {
    return res.status(403).json({ error: 'Only truckers can view available loads' });
  }
  const userId = req.user.id;

  // Find loads that the current trucker has already interacted with
  const interactedLoadIds = (await prisma.match.findMany({
    where: {
      truckerId: userId,
    },
    select: {
      loadId: true,
    },
  })).map(match => match.loadId);

  const availableLoads = await prisma.load.findMany({
    where: {
      status: 'PENDING',
      NOT: {
        id: {
          in: interactedLoadIds,
        },
      },
    },
  });
  res.json(availableLoads);
});

app.delete('/loads/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  console.log(`DELETE /loads/${id} requested by user ${userId}`);

  try {
    const load = await prisma.load.findUnique({
      where: { id },
    });

    if (!load) {
      console.log(`Load ${id} not found.`);
      return res.status(404).json({ error: 'Load not found' });
    }

    if (load.shipperId !== userId) {
      console.log(`User ${userId} is unauthorized to delete load ${id}. Shipper ID: ${load.shipperId}`);
      return res.status(403).json({ error: 'Unauthorized to delete this load' });
    }

    await prisma.load.delete({
      where: { id },
    });
    console.log(`Load ${id} deleted successfully.`);
    res.status(204).send(); // No Content
  } catch (err) {
    console.error('Failed to delete load:', err);
    res.status(500).json({ error: 'Failed to delete load' });
  }
});

// Match Routes
app.post('/matches', authMiddleware, async (req, res) => {
  const { loadId, status, matchId, action } = req.body; // Added matchId and action
  const userId = req.user.id;
  const userRole = req.user.role;

  if (action === 'swipe' && userRole === 'TRUCKER') {
    // Trucker initiating a swipe
    if (!loadId || !['PENDING', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid request for trucker swipe' });
    }

    const load = await prisma.load.findUnique({ where: { id: loadId } });
    if (!load) {
      return res.status(404).json({ error: 'Load not found' });
    }

    let existingMatch = await prisma.match.findFirst({
      where: {
        loadId: loadId,
        truckerId: userId,
      },
    });

    if (existingMatch) {
      // Update existing match (e.g., trucker changes mind)
      const updatedMatch = await prisma.match.update({
        where: { id: existingMatch.id },
        data: { status: status },
      });
      return res.json({ message: 'Match updated', match: updatedMatch });
    } else {
      // Create new match
      const newMatch = await prisma.match.create({
        data: {
          loadId,
          truckerId: userId,
          shipperId: load.shipperId,
          status,
        },
      });
      return res.json({ message: 'Match created', match: newMatch });
    }
  } else if (action === 'respond' && userRole === 'SHIPPER') {
    // Shipper responding to a pending match
    if (!matchId || !['MATCHED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid request for shipper response' });
    }

    const existingMatch = await prisma.match.findUnique({
      where: { id: matchId },
      include: { load: true } // Include load to check shipperId
    });

    if (!existingMatch) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Ensure the shipper is authorized to respond to this match
    if (existingMatch.shipperId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to respond to this match' });
    }

    // Only allow updating PENDING matches
    if (existingMatch.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending matches can be responded to' });
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: { status: status },
    });

    // If the shipper accepted the match, reject all other pending matches for this load
    if (status === 'MATCHED') {
      await prisma.match.updateMany({
        where: {
          loadId: existingMatch.load.id,
          status: 'PENDING',
          NOT: {
            id: matchId,
          },
        },
        data: { status: 'REJECTED' },
      });
      // Also update the load status to 'MATCHED' or 'COMPLETED' as appropriate
      await prisma.load.update({
        where: { id: existingMatch.load.id },
        data: { status: 'MATCHED' }, // Or 'COMPLETED' if that's the final state after a match
      });
    }
    return res.json({ message: 'Match updated', match: updatedMatch });

  } else {
    return res.status(400).json({ error: 'Invalid action or user role' });
  }
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
      OR: [
        { truckerId: userId },
        { shipperId: userId }
      ]
    },
    include: {
      trucker: { select: { id: true, name: true, email: true, role: true } },
      shipper: { select: { id: true, name: true, email: true, role: true } },
      load: true
    }
  });

  res.json(matches);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
