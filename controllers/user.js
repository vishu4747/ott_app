const fetchDataFromCollection = require("../config/mongoConfig");
const { executeQuery, getUserByMobile } = require("../config/mysqlConfig");
const { asyncError } = require("../middleware/errorMiddleware");
const ErrorHandler = require("../utils/ErrorHandler");

const usersWallet = asyncError(async(req, res, next) => {
        const page = parseInt(req.query.page_no) || 1; //pagination
        const {data, total_count, next_page} = await fetchDataFromCollection('wallets',{}, page);
        const result = {
            total_count: total_count,
            data: data,
            next_page: next_page
        }
        return res.status(200).json({
            success: true,
            message: result
        })

});

const userWallet = asyncError(async(req, res, next) => {
    const user_id = req.params.user_id;
    const {data} = await fetchDataFromCollection('wallets',{ user_id });
    if(data.length <= 0) next(new ErrorHandler("Didn't find user with user_id ", 400));
    return res.status(200).json({
        success: true,
        message: data
    })

});

const allUsers = asyncError(async(req, res, next) => {
    // Usage example
    const page = parseInt(req.query.page_no) || 1; //pagination
    const query = `SELECT * FROM ch_users`;
    const {data, total_count, next_page} = await executeQuery(query,page,10);
    const result = {
        total_count,
        data,
        next_page
    }
    return res.status(200).json({
        success: true,
        message: result
    });
})

const getUser = asyncError(async(req, res, next) => {
    // Usage example
    const user_id = req.params.user_id;
    const query = `SELECT * FROM ch_users WHERE ID = '${user_id}'`;
    const {data, total_count, next_page} = await executeQuery(query);
    const result = {
        data
    }
    return res.status(200).json({
        success: true,
        message: result
    });
})

const fetchUserByMobileNo = asyncError(async(req, res, next) => {
    // Usage example
    const mobile_no = parseInt(req.query.mobile_no) ?? '';
    const user = await getUserByMobile(mobile_no)
    return res.status(200).json({
        success: true,
        message: user
    });
})

module.exports = { usersWallet, userWallet, allUsers, getUser, fetchUserByMobileNo};
 