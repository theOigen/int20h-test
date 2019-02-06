import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';

Vue.use(Vuex);

const NUMBER_OF_PHOTOS_PER_PAGE = 2;

axios.defaults.baseURL = 'http://localhost:3000';

export const store = new Vuex.Store({
    state: {
      filtrePaginationCoordinates: [
        {
          //FirstPage
          originPage: 1,
          pointer: 0
        }
      ]
    },
    getters: {
      getCurrentFiltrePaginationCoordinates: (state) => (page) => {
        return state.filtrePaginationCoordinates[page - 1];
      },
      getFiltrePaginationCoordinates: (state) => {
        return state.filtrePaginationCoordinates;
      }
    },
    mutations: {
      filtrePaginationIncrement(state, nextCoordinates) {
        console.log('nextCoordinates', nextCoordinates)
        state.filtrePaginationCoordinates.push(nextCoordinates);
      },
      filtrePaginationDecrement(state) {
        if (state.filtrePaginationCoordinates.length != 1)
          state.filtrePaginationCoordinates.pop();
      },
      filtrePaginationReset(state) {
        state.filtrePaginationCoordinates = [
          {
            //FirstPage
            originPage: 1,
            pointer: 0
          }
        ]
      }
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
      async getPhotoesByFiltres(context, credentials) {
        console.log('getPhotoesByFiltres credentials.page', credentials.page);
          const url = '/api/v1/filtre?filtres=' + credentials.filtres
            + '&page=' + credentials.page
            + '&per_page=' + NUMBER_OF_PHOTOS_PER_PAGE
            + '&origin_page=' + context.getters.getCurrentFiltrePaginationCoordinates(credentials.page).originPage
            + '&pointer_position=' + context.getters.getCurrentFiltrePaginationCoordinates(credentials.page).pointer;
          const response = await axios.get(url);
            if (response.data.error)
              throw new Error(response.data.error);
        if (context.getters.getFiltrePaginationCoordinates.length == credentials.page && response.data.photos.nextPhotoIsExist)
            this.commit('filtrePaginationIncrement', {
              originPage: response.data.photos.pageOfNextPhoto,
              pointer: response.data.photos.pointerOfNextPhotoOnPage
            })
            return response.data.photos;
        }
    }
});
