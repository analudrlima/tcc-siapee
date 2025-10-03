import request from 'supertest'
import { createApp } from '../src/app'

export function makeApp() {
  process.env.JWT_SECRET = 'test-secret'
  process.env.NODE_ENV = 'test'
  return createApp()
}

export function authHeader(token = 'token') {
  return { Authorization: `Bearer ${token}` }
}
