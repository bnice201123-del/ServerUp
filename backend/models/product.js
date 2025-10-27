const { ObjectId } = require('mongodb');

const getCollection = () => {
    const db = require('../db').getDb();
    return db.collection('products');
};

class Product {
    static async create(productData) {
        const products = getCollection();
        const now = new Date();
        
        const productWithTimestamps = {
            ...productData,
            createdAt: now,
            updatedAt: now
        };

        const result = await products.insertOne(productWithTimestamps);
        return { ...productWithTimestamps, _id: result.insertedId };
    }

    static async findById(productId) {
        const products = getCollection();
        return await products.findOne({ _id: new ObjectId(productId) });
    }

    static async findAll(query = {}) {
        const products = getCollection();
        const filter = {};
        
        // Text search if provided
        if (query.search) {
            filter.$or = [
                { name: { $regex: query.search, $options: 'i' } },
                { description: { $regex: query.search, $options: 'i' } }
            ];
        }

        return await products.find(filter)
            .sort({ createdAt: -1 })
            .toArray();
    }

    static async update(productId, updateData) {
        const products = getCollection();
        // Validate productId
        const { ObjectId } = require('mongodb');
        if (!ObjectId.isValid(productId)) {
            return null;
        }

        // Prevent changing immutable fields
        const sanitized = { ...updateData };
        delete sanitized._id;
        delete sanitized._rev;
        delete sanitized.createdAt;

        // Always update the updatedAt timestamp
        const updates = {
            ...sanitized,
            updatedAt: new Date()
        };

        const result = await products.findOneAndUpdate(
            { _id: new ObjectId(productId) },
            { $set: updates },
            { returnDocument: 'after' }
        );

        return result.value || null;
    }

    static async delete(productId) {
        const products = getCollection();
        const result = await products.deleteOne({ _id: new ObjectId(productId) });
        return result.deletedCount > 0;
    }
}

module.exports = Product;