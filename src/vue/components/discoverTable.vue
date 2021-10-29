<!--
Copyright 2021 SpinalCom - www.spinalcom.com

This file is part of SpinalCore.

Please read all of the following terms and conditions
of the Free Software license Agreement ("Agreement")
carefully.

This Agreement is a legally binding contract between
the Licensee (as defined below) and SpinalCom that
sets forth the terms and conditions that govern your
use of the Program. By installing and/or using the
Program, you agree to abide by all the terms and
conditions stated or referenced herein.

If you do not agree to abide by these terms and
conditions, do not demonstrate your acceptance and do
not install or use the Program.
You should have received a copy of the license along
with this file. If not, see
<http://resources.spinalcom.com/licenses.pdf>.
-->

<template>
  <div class="devices_table"
       v-if="show === STATES.discovered">
    <div class="header">
      <div>{{selected.length}} selected / {{devices.length}} found</div>
      <!-- <div>{{devices.length}} controller(s) found</div> -->
    </div>

    <md-table class="tablecontent"
              v-model="devices"
              @md-selected="onSelect">
      <!-- md-fixed-header -->

      <md-table-row slot="md-table-row"
                    slot-scope="{ item }"
                    md-selectable="multiple"
                    md-auto-select>
        <md-table-cell md-label="Name"
                       md-sort-by="name">{{ item.name }}</md-table-cell>

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
  </div>

  <div class="discover_container"
       v-else>

    <div class="description">{{label}}</div>
    <div class="buttons">
      <md-button class="md-primary md-raised"
                 v-if="show === STATES.reseted"
                 @click="discover"
                 :disabled="disabledBtn()">Discover</md-button>

      <md-button class="md-primary md-raised"
                 v-else-if="show === STATES.timeout"
                 @click="discover">Retry</md-button>

      <div class="loading"
           v-else-if="show === STATES.discovering">
        <div>
          <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
        </div>
        <div>
          <md-button class="md-accent md-raised"
                     @click="stop">Stop</md-button>
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
    disabledBtn() {
      if (this.network.name.trim().length === 0) return true;
      if (this.network.useBroadcast) {
        if (this.network.address.length === 0) return true;
        if (this.network.port.length === 0) return true;
      } else {
        if (this.network.ips.length === 0) return true;
      }

      return false;
    },

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
}

.discover_container .devices_table .header {
  width: 99%;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.4em;
  border: 1px dashed grey;
}

.discover_container .devices_table .tablecontent {
  width: 100%;
  height: calc(100% - 50px);
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