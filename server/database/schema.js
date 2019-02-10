const mongoose = require('mongoose');

const AnalyzedPhotoSchema = new mongoose.Schema({
    id: { type: String, require: true },
    owner: { type: String, require: true },
    secret: { type: String, require: true },
    server: { type: String, require: true },
    title: { type: String, require: true },
    originalsecret: { type: String, require: true },
    originalformat: { type: String, require: true },
    url: { type: String, require: true },
    farm: { type: Number, default: 0 },
    ispublic: { type: Number, default: 0 },
    isfriend: { type: Number, default: 0 },
    isfamily: { type: Number, default: 0 },
    addingDate: { type: Date, default: Date.now },
    faces_info: [{
        face_token: { type: String, require: true },
        emotion: { type: String, require: true },
        face_rectangle: [{
            width: { type: Number, default: 0 },
            top: { type: Number, default: 0 },
            left: { type: Number, default: 0 },
            height: { type: Number, default: 0 },
        }]
    }]
});

module.exports = {
    AnalyzedPhotoSchema: AnalyzedPhotoSchema
};
