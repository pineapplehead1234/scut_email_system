import http from './http'
import type {
  CurrentUserVO,
  LoginData,
  LoginRequest,
  RegisterData,
  RegisterRequest,
} from './type'

const authApi = {
  register(data: RegisterRequest) {
    return http.post<RegisterData, RegisterRequest>('/api/auth/register', data)
  },

  login(data: LoginRequest) {
    return http.post<LoginData, LoginRequest>('/api/auth/login', data)
  },

  logout() {
    return http.post<null>('/api/auth/logout', null, { silent: true })
  },

  getCurrentUser() {
    return http.get<CurrentUserVO>('/api/users/me')
  },
}

export default authApi
