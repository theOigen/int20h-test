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
                face.attributes = undefined; // delete unused fields
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
        const { farm, server, id, secret, originalsecret, originalformat } = photo;
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
                    text: '#int20h',
                    privacy_filter: 1, page, per_page,
                    extras: "original_format"
                }),
                flickr.photosets.getPhotos({
                    photoset_id: config.album_id,
                    user_id: config.user_id, page, per_page,
                    privacy_filter: 1, media: 'photos',
                    extras: "original_format"
                })
            ]);
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
    


    static async getPhotoesByFiltres(filtres, page = 1, origin_page = 1, per_page = 5, pointer_position = 0) {
        /*
         * page - page of list with filtres
         * origin_page - page of origin list without filtres that contains last photo of last set
         * pointer_position - position of first available photo
         */
        console.log(`per_page + 1 = ${Number(per_page) + 1}`)
        console.log(`params:\nfiltres = ${filtres}\npage = ${page}\norigin_page = ${origin_page}\nper_page = ${per_page}\npointer_position = ${pointer_position}`);
        pointer_position = pointer_position % per_page;
        let number_of_selected_photos = 0;
        const photos = [];
        let photoset; // will contain the resulting info about pages
        while (number_of_selected_photos != Number(per_page) + 1 && !(photoset && photoset.error && photoset.photos.photo.length == 0)) {
            photoset = await this.getPhotos(origin_page, per_page);
            console.log('photoset.photos.photo.length = ' + photoset.photos.photo.length);
            if (photoset.error || photoset.photos.photo.length == 0)
                break;
            photoset.photos.photo = photoset.photos.photo.slice(pointer_position);
            pointer_position = 0; // for first round of cycle
            console.log(`Begining of analyzing on origin page ${origin_page}`)
            await this.analyzePhotoSetAndModify(photoset.photos.photo);
            for (let photo of photoset.photos.photo) {
                let filtres_copy = filtres.slice();
                for (let face of photo.faces_info) {
                    console.log('face ' + face);
                    const index = filtres_copy.indexOf(face.emotion);
                    if (index != -1) {
                        filtres_copy.splice(index, 1);
                    }
                    if (filtres_copy.length == 0)
                        break;
                }
                //if all amotion in filtres there are in the photo               
                if (filtres_copy.length == 0) {
                    console.log("PHOTO WAS FOUNDED")
                    // if we dont search photo to next set
                    if (number_of_selected_photos != per_page)
                        photos.push(photo);
                    number_of_selected_photos++;
                    console.log(`number_of_selected_photos = ${number_of_selected_photos}`)
                }
                if (number_of_selected_photos == Number(per_page) + 1)
                    break;
                pointer_position++; // position in page of not analyzed photo
            }
            //bad code
            if (number_of_selected_photos == Number(per_page) + 1)
                break;
            origin_page++; 
            pointer_position = 0;
        }
        //registration of result
        if (!photoset) {
            //in that case: per_page=0
            photoset = {
                error: "400 Bad request",
            }
        }
        if (photoset.error) {
            photoset.photos = undefined;
            return photoset;
        }
        const result = {
            photos: {
                page: Number(page),
                nextPhotoIsExist: number_of_selected_photos === Number(per_page) + 1,
                pageOfNextPhoto: origin_page,
                pointerOfNextPhotoOnPage: pointer_position,
                photo: photos
            }
        }
        return result;
    }
}




module.exports = Api;
