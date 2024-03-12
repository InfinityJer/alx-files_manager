/* eslint-disable import/no-named-as-default */
/* eslint-disable no-unused-vars */

// Import necessary modules
import sha1 from 'sha1';
import { Request } from 'express';
import mongoDBCore from 'mongodb/lib/core'; // Import MongoDB Core module
import dbClient from './db'; // Import database client module
import redisClient from './redis'; // Import Redis client module

/**
 * Retrieves user information from the Authorization header in the request object.
 * @param {Request} req The Express request object.
 * @returns {Promise<{_id: ObjectId, email: string, password: string}>} A promise resolving to the user object.
 */
export const getUserFromAuthorization = async (req) => {
  // Extract authorization header from the request
  const authorization = req.headers.authorization || null;

  // Return null if authorization header is missing
  if (!authorization) {
    return null;
  }

  // Split authorization header into parts
  const authorizationParts = authorization.split(' ');

  // Return null if authorization header is not in the expected format
  if (authorizationParts.length !== 2 || authorizationParts[0] !== 'Basic') {
    return null;
  }

  // Decode token from base64 and extract email and password
  const token = Buffer.from(authorizationParts[1], 'base64').toString();
  const sepPos = token.indexOf(':');
  const email = token.substring(0, sepPos);
  const password = token.substring(sepPos + 1);

  // Find user in the database using the email
  const user = await (await dbClient.usersCollection()).findOne({ email });

  // Return null if user is not found or password does not match
  if (!user || sha1(password) !== user.password) {
    return null;
  }

  // Return the user object
  return user;
};

/**
 * Retrieves user information from the X-Token header in the request object.
 * @param {Request} req The Express request object.
 * @returns {Promise<{_id: ObjectId, email: string, password: string}>} A promise resolving to the user object.
 */
export const getUserFromXToken = async (req) => {
  // Extract token from the X-Token header
  const token = req.headers['x-token'];

  // Return null if token is missing
  if (!token) {
    return null;
  }

  // Retrieve user ID from Redis cache
  const userId = await redisClient.get(`auth_${token}`);

  // Return null if user ID is not found in Redis
  if (!userId) {
    return null;
  }

  // Find user in the database using the retrieved user ID
  const user = await (await dbClient.usersCollection()).findOne({ _id: new mongoDBCore.BSON.ObjectId(userId) });

  // Return the user object or null if not found
  return user || null;
};

// Export functions for accessing user information
export default {
  getUserFromAuthorization: async (req) => getUserFromAuthorization(req),
  getUserFromXToken: async (req) => getUserFromXToken(req),
};
