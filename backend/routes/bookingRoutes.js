const express = require('express');
const router = express.Router();
const { bookRide, getUserBookings, cancelBooking, updateBookingStatus, getDriverRequests, completeBooking } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, bookRide);
router.get('/driver/requests', protect, getDriverRequests); // Specific route first
router.put('/:id/status', protect, updateBookingStatus);
router.put('/:id/complete', protect, completeBooking);
router.get('/:userId', protect, getUserBookings);
router.put('/:id', protect, cancelBooking);

module.exports = router;
