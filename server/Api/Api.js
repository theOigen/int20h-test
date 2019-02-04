const Flickr = require("flickr-sdk");
const axios = require("axios");
const promisify = require('util').promisify;
const options = {
  flickr_api_key: "653588b4a53594b839e5af497dea2f3d",
  flickr_secret: "cd3fc9a52873b6bd",
  user_id: "144522605@N06",
  album_id: "72157674388093532",
  fpp_api_key: "6cbxOJD1SNpMurRFJ0W9IOBYJAd76THI",
  fpp_secret: "Am99rkBpVebGCnYg33DDgTveyyRW0kec"
};
flickr = new Flickr(options.flickr_api_key);
// const analyze = promisify(facepp.post);

class Api {
  static async analyzePhoto(photo_url) {
    let result = {
      info: {},
      error: null
    };

    try {
      let response = await axios.post('https://api-us.faceplusplus.com/facepp/v3/detect', null, {
        params: {
          api_key: options.fpp_api_key,
          api_secret: options.fpp_secret,
          image_url: photo_url,
          return_attributes: "emotion"
        }
      });
      result.info = response.data;
     // console.log(response.data);
    } catch (error) {
      //console.error(error);
      result.error = error;
    }
    return result;
  }

  static async analyzePhotoSetAndModify(photos){
    for (let photo of photos) {
      let analyzed_info = await this.analyzePhoto(this.mapPhotoToURL(photo, "c"));
      if(analyzed_info.error) 
        throw new Error(analyzed_info.error.message);
      photo.faces_info = analyzed_info;
    }
  }


  static mapPhotoToURL(photo, size_suffix = "o") {
    const { farm, server, id, secret, originalsecret, originalformat } = photo;
    const photo_secret = size_suffix === "o" ? originalsecret : secret;
    return `https://farm${farm}.staticflickr.com/${server}/${id}_${photo_secret}_${size_suffix}.${originalformat}`;
  }
  static async getPhotos(page = 1, per_page=5) {
    let result = {
      photos: null,
      error: null
    }
    try {

      let raw_response = await flickr.photos.search({ text: 'int20h', page, per_page, extras: "original_format" });
      let response = raw_response.body.photos;
      response.photo = response.photo.map(photo => {
        photo.url = this.mapPhotoToURL(photo);
        return photo;
      });
      result.photos = response;
      await this.analyzePhotoSetAndModify(result.photos.photo);

    } catch (error) {
      console.error(error);
      result.error = error;
    }
    return result;
  }
}



module.exports = Api;