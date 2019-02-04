require('dotenv').config();

const config = {
    PORT: process.env["PORT"] || 3000,
    flickr_key : "653588b4a53594b839e5af497dea2f3d",
    flickr_secret: "cd3fc9a52873b6bd", 
};

module.exports = config;