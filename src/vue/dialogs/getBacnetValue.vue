<template>
   <md-dialog class="mdDialogContainer" :md-active.sync="showDialog" @md-closed="closeDialog(false)">
      <md-dialog-title class="dialogTitle">Get Bacnet Values</md-dialog-title>
      <md-dialog-content class="content">

         <!-- Selection Page (select sensor types) -->
         <div class="itemList" v-if="pageSelected === PAGES.selection">
            <div class="itemList-item" v-for="item in sensor_types" :key="item.id">
               <md-checkbox class="md-primary" v-model="item.checked">
                  {{ item.name }}
               </md-checkbox>
               <!-- <span class="md-list-item-text"></span> -->
            </div>
         </div>

         <!-- Devices Progress Page -->
         <div class="devicesProgress" v-else-if="pageSelected === PAGES.creation">

            <div class="device" v-for="device in devices" :key="device.info.id">
               <div class="name">{{ device.info.name }}</div>

               <div class="progress-bar" v-if="device.progress != -1">
                  <div class="progress-value">
                     <md-progress-bar md-mode="buffer" :md-value="device.progress"></md-progress-bar>
                  </div>

                  <div class="progress-number">{{ device.progress }} %</div>
               </div>

               <div class="progress-bar" v-else>
                  <div class="message" :class="device.message.id">{{ device.message.text }}</div>
               </div>
            </div>

         </div>

         <!-- State Page -->
         <div class="state" v-else>
            <md-progress-spinner v-if="pageSelected === PAGES.loading" md-mode=" indeterminate"></md-progress-spinner>
            <md-icon class="md-size-5x" v-else-if="pageSelected === PAGES.success">done</md-icon>
            <md-icon class="md-size-5x" v-else-if="pageSelected === PAGES.error">error_outline</md-icon>
         </div>

      </md-dialog-content>

      <md-dialog-actions>
         <md-button class="md-primary" @click="closeDialog(false)">Close</md-button>

         <md-button class="md-primary" :disabled='disabled()' @click="getAllBacnetValues">GET Bacnet</md-button>
      </md-dialog-actions>
   </md-dialog>
</template>


<script>
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { SENSOR_TYPES, MESSAGES } from "../../js/constants";
import { SpinalBacnetValueModel, BACNET_VALUES_STATE } from "spinal-model-bacnet";
import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";
import Utilities from "../../js/utilities";

export default {
   name: "GetBacnetValueDialog",
   props: ["onFinised"],
   data() {
      this.PAGES = {
         selection: 0,
         loading: 1,
         creation: 2,
         success: 3,
         error: 4,
      };

      this.MESSAGES = MESSAGES;
      this.context = null;
      this.graph = null;
      this.selectedNode = null;
      this.network = null;

      return {
         sensor_types: [...SENSOR_TYPES],
         pageSelected: this.PAGES.creation,
         showDialog: true,
         devices: []
      }
   },
   methods: {
      async opened(option) {
         this.pageSelected = this.PAGES.loading;

         this.context = option.context;
         this.graph = option.graph;
         this.selectedNode = option.selectedNode;


         const promises = [
            Utilities.getNetwork(this.selectedNode, this.context),
            this.getBmsDevices(this.context, this.selectedNode)
         ];

         const [network, devices] = await Promise.all(promises);

         this.network = network;
         this.devices = devices;

         // this.network = await this._getNetwork(this.context, this.selectedNode);

         this.pageSelected = this.PAGES.selection;
      },

      removed(save) {
         if (save) { }

         this.showDialog = false;
      },

      disabled() {
         if (this.pageSelected !== this.PAGES.selection) return true;

         const found = this.sensor_types.find((el) => el.checked);
         if (found) return false;

         return true;
      },

      getSensorSelected() {
         return this.sensor_types.reduce((list, sensor) => {
            if (sensor.checked) list.push(sensor.value);
            return list;
         }, [])

      },

      closeDialog(closeResult) {
         if (typeof this.onFinised === "function") {
            this.onFinised(closeResult);
         }
      },

      async getAllBacnetValues() {
         this.pageSelected = this.PAGES.creation;
         const sensors = this.getSensorSelected();

         const devices = [...this.devices];
         const organ = await Utilities.getOrgan(this.network, this.context);

         this.getBacnetVal(devices, sensors, organ);
      },

      async getBacnetVal(devices, sensors, organ) {

         while (devices.length > 0 && this.showDialog) {
            const device = devices.shift();
            const listenerModel = new SpinalBacnetValueModel(this.graph, this.context, organ, this.network, device.node, sensors);
            await listenerModel.addToGraph();

            // bind the listener state to update the progress and message of the device
            // this function wait until the process is finished (success or error) before going to the next device
            await this.bindListenerState(listenerModel, device);

         }

         // const value = next.value;

      },

      bindListenerState(model, device) {
         return new Promise((resolve) => {
            let progressProcess, modelProcess;

            modelProcess = model.state.bind(() => {
               const state = model.state.get();

               switch (state) {
                  case BACNET_VALUES_STATE.recover:
                     device.message = this.MESSAGES.recover;
                     device.progress = -1;
                     break;

                  case BACNET_VALUES_STATE.progress:
                     progressProcess = model.progress.bind(() => device.progress = model.progress.get());
                     break;

                  case BACNET_VALUES_STATE.success:
                  case BACNET_VALUES_STATE.error:
                     model.state.unbind(modelProcess);
                     model.progress.unbind(progressProcess);

                     device.message = this.MESSAGES[state];
                     device.progress = -1;

                     resolve(state === BACNET_VALUES_STATE.success);
                     break;
               }
            });
         });
      },



      // async _getNetwork(context, startNode) {


      // const info = SpinalGraphService.getInfo(nodeId);
      // const nodeType = info.type.get();

      // if (nodeType === SpinalBmsNetwork.nodeTypeName) {
      //    const parents = await SpinalGraphService.getParents(nodeId, [SpinalBmsNetwork.relationName]);
      //    const organ = parents.find((parent) => parent.type.get() === SpinalOrganConfigModel.TYPE);
      //    // console.log("organ", organ);
      //    if (organ) return SpinalGraphService.getRealNode(organ.id.get());
      // } else {
      //    const networks = await SpinalGraphService.getChildrenInContext(
      //       contextId,
      //       contextId
      //    );
      //    const parentId = await this._getParent(nodeId);

      //    for (const network of networks) {
      //       const id = network.id.get();
      //       const childId = SpinalGraphService.getChildrenIds(id);
      //       if (childId.indexOf(parentId) !== -1) {
      //          return SpinalGraphService.getRealNode(id);
      //       }
      //    }
      // }
      // },

      // _getOrgan(network) {
      //    if (network) {
      //       return network.getElement();
      //    }
      // },

      async getBmsDevices(context, startNode) {
         let devices = await Utilities.getBmsDevices(context, startNode);
         return devices.map((device) => ({ info: device.info.get(), progress: -1, message: this.MESSAGES.wait, node: device }));
      },

      async _getParent(nodeId) {
         const realNode = SpinalGraphService.getRealNode(nodeId);
         const parents = await realNode.getParents([
            SpinalBmsDevice.relationName,
         ]);
         const found = parents.find(
            (el) => el.getType().get() === SpinalBmsNetwork.nodeTypeName
         );
         if (found) {
            SpinalGraphService._addNode(found);
            return found.getId().get();
         }
      },

      // async getNetworkId(nodeId) {

      // },
   },
};
</script>


