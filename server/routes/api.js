const express = require('express');
const api = require("../Api/Api");
const router = express.Router();

// middleware that is specific to this router
// define the home page route
router.get('/photos', async (req, res) => {
    let page = req.query.page > 0 ? req.query.page : 1;
    let per_page = req.query.per_page > 0 ? req.query.per_page : 5;
    
    let response = await api.getPhotos(page, per_page);
    res.json(response);
});
// define the about route
// router.get('/about', function(req, res) {
//   res.send('About birds');
// });

module.exports = router;

