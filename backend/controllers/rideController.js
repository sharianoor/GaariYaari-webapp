const asyncHandler = require('express-async-handler');
const Ride = require('../models/Ride');

// @desc    Offer a ride
// @route   POST /api/rides
// @access  Private
// @desc    Offer a ride
// @route   POST /api/rides
// @access  Private
const offerRide = asyncHandler(async (req, res) => {
    const { city, pickup, destination, datetime, seats_available, cost, vehicle_type, vehicle_name, vehicle_number } = req.body;

    if (!city || !pickup || !destination || !datetime || !seats_available || !cost || !vehicle_type || !vehicle_name || !vehicle_number) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    const ride = await Ride.create({
        driver_id: req.user.id,
        city,
        pickup,
        destination,
        datetime,
        seats_available,
        cost,
        vehicle_type,
        vehicle_name,
        vehicle_number
    });

    res.status(201).json(ride);
});

// @desc    Get rides (search)
// @route   GET /api/rides
// @access  Public
const getRides = asyncHandler(async (req, res) => {
    const { city, pickup, destination, date } = req.query;

    let query = {};

    if (city) {
        query.city = city;
    }
    if (pickup) {
        query.pickup = { $regex: pickup, $options: 'i' };
    }
    if (destination) {
        query.destination = { $regex: destination, $options: 'i' };
    }
    if (date) {
        // Basic date filtering - assumes YYYY-MM-DD
        // Create a range for the whole day
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);

        query.datetime = {
            $gte: startDate,
            $lt: endDate
        };
    }

    // Only show active rides
    query.status = 'active';

    const rides = await Ride.find(query).populate('driver_id', 'full_name phone email');
    res.status(200).json(rides);
});

// @desc    Get ride details
// @route   GET /api/rides/:id
// @access  Public
const getRideById = asyncHandler(async (req, res) => {
    const ride = await Ride.findById(req.params.id).populate('driver_id', 'full_name phone email');

    if (ride) {
        res.status(200).json(ride);
    } else {
        res.status(404);
        throw new Error('Ride not found');
    }
});

// @desc    Get logged in driver's rides
// @route   GET /api/rides/my-rides
// @access  Private
const getMyRides = asyncHandler(async (req, res) => {
    const rides = await Ride.find({ driver_id: req.user.id });
    res.status(200).json(rides);
});

// @desc    Delete a ride
// @route   DELETE /api/rides/:id
// @access  Private
const deleteRide = asyncHandler(async (req, res) => {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
        res.status(404);
        throw new Error('Ride not found');
    }

    if (ride.driver_id.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    // Optional: Cancel associated bookings instead of just leaving them
    // For now, let's just delete the ride. Mongoose will leave orphan bookings 
    // unless we handle them. Better to mark bookings as cancelled.
    const Booking = require('../models/Booking'); // Require here to avoid circular dep if any
    await Booking.updateMany({ ride_id: ride._id }, { status: 'cancelled' });

    await ride.deleteOne();

    res.status(200).json({ id: req.params.id });
});

// @desc    Complete a ride (Driver)
// @route   PUT /api/rides/:id/complete
// @access  Private
const completeRide = asyncHandler(async (req, res) => {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
        res.status(404);
        throw new Error('Ride not found');
    }

    if (ride.driver_id.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    ride.status = 'completed';
    await ride.save();

    // Mark confirmed bookings as completed
    const Booking = require('../models/Booking');
    await Booking.updateMany(
        { ride_id: ride._id, status: 'confirmed' },
        { status: 'completed' }
    );

    res.status(200).json(ride);
});

module.exports = {
    offerRide,
    getRides,
    getRideById,
    getMyRides,
    deleteRide,
    completeRide
};
