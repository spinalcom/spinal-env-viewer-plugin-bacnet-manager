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
  <div class="discover_container">
    <!-- <md-field>
         <label>Network Name</label>
         <md-input v-model="network.name"></md-input>
      </md-field>

      <md-button @click="discover">Discover</md-button> -->
    <md-steppers md-vertical>
      <md-step id="first" md-label="Network name" md-description="Network name">
        <div class="stepContainer">
          <div class="header">
            <div class="radio" :class="{ isActive: network.useBroadcast }">
              <md-radio class="md-primary" v-model="network.useBroadcast" :value="true">Broadcast</md-radio>
            </div>

            <div class="radio" :class="{ isActive: !network.useBroadcast }">
              <md-radio class="md-primary" v-model="network.useBroadcast" :value="false">Unicast</md-radio>
            </div>
          </div>

          <div class="content">
            <broadcast-template v-if="network.useBroadcast" :network="network"></broadcast-template>

            <unicast-template v-else :network="network"></unicast-template>
          </div>
        </div>
      </md-step>

      <md-step id="second" md-label="Discover network" md-description="Discover">
        <div class="stepContainer">
          <discover-table :devices="devices" :state="state" :selected="selected" :network="network" @discover="discover"
            @select="selectDevice" @stop="stopDiscovering"></discover-table>
        </div>

        <!-- <md-button @click="discover">Discover</md-button>
             -->
      </md-step>

      <md-step id="third" md-label="Create network" md-description="Create">
        <div class="stepContainer">
          <div class="loading">
            <md-progress-spinner v-if="state === STATES.creating" md-mode="indeterminate"></md-progress-spinner>

            <md-icon v-else-if="state === STATES.created" class="md-size-5x">check</md-icon>

            <div v-else-if="state === STATES.error">
              Something went wrong during the creation of the network, please
              <md-button class="md-dense md-primary" @click="createNodes">
                try again
              </md-button>

            </div>


            <md-button v-else :disabled="selected.length === 0" @click="createNodes">
              Create Network
            </md-button>
          </div>
        </div>
      </md-step>
    </md-steppers>
  </div>
</template>

<script>
import { SpinalDiscoverModel } from "spinal-model-bacnet";

import { NETWORK_TYPE } from "../../js/constants";
import discoverTable from "../components/discoverTable.vue";
import { STATES } from "spinal-connector-service";

// import { STATES } from "../../js/stateEnum";


import BroadcastTemplate from "../components/broadcastTemplate.vue";
import UnicastTemplate from "../components/unicastTemplate.vue";

export default {
  name: "discoverNetworkPanel",
  components: {
    "discover-table": discoverTable,
    "broadcast-template": BroadcastTemplate,
    "unicast-template": UnicastTemplate,
  },
  data() {
    this.STATES = STATES;

    this.spinalDiscover;
    this.context;
    this.graph;
    this.organ;
    this.devicesBindProcess;
    return {
      state: STATES.initial,
      devices: [],
      selected: [],
      network: {
        useBroadcast: true,
        address: "255.255.255.255",
        port: 47808,
        name: "",
        type: NETWORK_TYPE,
        ips: [{ id: 0, address: "", deviceId: "" }],
      },
    };
  },
  methods: {
    async opened({ graph, context, organ }) {
      this.graph = graph;
      this.context = context;
      this.organ = organ;

      if (typeof this.spinalDiscover !== "undefined") this.reInitDevice();
    },

    closed() { },

    reInitDevice() {
      this.spinalDiscover = undefined;
      this.state = STATES.initial;
    },

    // Discover the network and get the devices found
    async discover() {
      if (!this.spinalDiscover) {
        this.spinalDiscover = new SpinalDiscoverModel(this.graph, this.context, this.organ, this.network);
        await this.spinalDiscover.addToGraph();
        this._bindDevice();
      }

      this.spinalDiscover.setDiscoveringState();
    },

    async createNodes() {
      console.log("creating...");
      await this.spinalDiscover.setTreeToCreate(this.selected);
      this.spinalDiscover.setCreatingState();
    },

    _bindDevice() {
      this.devicesBindProcess = this.spinalDiscover.state.bind(async () => {
        console.log(this.spinalDiscover.state.get());
        this.state = this.spinalDiscover.state.get();

        if (this.state === STATES.discovered) {
          // getDevices found in server
          this.devices = await this.spinalDiscover.getTreeDiscovered();
        } else if (this.state === STATES.created) {
          // reset all data
          this.spinalDiscover = undefined;
        }

      });
    },

    // getOrganModel(nodeId) {
    //   return realNode.getElement();
    // },

    ModContextAttr(context) {
      if (context.name) context.name.set(this.context.name);
      else context.add_attr({ name: this.context.name });


      if (context.type) context.type.set(this.context.type);
      else context.add_attr({ type: this.context.type });

    },

    ModNetworkAttr(network) {
      if (network.name) network.name.set(this.network.name);
      else network.add_attr({ name: this.network.name });


      if (network.type) network.type.set(this.network.type);
      else network.add_attr({ type: this.network.type });
    },

    selectDevice(devices) {
      this.selected = devices;
    },

    async stopDiscovering() {
      if (!this.spinalDiscover) {
        this.state = STATES.initial;
        return;
      }

      this.spinalDiscover.changeState(STATES.cancelled);
      await this.spinalDiscover.removeFromGraph();
      this.reInitDevice();
    },
  },
  watch: {
    "network.useBroadcast": function () {
      this.stopDiscovering();
    },
    "network.address": function () {
      this.stopDiscovering();
    },
    "network.port": function () {
      this.stopDiscovering();
    },

    "network.ips": function () {
      this.stopDiscovering();
    },
  },
  beforeDestroy() {
    if (this.spinalDiscover) this.spinalDiscover.removeFromGraph();
  },
};
</script>

<style scoped>
.discover_container {
  width: 100%;
  height: calc(100% - 15px);
}

.discover_container .stepContainer {
  width: 100%;
  height: 350px;
}

.discover_container .loading {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.discover_container .header {
  width: 100%;
  height: 50px;
  display: flex;
  justify-content: space-between;
}

.discover_container .header .radio {
  width: 50%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.discover_container .header .radio.isActive {
  color: #448aff;
  border-bottom: 2px solid #448aff;
}

.discover_container .content {
  width: 100%;
  height: calc(100% - 50px);
  margin-top: 10px;
  /* min-height: 200px; */

  /* overflow: hidden;
   overflow-y: auto; */
}
</style>

<style>
.discover_container .md-steppers.md-theme-default,
.discover_container .md-steppers.md-theme-default .md-steppers-wrapper,
.discover_container .md-steppers.md-theme-default .md-steppers-wrapper .md-steppers-container {
  height: 100%;
}

.discover_container .md-steppers.md-theme-default .md-steppers-wrapper .md-steppers-container .md-stepper-content.md-active {
  min-height: 250px;
  max-height: 350px;
}
</style>
