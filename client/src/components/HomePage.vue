<template>
  <div class="container">
    <div class="row">
      <!--  Filtration  -->
      <div class="col-md-3">
        <div class="header affix">
          <div class="table">
            <div class="table-cell">
              <div class="logo">
                <router-link to="/">EMO!</router-link>
                <div class="sub-logo">emotions only. nothing else.</div>
              </div>
              <div class="photo-filter">
                <nav>
                  <ul class="filter-list">
                    <li>
                      <a href="#" @click.prevent="filterEmote('happiness')" :class="{ active: this.emoteString === 'happiness' }">happiness</a>
                    </li>
                    <li>
                      <a href="#" @click.prevent="filterEmote('sadness')" :class="{ active: this.emoteString === 'sadness' }">sadness</a>
                    </li>
                    <li>
                      <a href="#" @click.prevent="filterEmote('anger')" :class="{ active: this.emoteString === 'anger' }">anger</a>
                    </li>
                    <li>
                      <a href="#" @click.prevent="filterEmote('disgust')" :class="{ active: this.emoteString === 'disgust' }">disgust</a>
                    </li>
                    <li>
                      <a href="#" @click.prevent="filterEmote('fear')" :class="{ active: this.emoteString === 'fear' }">fear</a>
                    </li>
                    <li>
                      <a href="#" @click.prevent="filterEmote('neutral')" :class="{ active: this.emoteString === 'neutral' }">neutral</a>
                    </li>
                    <li>
                      <a href="#" @click.prevent="filterEmote('surprise')" :class="{ active: this.emoteString === 'surprise' }">surprise</a>
                    </li>
                  </ul>
                </nav>
              </div>
              <div class="copyright">
                <p>emo! &copy; 2019. Created by "Do Nothing Club"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!isLoading" class="col-md-9 col-md-offset-3">
        <!-- Page Content -->
        <div class="photos">
          <div v-for="photo in photos" :key="photo.id" class="photo-item">
            <a href="#" @click.prevent="clickedOnPhoto(photo)">
              <div v-if="photo.id === selectedPhoto.id && !isLoadingInfo ">
                <img :src="photo.url" alt>
              </div>
               <div v-else-if="photo.id === selectedPhoto.id && isLoadingInfo ">
                <div class="blur-text">Loading...</div>
                <img :src="photo.url" alt class="blur">
              </div>
              <div v-else class="image-container">
                <div class="blur-text">Click to see emotions</div>
                <img :src="photo.url" alt class="blur">
              </div>
            </a>
          </div>
          <!-- Pagination -->
          <pagination v-if="photos.length" class="center" :current="currPage" :total="totalPages" :page-range="pageRange" @page-changed="getPhotos"></pagination>
        </div>
      </div>
      <div v-else class="lds-place">
        <div class="lds-ring">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Pagination from "./Pagination";
