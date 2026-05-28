import db from '../../config/db'

export interface UserRow {
  id: string
  email: string
  password_hash: string
  display_name: string
  onboarding_completed: boolean
  created_at: Date
}

export const authQueries = {
  findByEmail(email: string): Promise<UserRow | undefined> {
    return db<UserRow>('users').where({ email }).first()
  },

  findById(id: string): Promise<UserRow | undefined> {
    return db<UserRow>('users').where({ id }).first()
  },

  async createUser(data: {
    email: string
    passwordHash: string
    displayName: string
  }): Promise<UserRow> {
    const [user] = await db<UserRow>('users')
      .insert({
        email: data.email,
        password_hash: data.passwordHash,
        display_name: data.displayName,
      })
      .returning('*')
    return user
  },

  async createWorkspace(userId: string): Promise<void> {
    await db('workspaces').insert({ user_id: userId, name: 'My Workspace' })
  },

  async markOnboardingComplete(userId: string, completed: boolean): Promise<void> {
    await db('users').where({ id: userId }).update({ onboarding_completed: completed })
  },
}
