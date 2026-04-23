import fs from 'fs';
import path from 'path';
import multer from 'multer';
import StudyFile from '../models/StudyFile.js';
import User from '../models/User.js';

const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];
const MAX_SIZE = 25 * 1024 * 1024; // 25 MB

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(process.cwd(), 'uploads');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter(req, file, cb) {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error('Only PDF and PowerPoint files are allowed'), { status: 400 }));
    }
  },
});

export async function uploadFile(req, res) {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const url = `/uploads/${req.file.filename}`;
  const file = await StudyFile.create({
    user: req.user._id,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    url,
  });

  res.status(201).json({ file });
}

export async function listMyFiles(req, res) {
  const files = await StudyFile.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ files });
}

export async function deleteFile(req, res) {
  const file = await StudyFile.findOne({ _id: req.params.id, user: req.user._id });
  if (!file) return res.status(404).json({ message: 'File not found' });

  const diskPath = path.join(process.cwd(), 'uploads', file.filename);
  fs.unlink(diskPath, (err) => {
    if (err && err.code !== 'ENOENT') console.error('File delete error:', err);
  });

  await StudyFile.deleteOne({ _id: file._id });
  res.json({ message: 'File deleted' });
}

export async function shareFile(req, res) {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId is required' });

  const file = await StudyFile.findOne({ _id: req.params.id, user: req.user._id });
  if (!file) return res.status(404).json({ message: 'File not found' });

  const recipient = await User.findById(userId).select('_id name').lean();
  if (!recipient) return res.status(404).json({ message: 'User not found' });

  if (file.sharedWith.some((id) => id.toString() === userId)) {
    return res.status(409).json({ message: 'Already shared with this user' });
  }

  file.sharedWith.push(userId);
  await file.save();

  res.json({ file });
}

export async function getSharedWithMe(req, res) {
  const files = await StudyFile.find({ sharedWith: req.user._id })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ files });
}
