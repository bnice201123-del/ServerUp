const { ObjectId } = require('mongodb');

const getCollection = () => {
    const db = require('../db').getDb();
    return db.collection('messages');
};

class Message {
    static async create({ name, message, userId, username }) {
        const messages = getCollection();
        const result = await messages.insertOne({
            name,
            message,
            userId,
            username,
            createdAt: new Date()
        });
        return result;
    }

    static async findAll(query = {}) {
        const messages = getCollection();
        const filter = {};
        
        // Text search
        if (query.search) {
            filter.$or = [
                { message: { $regex: query.search, $options: 'i' } },
                { name: { $regex: query.search, $options: 'i' } }
            ];
        }

        // User filter
        if (query.username) {
            filter.username = query.username;
        }

        return await messages.find(filter)
            .sort({ createdAt: -1 })
            .toArray();
    }

    static async deleteMessage(messageId, userId) {
        const messages = getCollection();
        const result = await messages.deleteOne({
            _id: new ObjectId(messageId),
            userId: userId
        });
        return result.deletedCount > 0;
    }}module.exports = Message;