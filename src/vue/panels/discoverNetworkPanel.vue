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
      <md-step id="first"
               md-label="Network name"
               md-description="Network name">
        <div class="stepContainer">
          <div class="header">
            <div class="radio"
                 :class="{ isActive: network.discoverMethod==0 }">
                 
              <md-radio class="md-primary"
                        v-model="network.discoverMethod"
                        :value="0">Broadcast</md-radio>
            </div>

            <div class="radio"
                 :class="{ isActive: discoverMethod==1 }">
              <md-radio class="md-primary"
                        v-model="network.discoverMethod"
                        :value="1">Unicast</md-radio>
            </div>
            <div class="radio"
                 :class="{ isActive: discoverMethod==2 }">
              <md-radio class="md-primary"
                        v-model="network.discoverMethod"
                        :value="2">Api</md-radio>
            </div>
          </div>

          <div class="content">
            <broadcast-template v-if="network.discoverMethod==0"
                                :network="network"></broadcast-template>

            <unicast-template v-if="network.discoverMethod==1"
                              :network="network"></unicast-template>
                              
            <api-template v-if="network.discoverMethod==2"
                              :network="network"></api-template>
                              
            

            
          </div>
        </div>
      </md-step>

      <md-step id="second"
               md-label="Discover network"
               md-description="Discover">
        <div class="stepContainer">
          <discover-table :devices="devices"
                          :state="state"
                          :selected="selected"
                          :network="network"
                          @discover="discover"
                          @select="selectDevice"
                          @stop="stopDiscovering"></discover-table>
        </div>

        <!-- <md-button @click="discover">Discover</md-button>
             -->
      </md-step>

      <md-step id="third"
               md-label="Create network"
               md-description="Create">
        <div class="stepContainer">
          <div class="loading">
            <md-progress-spinner v-if="state === STATES.creating"
                                 md-mode="indeterminate"></md-progress-spinner>

            <md-icon v-else-if="state === STATES.created"
                     class="md-size-5x">check</md-icon>

            <md-button v-else
                       :disabled="selected.length === 0"
                       @click="createNodes">Create Network</md-button>
          </div>
        </div>
      </md-step>
    </md-steppers>
  </div>
</template>

<script>
import { STATES,DISCOVERY_METHOD, SpinalDisoverModel, SpinalApiDiscoverModel } from "spinal-model-bacnet";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";

import { NETWORK_TYPE } from "../../js/constants";
import discoverTable from "../components/discoverTable.vue";
// import { STATES } from "../../js/stateEnum";

// import { SpinalDisoverModel } from "../../model/SpinalDiscoverModel";

import BroadcastTemplate from "../components/broadcastTemplate.vue";
import UnicastTemplate from "../components/unicastTemplate.vue";
import ApiTemplate from "../components/apiTemplate.vue";

export default {
  name: "discoverNetworkPanel",
  components: {
    "discover-table": discoverTable,
    "broadcast-template": BroadcastTemplate,
    "unicast-template": UnicastTemplate,
    "api-template": ApiTemplate
  },
  data() {
    this.STATES = STATES;
    this.DISCOVERY_METHOD = DISCOVERY_METHOD;
    this.spinalDiscover;
    this.context;
    this.graph;
    this.organ;
    this.devicesBindProcess;
    return {
      state: STATES.reseted,
      devices: [],
      selected: [],
      network: {
        discoverMethod : DISCOVERY_METHOD.broadcast,
        address: "255.255.255.255",
        protocol: "http",
        path:"/",
        site: "",
        port: 47808,
        name: "",
        type: NETWORK_TYPE,
        ips: [{ id: 0, address: "", deviceId: "" }],
      },

    };
  },
  methods: {
    async opened(params) {
      this.graph = params.graph;
      this.context = params.context.get();
      this.organ = await this.getOrganModel(params.selectedNode.id.get());

      if (typeof this.spinalDiscover !== "undefined") {
        this.spinalDiscover = undefined;
        this.state = STATES.reseted;
      }
    },

    closed() {},

    async discover() { 
      console.log("entry discover function");
      if (typeof this.spinalDiscover === "undefined" && this.network.discoverMethod !==2) {
        this.spinalDiscover = new SpinalDisoverModel(
          this.graph,
          this.context,
          this.network,
          this.organ
        );
      }

      if (typeof this.spinalDiscover === "undefined" && this.network.discoverMethod ==2) {
        this.spinalDiscover = new SpinalApiDiscoverModel(
          this.graph,
          this.context,
          this.network,
          this.organ
        );
        // console.log(this.spinalDiscover);
      }
      await this.spinalDiscover.addToGraph();
      this.spinalDiscover.setDiscoveringMode();
      this.getDevicesFound();
    },

    createNodes() {
      console.log("creating...");
      this.spinalDiscover.devices.set(this.selected);
      // this.spinalDiscover.state.set(STATES.creating);
      this.spinalDiscover.setCreatingMode();
    },

    getDevicesFound() {
      this.devicesBindProcess = this.spinalDiscover.state.bind(() => {
        console.log(this.spinalDiscover.state.get());
        this.state = this.spinalDiscover.state.get();

        if (this.state === STATES.discovered) {
          this.devices = this.spinalDiscover.devices.get();
        } else if (this.state === STATES.created) {
          this.spinalDiscover = undefined;
          // this.state = STATES.reseted;
        }
      });
    },

    getOrganModel(nodeId) {
      const realNode = SpinalGraphService.getRealNode(nodeId);
      return realNode.getElement();
    },

    ModContextAttr(context) {
      if (context.name) {
        context.name.set(this.context.name);
      } else {
        context.add_attr({ name: this.context.name });
      }

      if (context.type) {
        context.type.set(this.context.type);
      } else {
        context.add_attr({ type: this.context.type });
      }
    },

    ModNetworkAttr(network) {
      if (network.name) {
        network.name.set(this.network.name);
      } else {
        network.add_attr({ name: this.network.name });
      }

      if (network.type) {
        network.type.set(this.network.type);
      } else {
        network.add_attr({ type: this.network.type });
      }
    },

    selectDevice(devices) {
      this.selected = devices;
    },

    stopDiscovering() {
      if (this.spinalDiscover) {
        this.spinalDiscover.setResetedMode();
        this.spinalDiscover.remove().then(() => {
          this.spinalDiscover = undefined;
          this.state = STATES.reseted;
        });
      } else {
        this.state = STATES.reseted;
      }
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
    this.spinalDiscover.remove(this.graph);
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
.discover_container
  .md-steppers.md-theme-default
  .md-steppers-wrapper
  .md-steppers-container {
  height: 100%;
}

.discover_container
  .md-steppers.md-theme-default
  .md-steppers-wrapper
  .md-steppers-container
  .md-stepper-content.md-active {
  min-height: 250px;
  max-height: 350px;
}
</style>