<style scoped>
.mdDialogContainer {
   width: 750px;
   height: 500px;
}

.mdDialogContainer .dialogTitle {
   text-align: center;
}

.mdDialogContainer .content {
   padding: 0 10px 24px 24px;
}

.mdDialogContainer .content .devicesProgress {
   width: 100%;
   height: 100%;
   display: flex;
   flex-direction: column;
   overflow: hidden;
   overflow-y: auto;
}

.mdDialogContainer .content .devicesProgress .device {
   width: 95%;
   min-height: 50px;
   display: flex;
   justify-content: space-between;
   padding: 0 5px;
   align-items: center;
   border-top: 1px solid grey;
}

.mdDialogContainer .content .devicesProgress .device .name {
   width: 70%;
   font-size: 1.2em;
   overflow: hidden;
   text-overflow: ellipsis;
   white-space: nowrap;
}

.mdDialogContainer .content .devicesProgress .device .progress-bar {
   width: 30%;
   display: flex;
   justify-content: space-between;
   align-items: center;
}

.mdDialogContainer .content .devicesProgress .device .progress-bar .message {
   text-align: center;
}

.mdDialogContainer .content .devicesProgress .device .progress-bar .message.waiting {
   color: grey;
}

.mdDialogContainer .content .devicesProgress .device .progress-bar .message.success {
   color: green;
}

.mdDialogContainer .content .devicesProgress .device .progress-bar .message.error {
   color: #ff5252;
}

.mdDialogContainer .content .devicesProgress .device .progress-bar .progress-number {
   width: 25%;
   text-align: center;
}

.mdDialogContainer .content .devicesProgress .device .progress-bar .progress-value {
   width: 75%;
}

.mdDialogContainer .content .itemList {
   width: 100%;
   /* height: 100%; */
   display: flex;
   /* justify-content: space-between; */
   /* align-items: flex-start; */
   flex-wrap: wrap;
   padding-top: 20px;
}

.mdDialogContainer .content .itemList .itemList-item {
   /* width: 200px; */
   width: 33%;
   height: 50px;
   margin-bottom: 10px;
   display: flex;
   align-items: center;
}

.mdDialogContainer .content .state {
   width: 100%;
   height: 100%;
   display: flex;
   justify-content: center;
   align-items: center;
}

.mdDialogContainer .content .results {
   width: 100%;
   height: 100%;
}

.mdDialogContainer .content .results .result-component {
   width: 100%;
   height: 70px;
   border: 1px solid gray;
   margin: 5px 0 5px 0;
}
</style>