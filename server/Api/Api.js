const Flickr = require("flickr-sdk");
const axios = require("axios");
const config = require("../config");
const _ = require("underscore");
const DB_analyzedPhotos = require('../database/model');

const flickr = new Flickr(config.flickr_api_key);
const API_RATE_LIMIT = 3; // 3 async request is working fine

function pagination(array, page, per_page) {
    page = Number(page);
    per_page = Number(per_page);
    const delta = array.length % per_page === 0 ? 0 : 1;
    const maxPage = parseInt(array.length / per_page) + delta;
    if (page > maxPage) page = maxPage;
    let bound = page * per_page;
    if (bound > array.length) bound = array.length;
    return {
        resultOfPagination: array.slice(per_page * (page - 1), bound),
        page: page,
        maxPage: maxPage
    };
}
function PhotoCompare(a, b) {
    if (a.addingDate > b.addingDate) {
        return 1;
    } else if (a.addingDate < b.addingDate) {
        return -1;
    } else return 0;
}

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
        const analyzedPhoto = await DB_analyzedPhotos.getByUrl(photo_url);
        if (analyzedPhoto) {
            result.info.faces = analyzedPhoto.faces_info;
        }
        else try {
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
                analyzeProms.push(this.analyzePhoto(this.mapPhotoToURL(photos[i + rate_counter], "b")));
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
        try {
            this.equalizeDbAndFlickr();
        }
        catch (error) {
            return { error: error };
        }
        let allPhotos = (await DB_analyzedPhotos.getAll()).sort(PhotoCompare);
        const total = allPhotos.length;
        allPhotos = pagination(allPhotos, page, per_page);
        return {
            "photos": {
                "page": allPhotos.page,
                "pages": allPhotos.maxPage,
                "perpage": per_page,
                "total": total,
                "photo": allPhotos.resultOfPagination
            }
        };
    }
    static async getPhotos(page = 1, per_page = 5) {
        const result = {
            photos: null,
            error: null
        };
        try {
            const [raw_response_by_tag, raw_response_by_album] = await Promise.all([
                flickr.photos.search({
                    tags: 'int20h',
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
            const response_by_tag = raw_response_by_tag.body.photos;
            const response_by_album = raw_response_by_album.body.photoset;
            const mergedList = _
                .map(response_by_tag.photo, (item) => {
                    return _.extend(item, _.findWhere(response_by_album.photo, { id: item.id }));
                })
                .map(photo => {
                    photo.url = this.mapPhotoToURL(photo);
                    return photo;
                });
            result.photos = response_by_tag;
            result.photos.photo = mergedList;
        } catch (error) {
            console.error(error);
            result.error = error;
        }
        return result;
    }

    static async getPhotosByFilters(filters, page = 1, per_page = 5) {
        try {
            this.equalizeDbAndFlickr();
        }
        catch (error) {
            return { error: error };
        }
        const allPhotos = (await DB_analyzedPhotos.getAll()).sort(PhotoCompare);
        let availablePhotos = [];
        for (const photo of allPhotos) {
            let filters_copy = filters.slice();
            for (const face of photo.faces_info) {
                const index = filters_copy.indexOf(face.emotion);
                if (index !== -1) {
                    // console.log('there is an emotion!');
                    // console.log(`before` + filters_copy);
                    filters_copy.splice(index, 1);
                    // console.log('after' + filters_copy);
                }
                if (filters_copy.length === 0) break;
            }
            //if all amotion in filters there are in the photo
            if (filters_copy.length === 0) {
                availablePhotos.push(photo);
            }
        }
        console.log(`All ${allPhotos.length}; detected ${availablePhotos.length}`);
        availablePhotos = pagination(availablePhotos, page, per_page);
        return {
            photos: {
                page: availablePhotos.page,
                nextPhotoIsExist: availablePhotos.maxPage !== availablePhotos.page,
                photo: availablePhotos.resultOfPagination
            }
        };
    }
    static async getAllPhotos() {
        const allPhotos = {
            "photos": [],
            "error": null
        };
        let photoset = null;
        let page = 1;
        while (!photoset || photoset.photos.photo.length !== 0) {
            photoset = await this.getPhotos(page, 500);
            if (photoset.error) {
                // console.log("Error detected in function getAllPhotos()");
                allPhotos.photos = null;
                allPhotos.error = photoset.error;
                return allPhotos;
            }
            allPhotos.photos = allPhotos.photos.concat(photoset.photos.photo);
            page++;
        }
        // console.log(`Found ${allPhotos.photos.length} photos`);
        return allPhotos;
    }
    static async equalizeDbAndFlickr() {
        const flickrPhotos = await this.getAllPhotos();
        if (flickrPhotos.error)
            throw new Error(flickrPhotos.error);
        const dbPhotos = await DB_analyzedPhotos.getAll();
        for (const photo of flickrPhotos.photos) {
            if (!dbPhotos.find(x => x.id === photo.id)) {
                photo.faces_info = (await this.analyzePhoto(photo.url)).info.faces;
                await DB_analyzedPhotos.insert(photo);
            }
        }
        for (const photo of dbPhotos) {
            if (!flickrPhotos.photos.find(x => x.id === photo.id)) {
                // console.log('Found removed from Flickr photo, but existing in the database');
                await DB_analyzedPhotos.delete(photo.id);
            }
        }
    }
}

module.exports = Api;
