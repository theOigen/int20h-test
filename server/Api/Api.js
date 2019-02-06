const Flickr = require("flickr-sdk");
const axios = require("axios");
const config = require("../config");
const _ = require("underscore");
const flickr = new Flickr(config.flickr_api_key);
const API_RATE_LIMIT = 3; // 3 async request is working fine

class Api {
    static analyzeEmotion(emotion) {
        let max_emotion_id = "neutral";
        for (const id in emotion) {
            if (emotion[id] > emotion[max_emotion_id])
                max_emotion_id = id;
        }
        return max_emotion_id;
    }
    static async analyzePhoto(photo_url) {
        const result = {
            info: {},
            error: null
        };
        try {
            const response = await axios.post('https://api-us.faceplusplus.com/facepp/v3/detect', null, {
                params: {
                    api_key: config.fpp_api_key,
                    api_secret: config.fpp_secret,
                    image_url: photo_url,
                    return_attributes: "emotion"
                }
            });
            result.info = response.data;
            for (const face of result.info.faces) {
                if (face.attributes) {
                    const max_emotion = this.analyzeEmotion(face.attributes.emotion);
                    face.emotion = max_emotion;
                } else face.emotion = "none";
                face.attributes = face.face_token = undefined; // delete unused fields
            }
            //console.log(response.data);
        } catch (error) {
            console.error(error.response.data);
            result.error = new Error(error.response.data.error_message);
        }
        return result;
    }

    static async analyzePhotoSetAndModify(photos) {
        let infoArr = [];
        for (let i = 0; i < photos.length; i += API_RATE_LIMIT) {
            const analyzeProms = [];
            for (let rate_counter = 0; rate_counter < API_RATE_LIMIT
                && i + rate_counter < photos.length; rate_counter++)
                analyzeProms.push(this.analyzePhoto(this.mapPhotoToURL(photos[i + rate_counter], "c")));
            const partInfoArr = await Promise.all(analyzeProms);
            infoArr = infoArr.concat(partInfoArr);
        }
        for (const index in infoArr) {
            if (infoArr[index].error) {
                throw new Error(infoArr[index].error.message);
            } else {
                photos[index].faces_info = infoArr[index].info.faces;
            }
        }
    }


    static mapPhotoToURL(photo, size_suffix = "b") {  // 1024 on large side by default, for the original image use 'o'
        const { farm, server, id, secret, originalsecret, originalformat = "jpg" } = photo;
        const photo_secret = size_suffix === "o" ? originalsecret : secret;
        return `https://farm${farm}.staticflickr.com/${server}/${id}_${photo_secret}_${size_suffix}.${originalformat}`;
    }
    static async getAnalyzedPhotos(page = 1, per_page = 5) {
        let result = {
            photos: null,
            error: null
        };
        try {
            result = await this.getPhotos(page, per_page);
            await this.analyzePhotoSetAndModify(result.photos.photo);
        } catch (error) {
            console.error(error);
            result.error = error.message;
        }
        return result;
    }
    static async getPhotos(page = 1, per_page = 5) {
        const result = {
            photos: null,
            error: null
        };
        try {

            const [raw_response, raw_response_from_album] = await Promise.all([
                flickr.photos.search({
                    text: 'int20h',
                    privacy_filter: 1, page, per_page,
                    extras: "original_format"
                }),
                flickr.photosets.getPhotos({
                    photoset_id: config.album_id,
                    user_id: config.user_id, page, per_page,
                    privacy_filter: 1, media: 'photos'
                })
            ]);
            // console.log(raw_response_from_album);
            const response = raw_response.body.photos;
            const response_2 = raw_response_from_album.body.photoset;
            response.photo = response.photo.map(photo => {
                photo.url = this.mapPhotoToURL(photo);
                return photo;
            });
            response_2.photo = response_2.photo.map(photo => {
                photo.url = this.mapPhotoToURL(photo);
                return photo;
            });

            const mergedList = _.map(response.photo, (item) => {
                return _.extend(item, _.findWhere(response_2.photo, { id: item.id }));
            });

            result.photos = response;
            result.photos.photo = mergedList;
        } catch (error) {
            console.error(error);
            result.error = error;
        }
        return result;
    }
}

module.exports = Api;
