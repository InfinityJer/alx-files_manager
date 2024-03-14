import { existsSync, readFileSync } from 'fs';

/**
 * Loads the appropriate environment variables for an event.
 * Determines the environment based on the npm lifecycle event.
 * If the event includes 'test' or 'cover', loads variables from '.env.test',
 * otherwise loads from '.env'.
 */
const envLoader = () => {
  // Determine the environment based on the npm lifecycle event
  const env = process.env.npm_lifecycle_event || 'dev';
  const path = env.includes('test') || env.includes('cover') ? '.env.test' : '.env';

  // Load environment variables if the file exists
  if (existsSync(path)) {
    const data = readFileSync(path, 'utf-8').trim().split('\n');

    for (const line of data) {
      // Split each line by '=' to extract variable and value
      const delimPosition = line.indexOf('=');
      const variable = line.substring(0, delimPosition);
      const value = line.substring(delimPosition + 1);

      // Set the environment variable
      process.env[variable] = value;
    }
  }
};

export default envLoader;
