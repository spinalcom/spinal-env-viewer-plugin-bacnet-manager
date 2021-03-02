<template>
   <md-table
      v-model="devices"
      md-card
      @md-selected="onSelect"
      v-if="show === STATES.discovered"
   >
      <!-- <md-table-toolbar>
         <h1 class="md-title">With auto select and alternate headers</h1>
      </md-table-toolbar> -->

      <md-table-row
         slot="md-table-row"
         slot-scope="{ item }"
         md-selectable="multiple"
         md-auto-select
      >
         <md-table-cell
            md-label="Name"
            md-sort-by="name"
         >{{ item.name }}</md-table-cell>

         <md-table-cell md-label="deviceId">{{ item.deviceId }}</md-table-cell>

         <md-table-cell md-label="address">{{ item.address }}</md-table-cell>

      </md-table-row>
   </md-table>

   <div
      class="_container"
      v-else
   >

      <div class="description">{{label}}</div>
      <div class="buttons">
         <md-button
            class="md-primary md-raised"
            v-if="show === STATES.reseted"
            @click="discover"
         >Discover</md-button>

         <md-button
            class="md-primary md-raised"
            v-else-if="show === STATES.timeout"
            @click="discover"
         >Retry</md-button>

         <md-progress-spinner
            v-else-if="show === STATES.discovering"
            md-mode="indeterminate"
         ></md-progress-spinner>
      </div>

   </div>
</template>
<script>
import { STATES } from "../../js/stateEnum";

export default {
   name: "discoverTable",
   props: {
      devices: {},
      state: {},
      selected: {},
   },
   data() {
      this.STATES = STATES;
      return {
         label: "Discover network to find devices",
         show: STATES.reseted,
      };
   },
   methods: {
      onSelect(items) {
         this.$emit("select", items);
      },

      discover() {
         this.$emit("discover");
      },

      // retry() {
      //    this.$emit("retry");
      // },

      // getLabel() {
      //    switch (this.state) {
      //       case STATES.reseted:
      //          return "Discover network to find devices";
      //       case STATES.timeout:
      //          return "Discover Timeout, retry";
      //       case STATES.discovering:
      //          return "Discovering";

      //       // case STATES.reseted:
      //       //    return "Discover network to find devices";

      //       default:
      //          return "hello world";
      //    }
      // },

      //////////////////////////////////////////////////////////
      ///
      //////////////////////////////////////////////////////////

      // reseted() {
      //    return this.state === STATES.reseted;
      // },
      // discovering() {
      //    return this.state === STATES.discovering;
      // },
      // discovered() {
      //    return this.state === STATES.discovered;
      // },
      // timeout() {
      //    return this.state === STATES.timeout;
      // },
      // creating() {
      //    return this.state === STATES.creating;
      // },
      // created() {
      //    return this.state === STATES.created;
      // },
   },
   watch: {
      state() {
         this.show = this.state;
         switch (this.state) {
            case STATES.reseted:
               this.label = "Discover network to find devices";
               break;
            case STATES.discovering:
               this.label = "Discovering";
               break;
            case STATES.timeout:
               this.label = "Timeout, no device found !";
               break;

            default:
               break;
         }

         // this.$forceUpdate();
      },
   },
};
</script>

<style>
</style>