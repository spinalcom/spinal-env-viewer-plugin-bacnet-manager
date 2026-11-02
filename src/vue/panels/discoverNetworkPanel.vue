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
      <md-step id="first" md-label="BACnet client options" md-description="BACnet client options">
        <div class="stepContainer">
          <div class="network-settings">
            <md-field class="contextInput">
              <label>Network Name</label>
              <md-input v-model="network.name"></md-input>
            </md-field>

            <md-field class="contextInput">
              <label>Interface</label>
              <md-input v-model="network.interface"></md-input>
              <span class="md-helper-text">interface used for network communication</span>
            </md-field>

            <md-field class="contextInput">
              <label>Port</label>
              <md-input v-model="network.port" type="number"></md-input>
              <span class="md-helper-text">Port used to communicate on the network. Default: 47808</span>
            </md-field>

            <md-field class="contextInput">
              <label>APDU Timeout (ms)</label>
              <md-input v-model="network.apduTimeout" type="number"></md-input>
              <span class="md-helper-text">Default: 3000, time to wait for APDU response</span>
            </md-field>
          </div>
        </div>
      </md-step>

      <md-step id="second" md-label="Discovery process" md-description="Discovery process">
        <div class="stepContainer">
          <div class="header">
            <div class="radio" :class="{ isActive: network.discoveryMode === 'broadcast' }">
              <md-radio class="md-primary" v-model="network.discoveryMode" value="broadcast">Broadcast</md-radio>
            </div>

            <div class="radio" :class="{ isActive: network.discoveryMode === 'unicast' }">
              <md-radio class="md-primary" v-model="network.discoveryMode" value="unicast">Unicast</md-radio>
            </div>
          </div>

          <div class="content">
            <broadcast-template v-if="network.discoveryMode === 'broadcast'" :network="network"></broadcast-template>

            <unicast-template v-if="network.discoveryMode === 'unicast'" :network="network"></unicast-template>
          </div>
        </div>
      </md-step>

      <md-step id="third" md-label="Discover network" md-description="Discover">
        <div class="stepContainer">
          <discover-table :devices="devices" :state="state" :selected="selected" :network="network" @discover="discover"
            @select="selectDevice" @stop="stopDiscovering"></discover-table>

          <div class="actions" v-if="state === DEVICE_STATES.discovered">
            <md-button class="md-dense md-primary" @click="resetProcess">Reset process</md-button>
          </div>
        </div>

        <!-- <md-button @click="discover">Discover</md-button>
             -->
      </md-step>

      <md-step id="fourth" md-label="Create network" md-description="Create">
        <div class="stepContainer">
          <div class="loading">
            <md-progress-spinner v-if="state === DEVICE_STATES.creating" md-mode="indeterminate"></md-progress-spinner>

            <div v-else-if="state === DEVICE_STATES.created" class="creation-success">
              <md-icon class="md-size-5x">check</md-icon>
              <md-button class="md-dense md-primary" @click="resetProcess">Reset process</md-button>
            </div>

            <div v-else-if="state === DEVICE_STATES.error">
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
import { STATES as DEVICE_DISCOVER_STATES } from "spinal-connector-service";

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
    this.DEVICE_STATES = DEVICE_DISCOVER_STATES;

    this.spinalDiscover;
    this.context;
    this.graph;
    this.organ;
    this.devicesBindProcess;
    return {
      state: DEVICE_DISCOVER_STATES.initial,
      devices: [],
      selected: [],
      network: {
        useBroadcast: true,
        discoveryMode: "broadcast",
        interface: "",
        apduTimeout: "3000",
        address: "255.255.255.255",
        port: "47808",
        name: "",
        type: NETWORK_TYPE,
        ips: [{ id: 0, process: "unicast", address: "", deviceId: "" }],
      },
    };
  },
  methods: {
    async opened({ graph, context, organ, networkInfo }) {
      this.graph = graph;
      this.context = context;
      this.organ = organ;

      if (networkInfo) this.network.name = networkInfo.name;

      if (typeof this.spinalDiscover !== "undefined") this.reInitDevice();
    },

    closed() { },

    reInitDevice() {
      this.spinalDiscover = undefined;
      this.state = DEVICE_DISCOVER_STATES.initial;
    },

    // Discover the network and get the devices found
    async discover() {
      const network = this.getDiscoveryNetworkConfig();
      if (!this.spinalDiscover) {
        this.spinalDiscover = new SpinalDiscoverModel(this.graph, this.context, this.organ, network);
        await this.spinalDiscover.addToGraph();
        this._bindDevice();
      } else if (this.spinalDiscover.network) {
        this.spinalDiscover.network.mod_attr(network);
      }

      this.spinalDiscover.setDiscoveringState();
    },

    getDiscoveryNetworkConfig() {
      const mode = this.network.discoveryMode === "broadcast" ? "broadcast" : "unicast";
      const useBroadcast = mode === "broadcast";
      const ips = (this.network.ips || []).reduce((list, target, index) => {
        if (!target || typeof target.address !== "string") return list;
        const address = target.address.trim();
        if (!address) return list;

        if (mode === "broadcast") return list;

        list.push({
          id: index,
          process: (target.process || "unicast").toLowerCase() === "bbmd" ? "bbmd" : "unicast",
          address,
          deviceId: target.deviceId === undefined || target.deviceId === null ? "" : String(target.deviceId).trim(),
        });
        return list;
      }, []);

      return {
        ...this.network,
        discoveryMode: mode,
        useBroadcast,
        interface: typeof this.network.interface === "string" ? this.network.interface.trim() : "",
        apduTimeout: String(this.network.apduTimeout || "").trim().length > 0 ? String(this.network.apduTimeout).trim() : "3000",
        address: typeof this.network.address === "string" && this.network.address.trim().length > 0 ? this.network.address.trim() : "255.255.255.255",
        port: String(this.network.port || "").trim().length > 0 ? String(this.network.port).trim() : "47808",
        ips,
      };
    },

    async createNodes() {
      console.log("creating...");
      await this.spinalDiscover.setTreeToCreate(this.selected);
      this.spinalDiscover.setCreatingState();
    },

    async resetProcess() {
      if (this.spinalDiscover) {
        try {
          await this.spinalDiscover.removeFromGraph();
        } catch (error) {
          console.error("Failed to remove discovery model from graph", error);
        }
      }

      this.spinalDiscover = undefined;
      this.devices = [];
      this.selected = [];
      this.state = DEVICE_DISCOVER_STATES.initial;
    },

    _bindDevice() {
      this.devicesBindProcess = this.spinalDiscover.state.bind(async () => {
        if (!this.spinalDiscover.state) return;

        this.state = this.spinalDiscover.state.get();

        // if (this.state === DEVICE_DISCOVER_STATES.discovered) {
        //   // getDevices found in server
        //   this.devices = await this.spinalDiscover.getTreeDiscovered();
        // } else if (this.state === DEVICE_DISCOVER_STATES.created) {
        //   // reset all data
        //   this.spinalDiscover = undefined;
        // }

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
        this.state = DEVICE_DISCOVER_STATES.initial;
        return;
      }

      this.spinalDiscover.changeState(DEVICE_DISCOVER_STATES.cancelled);
      // await this.spinalDiscover.removeFromGraph();
    },
  },
  watch: {
    "network.discoveryMode": function () {
      this.stopDiscovering();
    },
    "network.name": function () {
      this.stopDiscovering();
    },
    "network.interface": function () {
      this.stopDiscovering();
    },
    "network.apduTimeout": function () {
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

    state: async function (value) {
      switch (value) {
        case DEVICE_DISCOVER_STATES.discovered:
          if (!this.spinalDiscover) break;
          this.devices = await this.spinalDiscover.getTreeDiscovered();
          break;
        case DEVICE_DISCOVER_STATES.created:
          this.spinalDiscover = undefined;
          break;
        case DEVICE_DISCOVER_STATES.cancelled:
          this.reInitDevice();
          break;
      }
      // Removed old if-else block as it is replaced by the switch statement above.
    }
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

.discover_container .actions {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.discover_container .creation-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.discover_container .header {
  width: 100%;
  height: 50px;
  display: flex;
  justify-content: space-between;
}

.discover_container .header .radio {
  flex: 1;
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

.discover_container .network-settings {
  width: 100%;
}

.discover_container .network-settings .contextInput {
  min-height: unset;
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
