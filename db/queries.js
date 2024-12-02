// queries.js - Database queries
const pool = require('./pool');

// Fetch messages based on user type
const fetchMessages = async (userType) => {
    let query;
    if (userType === 'member') {
        query = `
            SELECT message_title, message, username, timestamp
            FROM user_messages
            ORDER BY timestamp DESC;
        `;
    } else {
        query = `
            SELECT message_title, message, 'Anonymous' AS username, timestamp
            FROM user_messages
            ORDER BY timestamp DESC;
        `;
    }

    try {
        const result = await pool.query(query);
        return result.rows;
    } catch (err) {
        console.error('Error fetching messages:', err);
        throw err;
    }
};

// Insert a new message into the user_messages table
const insertMessage = async (username, messageTitle, messageContent) => {
    const query = `
        INSERT INTO user_messages (username, message_title, message, timestamp)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP);
    `;

    try {
        await pool.query(query, [username, messageTitle, messageContent]);
    } catch (err) {
        console.error('Error inserting message:', err);
        throw err;
    }
};

module.exports = { fetchMessages, insertMessage };
