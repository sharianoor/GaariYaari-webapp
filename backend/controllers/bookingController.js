const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Ride = require('../models/Ride');

// @desc    Book a ride
// @route   POST /api/bookings
// @access  Private
const bookRide = asyncHandler(async (req, res) => {
    const { ride_id, seats_booked } = req.body;

    if (!ride_id || !seats_booked) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    // Find ride
    const ride = await Ride.findById(ride_id);

    if (!ride) {
        res.status(404);
        throw new Error('Ride not found');
    }

    // Check seat availability
    if (ride.seats_available < seats_booked) {
        res.status(400);
        throw new Error('Not enough seats available');
    }

    // Create booking
    const booking = await Booking.create({
        ride_id,
        passenger_id: req.user.id,
        seats_booked
    });

    // Update ride seats
    if (booking) {
        ride.seats_available -= seats_booked;
        await ride.save();

        res.status(201).json(booking);
    } else {
        res.status(400);
        throw new Error('Invalid booking data');
    }
});

// @desc    Get user bookings
// @route   GET /api/bookings/:userId
// @access  Private
const getUserBookings = asyncHandler(async (req, res) => {
    // Ensure user matches or is admin (logic simplified to match ID)
    if (req.params.userId !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const bookings = await Booking.find({ passenger_id: req.params.userId })
        .populate({
            path: 'ride_id',
            populate: {
                path: 'driver_id',
                select: 'full_name phone email'
            }
        });

    res.status(200).json(bookings);
});

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id
// @access  Private
const cancelBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    // Ensure user is the passenger
    if (booking.passenger_id.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    // Find the associated ride to restore seats
    const ride = await Ride.findById(booking.ride_id);

    if (booking.status !== 'cancelled') {
        booking.status = 'cancelled';
        await booking.save();

        // Restore seats
        if (ride) {
            ride.seats_available += booking.seats_booked;
            await ride.save();
        }
    }

    res.status(200).json(booking);
});

// @desc    Update booking status (Accept/Decline)
// @route   PUT /api/bookings/:id/status
// @access  Private
const updateBookingStatus = asyncHandler(async (req, res) => {
    const { status } = req.body; // 'confirmed' or 'declined'
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    // Find ride to verify owner (driver)
    const ride = await Ride.findById(booking.ride_id);

    if (ride.driver_id.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized. Only driver can response to bookings.');
    }

    if (status === 'declined' && booking.status !== 'declined') {
        // If declining, restore seats (assuming we deducted them at creation)
        ride.seats_available += booking.seats_booked;
        await ride.save();
    }
    // If accepting, seats are already deducted, so just update status

    booking.status = status;
    const updatedBooking = await booking.save();

    res.json(updatedBooking);
});

// @desc    Get bookings for rides offered by current user (driver)
// @route   GET /api/bookings/driver/requests
// @access  Private
const getDriverRequests = asyncHandler(async (req, res) => {
    // 1. Find all rides by this driver
    const rides = await Ride.find({ driver_id: req.user.id });
    const rideIds = rides.map(r => r._id);

    // 2. Find bookings for these rides
    const requests = await Booking.find({ ride_id: { $in: rideIds } })
        .populate('passenger_id', 'full_name phone email')
        .populate('ride_id', 'pickup destination datetime');

    res.json(requests);
});

// @desc    Complete a booking (Passenger)
// @route   PUT /api/bookings/:id/complete
// @access  Private
const completeBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    if (booking.passenger_id.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    if (booking.status === 'confirmed') {
        booking.status = 'completed';
        await booking.save();
    } else {
        res.status(400);
        throw new Error('Booking must be confirmed to complete');
    }

    res.status(200).json(booking);
});

module.exports = {
    bookRide,
    getUserBookings,
    cancelBooking,
    updateBookingStatus,
    getDriverRequests,
    completeBooking
};
