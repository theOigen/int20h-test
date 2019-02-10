const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const config = require("./config");
const path = require("path");

const app = express();
app.use(morgan('dev'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect(config.database_url, { useNewUrlParser: true })
    .then(() => console.log(`Database connected: ${config.database_url}`))
    .then(() => {
        app.listen(config.PORT, () => console.log(`Server is running on port ${config.PORT}`));
    })
    .catch(err => console.log(`Status error: ${err}`));

const api_v1 = require('./routes/api');

app.use('/api/v1', api_v1);

/*
// will open dist/ directory files for http requests
app.use(express.static(path.join(__dirname, 'dist')));
app.use('*', (req, res) => {
    res.sendFile(process.cwd() + '/dist/index.html');
})
*/