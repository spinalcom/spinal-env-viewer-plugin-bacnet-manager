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
  <div class="unicast_container"
       v-if="!isLoading">
    <md-field class="contextInput">
      <label>Network Name</label>
      <md-input v-model="network.name"></md-input>
    </md-field>

    <div class="header">
      <div class="button_div addRow"
           @click="addRow">add row</div>

      <div class="button_div resetRow"
           @click="reset">reset</div>

      <div class="button_div upload_div"
           @click="uploadFile">
        click to upload file
      </div>
    </div>

    <md-content class="content md-scrollbar">
      <input-data-template v-for="item in network.ips"
                           :key="item.id"
                           :item="item"
                           @remove="removeItem"></input-data-template>
    </md-content>
  </div>

  <div class="loading"
       v-else>
    <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
  </div>
</template>

<script>
import InputDataTemplate from "./inputData.vue";
import spinalExcelManager from "spinal-env-viewer-plugin-excel-manager-service";

export default {
  name: "UnicastTemplate",
  props: { network: {} },
  components: {
    "input-data-template": InputDataTemplate,
  },
  data() {
    return {
      isLoading: false,
    };
  },
  methods: {
    addRow() {
      const id = this.network.ips.length;
      this.network.ips = [
        ...this.network.ips,
        { id: id, address: "", deviceId: "" },
      ];
    },

    reset() {
      this.network.ips = [{ id: 0, address: "", deviceId: "" }];
    },

    removeItem(id) {
      this.network.ips = this.network.ips.filter((el) => el.id !== id);
    },

    uploadFile() {
      let input = document.createElement("input");
      input.type = "file";
      input.accept =
        ".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel";
      input.click();

      input.addEventListener(
        "change",
        async (event) => {
          this.isLoading = true;

          try {
            const file = event.target.files[0];
            const dataJson = await spinalExcelManager.convertExcelToJson(file);
            const ips = [];

            for (const key in dataJson) {
              if (Object.hasOwnProperty.call(dataJson, key)) {
                const data = dataJson[key].map((element) => {
                  return {
                    address: this.getElementAddress(element),
                    deviceId: this.getElementDeviceId(element),
                  };
                });
                ips.push(...data);
              }
            }
            this.network.ips = ips.map((el, index) => {
              el.id = index;
              return el;
            });
            this.isLoading = false;
          } catch (error) {
            this.isLoading = false;
          }
        },
        false
      );
    },

    getElementAddress(element) {
      const address = "address";
      const key = Object.keys(element).find((el) => {
        return el.toLowerCase() === address;
      });

      if (key) return element[key];
      // for (const key of list) {
      //    if (element[key]) return element[key];
      // }
    },

    getElementDeviceId(element) {
      const deviceId = "deviceid";
      const key = Object.keys(element).find((el) => {
        return el.replace(" ", "").toLowerCase() === deviceId;
      });

      if (key) return element[key];

      // const list = [
      //    "Device ID",
      //    "DeviceID",
      //    "deviceID",
      //    "device ID",
      //    "deviceId",
      //    "device Id",
      // ];
      // for (const key of list) {
      //    if (element[key]) return element[key];
      // }
    },
  },
};
</script>

<style scoped>
.unicast_container {
  width: 100%;
  height: 100%;
  margin: auto;
}

.unicast_container .header {
  width: 99%;
  height: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.unicast_container .header .button_div {
  /* width: 50%; */
  flex: 0 1 32%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  text-transform: capitalize;
  border: 1px solid grey;
  border-radius: 10px;
}

.unicast_container .header .button_div.resetRow {
  color: #ff5252;
  border: 1px solid #ff5252;
}

.unicast_container .header .button_div.addRow {
  color: #448aff;
  border: 1px solid #448aff;
}

.unicast_container .header .button_div.upload_div {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px dashed grey;
}

.unicast_container .header .button_div:hover {
  cursor: pointer;
}

.unicast_container .content {
  width: 100%;
  height: calc(100% - 100px);
  overflow: hidden;
  overflow-y: auto;
}

.unicast_container .contextInput {
  min-height: unset;
}
</style>

<style>
.unicast_container .content .md-button .md-ripple {
  padding: unset;
}
</style>
