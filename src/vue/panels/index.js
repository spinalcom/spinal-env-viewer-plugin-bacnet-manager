import Vue from "vue";
import { SpinalForgeExtention } from "spinal-env-viewer-panel-manager-service_spinalforgeextention";

import DiscoverNetworkPanel from "./discoverNetworkPanel.vue";
import ManageDevicesPanel from "./manageDevicesPanel.vue";


const panels = [
   {
      name: "discoverNetworkPanel",
      vueMountComponent: Vue.extend(DiscoverNetworkPanel),
      panel: {
         title: "Discover network",
         closeBehaviour: "hide",
      },
      style: {
         minWidth: '462px',
         height: "670px",
         left: "400px",
      },
   },
   {
      name: "manageDevicesPanel",
      vueMountComponent: Vue.extend(ManageDevicesPanel),
      panel: {
         title: "Manage devices monitoring",
         closeBehaviour: "hide",
      },
      style: {
         minWidth: '620px',
         height: "670px",
         left: "400px",
      },
   }
];


for (const element of panels) {
   const panelExtension = SpinalForgeExtention.createExtention(element);
   SpinalForgeExtention.registerExtention(element.name, panelExtension);
}