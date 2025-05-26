import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

const allowedExts = ['.jpg', '.jpeg', '.png'];
const fileFilter = (_req: any, file: any, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(null, false); 
  }
};

export const upload = multer({ storage, fileFilter });
