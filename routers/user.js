const express = require('express');
const { usersWallet, userWallet, allUsers, getUser, fetchUserByMobileNo } = require('../controllers/user');

const router = express.Router();

router.get('/wallets', usersWallet);
router.get('/wallet/:user_id', userWallet);
router.get('/allUsers', allUsers);
router.get('/getUser/:user_id', getUser);
router.get('/fetUserByMobile', fetchUserByMobileNo);

module.exports = router;