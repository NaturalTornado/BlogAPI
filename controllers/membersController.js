// membersController.js - Handles member-related logic
const { fetchMessages, insertMessage } = require('../db/queries'); // Modularized DB queries
const pool = require('../db/pool'); // Database connection pool
const bcrypt = require('bcrypt');

/**
 * Render the Home Page
 * Fetches and displays messages based on the user's membership type.
 */
const renderHomePage = async (req, res) => {
    try {
        const user = req.user || null; // Get logged-in user or default to null
        const userType = user ? user.user_type : 'user'; // Default to 'user' if not logged in

        // Fetch messages from the database
        const messages = await fetchMessages(userType);

        // Render the index view with user and messages data
        res.render('index', { user, messages });
    } catch (err) {
        console.error('Error rendering home page:', err);
        res.status(500).send('Server error');
    }
};

/**
 * Handle Adding a New Message
 * Inserts a new message into the database.
 */
const addNewMessage = async (req, res) => {
    const user = req.user;

    // Ensure the user is logged in
    if (!user) {
        return res.status(401).send('You must be logged in to post a message.');
    }

    const { newMessageTitle, newMessage } = req.body;

    try {
        // Insert the new message into the database
        await insertMessage(user.username, newMessageTitle, newMessage);

        // Redirect back to the home page
        res.redirect('/');
    } catch (err) {
        console.error('Error adding new message:', err);
        res.status(500).send('Server error while adding message.');
    }
};

/**
 * Handle Membership Upgrade
 * Validates the passcode and upgrades a user's membership status.
 */
const upgradeToMember = async (req, res) => {
    const { membershipPasscode } = req.body;
    const user = req.user;

    // Ensure the user is logged in
    if (!user) {
        return res.status(401).send('You must be logged in to become a member.');
    }

    // Check if user is already a member
    if (user.user_type === 'member') {
        return res.redirect('/');
    }

    // Validate the passcode
    const correctPasscode = 'Secret';
    if (membershipPasscode !== correctPasscode) {
        return res.status(401).send('Incorrect passcode. Please try again.');
    }

    try {
        // Update the user's membership status in the database
        const query = `
            UPDATE users
            SET user_type = 'member'
            WHERE username = $1;
        `;
        await pool.query(query, [user.username]);

        // Update user session and redirect
        req.user.user_type = 'member'; // Update session user data
        res.redirect('/');
    } catch (err) {
        console.error('Error upgrading membership:', err);
        res.status(500).send('Server error');
    }
};

/**
 * Render the Sign-Up Form
 */
const renderSignUpForm = (req, res) => {
    res.render('signUp'); // Ensure you have signUp.ejs in your views folder
};

/**
 * Handle User Sign-Up
 * Creates a new user in the database after validating input.
 */
const handleSignUp = async (req, res) => {
    const { username, password, confirmPassword } = req.body;

    // Validate passwords match
    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match.');
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        const query = `
            INSERT INTO users (username, password, user_type)
            VALUES ($1, $2, 'user');
        `;
        await pool.query(query, [username, hashedPassword]);

        // Redirect to log-in page after successful sign-up
        res.redirect('/log-in');
    } catch (err) {
        console.error('Error during sign-up:', err);
        res.status(500).send('Server error during sign-up.');
    }
};


/**
 * Render the Log-In Form
 */
const renderLogInForm = (req, res) => {
    res.render('logIn'); // Ensure you have logIn.ejs in your views folder
};


/**
 * Handle User Log-Out
 * Destroys the user session and redirects to the home page.
 */
const handleLogOut = (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Error during log-out:', err);
            return res.status(500).send('Server error during log-out.');
        }
        res.redirect('/');
    });
};


// Export all functions for use in membersRouter.js
module.exports = {
    renderHomePage,
    addNewMessage,
    upgradeToMember,
    renderSignUpForm,
    handleSignUp,
    renderLogInForm,
    handleLogOut,
};
