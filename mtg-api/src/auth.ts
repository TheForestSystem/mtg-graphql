import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const SECRET = process.env.JWT_SECRET!;
const SALT_ROUNDS = 12;

export function signToken(userUuid: string, username: string) {
  return jwt.sign(
    { sub: userUuid, username },
    SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): { sub: string; username: string } | null {
  try {
    return jwt.verify(token, SECRET) as { sub: string; username: string };
  } catch (err) {
    console.error('verifyToken error:', err); // 👈
    return null;
  }
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}