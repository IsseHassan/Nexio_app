import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { JWT_SECRET, MONGODB_URI } from '../config.js';

const router = Router();

function noDb(res: Response): boolean {
  if (!MONGODB_URI) {
    res.status(503).json({ error: 'Database not configured. Set MONGODB_URI in .env' });
    return true;
  }
  return false;
}

function makeToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' });
}

router.post('/auth/signup', async (req: Request, res: Response) => {
  if (noDb(res)) return;
  const { username, email, password, name } = req.body;
  if (!username || !email || !password)
    return void res.status(400).json({ error: 'username, email, and password are required' });
  if (password.length < 8)
    return void res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] } as any);
    if (exists) {
      const field = (exists as any).email === email.toLowerCase() ? 'Email' : 'Username';
      return void res.status(409).json({ error: `${field} already taken` });
    }
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ username: username.toLowerCase(), email: email.toLowerCase(), name: name?.trim() ?? '', password: hash });
    const token = makeToken(String(user._id));
    res.status(201).json({ token, user: { id: user._id, username: user.username, email: user.email, name: user.name, role: user.role } });
  } catch (err: any) {
    console.error('[auth] signup error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/login', async (req: Request, res: Response) => {
  if (noDb(res)) return;
  const { usernameOrEmail, password } = req.body;
  if (!usernameOrEmail || !password)
    return void res.status(400).json({ error: 'usernameOrEmail and password are required' });

  try {
    const isEmail = usernameOrEmail.includes('@');
    const user = await User.findOne((isEmail
      ? { email: usernameOrEmail.toLowerCase() }
      : { username: usernameOrEmail.toLowerCase() }
    ) as any);
    if (!user) return void res.status(401).json({ error: 'No account found with that username or email' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return void res.status(401).json({ error: 'Incorrect password' });

    const token = makeToken(String(user._id));
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, name: user.name, role: user.role } });
  } catch (err: any) {
    console.error('[auth] login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) { res.status(401).json({ error: 'Missing token' }); return; }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    (req as any).userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

router.get('/auth/me', requireAuth, async (req: Request, res: Response) => {
  if (noDb(res)) return;
  try {
    const user = await User.findById((req as any).userId, { password: 0 });
    if (!user) return void res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user._id, username: (user as any).username, email: (user as any).email, name: (user as any).name, role: (user as any).role } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
