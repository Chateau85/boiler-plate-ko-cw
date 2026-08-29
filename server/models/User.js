const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 12;

const userSchema = mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
        maxlength: 50,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        required: true,
        unique: true,
        maxlength: 254,
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false,
    },
    lastname: {
        type: String,
        trim: true,
        maxlength: 50,
    },
    role: {
        type: Number,
        default: 0,
    },
    image: String,
    token: {
        type: String,
        select: false,
    },
});

userSchema.pre('save', async function hashPassword() {
    if (!this.isModified('password')) {
        return;
    }

    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

userSchema.methods.comparePassword = function comparePassword(plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
};

userSchema.methods.generateToken = async function generateToken(jwtSecret, expiresIn) {
    const token = jwt.sign(
        { sub: this._id.toString() },
        jwtSecret,
        { expiresIn },
    );

    this.token = token;
    await this.save();
    return token;
};

userSchema.statics.findByToken = async function findByToken(token, jwtSecret) {
    try {
        const decoded = jwt.verify(token, jwtSecret);
        return this.findOne({ _id: decoded.sub, token }).select('+token');
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return null;
        }

        throw error;
    }
};

const User = mongoose.model('User', userSchema);

module.exports = { User };
