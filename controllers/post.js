const { asyncError } = require("../middleware/errorMiddleware");
const { fetchPostData, executeQueryForDataForData } = require("../config/mysqlConfig");

const getPostData = asyncError(async (req, res, next) => {
    const post_id = req.params.post_id;
    const postData = await fetchPostData(post_id);
    return res.status(200).json({
        success: true,
        message: postData
    })
});

const settings = asyncError(async (req, res, next) => {

    // Query to retrieve the latest published event post ID
    const latestEventPostQuery = `
      SELECT ID
      FROM ch_posts
      WHERE post_type = 'events'
        AND post_status = 'publish'
      ORDER BY ID DESC
      LIMIT 1;
    `;
    const latestEventPostResults = await executeQueryForData(latestEventPostQuery);
    const latestEventPostId = latestEventPostResults[0].ID;

    // Query to retrieve redeem_cash and rate_of_coins for the latest event post
    const customFieldsQuery = `
      SELECT
        IFNULL(meta_value, 0) AS redeem_cash,
        IFNULL((SELECT meta_value FROM wp_postmeta WHERE post_id = ? AND meta_key = 'rate_of_coins'), 0) AS rate_of_coins
      FROM ch_postmeta
      WHERE post_id = ?
        AND meta_key = 'redeem_cash';
    `;
    const customFieldsResults = await executeQueryForData(customFieldsQuery, [latestEventPostId, latestEventPostId]);
    const redeemCash = customFieldsResults[0].redeem_cash;
    const rateOfCoins = customFieldsResults[0].rate_of_coins || 0;

    // Query to retrieve coins_rules posts with specific meta query conditions
    const coinsRulesQuery = `
      SELECT ID, meta_value AS coin_value, meta_key AS entity_type
      FROM ch_posts
      INNER JOIN ch_postmeta ON ch_posts.ID = ch_postmeta.post_id
      WHERE post_type = 'coins_rules'
        AND post_status = 'publish'
        AND ch_postmeta.meta_key IN ('entity_type', 'coin_value', 'status')
        AND ch_postmeta.meta_value IN ('refer', 'REFERRER_COINS', 'register')
        AND EXISTS (
          SELECT 1 FROM ch_postmeta
          WHERE post_id = ch_posts.ID
            AND meta_key = 'status'
            AND meta_value = 'Enabled'
        );
    `;
    const coinsRulesResults = await executeQueryForData(coinsRulesQuery);

    let registerCoins = 0;
    let referrerCoins = 0;
    let refereeCoins = 0;
    for (const post of coinsRulesResults) {
      if (post.entity_type === 'register') {
        registerCoins = post.coin_value;
      } else if (post.entity_type === 'REFERRER_COINS') {
        referrerCoins = post.coin_value;
      } else if (post.entity_type === 'refer') {
        refereeCoins = post.coin_value;
      }
    }

    // Query to retrieve public settings
    const publicSettingsQuery = `
      SELECT *
      FROM ch_options
      WHERE option_name = 'public_settings';
    `;
    const publicSettingsResult = await executeQueryForData(publicSettingsQuery);
    const publicSettings = JSON.parse(publicSettingsResult[0].option_value);

    // Query to retrieve app data
    const appDataQuery = `
      SELECT *
      FROM ch_options
      WHERE option_name IN ('version', 'app_maintenance', 'min_subscription_amount', 'subscription_learn_more', 'general_learn_more', 'subscription_offer_image', 'win_cash_learn_more', 'app_version', 'live_servey_id', 'admobs_video_hash', 'admobs_image_hash', 'avatar_script', 'campaign_id', 'campaign_param_1', 'campaign_param_2', 'avatar_loader', 'model_viewer_and_face_script', 'avatar_share_text', 'privacy_policy', 'diamonds_settings', 'otp_resend_seconds', 'series_tag_title', 'series_tag_duration', 'season_tag_title', 'season_tag_duration', 'episode_tag_title', 'episode_tag_duration', 'movie_tag_title', 'movie_tag_duration', 'minimum_duration_for_recent_tag')
    `;
    const appDataResult = await executeQueryForData(appDataQuery);
    const appData = {};
    for (const row of appDataResult) {
      appData[row.option_name] = row.option_value;
    }

    // Query to retrieve private settings
    const privateSettingsQuery = `
      SELECT *
      FROM ch_options
      WHERE option_name = 'private_settings';
    `;
    const privateSettingsResult = await executeQueryForData(privateSettingsQuery);
    const privateSettings = JSON.parse(privateSettingsResult[0].option_value);

    // Query to retrieve countries
    const countriesQuery = `
      SELECT *
      FROM wp_countries;
    `;
    const countriesResult = await executeQueryForData(countriesQuery);
    const countries = countriesResult.map(country => country.country_name);

    // Query to retrieve languages
    const languagesQuery = `
      SELECT *
      FROM wp_languages;
    `;
    const languagesResult = await executeQueryForData(languagesQuery);
    const languages = languagesResult.map(language => language.language_name);
    const countriesData = await countriesData();
    const languagesData = await languagesData();

    // Merge all options and additional data
    const options = {
      ...publicSettings,
      ...privateSettings,
      ...appData,
      countries: countriesData,
      languages: languagesData,
      register_bonus: registerCoins,
      referrer_points: referrerCoins,
      referee_points: refereeCoins,
      redeem_cash: redeemCash,
      rate_of_coins: rateOfCoins
    };

    console.log('Options:', options);
});

