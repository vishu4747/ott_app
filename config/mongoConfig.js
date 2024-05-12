const { MongoClient } = require('mongodb');

// Connection URI
const uri = process.env.MONGO_URL; // Change this according to your MongoDB connection URI

// Database Name
const dbName = process.env.MONGO_DB; // Change this to your database name

async function fetchDataFromCollection(collectionName, query = {}, page = 1, limit = 10, sort = {}) {
    // Create a new MongoClient
    const client = new MongoClient(uri);
  
    try {
      // Connect to the MongoDB server
      await client.connect();
      console.log('Connected to MongoDB');
  
      // Access your database
      const db = client.db(dbName);
  
      // Access the specified collection
      const collection = db.collection(collectionName);
  
      // Calculate skip value based on page number and data limit
      const skip = (page - 1) * limit;
  
      // Set up options for pagination and sorting
      const options = { limit, skip, sort };
  
      // Find data from collection based on query and options
      const data = await collection.find(query, options).toArray();
  
      // Get total count of documents in the collection
      const totalCount = await collection.countDocuments(query);
  
      // Calculate next page number
      const nextPage = data.length === limit ? page + 1 : 0;
  
      // Return data along with next page number and total count
      return { data, total_count: totalCount, next_page: nextPage };
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw error;
    } finally {
      // Close the connection
      await client.close();
      console.log('Connection closed');
    }
  }

module.exports = fetchDataFromCollection;

