import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { authQueries } from './auth.queries'
import { env } from '../../config/env'
import redis from '../../config/redis'
import { AppError } from '../../middleware/errorHandler'
import type { AuthPayload } from '../../middleware/authenticate'
import type { RegisterBody, LoginBody } from './auth.schema'

const REFRESH_TTL = 7 * 24 * 60 * 60

function generateTokens(payload: AuthPayload) {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions)
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions)
  return { accessToken, refreshToken }
}

async function storeRefreshToken(userId: string, token: string): Promise<void> {
  try {
    await redis.setex(`refresh:${userId}`, REFRESH_TTL, token)
  } catch {
    // Redis unavailable — token still works until server restart
  }
}

async function getRefreshToken(userId: string): Promise<string | null> {
  try {
    return await redis.get(`refresh:${userId}`)
  } catch {
    return null
  }
}

async function deleteRefreshToken(userId: string): Promise<void> {
  try {
    await redis.del(`refresh:${userId}`)
  } catch {
    // best-effort
  }
}

export const authService = {
  async register(body: RegisterBody) {
    const existing = await authQueries.findByEmail(body.email)
    if (existing) throw new AppError(409, 'Email already in use')

    const passwordHash = await bcrypt.hash(body.password, 12)
    const user = await authQueries.createUser({
      email: body.email,
      passwordHash,
      displayName: body.displayName,
    })
    await authQueries.createWorkspace(user.id)

    const payload: AuthPayload = { userId: user.id, email: user.email }
    const tokens = generateTokens(payload)
    await storeRefreshToken(user.id, tokens.refreshToken)

    return {
      ...tokens,
      user: { id: user.id, email: user.email, displayName: user.display_name },
    }
  },

  async login(body: LoginBody) {
    const user = await authQueries.findByEmail(body.email)
    if (!user) throw new AppError(401, 'Invalid credentials')

    const valid = await bcrypt.compare(body.password, user.password_hash)
    if (!valid) throw new AppError(401, 'Invalid credentials')

    const payload: AuthPayload = { userId: user.id, email: user.email }
    const tokens = generateTokens(payload)
    await storeRefreshToken(user.id, tokens.refreshToken)

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        onboardingCompleted: user.onboarding_completed,
      },
    }
  },

  async refresh(refreshToken: string) {
    let payload: AuthPayload
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as AuthPayload
    } catch {
      throw new AppError(401, 'Invalid or expired refresh token')
    }

    const stored = await getRefreshToken(payload.userId)
    // If Redis is unavailable (stored === null), fall back to trusting the JWT signature alone
    if (stored !== null && stored !== refreshToken) {
      throw new AppError(401, 'Refresh token revoked')
    }

    const accessToken = jwt.sign(
      { userId: payload.userId, email: payload.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
    )
    return { accessToken }
  },

  async logout(userId: string): Promise<void> {
    await deleteRefreshToken(userId)
  },

  async setOnboarding(userId: string, completed: boolean): Promise<void> {
    await authQueries.markOnboardingComplete(userId, completed)
  },
}
