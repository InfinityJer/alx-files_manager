import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController'; 

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);

router.post('/users', UsersController.postNew);
router.post('/files', FilesController.postUpload);

router.get('/files/:id', FilesController.getShow); // GET /files/:id
router.get('/files', FilesController.getIndex); // GET /files

router.put('/files/:id/publish', FilesController.putPublish); // PUT /files/:id/publish
router.put('/files/:id/unpublish', FilesController.putUnpublish); // PUT /files/:id/unpublish

router.get('/files/:id/data', FilesController.getFile); // GET /files/:id/data

export default router;
