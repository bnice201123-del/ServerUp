const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const getCollection = () => {
    const db = require('../db').getDb();
    return db.collection('users');
};

class User {
    static async register({ username, password }) {
        const users = getCollection();
        
        // Check if user exists
        const existing = await users.findOne({ username });
        if (existing) {
            throw new Error('Username already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const result = await users.insertOne({
            username,
            password: hashedPassword,
            createdAt: new Date()
        });

        return { username, _id: result.insertedId };
    }

    static async login({ username, password }) {
        const users = getCollection();
        
        // Find user
        const user = await users.findOne({ username });
        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        // Create token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        return { token, username: user.username };
    }

    static async findById(userId) {
        const users = getCollection();
        return await users.findOne({ _id: userId });
    }
}

module.exports = User;