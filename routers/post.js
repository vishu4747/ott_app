const express = require('express');
const { getPostData } = require('../controllers/post');


const router = express.Router();

router.get('/:post_id', getPostData);

module.exports = router;
