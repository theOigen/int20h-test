const Flickr = require("flickr-sdk");
const axios = require("axios");
const promisify = require('util').promisify;
const config = require("../config");
flickr = new Flickr(config.flickr_api_key);
// const analyze = promisify(facepp.post);

class Api {

  static analyzeEmotion(emotion){
    let max_emotion_id = "neutral";
    for(const id in emotion){
      if(emotion[id] > emotion[max_emotion_id])
        max_emotion_id = id;
    }
    return max_emotion_id;

  }
  static async analyzePhoto(photo_url) {
    let result = {
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
      for(let face of result.info.faces){
        if(face.attributes){
           const max_emotion = this.analyzeEmotion(face.attributes.emotion);
          face.emotion = max_emotion;
        }else face.emotion = "none";
        face.attributes = face.face_token = undefined; // delete unused fields
      }
     // console.log(response.data);
    } catch (error) {
      //console.error(error);
      result.error = error;
    }
    return result;
  }

  static async analyzePhotoSetAndModify(photos){
    for (const photo of photos) {
      const analyzed_info = await this.analyzePhoto(this.mapPhotoToURL(photo, "c"));
      if(analyzed_info.error) 
        throw new Error(analyzed_info.error.message);
      else photo.faces_info = analyzed_info.info.faces;
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
      const raw_response = await flickr.photos.search({ text: 'int20h', page, per_page, extras: "original_format" });
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