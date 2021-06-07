<template>
   <div
      class="manage_container"
      v-if="pageSelected === PAGES.selection"
   >
      <div class="header">

         <md-button
            class="md-icon-button"
            v-tooltip="'start all devices'"
            @click="startAllMonitoring"
         >
            <md-icon class="md-primary">play_arrow</md-icon>
         </md-button>

         <md-button
            class="md-icon-button"
            v-tooltip="'restart all devices'"
            @click="startAllMonitoring"
         >
            <md-icon class="md-primary">replay</md-icon>
         </md-button>

         <md-button
            class="md-icon-button md-accent"
            v-tooltip="'stop all devices'"
            @click="stopAllMonitoring"
         >
            <md-icon class="md-accent">stop</md-icon>
         </md-button>
         <!-- 
         <md-button class="md-icon-button">
            <md-icon class="md-primary">star</md-icon>
         </md-button> -->
      </div>

      <div class="devices_list md-scrollbar">

         <div
            class="device"
            v-for="device in devices"
            :key="device.info.id"
         >
            <div
               class="name"
               v-tooltip="device.info.name"
            >
               {{device.info.name}}
            </div>

            <div class="state">
               {{getState(device.model)}}
            </div>

            <div class="actions">

               <md-button
                  class="md-icon-button md-primary"
                  v-tooltip="'start'"
                  :disabled="disabledStart(device.model)"
                  @click="startMonitoring(device)"
               >
                  <md-icon>play_arrow</md-icon>
               </md-button>

               <md-button
                  class="md-icon-button md-primary"
                  v-tooltip="'restart'"
                  :disabled="disabledRestart(device.model)"
                  @click="startMonitoring(device)"
               >
                  <md-icon>replay</md-icon>
               </md-button>

               <md-button
                  class="md-icon-button md-accent"
                  v-tooltip="'stop'"
                  :disabled="disabledStop(device.model)"
                  @click="stopMonitoring(device)"
               >
                  <md-icon>stop</md-icon>
               </md-button>

               <!-- <md-button class="md-icon-button">
                  <md-icon class="md-primary">star</md-icon>
               </md-button> -->

            </div>
         </div>

      </div>
   </div>
   <div
      class="state"
      v-else-if="pageSelected === PAGES.loading"
   >
      <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
   </div>
</template>

<script>
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { SpinalBmsDevice } from "spinal-model-bmsnetwork";
import { SpinalListenerModel } from "spinal-model-bacnet";

import utilities from "../../js/utilities";

export default {
   name: "manageDevicesPanel",
   components: {},
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

      return {
         devices: [],
         pageSelected: this.PAGES.creation,
      };
   },
   methods: {
      async opened(params) {
         this.pageSelected = this.PAGES.loading;
         // const { selectedNode, context, graph } = params;

         this.context = params.context;
         this.graph = params.graph;
         this.selectedNode = params.selectedNode;

         this.devices = await this.getBmsDevices(
            this.context.id,
            this.selectedNode.id
         );
         this.pageSelected = this.PAGES.selection;
      },

      closed() {},

      async getBmsDevices(contextId, id) {
         const realNode = SpinalGraphService.getRealNode(id);
         if (realNode.getType().get() === SpinalBmsDevice.nodeTypeName) {
            return [
               {
                  info: realNode.info.get(),
                  node: realNode,
                  model: await utilities.getModel(realNode),
               },
            ];
         }
         const res = [];

         return SpinalGraphService.findInContext(id, contextId, (node) => {
            if (node.getType().get() === SpinalBmsDevice.nodeTypeName) {
               SpinalGraphService._addNode(node);
               res.push({
                  info: node.info.get(),
                  node,
               });
               return true;
            }
            return false;
         }).then(() => {
            const promises = res.map(async (el) => {
               el.model = await utilities.getModel(el.node);
               return el;
            });

            return Promise.all(promises);
         });
      },

      getState(model) {
         return model.listen && model.listen.get() ? "Running" : "Stopped";
      },

      ////////////////////////////////////////////
      ////              CLIKS                   //
      ////////////////////////////////////////////

      async startAllMonitoring() {
         const length = this.devices.length;
         let index = 0;

         while (index <= length - 1) {
            const device = this.devices[index];
            await this.startMonitoring(device);
            index++;
         }
      },

      async stopAllMonitoring() {
         const length = this.devices.length;
         let index = 0;

         while (index <= length - 1) {
            const device = this.devices[index];
            await this.stopMonitoring(device);
            index++;
         }
      },

      async startMonitoring(device) {
         const deviceId = device.info.id;
         const contextId = this.context.id;

         const model = device.model;
         const monitor = await utilities.getMonitoringInfo(deviceId, contextId);

         if (model != -1) {
            if (!monitor) {
               model.listen.set(false);
            } else {
               model.monitor.set(monitor);
               model.listen.set(true);
            }
         } else {
            const graph = this.graph;
            const context = SpinalGraphService.getRealNode(contextId);
            const realNode = SpinalGraphService.getRealNode(deviceId);
            const network = await utilities.getNetwork(deviceId, contextId);

            const organ = await utilities.getOrgan(
               network.getId().get(),
               contextId
            );

            const spinalListener = new SpinalListenerModel(
               graph,
               context,
               network,
               realNode,
               organ,
               monitor
            );
            realNode.info.add_attr({
               listener: new Ptr(spinalListener),
            });
         }
      },

      stopMonitoring(device) {
         if (device.model != -1 && device.model.listen) {
            device.model.listen.set(false);
         }
      },

      ////////////////////////////////////////////
      ////              DISABLED                //
      ////////////////////////////////////////////

      disabledRestart(model) {
         return !(model && model !== -1 && model.listen && model.listen.get());
      },

      disabledStart(model) {
         return model && model !== -1 && model.listen && model.listen.get();
      },

      disabledStop(model) {
         return !(model && model !== -1 && model.listen && model.listen.get());
      },
   },
};
</script>


<style scoped>
.manage_container {
   width: 100%;
   height: calc(100% - 15px);
   overflow: hidden;
}

.manage_container .header {
   width: 100%;
   height: 50px;
   border-bottom: 1px solid grey;
   display: flex;
   justify-content: flex-end;
   align-items: center;
}

.manage_container .devices_list {
   width: 100%;
   height: calc(100% - 60px);
   overflow: auto;
}

.manage_container .devices_list .device {
   width: 96%;
   height: 50px;
   display: flex;
   justify-content: space-between;
   align-items: center;
   margin: auto;
   /* border-bottom: 1px solid gray; */
}

.manage_container .devices_list .device .name,
.manage_container .devices_list .device .state {
   width: 25%;
   overflow: hidden;
   white-space: nowrap;
   text-overflow: ellipsis;
}

.manage_container .devices_list .device .state {
   color: grey;
   text-align: center;
}

.manage_container .devices_list .device .actions {
   width: 50%;
   display: flex;
   justify-content: flex-end;
}
</style>

<style>
.manage_container .md-button .md-ripple {
   padding: unset;
}
</style>