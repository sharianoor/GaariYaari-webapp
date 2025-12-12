const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    ride_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride',
        required: true
    },
    passenger_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    seats_booked: {
        type: Number,
        required: [true, 'Please add number of seats booked'],
        min: 1
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'declined', 'cancelled', 'completed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
