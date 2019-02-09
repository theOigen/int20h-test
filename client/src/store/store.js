import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';

Vue.use(Vuex);

const NUMBER_OF_PHOTOS_PER_PAGE = 2;

axios.defaults.baseURL = 'http://localhost:3000';

export const store = new Vuex.Store({
    state: {

    },
    getters: {

    },
    mutations: {

    },
    actions: {
        async getPhotos(context, credentials) {
            const response = await axios.get('/api/v1/photos?page=' + credentials.page + '&per_page=' + NUMBER_OF_PHOTOS_PER_PAGE + '&raw=true');
            console.log('response from server:', response);
            if (response.data.error)
                throw new Error(response.data.error);
            return response.data.photos;
        },
        async getPhotoInfo(context, photo_url) {
            console.log(photo_url);
            const response = await axios.post('/api/v1/detect', { photo_url });
            console.log('response from server:', response);
            if (response.data.error)
                throw new Error(response.data.error);
            return response.data.info;
        },
        async getPhotosByFilters(context, credentials) {
            const url = '/api/v1/filter?filters=' + credentials.filters
                + '&page=' + credentials.page
                + '&per_page=' + NUMBER_OF_PHOTOS_PER_PAGE;
            const response = await axios.get(url);
            console.log('response', response);
            if (response.data.error)
                throw new Error(response.data.error);
            return response.data.photos;
        }
    }
});
