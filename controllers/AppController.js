import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const AppController = {
    async getStatus(req, res) {
        const redisIsAlive = redisClient.isAlive();
        const dbIsAlive = dbClient.isAlive();

        const status = {
            redis: redisIsAlive,
            db: dbIsAlive,
        };

        res.status(200).json(status);
    },

    async getStats(req, res) {
        const usersCount = await dbClient.nbUsers();
        const filesCount = await dbClient.nbFiles();

        const stats = {
            users: usersCount,
            files: filesCount,
        };

        res.status(200).json(stats);
    },
};

export default AppController;
