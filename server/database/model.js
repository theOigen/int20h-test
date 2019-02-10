const schema = require("./schema");
const mongoose = require('mongoose');
const AnalyzedPhotoModel = mongoose.model('AnalyzedPhoto', schema.AnalyzedPhotoSchema);

module.exports = {
    getAll: function () {
        return AnalyzedPhotoModel.find();
    },
    getByUrl(url) {
        return AnalyzedPhotoModel.findOne({ url: url });
    },
    insert: function (AnalyzedPhoto) {
        const mod = new AnalyzedPhotoModel(AnalyzedPhoto);
        return mod.save();
    },
    delete: function (id) {
        return AnalyzedPhotoModel.deleteOne({ id: id });
    }
};
