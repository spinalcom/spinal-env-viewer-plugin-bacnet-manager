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
    <div class="manage_container"
         v-if="pageSelected === PAGES.selection">
      <div class="header">
        <div>
          <md-button class="md-icon-button"
                     v-tooltip="'start all devices'"
                     @click="startAllMonitoring">
            <md-icon class="md-primary">play_arrow</md-icon>
          </md-button>

          <md-button class="md-icon-button"
                     v-tooltip="'restart all devices'"
                     @click="restartAllMonitoring">
            <md-icon class="md-primary">replay</md-icon>
          </md-button>

          <md-button class="md-icon-button md-accent"
                     v-tooltip="'stop all devices'"
                     @click="stopAllMonitoring">
            <md-icon class="md-accent">stop</md-icon>
          </md-button>

          <md-button class="md-primary"
                     @click="changeTimeSeries(true)">Save all time series
          </md-button>

          <md-button class="md-accent"
                     @click="changeTimeSeries(false)">Stop saving all time
            series</md-button>
        </div>
      </div>

      <div class="devices_list">
        <device-monitoring v-for="device in devices"
                           :key="device.id"
                           :ref="device.id"
                           :device="device"
                           :profilId="device.profilId"
                           :context="context"
                           :graph="graph"></device-monitoring>
      </div>
    </div>
    <div class="state"
         v-else-if="pageSelected === PAGES.loading">
      <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
    </div>

    <div class="state"
         v-else-if="pageSelected === PAGES.error">
      <md-icon class="md-size-5x">close</md-icon>
    </div>
  </div>
</template>

<script>
import DeviceMonitoring from "../components/monitoring/devicemonitor.vue";
import { spinalEventEmitter } from "spinal-env-viewer-plugin-event-emitter";
import utilities from "../../js/utilities";
import { monitorState } from "../../js/monitorState";

const {
  spinalPanelManagerService,
} = require("spinal-env-viewer-panel-manager-service");

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
    spinalEventEmitter.on("deviceProfileContext-ChangeSupervision", () => {});
  },
  methods: {
    async opened({ context, graph, selectedNode }) {
      this.pageSelected = this.PAGES.loading;
      this.setPanelTitle(selectedNode.name);
      monitorState.clear();

      try {
        const [nodeId, contextId] = [selectedNode.id, context.id];
        this.context = context;
        this.graph = graph;
        this.selectedNode = selectedNode;

        await monitorState.init(graph, contextId, nodeId);
        const { devices, profilIds } = await this.getBmsDevices(
          contextId,
          nodeId
        );

        this.devices = devices;
        await this.saveProfilIds(profilIds);

        console.log(monitorState);

        this.pageSelected = this.PAGES.selection;
      } catch (error) {
        console.error(error);
        this.pageSelected = this.PAGES.error;
      }
    },

    closed() {},

    async getBmsDevices(contextId, id) {
      return utilities.getBmsDevices(contextId, id).then((devices) => {
        const profilIds = new Set([]);
        const promises = devices.map(async (el) => {
          const res = el.get();
          const profile = await utilities.getProfilLinkedToDevice(res.id);
          if (profile) {
            const { id } = profile;
            res.profilId = id;
            profilIds.add(id);
          }
          return res;
        });

        return Promise.all(promises)
          .then((devices) => {
            return {
              devices,
              profilIds: Array.from(profilIds),
            };
          })
          .catch((err) => {});
      });
    },

    saveProfilIds(profilIds) {
      const promises = profilIds.map((id) => monitorState.addProfile(id));
      return Promise.resolve(promises);
    },

    ////////////////////////////////////////////
    ////              CLIKS                   //
    ////////////////////////////////////////////

    async startAllMonitoring() {
      // const length = this.devices.length;

      // this.devices.forEach((device) => {
      //   const deviceId = device.id;
      //   const [ref] = this.$refs[deviceId];
      //   if (ref) {
      //     ref.startMonitoring();
      //   }
      // });
      const references = this.devices
        .map((el) => (this.$refs[el.id] ? this.$refs[el.id][0] : undefined))
        .filter((el) => !!el)
        .map((ref) => {
          return async () => {
            const model = await ref.startMonitoring();
            await utilities.waitModelReady(model);
          };
        });

      await utilities.consumeBatch(references, 30);

      // while (references.length > 0) {

      //   const model = await ref.startMonitoring();
      //   await utilities.waitModelReady(model);

      //   // await this.execFunction(refs, (ref) => ref.startMonitoring());
      //   // delay(2000);
      // }
    },

    async restartAllMonitoring() {
      const references = this.devices
        .map((el) => (this.$refs[el.id] ? this.$refs[el.id][0] : undefined))
        .filter((el) => !!el)
        .map((ref) => {
          return async () => {
            const model = await ref.restartMonitoring();
            await utilities.waitModelReady(model);
          };
        });

      await utilities.consumeBatch(references, 30);

      // const length = this.devices.length;

      // this.devices.forEach((device) => {
      //   const deviceId = device.id;
      //   const [ref] = this.$refs[deviceId];
      //   if (ref) {
      //     ref.restartMonitoring();
      //   }
      // });

      // const references = this.devices
      //   .map((el) => (this.$refs[el.id] ? this.$refs[el.id][0] : undefined))
      //   .filter((el) => !!el);

      // while (references.length > 0) {
      //   const refs = references.splice(0, 10);
      //   await this.execFunction(refs, (ref) => ref.restartMonitoring());
      //   // delay(2000);
      // }

      // for (const device of this.devices) {
      //   const deviceId = device.id;
      //   const [ref] = this.$refs[deviceId];
      //   if (ref) {
      //     await ref.restartMonitoring();
      //   }
      // }
    },

    async stopAllMonitoring() {
      // this.devices.forEach((device) => {
      //   const deviceId = device.id;
      //   const [ref] = this.$refs[deviceId];
      //   if (ref) {
      //     ref.stopMonitoring();
      //   }
      // });

      const references = this.devices
        .map((el) => (this.$refs[el.id] ? this.$refs[el.id][0] : undefined))
        .filter((el) => !!el);

      while (references.length > 0) {
        const refs = references.splice(0, 10);
        await this.execFunction(refs, (ref) => ref.stopMonitoring());
      }

      // for (const device of this.devices) {
      //   const deviceId = device.id;
      //   const [ref] = this.$refs[deviceId];
      //   if (ref) {
      //     await ref.stopMonitoring();
      //   }
      // }
    },

    changeTimeSeries(value) {
      this.devices.forEach((device) => {
        const deviceId = device.id;
        const [ref] = this.$refs[deviceId];
        if (ref) {
          ref.updateTimeSeries(value);
        }
      });

      // const length = this.devices.length;
      // let index = 0;
      // while (index <= length - 1) {
      //    const deviceId = this.devices[index].id;
      //    const [ref] = this.$refs[deviceId];
      //    if (ref) {
      //       ref.updateTimeSeries(value);
      //    }
      //    index++;
      // }
    },

    setPanelTitle(title) {
      spinalPanelManagerService.panels.manageDevicesPanel.panel.setTitle(
        `Manage devices monitoring : ${title}`
      );
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

.manage_panel_container .manage_container .header > div {
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
