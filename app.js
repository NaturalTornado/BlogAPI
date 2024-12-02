// app.js - Main application setup with Passport Local Strategy
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const membersRouter = require('./routes/membersRouter');
const pool = require('./db/pool'); // Database connection pool

const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
    session({
        secret: 'yourSecretKey', // Replace with a strong secret in production
        resave: false,
        saveUninitialized: true,
    })
);
app.use(passport.initialize());
app.use(passport.session());

// Passport Local Strategy
passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            // Check if the username exists in the database
            const query = `SELECT * FROM users WHERE username = $1`;
            const result = await pool.query(query, [username]);

            if (result.rows.length === 0) {
                return done(null, false, { message: 'Incorrect username.' });
            }

            const user = result.rows[0];

            // Compare the hashed password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: 'Incorrect password.' });
            }

            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);

// Serialize user into the session
passport.serializeUser((user, done) => {
    done(null, user.username); // Use username as the session identifier
});

// Deserialize user from the session
passport.deserializeUser(async (username, done) => {
    try {
        const query = `SELECT * FROM users WHERE username = $1`;
        const result = await pool.query(query, [username]);
        if (result.rows.length === 0) {
            return done(null, false);
        }
        done(null, result.rows[0]);
    } catch (err) {
        done(err);
    }
});

// Routes
app.use('/', membersRouter);

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
