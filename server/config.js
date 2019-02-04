require('dotenv').config();

const config = {
    PORT: process.env["PORT"] || 3000,
    flickr_api_key: "653588b4a53594b839e5af497dea2f3d",
    flickr_secret: "cd3fc9a52873b6bd",
    user_id: "144522605@N06",
    album_id: "72157674388093532",
    fpp_api_key: "6cbxOJD1SNpMurRFJ0W9IOBYJAd76THI",
    fpp_secret: "Am99rkBpVebGCnYg33DDgTveyyRW0kec"
};

module.exports = config;