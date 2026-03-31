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
  <div class="manage_panel_container">
    <div class="manage_container" v-if="pageSelected === PAGES.selection">
      <div class="header">
        <div>
          <md-button class="md-icon-button" v-tooltip="'start all devices'" @click="startAllMonitoring">
            <md-icon class="md-primary">play_arrow</md-icon>
          </md-button>

          <md-button class="md-icon-button" v-tooltip="'restart all devices'" @click="restartAllMonitoring">
            <md-icon class="md-primary">replay</md-icon>
          </md-button>

          <md-button class="md-icon-button md-accent" v-tooltip="'stop all devices'" @click="stopAllMonitoring">
            <md-icon class="md-accent">stop</md-icon>
          </md-button>

          <md-button class="md-primary" @click="changeTimeSeries(true)">Save all time series
          </md-button>

          <md-button class="md-accent" @click="changeTimeSeries(false)">Stop saving all time
            series</md-button>
        </div>
      </div>

      <div class="devices_list">
        <device-monitoring v-for="item in devices" :ref="item.device.getId().get()" :key="item.device.getId().get()"
          :device="item.device" :profile="item.profile" :context="context" :graph="graph" :network="network"
          :organ="organ"></device-monitoring>
      </div>
    </div>

    <div class="state" v-else-if="pageSelected === PAGES.loading">
      <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
    </div>

    <div class="state" v-else-if="pageSelected === PAGES.error">
      <md-icon class="md-size-5x">close</md-icon>
    </div>
  </div>
</template>

<script>
import DeviceMonitoring from "../components/monitoring/devicemonitor.vue";
import { spinalEventEmitter } from "spinal-env-viewer-plugin-event-emitter";
import utilities from "../../js/utilities";
import { monitorState } from "../../js/monitorState";

const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");

export default {
  name: "manageDevicesPanel",
  components: {
    "device-monitoring": DeviceMonitoring,
  },
  data() {
    this.PAGES = {
      selection: 0,
      loading: 1,
      creation: 2,
      success: 3,
      error: 4,
    };

    this.context;
    this.graph;
    this.selectedNode;
    this.network;
    this.organ;

    return {
      devices: [],
      pageSelected: this.PAGES.creation,
    };
  },
  created() {
    spinalEventEmitter.on("deviceProfileContext-ChangeSupervision", () => { });
  },

  methods: {
    async opened({ context, graph, selectedNode }) {
      this.pageSelected = this.PAGES.loading;
      this.setPanelTitle(selectedNode.getName().get()); // change panel title
      monitorState.clear();

      try {

        this.context = context;
        this.graph = graph;
        this.selectedNode = selectedNode;
        this.network = await utilities.getNetwork(this.selectedNode, this.context);
        this.organ = await utilities.getOrgan(this.network, this.context);

        this.devices = await this.getBmsDevices(context, selectedNode);

        // await this.saveProfilIds(profilIds);

        // console.log(monitorState);
        this.pageSelected = this.PAGES.selection;
      } catch (error) {
        console.error(error);
        this.pageSelected = this.PAGES.error;
      }
    },

    closed() { },

    async getBmsDevices(context, selectedNode) {
      const devices = await utilities.getBmsDevices(context, selectedNode);

      const promises = devices.map(async (device) => {
        const profile = await utilities.getProfilLinkedToDevice(device);
        return { device, profile };
      });

      return Promise.all(promises);
    },

    // saveProfilIds(profilIds) {
    //   const promises = profilIds.map((id) => monitorState.addProfile(id));
    //   return Promise.resolve(promises);
    // },



    getReferences() {
      return this.devices.reduce((acc, { device }) => {
        const deviceId = device.getId().get();
        const reference = this.$refs[deviceId] ? this.$refs[deviceId][0] : null;
        if (reference) acc.push(reference);
        return acc;
      }, [])
    },

    async startAllMonitoring() {
      const references = this.getReferences();
      const promisesFunc = [];

      // we create an array of functions to execute them in batch to avoid freezing the UI
      for (const ref of references) {
        const func = async () => {
          const model = await ref.startMonitoring();
          await utilities.waitModelReady(model);
        };

        promisesFunc.push(func);
      }

      // execute them in batch to avoid freezing the UI
      await utilities.consumeBatch(promisesFunc, 30);

    },

    async restartAllMonitoring() {
      const references = this.getReferences();
      const promisesFunc = [];

      for (const ref of references) {
        const func = async () => {
          const model = await ref.restartMonitoring();
          await utilities.waitModelReady(model);
        };

        promisesFunc.push(func);
      }

      await utilities.consumeBatch(promisesFunc, 30);
    },

    async stopAllMonitoring() {

      const references = this.getReferences();
      const promisesFunc = [];

      for (const ref of references) {
        const func = async () => {
          const model = await ref.stopMonitoring();
          await utilities.waitModelReady(model);
        };

        promisesFunc.push(func);
      }

      await utilities.consumeBatch(promisesFunc, 30);
    },



    changeTimeSeries(value) {
      for (const { device } of this.devices) {
        const deviceId = device.getId().get();

        const [ref] = this.$refs[deviceId];
        if (ref) ref.updateTimeSeries(value);
      }
    },

    setPanelTitle(title) {
      const titlePrefix = "Manage devices monitoring";
      spinalPanelManagerService.panels.manageDevicesPanel.panel.setTitle(`${titlePrefix} : ${title}`);
    },

    execFunction(array, callback) {
      const promises = array.map((el) => callback(el));
      return Promise.all(promises);
    },
  },
};
</script>

<style scoped>
.manage_panel_container {
  width: 100%;
  height: calc(100% - 15px);
  overflow: hidden;
}

.manage_panel_container .manage_container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.manage_panel_container .manage_container .header {
  width: 100%;
  height: 50px;
  border-bottom: 1px solid grey;
}

.manage_panel_container .manage_container .header>div {
  width: 100%;
  float: right;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.manage_panel_container .manage_container .devices_list {
  width: 100%;
  height: calc(100% - 60px);
  overflow: auto;
}

.manage_panel_container .state {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

<style>
.manage_panel_container .manage_container .md-button .md-ripple {
  padding: unset;
}
</style>
