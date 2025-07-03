const mongoose = require('mongoose');
const config = require('./config');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      this.connection = await mongoose.connect(config.database.mongoUri, config.database.options);
      
      console.log('✅ Connected to MongoDB');
      console.log(`📊 Database: ${this.connection.connection.name}`);
      console.log(`🌐 Host: ${this.connection.connection.host}`);
      console.log(`🔌 Port: ${this.connection.connection.port}`);

      // Connection event listeners
      mongoose.connection.on('connected', () => {
        console.log('Mongoose connected to MongoDB');
      });

      mongoose.connection.on('error', (err) => {
        console.error('Mongoose connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('Mongoose disconnected from MongoDB');
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.connection.close();
        console.log('📴 Disconnected from MongoDB');
      }
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }
  }

  getConnection() {
    return this.connection;
  }

  async isConnected() {
    return mongoose.connection.readyState === 1;
  }

  async dropDatabase() {
    try {
      if (config.server.nodeEnv === 'test') {
        await mongoose.connection.dropDatabase();
        console.log('🗑️ Test database dropped');
      } else {
        throw new Error('Database can only be dropped in test environment');
      }
    } catch (error) {
      console.error('Error dropping database:', error);
      throw error;
    }
  }

  async clearCollections() {
    try {
      if (config.server.nodeEnv === 'test') {
        const collections = await mongoose.connection.db.collections();
        
        for (let collection of collections) {
          await collection.deleteMany({});
        }
        
        console.log('🧹 Test collections cleared');
      } else {
        throw new Error('Collections can only be cleared in test environment');
      }
    } catch (error) {
      console.error('Error clearing collections:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new Database(); 