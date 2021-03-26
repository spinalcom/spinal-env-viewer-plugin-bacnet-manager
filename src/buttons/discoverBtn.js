import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");

const SIDEBAR = "GraphManagerSideBar";


class DiscoverNetworkBtn extends SpinalContextApp {
   constructor() {
      super(
         "Discover and Create BMS subnetwork",
         "This button allows to discover network and create", {
         icon: "network_check",
         icon_type: "in",
         backgroundColor: "#FF0000",
         fontColor: "#FFFFFF"
      }
      );
   }

   isShown(option) {
      let typeSelected = option.selectedNode.type.get();

      return Promise.resolve(typeSelected === "Network" ? true : -1);

   }

   action(option) {
      spinalPanelManagerService.openPanel("discoverNetworkPanel", option)
   }

}

const discoverNetworkBtn = new DiscoverNetworkBtn()

spinalContextMenuService.registerApp(SIDEBAR, discoverNetworkBtn, [3]);

export default discoverNetworkBtn;