export default {
  name: "HomePage",
  components: {
    Pagination
  },
  data() {
    return {
      photos: [],
      selectedPhoto: {},
      currPage: -1,
      nextPage: -1,
      prevPage: -1,
      totalPages: 0,
      pageRange: 1,
      searchResult: "",
      isLoading: false,
      isLoadingInfo: false,
      emoteString: ""
    };
  },
  mounted() {
    this.getPhotos(1);
  },
  computed: {
    filteredPhotos() {
      // @todo filter photos by emote
      // @todo in future send a request with current emoteString
    }
  },
  methods: {
    async getPhotos(page) {
      try {
        this.isLoading = true;
        const response = await this.$store.dispatch("getPhotos", { page });
        this.photos = response.photo;
        this.currPage = response.page;
        this.nextPage =
          this.currPage + 1 < response.pages ? this.currPage + 1 : 0;
        this.prevPage = this.currPage - 1 > 0 ? this.currPage - 1 : 0;
        this.totalPages = response.pages;
      } catch (error) {
        console.log("Error: ", error);
      }
      this.isLoading = false;
    },
    filterEmote(emote) {
      this.emoteString = emote;
      console.log(emote);
    },
    async clickedOnPhoto(photo) {
      if(this.isLoadingInfo 
      || photo.id === this.selectedPhoto.id) return; // implement reject;
      console.log(photo.id);
      this.selectedPhoto = photo;
      let isCashed = this.selectedPhoto.faces_info;

      
      if(!isCashed) try {
        this.isLoadingInfo = true;
        const response = await this.$store.dispatch("getPhotoInfo", photo.url);
        this.selectedPhoto.faces_info = response.faces; 
        this.addFaceInfoToCash(this.selectedPhoto.id, response.faces);
      } catch (error) {
        console.log("Error: ", error);
      }else console.log("Already cashed");
      this.isLoadingInfo = false;
      console.log(this.selectedPhoto.faces_info);
    },
    addFaceInfoToCash(photoId, faces_info){
      const cashedPhoto = this.photos.find(photo => photo.id === photoId );
      if(cashedPhoto) cashedPhoto.faces_info = faces_info;
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.header {
  width: 220px;
  bottom: 0;
  top: 0;
  text-align: right;
  z-index: 9;
}

.affix {
  position: fixed;
}

.table {
  display: table;
  width: 100%;
  height: 100%;
}

.table-cell {
  display: table-cell;
  vertical-align: middle;
}

.copyright {
  font-size: 10px;
  color: #ababab;
}

.logo {
  font-size: 40px;
  color: #000000;
  text-transform: lowercase;
  padding-bottom: 30px;
  letter-spacing: 2px;
  line-height: 40px;
}

.logo a {
  color: inherit;
}

.blur {
  filter: blur(3px);
}

.image-container {
  position: relative;
}

.blur-text {
  font-size: 32px;
  font-weight: bold;
  position: absolute;
  margin: 0 auto;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin-top: 30%;
  text-align: center;
  text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;
  transition: all 0.3s ease;

  z-index: 1000;
}

.blur-text:hover {
  text-shadow: -1px 0 #ababab, 0 1px #ababab, 1px 0 #ababab, 0 -1px #ababab;
  transition: all 0.3s ease;
}

.normal {
  filter: saturate(3);
}

.logo a:hover {
  text-decoration: none;
}

.sub-logo {
  font-size: 12px;
  color: #474747;
  text-transform: none;
  line-height: 17px;
  letter-spacing: 2;
}

.photo-filter {
  font-family: "Roboto", serif;
  letter-spacing: 1px;
  font-size: 18px;
  line-height: 24px;
}

.photo-filter ul,
.photo-filter li {
  list-style: none;
  padding: 0;
  margin: 0;
}

.photo-filter li {
  position: relative;
}

.photo-filter .filter-list>li>a {
  padding-top: 3px;
  padding-bottom: 3px;
  display: block;
}

.photo-filter .filter-list a:hover {
  color: #000000;
}

a {
  color: #ababab;
  text-decoration: none;
  transition: all 0.3s ease;
}

.photos {
  padding-left: 80px;
  padding-right: 50px;
}

.photo-item {
  position: relative;
  margin-bottom: 20px;
}

img {
  max-width: 100%;
  height: auto;
  vertical-align: middle;
  border: 0;
}

.filter-list a.active {
  color: #000;
}

.lds-place {
  position: relative;
  top: 270px;
  left: 350px;
}

.lds-ring {
  display: inline-block;
  position: relative;
  width: 64px;
  height: 64px;
}

.lds-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 70px;
  height: 70px;
  margin: 6px;
  border: 6px solid rgb(0, 0, 0);
  border-radius: 50%;
  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: rgb(73, 236, 86) transparent transparent transparent;
}

.lds-ring div:nth-child(1) {
  animation-delay: -0.45s;
  border-color: rgb(240, 201, 73) transparent transparent transparent;
}

.lds-ring div:nth-child(2) {
  animation-delay: -0.3s;
  border-color: rgb(240, 171, 68) transparent transparent transparent;
}

.lds-ring div:nth-child(3) {
  animation-delay: -0.15s;
  border-color: rgb(226, 63, 63) transparent transparent transparent;
}

.lds-ring div:nth-child(4) {
  animation-delay: -0.1s;
  border-color: rgb(153, 32, 177) transparent transparent transparent;
}

.lds-ring div:nth-child(5) {
  animation-delay: 0.1s;
  border-color: rgb(56, 108, 206) transparent transparent transparent;
}

@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
