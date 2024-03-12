import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const UsersController = {
  async postNew(req, res) {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // Check if email already exists
    const userExists = await dbClient.db.collection('users').findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'Already exist' });
    }

    // Hash the password
    const hashedPassword = sha1(password);

    // Create a new user
    const result = await dbClient.db.collection('users').insertOne({ email, password: hashedPassword });

    // Return the new user
    const newUser = {
      id: result.insertedId,
      email,
    };
    return res.status(201).json(newUser);
  },

  async getMe(req, res) {
    const token = req.headers['x-token'];

    // Check if token is provided
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user ID from Redis
    const userId = await redisClient.get(`auth_${token}`);

    // Check if user ID exists
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve user from database
    const user = await dbClient.db.collection('users').findOne({ _id: userId });

    // Check if user exists
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Return user information
    const userInfo = {
      id: user._id,
      email: user.email,
    };
    return res.status(200).json(userInfo);
  },
};

export default UsersController;
