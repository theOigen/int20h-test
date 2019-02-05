<template>
  <div>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
      <div class="container">
        <a class="navbar-brand" href="#">Do Nothing Club</a>
      </div>
    </nav>
    <div class="container">
      <!--  Filtration  -->
      <div class="card my-4">
        <h5 class="card-header">Filtration</h5>
        <div class="card-body">
          <div class="row">

            <div class="btn-group-toggle" data-toggle="buttons">
              <label class="btn btn-info active">
                <input type="checkbox" checked autocomplete="off"> Happy
              </label>
              <label class="btn btn-info active">
                <input type="checkbox" checked autocomplete="off"> Sad
              </label>
              <label class="btn btn-info active">
                <input type="checkbox" checked autocomplete="off"> Another emotion
              </label>
            </div>
          </div>
        </div>
      </div>
      <div v-if="photos">
        <!-- Page Content -->
        <div class="row text-center text-lg-left">
          <div v-for="photo in photos" class="col-lg-3 col-md-4 col-xs-6">
            <a href="#" class="d-block mb-4 h-100">
              <img class="img-fluid img-thumbnail" :src="photo.url" alt="">
            </a>
          </div>
        </div>
        <!-- Pagination -->
        <ul class="pagination justify-content-center mb-4">
          <li class="page-item" v-if="pages != 0 && page != 1">
            <a class="page-link js-scroll-trigger" href="#" v-on:click.prevent="movement(-1)">&larr; Older</a>
          </li>
          <li class="page-item disabled">
            <a class="page-item disabled">  Page {{page}} from {{pages}} </a>
          </li>
          <li class="page-item" v-if="pages != 0 && page != pages">
            <a class="page-link js-scroll-trigger" href="#" v-on:click.prevent="movement(1)">Newer &rarr;</a>
          </li>
        </ul>
      </div>
      <div v-else>
        <h1>Loading ...</h1>
      </div>
    </div>
    <!-- Footer -->
    <footer class="py-3 bg-dark">
      <div class="container">
        <p class="m-0 text-center text-white">Do Nothing Club</p>
      </div>
    </footer>
  </div>
</template>

<script>
  export default {
    name: 'HomePage',
    data() {
      return {
        photos: null,
        page: 0,
        pages: 0,
      }
    },
    mounted() {
      this.movement(0)
      console.log('HomePage mounted!');
    },
    methods: {
      async movement(dist) {
        this.photos = null;
        try {
          const response = await this.$store.dispatch('getPhotos', {
            page: this.page + dist
          });
          console.log('Response with photos', response);
          this.page = response.page;
          this.pages = response.pages;
          this.photos = response.photo;
        }
        catch (error) {
          console.log('Error:');
          console.log(error);
        }
      }
    },
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  h1, h2 {
    font-weight: normal;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    display: inline-block;
    margin: 0 10px;
  }

  a {
    color: #42b983;
  }
</style>
