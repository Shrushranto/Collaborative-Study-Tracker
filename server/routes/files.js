import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  upload,
  uploadFile,
  listMyFiles,
  deleteFile,
  shareFile,
  getSharedWithMe,
} from '../controllers/fileController.js';

const router = Router();

// multer error handler
function handleMulterError(err, req, res, next) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large (max 25 MB)' });
  }
  if (err.status === 400) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
}

router.post('/upload', authMiddleware, upload.single('file'), handleMulterError, uploadFile);
router.get('/me', authMiddleware, listMyFiles);
router.get('/shared', authMiddleware, getSharedWithMe);
router.delete('/:id', authMiddleware, deleteFile);
router.post('/:id/share', authMiddleware, shareFile);

export default router;
