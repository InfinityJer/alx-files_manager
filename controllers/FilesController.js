import dbClient from '../utils/db';
import fs from 'fs';
import path from 'path';
import mimeTypes from 'mime-types';
import { v4 as uuidv4 } from 'uuid';

const FilesController = {
  async postUpload(req, res) {
    try {
      // Retrieve user based on token
      const userId = req.user.id;

      // Extract file information from request body
      const { name, type, parentId = 0, isPublic = false, data } = req.body;

      // Validate input
      if (!name) return res.status(400).json({ error: 'Missing name' });
      if (!type || !['folder', 'file', 'image'].includes(type))
        return res.status(400).json({ error: 'Missing type' });
      if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

      // If parentId is set, validate it
      if (parentId !== 0) {
        const parentFile = await dbClient.files.findOne({ _id: parentId });
        if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
        if (parentFile.type !== 'folder')
          return res.status(400).json({ error: 'Parent is not a folder' });
      }

      // Save file data
      let localPath;
      if (type !== 'folder') {
        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
        localPath = path.join(folderPath, `${uuidv4()}`);
        await fs.promises.writeFile(localPath, Buffer.from(data, 'base64'));
      }

      // Add file document to DB
      const newFile = {
        userId,
        name,
        type,
        isPublic,
        parentId,
        localPath: type !== 'folder' ? localPath : undefined,
      };
      const { insertedId } = await dbClient.files.insertOne(newFile);
      newFile.id = insertedId;

      return res.status(201).json(newFile);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Server error' });
    }
  },

  async getShow(req, res) {
    try {
      // Retrieve user based on token
      const userId = req.user.id;

      // Retrieve file based on ID
      const file = await dbClient.files.findOne({ _id: req.params.id });
      if (!file) return res.status(404).json({ error: 'Not found' });

      // Check file access
      if (!file.isPublic && file.userId !== userId)
        return res.status(404).json({ error: 'Not found' });

      return res.json(file);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Server error' });
    }
  },

  async getIndex(req, res) {
    try {
      // Retrieve user based on token
      const userId = req.user.id;

      // Pagination parameters
      const { parentId = 0, page = 0 } = req.query;
      const limit = 20;
      const skip = page * limit;

      // Retrieve files based on parentId and pagination
      const files = await dbClient.files
        .find({ userId, parentId })
        .skip(skip)
        .limit(limit)
        .toArray();

      return res.json(files);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Server error' });
    }
  },

  async putPublish(req, res) {
    try {
      // Retrieve user based on token
      const userId = req.user.id;

      // Retrieve file based on ID
      const file = await dbClient.files.findOne({ _id: req.params.id });
      if (!file) return res.status(404).json({ error: 'Not found' });

      // Check file ownership
      if (file.userId !== userId) return res.status(401).json({ error: 'Unauthorized' });

      // Update file to be public
      await dbClient.files.updateOne({ _id: req.params.id }, { $set: { isPublic: true } });
      file.isPublic = true;

      return res.json(file);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Server error' });
    }
  },

  async putUnpublish(req, res) {
    try {
      // Retrieve user based on token
      const userId = req.user.id;

      // Retrieve file based on ID
      const file = await dbClient.files.findOne({ _id: req.params.id });
      if (!file) return res.status(404).json({ error: 'Not found' });

      // Check file ownership
      if (file.userId !== userId) return res.status(401).json({ error: 'Unauthorized' });

      // Update file to be private
      await dbClient.files.updateOne({ _id: req.params.id }, { $set: { isPublic: false } });
      file.isPublic = false;

      return res.json(file);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Server error' });
    }
  },

  async getFile(req, res) {
    try {
      // Retrieve file based on ID
      const file = await dbClient.files.findOne({ _id: req.params.id });
      if (!file) return res.status(404).json({ error: 'Not found' });

      // Check file access
      if (!file.isPublic && (!req.user || req.user.id !== file.userId))
        return res.status(404).json({ error: 'Not found' });

      // Validate file type
      if (file.type === 'folder')
        return res.status(400).json({ error: "A folder doesn't have content" });

      // Check file existence
      if (!fs.existsSync(file.localPath))
        return res.status(404).json({ error: 'Not found' });

      // Get MIME-type and send file data
      const mimeType = mimeTypes.lookup(file.name);
      res.setHeader('Content-Type', mimeType);
      fs.createReadStream(file.localPath).pipe(res);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Server error' });
    }
  },
};

export default FilesController;
