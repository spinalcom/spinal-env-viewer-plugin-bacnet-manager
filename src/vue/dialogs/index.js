import Vue from "vue";

import CreateGTBNetworkContextDialog from "./createContext.vue";
import ModifyTimeIntervalDialog from "./modifyTimeInterval.vue";
import AddOrganDialog from "./addOrgan.vue";
import LinkProfilToBmsDeviceDialog from "./linkToProfilDialog.vue";
import UnLinkProfilToBmsDeviceDialog from "./unLinkToProfilDialog.vue";
import LinkToBimAutomateDialog from "./linkToBimAutomate.vue";
import GetBacnetValueDialog from "./getBacnetValue.vue";
import CreateSubnetworkDialog from "./createSubNetwork.vue";

const { SpinalMountExtention } = require("spinal-env-viewer-panel-manager-service");


const dialogs = [
   {
      name: "createSubNetworkDialog",
      vueMountComponent: Vue.extend(CreateSubnetworkDialog),
      parentContainer: document.body
   },
   {
      name: "createGTBNetworkContextDialog",
      vueMountComponent: Vue.extend(CreateGTBNetworkContextDialog),
      parentContainer: document.body
   },
   {
      name: "modifyTimeIntervalDialog",
      vueMountComponent: Vue.extend(ModifyTimeIntervalDialog),
      parentContainer: document.body
   },
   {
      name: "addOrganDialogDialog",
      vueMountComponent: Vue.extend(AddOrganDialog),
      parentContainer: document.body
   },
   {
      name: "linkProfilToBmsDeviceDialog",
      vueMountComponent: Vue.extend(LinkProfilToBmsDeviceDialog),
      parentContainer: document.body
   },
   {
      name: "linkToBimAutomateDialog",
      vueMountComponent: Vue.extend(LinkToBimAutomateDialog),
      parentContainer: document.body
   },
   {
      name: "unLinkProfilToBmsDeviceDialog",
      vueMountComponent: Vue.extend(UnLinkProfilToBmsDeviceDialog),
      parentContainer: document.body
   },
   {
      name: "getBacnetValueDialog",
      vueMountComponent: Vue.extend(GetBacnetValueDialog),
      parentContainer: document.body
   }
]


for (let index = 0; index < dialogs.length; index++) {
   SpinalMountExtention.mount(dialogs[index]);
}