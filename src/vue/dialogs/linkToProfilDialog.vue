<template>
   <md-dialog
      class="mdDialogContainer"
      :md-active.sync="showDialog"
      @md-closed="closeDialog(false)"
   >
      <md-dialog-title class="dialogTitle">Link Automates to Profil
      </md-dialog-title>
      <md-dialog-content class="content">
         <link-component
            v-if="pageSelected === PAGES.selection"
            :context_title="'Profils'"
            :category_title="'Categories'"
            :group_title="'Devices'"
            :data="data"
            :profils="profils"
            :devices="devices"
            :contextSelected="contextSelected"
            :profilSelected="profilSelected"
            :deviceSelected="deviceSelected"
            @selectContext="selectContext"
            @selectProfil="selectProfil"
            @selectDevice="selectDevice"
         ></link-component>

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
            :disabled="disabled()"
            @click="createLinks"
         >Link</md-button>

      </md-dialog-actions>
   </md-dialog>

</template>

<script>
import { SpinalBacnetPluginService } from "../../../service";
import deviceProfilService from "../../js/devices_profil_services";
import LinkComponent from "../components/links/LinkComponent.vue";

export default {
   name: "dialogComponent",
   components: {
      "link-component": LinkComponent,
   },
   props: ["onFinised"],
   data() {
      this.bmsDevices;
      this.bmsContextId;

      this.PAGES = {
         selection: 0,
         result: 1,
         loading: 2,
         success: 3,
         error: 4,
      };
      // this.validMaps = new Map();
      // this.invalidMaps = new Map();
      return {
         resultMaps: new Map(),
         showDialog: true,
         pageSelected: this.PAGES.selection,

         data: [],
         profils: [],
         devices: [],

         contextSelected: undefined,
         profilSelected: undefined,
         deviceSelected: undefined,
      };
   },
   mounted() {
      // EventBus.$on("itemCreated", (id) => {
      //    this.pageSelected = this.PAGES.loading;
      //    this.getAllData().then(() => {
      //       this.pageSelected = this.PAGES.selection;
      //    });
      // });
   },
   methods: {
      opened(option) {
         this.pageSelected = this.PAGES.loading;
         this.bmsDevices = option.bmsDevices;
         this.bmsContextId = option.bmsContextId;

         this.getAllData().then(() => {
            this.pageSelected = this.PAGES.selection;
         });
      },

      removed(option) {
         this.showDialog = false;
      },

      createLinks() {
         this.pageSelected = this.PAGES.loading;
         const promises = this.bmsDevices.map(({ id }) => {
            return SpinalBacnetPluginService.linkProfilToDevice(
               this.bmsContextId,
               id,
               this.deviceSelected
            );
         });
      },

      closeDialog(closeResult) {
         if (typeof this.onFinised === "function") {
            this.onFinised(closeResult);
         }
      },

      getAllData() {
         return deviceProfilService
            .getDeviceContextTreeStructure()
            .then((result) => {
               this.data = result;
               this.updateProfils();
               return;
            });
      },

      disabled() {
         return !this.deviceSelected;
      },

      getItemsList(deviceId) {
         const found = this.devices.find((el) => el.id === deviceId);
         if (found) return found.itemList;
      },

      /* Selection */
      selectContext(id) {
         this.contextSelected = id;
      },

      selectProfil(id) {
         this.profilSelected = id;
      },

      selectDevice(id) {
         this.deviceSelected = id;
      },

      /* Update */
      updateProfils() {
         this.categories = [];
         if (this.contextSelected) {
            let val = this.data.find((el) => el.id === this.contextSelected);
            if (val) this.profils = val.profils;
         }
      },

      updateDevices() {
         this.devices = [];
         if (this.profilSelected) {
            let val = this.profils.find((el) => el.id === this.profilSelected);
            if (val) this.devices = val.devices;
         }
      },
   },
   watch: {
      async contextSelected() {
         await this.updateProfils();
         this.profilSelected = undefined;
      },
      async profilSelected() {
         this.updateDevices();
         this.deviceSelected = undefined;
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
   /* display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  overflow: auto; */
}
.mdDialogContainer .content .results .result-component {
   width: 100%;
   height: 70px;
   border: 1px solid gray;
   margin: 5px 0 5px 0;
}
/* .mdDialogContainer .content {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
}
.mdDialogContainer .content .section {
  width: 33%;
  border: 1px solid grey;
  border-radius: 4% 4% 0 0;
  padding: 15px;
} */
/* .mdIcon {
  display: flex;
  align-items: center;
} */
</style>

<style>
.mdDialogContainer .md-dialog-container {
   max-width: 100%;
   max-height: 100%;
}
</style>