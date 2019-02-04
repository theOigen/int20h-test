const Api = require("./Api.js");


async function testGet() {

    let data = await Api.getPhotos();
    console.log(data);
    for(let photo of data.photos.photo){
        console.log(photo.faces_info.info.faces);
    }
}

testGet();