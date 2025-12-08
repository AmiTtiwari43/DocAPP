const express = require('express');
const { addReview, getReviewsByDoctor, getReviewsByPatient, deleteReview, getTopRatedDoctors, addDoctorReply, addUserReply, getRatingDistribution, likeReview, unlikeReview } = require('../controllers/reviewController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Specific routes first (before parameterized routes)
router.post('/', authMiddleware, addReview);
router.get('/', authMiddleware, getReviewsByPatient);
router.get('/top-doctors', getTopRatedDoctors);
router.get('/rating-distribution/:doctorId', getRatingDistribution);

// Review-specific actions (post operations)
router.post('/:reviewId/doctor-reply', authMiddleware, addDoctorReply);
router.post('/:reviewId/user-reply', authMiddleware, addUserReply);
router.post('/:reviewId/like', authMiddleware, likeReview);
router.post('/:reviewId/unlike', authMiddleware, unlikeReview);

// Generic routes (most specific parameterized routes last)
router.get('/:doctorId', getReviewsByDoctor);
router.delete('/:id', authMiddleware, deleteReview);

module.exports = router;
