const express = require('express');
const router = express.Router();
const {createReward,getUserRewards,scratchReward,applyRewardPoints,getRewards,getRewardPoints} = require('../controller/reward');

router.post('/create-reward', createReward);

router.get('/user-rewards', getUserRewards);

router.post('/scratch-reward',scratchReward);

router.post('/apply-reward-points',applyRewardPoints);

router.get('/rewards',getRewards);

router.get('/rewardPoints', getRewardPoints);

module.exports = router;
