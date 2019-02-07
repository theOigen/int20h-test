const express = require('express');
const api = require("../Api/Api");
const router = express.Router();

// middleware that is specific to this router
// define the home page route
router.get('/photos', async (req, res) => {
    const page = req.query.page > 0 ? req.query.page : 1;
    const per_page = req.query.per_page > 0 ? req.query.per_page : 5;
    const is_raw = req.query.raw === "true";

    const response = !is_raw ?
        await api.getAnalyzedPhotos(page, per_page) :
        await api.getPhotos(page, per_page);
    res.json(response);
});

router.post('/detect', async (req, res) => {
    const url = req.body.photo_url;
    console.log(req.body);
    let response = null;
    try {
        response = await api.analyzePhoto(url);
        if (response.error)
            throw response.error;
    } catch (error) {
        console.log(error);
        response = {
            error: error.message
        };
    }
    res.json(response);
});

router.get('/filtre', async (req, res) => {
    const filtres = req.query.filtres.split(" ");
    const page = req.query.page > 0 ? req.query.page : 1;
    const origin_page = req.query.origin_page > 0 ? req.query.origin_page : 1;
    const per_page = req.query.per_page > 0 ? req.query.per_page : 5;
    const pointer_position = req.query.pointer_position > 0 ? req.query.pointer_position : 0;
    const response = await api.getPhotoesByFiltres(filtres, page, origin_page, per_page, pointer_position);
    res.json(response);
});


// define the about route
// router.get('/about', function(req, res) {
//   res.send('About birds');
// });

module.exports = router;

