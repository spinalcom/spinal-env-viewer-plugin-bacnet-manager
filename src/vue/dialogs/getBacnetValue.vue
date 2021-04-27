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
            class="loading"
            v-else-if="pageSelected === PAGES.loading"
         >
            <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
         </div>

         <div
            class="loading"
            v-else-if="pageSelected === PAGES.success"
         >
            <md-icon class="md-size-5x">done</md-icon>
         </div>

         <div
            class="loading"
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
import { SENSOR_TYPES } from "../../js/constants";
import { SpinalBacnetValueModel } from "spinal-model-bacnet";
import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";

export default {
   name: "GetBacnetValueDialog",
   props: ["onFinised"],
   data() {
      this.PAGES = {
         selection: 0,
         loading: 1,
         success: 2,
         error: 3,
      };

      return {
         sensor_types: SENSOR_TYPES,
         pageSelected: this.PAGES.selection,
         showDialog: true,
         node: undefined,
         context: undefined,
         graph: undefined,
         network: undefined,
      };
   },
   methods: {
      async opened(option) {
         this.pageSelected = this.PAGES.loading;

         this.node = SpinalGraphService.getRealNode(option.nodeId);
         this.context = SpinalGraphService.getRealNode(option.contextId);
         this.graph = option.graph;
         this.network = await this._getNetwork(option.contextId, option.nodeId);

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
         this.pageSelected = this.PAGES.loading;
         const sensors = this.sensor_types
            .filter((el) => el.checked)
            .map((el) => el.value);

         const model = new SpinalBacnetValueModel(
            this.graph,
            this.context,
            this.network,
            this.node,
            sensors
         );
         model.addToNode();
         const modelProcess = model.state.bind(() => {
            if (model.state.get() === "success") {
               model.state.unbind(modelProcess);
               model.remToNode().then(() => {
                  this.pageSelected = this.PAGES.success;
               });
            } else if (model.state.get() === "error") {
               model.state.unbind(modelProcess);
               model.remToNode().then(() => {
                  this.pageSelected = this.PAGES.error;
               });
            }
         });
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
   },
};
</script>


<style scoped>
.mdDialogContainer {
   width: 60%;
   height: 600px;
}

.mdDialogContainer .dialogTitle {
   text-align: center;
}

.mdDialogContainer .content {
   padding: 0 10px 24px 24px;
}

.mdDialogContainer .content .itemList {
   width: 100%;
   /* height: 100%; */
   display: flex;
   justify-content: center;
   align-items: flex-start;
   flex-wrap: wrap;
   padding-top: 20px;
}

.mdDialogContainer .content .itemList .itemList-item {
   width: 200px;
   height: 50px;
   margin-bottom: 10px;
   display: flex;
   align-items: center;
}

.mdDialogContainer .content .loading {
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