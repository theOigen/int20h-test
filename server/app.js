const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const PORT = require('./config').PORT;
var bodyParser = require('body-parser');

const app = express();
app.use(morgan('dev'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))


app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

app.get('/', (req, res) => {
    res.json('Welcome!!!');
});

var api_v1 = require('./routes/api');

app.use('/api/v1', api_v1);

/*
    // will open dist/ directory files for http requests
    app.use(express.static(path.join(__dirname, 'dist')))
    app.use('*', (req, res) => {
        res.sendFile(process.cwd() + '/dist/index.html')
    })
*/