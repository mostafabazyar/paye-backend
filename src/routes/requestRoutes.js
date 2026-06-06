const express = require('express');
const {
  sendRequest,
  getProfileRequests,
  updateRequestStatus,
  getUserReceivedRequests
} = require('../controllers/requestController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', sendRequest);
router.get('/received', getUserReceivedRequests);
router.get('/profile/:profileId', getProfileRequests);
router.put('/:id', updateRequestStatus);

module.exports = router;