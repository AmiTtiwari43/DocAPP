const express = require('express');
const { addReview, getReviewsByDoctor, deleteReview, getTopRatedDoctors } = require('../controllers/reviewController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, addReview);
router.get('/top-doctors', getTopRatedDoctors);
router.get('/:doctorId', getReviewsByDoctor);
router.delete('/:id', authMiddleware, deleteReview);

module.exports = router;
