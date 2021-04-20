<template>
   <md-table
      v-model="devices"
      class="devices_table"
      @md-selected="onSelect"
      v-if="show === STATES.discovered"
   >
      <!-- md-fixed-header -->

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

         <!-- <md-table-cell
            class="configureMonitoring"
            md-label="configure Monitoring"
         >
            <md-button
               class="md-icon-button md-primary"
               v-tooltip="'Configure Monitoring'"
            >
               <md-icon>settings</md-icon>
            </md-button>
         </md-table-cell> -->

      </md-table-row>
   </md-table>

   <div
      class="discover_container"
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

         <div
            class="loading"
            v-else-if="show === STATES.discovering"
         >
            <div>
               <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
            </div>
            <div>
               <md-button
                  class="md-accent md-raised"
                  @click="stop"
               >Stop</md-button>
            </div>

         </div>

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
      network: {},
   },
   data() {
      this.STATES = STATES;
      return {
         label: "Discover network to find devices",
         show: STATES.reseted,
      };
   },
   methods: {
      disabledBtn() {},

      onSelect(items) {
         this.$emit("select", items);
      },

      discover() {
         this.$emit("discover");
      },

      stop() {
         this.$emit("stop");
      },
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
            case STATES.error:
               this.label = "oups !";
               break;
            default:
               break;
         }

         // this.$forceUpdate();
      },
      // "network.useBroadcast": function () {
      //    this.disabledBtn();
      // },
      // "network.address": function () {
      //    this.disabledBtn();
      // },
      // "network.port": function () {
      //    this.disabledBtn();
      // },
      // "network.name": function () {
      //    this.disabledBtn();
      // },
      // "network.ips": function () {
      //    this.disabledBtn();
      // },
   },
};
</script>

<style scoped>
.discover_container {
   width: 100%;
   height: 100%;
   display: flex;
   flex-direction: column;
   align-items: center;
   justify-content: center;
}

.discover_container .loading {
   text-align: center;
   /* display: flex;
   flex-direction: column; */
}

.discover_container .devices_table {
   width: 98%;
   height: 100%;
   margin: auto;
   overflow: hidden;
   background: red;
}
</style>

<style>
/* .discover_container .devices_table .md-table.md-theme-default .md-table-content,
.md-table.md-theme-default .md-table-alternate-header .md-table table {
   width: 100%;
   height: 100%;
} */

.configureMonitoring .md-button .md-ripple {
   padding: 0;
}
</style>