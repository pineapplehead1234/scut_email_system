import axios, { AxiosHeaders } from 'axios'

import { networkConfig } from '../config/network'

export const http = axios.create({
  baseURL: networkConfig.apiBaseURL,
  timeout: 10000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('mail_token')

  if (token) {
    config.headers = AxiosHeaders.from(config.headers)
    config.headers.set('Authorization', `Bearer ${token}`)
  }

  return config
})

export default http
