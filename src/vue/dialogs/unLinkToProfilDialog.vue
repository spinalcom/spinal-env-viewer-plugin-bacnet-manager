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
  <md-dialog class="mdDialogContainer"
             :md-active.sync="showDialog"
             @md-closed="closeDialog(false)">
    <md-dialog-title class="dialogTitle">Unlink device to Profil
    </md-dialog-title>
    <md-dialog-content class="content">

      <div class="loading"
           v-if="pageSelected === PAGES.selection">
        Do you want unlink devices to profil ?
      </div>

      <div class="loading"
           v-else-if="pageSelected === PAGES.loading">
        <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
      </div>

      <div class="loading"
           v-else-if="pageSelected === PAGES.success">
        <md-icon class="md-size-5x">done</md-icon>
      </div>

      <div class="loading"
           v-else-if="pageSelected === PAGES.error">
        <md-icon class="md-size-5x">error_outline</md-icon>
      </div>

      <div class="progress-bar"
           v-else-if="pageSelected === PAGES.creation">
        <div class="percent-number">{{percent}} %</div>
        <md-progress-bar class="percent-bar"
                         md-mode="buffer"
                         :md-value="percent"></md-progress-bar>
      </div>

    </md-dialog-content>

    <md-dialog-actions>
      <md-button class="md-primary"
                 @click="closeDialog(false)">Close</md-button>

      <md-button class="md-primary"
                 :disabled="pageSelected !== PAGES.selection"
                 @click="unLink">Yes</md-button>

    </md-dialog-actions>
  </md-dialog>

</template>

<script>
import { SpinalGraphService } from "spinal-env-viewer-graph-service";

import {
  SpinalBmsDevice,
  SpinalBmsNetwork,
  SpinalBmsEndpoint,
} from "spinal-model-bmsnetwork";

// import { SpinalBacnetPluginService } from "../../../service";
// import deviceProfilService from "../../js/devices_profil_services";

import {
  DeviceProfileUtilities,
  LinkBmsDeviceService,
} from "spinal-env-viewer-plugin-network-tree-service";

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
      creation: 5,
    };
    // this.validMaps = new Map();
    // this.invalidMaps = new Map();
    return {
      resultMaps: new Map(),
      showDialog: true,
      pageSelected: this.PAGES.selection,
      percent: 0,
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
    async opened(option) {
      this.pageSelected = this.PAGES.loading;
      this.bmsContextId = option.bmsContextId;

      this.bmsDevices = await this.getAllDevices(
        this.bmsContextId,
        option.nodeId
      );

      this.pageSelected = this.PAGES.selection;
    },

    removed(option) {
      this.showDialog = false;
    },

    async unLink() {
      this.pageSelected = this.PAGES.creation;

      const ids = this.bmsDevices.map((el) => el.id);
      const listeLength = ids.length;
      let isError = false;

      while (!isError && ids.length > 0) {
        const id = ids.shift();
        try {
          await LinkBmsDeviceService.unLinkProfilToBmsDevice(
            this.bmsContextId,
            id
          );

          this.percent = Math.floor(
            (100 * (listeLength - ids.length)) / listeLength
          );
        } catch (error) {
          console.error(error);
          isError = true;
        }
      }

      if (isError) {
        this.pageSelected = this.PAGES.error;
        return;
      }

      this.pageSelected = this.PAGES.success;
    },

    closeDialog(closeResult) {
      if (typeof this.onFinised === "function") {
        this.onFinised(closeResult);
      }
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

    getAllDevices(contextId, nodeId) {
      return SpinalGraphService.findInContext(nodeId, contextId, (node) => {
        if (node.getType().get() === SpinalBmsDevice.nodeTypeName) {
          SpinalGraphService._addNode(node);
          return true;
        }
        return false;
      }).then((result) => {
        return result.map((el) => el.get());
      });
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
  width: 400px;
  height: 300px;
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

.mdDialogContainer .content .progress-bar {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.mdDialogContainer .content .progress-bar .percent-number {
  font-size: 1.8em;
  margin-bottom: 10px;
}

.mdDialogContainer .content .progress-bar .percent-bar {
  width: 90%;
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