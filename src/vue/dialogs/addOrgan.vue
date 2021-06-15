<template>
   <md-dialog
      class="selectOrganDialog"
      :md-active.sync="showDialog"
      @md-closed="closeDialog(false)"
   >
      <md-dialog-title class="title">Add BMS organ</md-dialog-title>

      <md-dialog-content>
         <md-table
            v-model="organsDisplayed"
            md-sort="name"
            md-sort-order="asc"
            md-fixed-header
         >
            <md-table-toolbar>
               <h1 class="md-title">Organs</h1>
            </md-table-toolbar>

            <md-table-empty-state md-label="No organ found">
            </md-table-empty-state>

            <md-table-row
               slot="md-table-row"
               slot-scope="{ item }"
            >
               <md-table-cell md-label="Name">{{ item.name }}</md-table-cell>
               <md-table-cell md-label="Type">{{ item.type }}</md-table-cell>
               <md-table-cell md-label="Action">
                  <organ-button
                     :ref="item._server_id"
                     :server_id="item._server_id"
                     :contextId="contextId"
                     @add="createAndLinkNode"
                     @remove="removeAndUnlinkNode"
                  ></organ-button>
               </md-table-cell>

            </md-table-row>
         </md-table>
      </md-dialog-content>

      <md-dialog-actions>
         <md-button
            class="md-primary"
            @click="closeDialog(false)"
         >Close</md-button>
         <!-- <md-button
            class="md-primary"
            @click="closeDialog(true)"
         >Save</md-button> -->
      </md-dialog-actions>
   </md-dialog>
</template>

<script>
import { SpinalBacnetPluginService } from "../../../service";
import OrganBtn from "../components/addOrganBtn.vue";
export default {
   name: "addOrganDialog",
   props: ["onFinised"],
   components: {
      "organ-button": OrganBtn,
   },
   data() {
      // this.organs = new Lst();

      return {
         contextId: undefined,
         organsDisplayed: [],
         showDialog: true,
      };
   },
   methods: {
      opened(option) {
         // this.organs.bind(() => {
         //    this.organsDisplayed = this.organs.get();
         // });
         this.contextId = option.context.id.get();
         this.getOrgans();
      },

      removed(option) {
         if (option.closeResult) {
         }
         this.showDialog = false;
      },

      closeDialog(closeResult) {
         if (typeof this.onFinised === "function") {
            this.onFinised({ closeResult });
         }
      },

      async getOrgans() {
         // const organs = [];
         const connection = spinal.spinalSystem.conn;
         this.organsDisplayed = await SpinalBacnetPluginService.getOrgans(
            connection
         );
         // // spinalCore.load(connection,);
         // spinalCore.load_type(connection, "SpinalOrganConfigModel", (file) => {
         //    // const obj = {
         //    //    name: file.name.get(),
         //    //    type: file.type.get(),
         //    //    server_id: file._server_id,
         //    // };
         //    this.organsDisplayed.push(file);
         // });
      },

      createAndLinkNode(server_id) {
         SpinalBacnetPluginService.addToReference(server_id, this.contextId)
            .then((result) => {
               this.$refs[server_id].isLinked = true;
            })
            .catch(() => {
               this.$refs[server_id].isLinked = false;
            });
      },

      removeAndUnlinkNode(server_id) {
         SpinalBacnetPluginService.removeToReference(server_id, this.contextId)
            .then(() => {
               this.$refs[server_id].isLinked = false;
            })
            .catch((err) => {
               this.$refs[server_id].isLinked = false;
            });
      },

      existeInReference(server_id) {
         return SpinalBacnetPluginService.isReferencedInContext(
            server_id,
            this.contextId
         );
      },
   },
};
</script>

<style scoped>
.selectOrganDialog {
   width: 700px;
   height: 500px;
}

.selectOrganDialog .title {
   text-align: center;
}
</style>