const spicedPg = require("spiced-pg");
const dbUsername = "postgres";
const dbUserPassword = "postgres";
const database = "petition";

const db = spicedPg(
    process.env.DATABASE_URL || `postgres:${dbUsername}:${dbUserPassword}@localhost:5432/${database}`
);
console.log("[db] Connecting to:", database);

// –––––––––––  ONLY SIGNATURE TABLE  –––––––––––

module.exports.addSignatureAndUserId = (signature, user_id) => {
    const q = `INSERT INTO signatures (signature, user_id)
                VALUES($1, $2)
                RETURNING id`;
    const params = [signature, user_id];
    return db.query(q, params);
};

module.exports.deleteSignature = (user_id) => {
    const q = `DELETE FROM signatures WHERE user_id = $1`;
    const params = [user_id];
    return db.query(q, params);
};


module.exports.getSignatureByUsersId = (user_id) => {
    const q = `SELECT signature FROM signatures
                WHERE user_id = ${user_id}`;
    const params = [user_id]
    return db.query(q);
};

// –––––––––––  ONLY USERS TABLE  –––––––––––

module.exports.addUserData = (firstName, lastName, password, email) => {
    const q = `INSERT INTO users (first, last, password, email)
                VALUES($1, $2, $3, $4)
                RETURNING id`;
    const params = [firstName, lastName, password, email];
    return db.query(q, params);
};


module.exports.getHashedPassword = (email) => {
    const q = `SELECT password FROM users
                WHERE email = $1`;
    const params = [email];
    return db.query(q, params);
};

module.exports.getUserId = (email) => {
    const q = `SELECT id FROM users
                WHERE email = $1`;
    const params = [email];
    return db.query(q, params);
};

// –––––––––––  ONLY PROFILE TABLE  –––––––––––

module.exports.addProfile = ({ user_id, age, city, link }) => {
    const q = `INSERT INTO profiles (user_id, age, city, link)
                VALUES($1, $2, $3, $4)`;
    const params = [user_id, age, city, link];
    return db.query(q, params);
};

// –––––––––––  JOINT TABLE  –––––––––––

module.exports.getSigners = () => {
    const q = `SELECT users.first, users.last, profiles.link, profiles.city
                FROM signatures
                LEFT JOIN users
                ON signatures.user_id = users.id
                LEFT JOIN profiles
                ON signatures.user_id = profiles.user_id;`;
    return db.query(q);
};

module.exports.getSignersByCity = (cityName) => {

    const q = `SELECT users.first, users.last, profiles.link, profiles.city
                FROM signatures
                LEFT JOIN users
                ON signatures.user_id = users.id
                LEFT JOIN profiles
                ON signatures.user_id = profiles.user_id
                WHERE city = $1`;
    const params = [cityName];          
    return db.query(q, params);
};

// –––––––– FOR LOGIN AND EDIT PROFILE ROUTE –––––––––––––

module.exports.getUserDataByUserId = (user_id) => {

    const q = `SELECT users.first, users.last, users.email, users.password, profiles.age, profiles.city, profiles.link
                FROM users
                LEFT JOIN profiles
                ON users.id = profiles.user_id
                LEFT JOIN signatures
                ON users.id = signatures.user_id
                WHERE users.id = $1`;
    const params = [user_id];
    return db.query(q, params);
};

// –––––––– UPDATE USER DATA –––––––––––––

module.exports.updateUserWithPassword = ({ user_id, first, last, email, hashedPassword }) => {    
    const q = `UPDATE users 
                SET first = $2, last = $3, email = $4, password = $5
                WHERE id = $1`;
    const params = [user_id, first, last, email, hashedPassword];
    return db.query(q, params);
};

module.exports.updateUser = ({ user_id, first, last, email }) => {   
    const q = `UPDATE users 
                SET first = $2, last = $3, email = $4
                WHERE id = $1`;
    const params = [user_id, first, last, email];
    return db.query(q, params);
};


module.exports.upsertProfile = ({ user_id, age, city, link }) => {
        const q = `INSERT INTO profiles (user_id, age, city, link) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET age = $2, city = $3, link = $4`;
    const params = [user_id, age || null, city || null, link || null];
    return db.query(q, params);
};

module.exports.updateSignature = ({ user_id }) => {
    const q = `UPDATE signatures 
                SET signature 
                WHERE id = $1`;
    const params = [user_id ];
    return db.query(q, params);
};
  



