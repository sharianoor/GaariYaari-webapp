const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    driver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    city: {
        type: String,
        required: [true, 'Please add a city']
    },
    pickup: {
        type: String,
        required: [true, 'Please add a pickup location']
    },
    destination: {
        type: String,
        required: [true, 'Please add a destination']
    },
    datetime: {
        type: Date,
        required: [true, 'Please add a date and time']
    },
    seats_available: {
        type: Number,
        required: [true, 'Please add number of seats'],
        min: 1
    },
    cost: {
        type: Number,
        required: [true, 'Please add cost per seat']
    },
    vehicle_type: {
        type: String,
        enum: ['Car', 'Bike'],
        required: [true, 'Please select vehicle type']
    },
    vehicle_name: {
        type: String,
        required: [true, 'Please add vehicle name']
    },
    vehicle_number: {
        type: String,
        required: [true, 'Please add vehicle number']
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Ride', rideSchema);
