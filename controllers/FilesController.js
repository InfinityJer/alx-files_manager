import { v4 as uuidv4 } from 'uuid'; // using UUIDv4 for generating file IDs
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

const FilesController = {
  async postUpload(req, res) {
    const {
      name, type, data, parentId = 0, isPublic = false,
    } = req.body;
    const userId = req.user.id; // Assuming the user object is available in the request

    // Validate request parameters
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing or invalid type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    // Validate parentId if present
    if (parentId !== 0) {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: parentId });
      if (!parentFile || parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent not found or is not a folder' });
      }
    }

    // Create file document
    const file = {
      userId,
      name,
      type,
      isPublic,
      parentId,
    };

    if (type !== 'folder') {
      // Decode Base64 data and save to disk
      const fileData = Buffer.from(data, 'base64');
      const fileId = uuidv4();
      const filePath = path.join(FOLDER_PATH, fileId);

      try {
        fs.writeFileSync(filePath, fileData);
      } catch (error) {
        console.error('Error saving file to disk:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      file.localPath = filePath;
    }

    // Save file document to database
    try {
      const result = await dbClient.db.collection('files').insertOne(file);
      file.id = result.insertedId;
      return res.status(201).json(file);
    } catch (error) {
      console.error('Error saving file to database:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
};

export default FilesController;
