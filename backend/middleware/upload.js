import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Storage for images (Josselin album, savings image, etc.)
const imageStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'telos/images',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
        transformation: [{ quality: 'auto' }],
    },
});

// Storage for files (PDFs and any other document)
const fileStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'telos/files',
        resource_type: 'auto',
        allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'],
    },
});

export const uploadImage = multer({ storage: imageStorage });
export const uploadFile = multer({ storage: fileStorage });
