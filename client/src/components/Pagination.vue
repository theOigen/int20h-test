<template id="pagination-template">
  <div class="pagination">
    <div class="center">
      <a href="#" v-if="hasPrev()" @click.prevent="changePage(prevPage)">
        <i class="fa fa-long-arrow-left"></i>
      </a>
      <span v-if="hasFirst()">
        <a href="#" @click.prevent="changePage(1)">1</a>
      </span>
      <a v-if="hasFirstDots()">...</a>
      <span v-for="page in pages" :key="page">
        <a
          v-if="page === current"
          class="active"
          href="#"
          @click.prevent="changePage(page)"
        >{{ page }}</a>
        <a v-else href="#" @click.prevent="changePage(page)">{{ page }}</a>
      </span>
      <a v-if="hasLastDots()">...</a>
      <!-- <span v-if="hasLast()">
        <a href="#" @click.prevent="changePage(total)">{{ total }}</a>
      </span>-->
      <a href="#" v-if="hasNext()" @click.prevent="changePage(nextPage)">
        <i class="fa fa-long-arrow-right"></i>
      </a>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    current: {
      type: Number,
      default: 1
    },
    total: {
      type: Number,
      default: 0
    },
    pageRange: {
      type: Number,
      default: 2
    }
  },
  computed: {
    pages() {
      let pages = [];
      for (let i = this.rangeStart; i <= this.rangeEnd; i++) {
        pages.push(i);
      }
      return pages;
    },
    rangeStart() {
      let start = this.current - this.pageRange;
      if (start > 0) {
        return start;
      } else {
        return 1;
      }
    },
    rangeEnd() {
      let end = this.current + this.pageRange;
      return end < this.total ? end : this.total;
    },
    nextPage() {
      return this.current + 1;
    },
    prevPage() {
      return this.current - 1;
    }
  },
  methods: {
    hasFirst() {
      return this.rangeStart !== 1;
    },
    hasLast() {
      return this.rangeEnd < this.total;
    },
    hasFirstDots() {
      if (this.rangeStart <= 2) {
        return false;
      } else {
        return true;
      }
    },
    hasLastDots() {
      if (this.rangeEnd >= this.total - 1) {
        return false;
      } else {
        return true;
      }
    },
    hasPrev() {
      return this.current > 1;
    },
    hasNext() {
      return this.current < this.total;
    },
    changePage(page) {
      this.$emit("page-changed", page);
    }
  }
};
</script>

<style>
.pagination {
  margin-top: 10px;
  margin-bottom: 20px;
}
.pagination a {
  color: grey;
  float: left;
  padding: 8px 16px;
  text-decoration: none;
  transition: background-color 0.3s;
}
.pagination a.active,
a:hover {
  color: black;
}
.center {
  display: flex;
  justify-content: center;
}
</style>