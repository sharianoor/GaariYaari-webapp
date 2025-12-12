const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    full_name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password']
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number']
    },
    role: {
        type: String,
        enum: ['driver', 'passenger'],
        default: 'passenger'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
