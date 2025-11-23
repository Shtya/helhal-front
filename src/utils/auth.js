import { decodeJwt } from 'jose';

export async function getJwtPayload(token) {
  try {
    const payload = decodeJwt(token);
    return payload; // contains id, sid, role, iat, exp
  } catch (err) {
    console.error('JWT verification failed:', err);
    return null;
  }
}