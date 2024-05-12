const mysql = require('mysql');
const dbConfig = require('./dbConfig');

async function executeQuery(query, page = 1, limit = 10) {
  // Create a MySQL connection
  const connection = mysql.createConnection(dbConfig);

  return new Promise((resolve, reject) => {
    // Connect to the MySQL server
    connection.connect((err) => {
      if (err) {
        console.error('Error connecting to MySQL:', err);
        reject(err);
        return;
      }
      console.log('Connected to MySQL');

      // Execute the count query to get total count
      const countQuery = `SELECT COUNT(*) AS total_count FROM (${query}) AS count_query`;
      connection.query(countQuery, (error, countResult) => {
        if (error) {
          console.error('Error executing count query:', error);
          reject(error);
          return;
        }

        // Execute the paginated query to get data
        const offset = (page - 1) * limit;
        const paginatedQuery = `${query} LIMIT ${limit} OFFSET ${offset}`;
        connection.query(paginatedQuery, (err, dataResult) => {
          if (err) {
            console.error('Error executing paginated query:', err);
            reject(err);
            return;
          }

          // Close the MySQL connection
          connection.end();

          const total_count = countResult[0].total_count;
          const next_page = offset + dataResult.length < total_count ? page + 1 : 0;

          console.log('Query results:', dataResult);

          // Resolve with data, total_count, and next_page
          resolve({ data: dataResult, total_count, next_page });
        });
      });
    });
  });
}

// Function to fetch data from post and postmeta tables
async function fetchPostData(postId) {
  // Create a MySQL connection
  const connection = mysql.createConnection(dbConfig);

  return new Promise((resolve, reject) => {
    // Connect to the MySQL server
    connection.connect((err) => {
      if (err) {
        console.error('Error connecting to MySQL:', err);
        reject(err);
        return;
      }
      console.log('Connected to MySQL');

      // Construct the SQL query to fetch data from post and postmeta tables
      const query = `
        SELECT *
        FROM ch_posts AS p
        LEFT JOIN ch_postmeta AS pm ON p.ID = pm.post_id
        WHERE p.ID = ?
      `;

      // Execute the query
      connection.query(query, [postId], (error, results) => {
        if (error) {
          console.error('Error executing query:', error);
          reject(error);
          return;
        }

        // Close the MySQL connection
        connection.end();

        // Organize post data and postmeta data into a single object
        const postData = {
          id: postId,
          post: results[0], // Directly assign the first row of results as post data
          postmeta: {} // Object to hold postmeta data
        };

        // Populate postmeta object with meta_key and meta_value pairs
        results.forEach((row) => {
          if (row.meta_key && row.meta_value) {
            postData.postmeta[row.meta_key] = row.meta_value;
          }
        });

        // Resolve with the organized post data
        resolve(postData);
      });
    });
  });
}

// Function to retrieve user and usermeta by mobile number
async function getUserByMobile(mobileNumber) {
  // Create a MySQL connection
  const connection = mysql.createConnection(dbConfig);

  return new Promise((resolve, reject) => {
    // Connect to the MySQL server
    connection.connect((err) => {
      if (err) {
        console.error('Error connecting to MySQL:', err);
        reject(err);
        return;
      }
      console.log('Connected to MySQL');

      // Construct the SQL query to retrieve user and usermeta by mobile number
      const query = `
        SELECT u.*, um.meta_key, um.meta_value
        FROM ch_users AS u
        LEFT JOIN ch_usermeta AS um ON u.ID = um.user_id
        WHERE u.user_nicename = ?
      `;

      // Execute the query
      connection.query(query, [mobileNumber], (error, results) => {
        if (error) {
          console.error('Error executing query:', error);
          reject(error);
          return;
        }

        // Close the MySQL connection
        connection.end();

        // Organize user and usermeta data into a single object
        const userData = {
          user: results[0], // User data
          usermeta: {} // Object to hold usermeta data
        };

        // Populate usermeta object with meta_key and meta_value pairs
        results.forEach((row) => {
          if (row.meta_key && row.meta_value) {
            userData.usermeta[row.meta_key] = row.meta_value;
          }
        });

        // Resolve with the user data and usermeta
        resolve(userData);
      });
    });
  });
}

async function executeQueryForData(query) {
  // Create a MySQL connection
  const connection = mysql.createConnection(dbConfig);

  return new Promise((resolve, reject) => {
    // Connect to the MySQL server
    connection.connect((err) => {
      if (err) {
        console.error('Error connecting to MySQL:', err);
        reject(err);
        return;
      }
      console.log('Connected to MySQL');

      // Execute the provided query
      connection.query(query, (error, results) => {
        if (error) {
          console.error('Error executing query:', error);
          reject(error);
          return;
        }

        // Close the MySQL connection
        connection.end();

        // Resolve with the query results
        resolve(results);
      });
    });
  });
}

module.exports = {executeQuery, fetchPostData, getUserByMobile, executeQueryForData};