const countriesData = asyncError(async(allCountries = false) => {
    // Constructing the SQL query
    let sql = `
      SELECT
        p.ID,
        p.post_title AS country_name,
        pm.meta_value AS country_image_url,
        pm1.meta_value AS calling_code,
        pm2.meta_value AS number_limit,
        pm3.meta_value AS max_diamonds_per_user,
        pm4.meta_value AS min_diamonds_buy_limit,
        pm5.meta_value AS max_diamonds_buy_limit,
        pm6.meta_value AS cash_event,
        pm7.meta_value AS spin_the_wheel,
        pm8.meta_value AS spin_the_wheel_auto_popup,
        pm9.meta_value AS auto_popup_interval,
        pm10.meta_value AS spin_the_wheel_interval
      FROM ch_posts AS p
      LEFT JOIN ch_postmeta AS pm ON p.ID = pm.post_id AND pm.meta_key = 'country_image'
      LEFT JOIN ch_postmeta AS pm1 ON p.ID = pm1.post_id AND pm1.meta_key = 'calling_code'
      LEFT JOIN ch_postmeta AS pm2 ON p.ID = pm2.post_id AND pm2.meta_key = 'number_limit'
      LEFT JOIN ch_postmeta AS pm3 ON p.ID = pm3.post_id AND pm3.meta_key = 'total_diamonds_per_users'
      LEFT JOIN ch_postmeta AS pm4 ON p.ID = pm4.post_id AND pm4.meta_key = 'diamond_minimum_limit'
      LEFT JOIN ch_postmeta AS pm5 ON p.ID = pm5.post_id AND pm5.meta_key = 'diamond_maximum_limit'
      LEFT JOIN ch_postmeta AS pm6 ON p.ID = pm6.post_id AND pm6.meta_key = 'cash_event'
      LEFT JOIN ch_postmeta AS pm7 ON p.ID = pm7.post_id AND pm7.meta_key = 'spin_the_wheel'
      LEFT JOIN ch_postmeta AS pm8 ON p.ID = pm8.post_id AND pm8.meta_key = 'spin_the_wheel_auto_popup'
      LEFT JOIN ch_postmeta AS pm9 ON p.ID = pm9.post_id AND pm9.meta_key = 'auto_popup_interval'
      LEFT JOIN ch_postmeta AS pm10 ON p.ID = pm10.post_id AND pm10.meta_key = 'spin_the_wheel_interval'
      WHERE p.post_type = 'country'
        AND p.post_status = 'publish'
        AND pm_status.meta_key = 'status'
        AND pm_status.meta_value = 1
    `;

    if (allCountries) {
      const excludedCountryId = EXCLUDECOUNTRY; // Assuming EXCLUDECOUNTRY is defined elsewhere
      sql += ` AND p.ID NOT IN (${excludedCountryId})`;
    }

    // Execute the SQL query
    const countries = await executeQuery(sql);

    // Processing the results
    const formattedCountries = countries.map(country => ({
      ID: country.ID,
      country_name: country.country_name,
      country_image_url: country.country_image_url,
      calling_code: country.calling_code,
      number_limit: country.number_limit,
      max_diamonds_per_user: country.max_diamonds_per_user,
      min_diamonds_buy_limit: country.min_diamonds_buy_limit,
      max_diamonds_buy_limit: country.max_diamonds_buy_limit,
      cash_event: country.cash_event || false,
      spin_the_wheel: country.spin_the_wheel || false,
      spin_the_wheel_auto_popup: country.spin_the_wheel_auto_popup || false,
      auto_popup_interval: country.auto_popup_interval || "0",
      spin_the_wheel_interval: country.spin_the_wheel_interval || "0"
    }));

    return formattedCountries;
})

const languagesData = asyncError(async () => {
    // Constructing the SQL query
    let sql = `
      SELECT
        p.ID,
        p.post_title AS language,
        pm.meta_value AS short_code
      FROM ch_posts AS p
      LEFT JOIN ch_postmeta AS pm ON p.ID = pm.post_id AND pm.meta_key = 'short_code'
      WHERE p.post_type = 'language'
        AND p.post_status = 'publish'
    `;

    // Execute the SQL query
    const languages = await executeQuery(sql);

    // Processing the results
    const formattedLanguages = languages.map(language => ({
      ID: language.ID,
      language: language.language,
      short_code: language.short_code
    }));

    return formattedLanguages;
});


module.exports = { getPostData };