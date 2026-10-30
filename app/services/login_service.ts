import User from '#models/user'
import limiter from '@adonisjs/limiter/services/main'

// Protection contre le bruteforce du formulaire de connexion
export class LoginService {
  /**
   * Vérifie les identifiants en limitant le nombre de tentatives :
   * - 5 échecs par couple IP + email bloquent ce couple pendant 15 minutes,
   *   le compteur étant remis à zéro après une connexion réussie ;
   * - 20 tentatives par minute et par IP, réussies ou non, contre les attaques
   *   visant de nombreux comptes et la saturation du CPU par le hash scrypt.
   *
   * @throws errors.E_TOO_MANY_REQUESTS de @adonisjs/limiter si une limite est atteinte
   * @throws errors.E_INVALID_CREDENTIALS de @adonisjs/auth si les identifiants sont invalides
   */
  async attempt(email: string, password: string, ip: string): Promise<User> {
    await limiter.use({ requests: 20, duration: '1 min' }).consume(`login_ip_${ip}`)

    const accountLimiter = limiter.use({
      requests: 5,
      duration: '15 min',
      blockDuration: '15 min',
    })
    const [error, user] = await accountLimiter.penalize(`login_${ip}_${email}`, () =>
      User.verifyCredentials(email, password)
    )
    if (error) {
      throw error
    }

    return user
  }
}
