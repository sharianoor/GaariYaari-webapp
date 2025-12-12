const express = require('express');
const router = express.Router();
const { offerRide, getRides, getRideById, getMyRides, deleteRide, completeRide } = require('../controllers/rideController');
const { protect } = require('../middleware/authMiddleware');

router.get('/my-rides', protect, getMyRides);

router.route('/')
    .post(protect, offerRide)
    .get(getRides);

router.route('/:id')
    .get(getRideById)
    .delete(protect, deleteRide);

router.put('/:id/complete', protect, completeRide);

module.exports = router;
