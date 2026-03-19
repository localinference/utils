import { Buffer } from 'node:buffer'
import { clean_30k_b64 } from '@sctg/sentencepiece-js'
import { IDENTITY_MODEL_B64 } from './model-base64.js'

export const getTokenizerModel = () =>
  Uint8Array.from(Buffer.from(clean_30k_b64, 'base64'))

export const getIdentityModel = () =>
  Uint8Array.from(Buffer.from(IDENTITY_MODEL_B64, 'base64'))
