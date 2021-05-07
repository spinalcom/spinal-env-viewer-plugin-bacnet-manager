<template>
   <md-dialog
      class="mdDialogContainer"
      :md-active.sync="showDialog"
      @md-closed="closeDialog(false)"
   >
      <md-dialog-title class="dialogTitle">Get Bacnet Value</md-dialog-title>
      <md-dialog-content class="content">

         <div
            class="itemList"
            v-if="pageSelected === PAGES.selection"
         >
            <div
               class="itemList-item"
               v-for="item in sensor_types"
               :key="item.id"
            >
               <md-checkbox
                  class="md-primary"
                  v-model="item.checked"
               />
               <!-- :value="item.checked" -->
               <span class="md-list-item-text">{{item.name}}</span>
            </div>
         </div>

         <div
            class="devicesProgress"
            v-else-if="pageSelected === PAGES.creation"
         >

            <div
               class="device"
               v-for="device in nodes"
               :key="device.id"
            >
               <div class="name">{{device.info.name}}</div>
               <div
                  class="progress-bar"
                  v-if="device.progress != -1"
               >
                  <div class="progress-value">
                     <md-progress-bar
                        md-mode="buffer"
                        :md-value="device.progress"
                     ></md-progress-bar>
                  </div>

                  <div class="progress-number">{{device.progress}} %</div>
               </div>

               <div
                  class="progress-bar"
                  v-else
               >
                  <div
                     class="message"
                     :class="device.message.id"
                  >{{device.message.text}}</div>
               </div>
            </div>

         </div>

         <div
            class="state"
            v-else-if="pageSelected === PAGES.loading"
         >
            <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
         </div>

         <div
            class="state"
            v-else-if="pageSelected === PAGES.success"
         >
            <md-icon class="md-size-5x">done</md-icon>
         </div>

         <div
            class="state"
            v-else-if="pageSelected === PAGES.error"
         >
            <md-icon class="md-size-5x">error_outline</md-icon>
         </div>

      </md-dialog-content>

      <md-dialog-actions>
         <md-button
            class="md-primary"
            @click="closeDialog(false)"
         >Close</md-button>

         <md-button
            class="md-primary"
            :disabled='disabled()'
            @click="getBacnetValue"
         >GET Bacnet</md-button>
      </md-dialog-actions>
   </md-dialog>
</template>


<script>
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { SENSOR_TYPES, MESSAGES } from "../../js/constants";
import { SpinalBacnetValueModel } from "spinal-model-bacnet";
import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";

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

      return {
         sensor_types: Object.assign([], SENSOR_TYPES),
         pageSelected: this.PAGES.creation,
         showDialog: true,
         nodes: undefined,
         context: undefined,
         graph: undefined,
         network: undefined,
      };
   },
   methods: {
      async opened(option) {
         this.pageSelected = this.PAGES.loading;
         this.context = SpinalGraphService.getRealNode(option.contextId);
         this.graph = option.graph;

         this.nodes = option.devices.map((el) => ({
            info: el.get(),
            progress: -1,
            message: this.MESSAGES.wait,
         }));

         if (option.networkId) {
            this.network = SpinalGraphService.getRealNode(option.networkId);
         } else {
            this.network = await this._getNetwork(
               option.contextId,
               option.nodeId
            );
         }

         this.pageSelected = this.PAGES.selection;
      },

      removed(save) {
         if (save) {
         }
         this.showDialog = false;
      },

      disabled() {
         if (this.pageSelected !== this.PAGES.selection) return true;

         const found = this.sensor_types.find((el) => el.checked);
         if (found) return false;

         return true;
      },

      getBacnetValue() {
         this.pageSelected = this.PAGES.creation;
         const sensors = this.sensor_types
            .filter((el) => el.checked)
            .map((el) => el.value);

         const iterator = [...this.nodes];

         this.createValue(iterator, sensors);
      },

      createValue(iterator, sensors) {
         console.log("inside createValue...");
         const value = iterator.shift();

         if (value && this.showDialog) {
            // const value = next.value;
            const realNode = SpinalGraphService.getRealNode(value.info.id);

            const model = new SpinalBacnetValueModel(
               this.graph,
               this.context,
               this.network,
               realNode,
               sensors
            );
            model.addToNode();
            const modelProcess = model.state.bind(() => {
               switch (model.state.get()) {
                  case "recover":
                     console.log("recovering...");
                     value.message = this.MESSAGES.recover;
                     value.progress = -1;
                     break;
                  case "progress":
                     console.log("progress...");
                     model.progress.bind(() => {
                        value.progress = model.progress.get();
                     });
                     break;
                  case "success":
                  case "error":
                     console.log("success or error");
                     model.state.unbind(modelProcess);
                     value.message = this.MESSAGES[model.state.get()];
                     value.progress = -1;

                     this.createValue(iterator, sensors);
                     break;

                  default:
                     break;
               }

               // if (model.state.get() === "success") {
               //    model.state.unbind(modelProcess);
               //    value.message = this.MESSAGES.success;
               //    value.progress = -1;

               //    this.createValue(iterator, iterator.next(), sensors);
               // } else if (model.state.get() === "error") {
               //    model.state.unbind(modelProcess);
               //    value.message = this.MESSAGES.error;
               //    value.progress = -1;

               //    this.createValue(iterator, iterator.next(), sensors);
               // }
            });
         } else {
            // this.pageSelected = this.PAGES.success;
         }
      },

      closeDialog(closeResult) {
         if (typeof this.onFinised === "function") {
            this.onFinised(closeResult);
         }
      },

      async _getNetwork(contextId, nodeId) {
         const networks = await SpinalGraphService.getChildrenInContext(
            contextId,
            contextId
         );
         const parentId = await this._getParent(nodeId);

         for (const network of networks) {
            const id = network.id.get();
            const childId = SpinalGraphService.getChildrenIds(id);
            if (childId.indexOf(parentId) !== -1) {
               return SpinalGraphService.getRealNode(id);
            }
         }
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

      *convertListToIterator(devices) {
         yield* devices;
      },
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

.mdDialogContainer
   .content
   .devicesProgress
   .device
   .progress-bar
   .message.waiting {
   color: grey;
}
.mdDialogContainer
   .content
   .devicesProgress
   .device
   .progress-bar
   .message.success {
   color: green;
}
.mdDialogContainer
   .content
   .devicesProgress
   .device
   .progress-bar
   .message.error {
   color: #ff5252;
}

.mdDialogContainer
   .content
   .devicesProgress
   .device
   .progress-bar
   .progress-number {
   width: 25%;
   text-align: center;
}

.mdDialogContainer
   .content
   .devicesProgress
   .device
   .progress-bar
   .progress-value {
   width: 75%;
}

.mdDialogContainer .content .itemList {
   width: 100%;
   /* height: 100%; */
   display: flex;
   justify-content: space-between;
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