<template>
   <md-dialog
      :md-active.sync="showDialog"
      @md-closed="closeDialog(false)"
   >
      <md-dialog-title>Create BMS network context</md-dialog-title>
      <md-dialog-content>
         <md-field>
            <label>Context Name</label>
            <md-input v-model="inputValue"></md-input>
         </md-field>

      </md-dialog-content>
      <md-dialog-actions>
         <md-button
            class="md-primary"
            @click="closeDialog(false)"
         >Close</md-button>
         <md-button
            class="md-primary"
            @click="closeDialog(true)"
            :disabled="!(inputValue.trim().length > 0)"
         >Save</md-button>
      </md-dialog-actions>
   </md-dialog>
</template>

<script>
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { CONTEXT_TYPE } from "../../js/constants";
export default {
   name: "createNetworkContextDialog",
   props: ["onFinised"],
   data() {
      return {
         showDialog: true,
         inputValue: "",
         title: "",
         label: "",
         createContext: "",
         selectedNode: null,
         context: null,
      };
   },
   methods: {
      opened(option) {
         // console.log(option);
      },
      removed(option) {
         if (option.closeResult && option.inputValue.length > 0) {
            SpinalGraphService.addContext(
               option.inputValue.trim(),
               CONTEXT_TYPE
            );
         }
         this.showDialog = false;
      },
      closeDialog(closeResult) {
         if (typeof this.onFinised === "function") {
            this.onFinised({ closeResult, inputValue: this.inputValue.trim() });
         }
      },
   },
};
</script>