import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import os from 'os'

export function makeMulter(destSubdir: 'avatars'|'students') {
  // Tenta usar a pasta local, se falhar (Vercel), usa /tmp
  let root = path.resolve(process.cwd(), 'uploads')
  
  try {
    fs.mkdirSync(path.join(root, destSubdir), { recursive: true })
  } catch (error) {
    // Ambiente somente leitura (Vercel), fallback para /tmp
    root = path.join(os.tmpdir(), 'uploads')
    try {
      fs.mkdirSync(path.join(root, destSubdir), { recursive: true })
    } catch {}
  }

  const dest = path.join(root, destSubdir)

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => {
      const id = crypto.randomBytes(8).toString('hex')
      const ext = path.extname(file.originalname) || '.jpg'
      cb(null, `${Date.now()}-${id}${ext}`)
    }
  })
  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
      const ok = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)
      if (!ok) return cb(new Error('Invalid file type'))
      cb(null, true)
    }
  })
  return upload
}
