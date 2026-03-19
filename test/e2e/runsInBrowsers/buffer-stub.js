const decodeBase64 = (value) => {
  const raw = atob(value)
  const bytes = new Uint8Array(raw.length)

  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index)
  }

  return bytes
}

const encodeBase64 = (bytes) => {
  let binaryString = ''

  for (let index = 0; index < bytes.length; index += 1) {
    binaryString += String.fromCharCode(bytes[index])
  }

  return btoa(binaryString)
}

export class Buffer extends Uint8Array {
  static from(value, encoding = 'utf8') {
    if (encoding === 'base64') {
      return new Buffer(decodeBase64(value))
    }

    if (typeof value === 'string') {
      return new Buffer(new TextEncoder().encode(value))
    }

    if (value instanceof Uint8Array) {
      return new Buffer(value)
    }

    if (ArrayBuffer.isView(value)) {
      return new Buffer(
        new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
      )
    }

    if (value instanceof ArrayBuffer) {
      return new Buffer(new Uint8Array(value))
    }

    throw new TypeError('Unsupported Buffer.from input in browser test harness')
  }

  toString(encoding = 'utf8') {
    if (encoding === 'base64') {
      return encodeBase64(this)
    }

    if (encoding === 'utf8' || encoding === 'utf-8') {
      return new TextDecoder().decode(this)
    }

    throw new TypeError('Unsupported Buffer encoding in browser test harness')
  }
}

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer
}

export default { Buffer }
