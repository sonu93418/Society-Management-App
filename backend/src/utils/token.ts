import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

interface TokenPayload {
  userId: string;
  role: string;
  societyId: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRE as any,
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRE as any,
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};

export const generateTokenPair = (payload: TokenPayload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};
