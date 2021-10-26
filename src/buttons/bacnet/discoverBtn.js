import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");
import { BACNET_ORGAN_TYPE } from "spinal-model-bacnet";
import { SpinalBmsNetwork } from "spinal-model-bmsnetwork";

import utilities from "../../js/utilities";

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

   async isShown(option) {
      const  typeSelected = option.selectedNode.type.get();
      const id = option.selectedNode.id.get();
      const contextId = option.context.id.get();

      if(typeSelected === BACNET_ORGAN_TYPE) return true;

      if(typeSelected === SpinalBmsNetwork.nodeTypeName) {
         const organ = await utilities.getOrgan(id, contextId);

         return organ && organ.type.get() == BACNET_ORGAN_TYPE ? true : -1;
      }
      
      
      return -1;
   }

   action(option) {
      spinalPanelManagerService.openPanel("discoverNetworkPanel", option)
   }

}

const discoverNetworkBtn = new DiscoverNetworkBtn()

spinalContextMenuService.registerApp(SIDEBAR, discoverNetworkBtn, [3]);

export default discoverNetworkBtn;