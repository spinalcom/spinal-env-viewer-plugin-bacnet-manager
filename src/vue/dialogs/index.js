import Vue from "vue";

import CreateGTBNetworkContextDialog from "./createContext.vue";
import ModifyTimeIntervalDialog from "./modifyTimeInterval.vue";
import AddOrganDialog from "./addOrgan.vue";

const { SpinalMountExtention } = require("spinal-env-viewer-panel-manager-service");



const dialogs = [{
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
}
]


for (let index = 0; index < dialogs.length; index++) {
   SpinalMountExtention.mount(dialogs[index]);
}