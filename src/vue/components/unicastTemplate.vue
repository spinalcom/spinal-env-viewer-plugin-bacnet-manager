<template>
   <div
      class="unicast_container"
      v-if="!isLoading"
   >

      <md-field class="contextInput">
         <label>Network Name</label>
         <md-input v-model="network.name"></md-input>
      </md-field>

      <div class="header">

         <div class="button_div">
            <div
               class="button"
               @click="addRow"
            >ADD ROW</div>
         </div>

         <div class="button_div">
            <div
               class="upload_div"
               @click="uploadFile"
            >
               click to upload file
            </div>
         </div>
      </div>

      <md-content class="content md-scrollbar">
         <input-data-template
            v-for="item in network.ips"
            :key="item.id"
            :item="item"
            @remove="removeItem"
         ></input-data-template>
      </md-content>
   </div>

   <div
      class="loading"
      v-else
   >
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
                  const dataJson = await spinalExcelManager.convertExcelToJson(
                     file
                  );
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
                  // console.log(this.network.ips);
                  this.isLoading = false;
               } catch (error) {
                  // console.log("error", error);
                  this.isLoading = false;
               }
            },
            false
         );
      },

      getElementAddress(element) {
         const list = ["Address", "ADDRESS", "address"];
         for (const key of list) {
            if (element[key]) return element[key];
         }
      },

      getElementDeviceId(element) {
         const list = [
            "Device ID",
            "DeviceID",
            "deviceID",
            "device ID",
            "deviceId",
            "device Id",
         ];

         for (const key of list) {
            if (element[key]) return element[key];
         }
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
   width: 50%;
   height: 100%;
}

.unicast_container .header .button_div .button {
   width: 100%;
   height: 100%;
   display: flex;
   justify-content: center;
   align-items: center;
   border: 1px solid grey;
}

.unicast_container .header .button_div .upload_div {
   width: 100%;
   height: 100%;
   display: flex;
   justify-content: center;
   align-items: center;
   border: 1px dashed grey;
}

.unicast_container .header .button_div .upload_div:hover,
.unicast_container .header .button_div .button:hover {
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

/* .unicast_container .header .button_div .contextInput {
   min-height: unset;
   margin: 0px;
} */
</style>

<style>
.unicast_container .content .md-button .md-ripple {
   padding: unset;
}
</style>