import http from './http'
import type {
  ChangePasswordRequest,
  UpdateUserSettingsRequest,
  UserSettingsVO,
} from './type'

const userApi = {
  changePassword(data: ChangePasswordRequest) {
    return http.put<boolean, ChangePasswordRequest>('/api/users/password', data)
  },

  getSettings() {
    return http.get<UserSettingsVO>('/api/users/settings')
  },

  updateSettings(data: UpdateUserSettingsRequest) {
    return http.put<UserSettingsVO, UpdateUserSettingsRequest>(
      '/api/users/settings',
      data,
    )
  },
}

export default userApi
