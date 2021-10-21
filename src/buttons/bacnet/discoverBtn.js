import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");
import { SpinalOrganConfigModel, BACNET_ORGAN_TYPE } from "spinal-model-bacnet";
import { SpinalBmsNetwork } from "spinal-model-bmsnetwork";

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

      if(typeSelected === BACNET_ORGAN_TYPE) return true;

      if(typeSelected === SpinalBmsNetwork.nodeTypeName) {
         const parents = await SpinalGraphService.getParents(id,[SpinalBmsNetwork.relationName]);
         const found = parents.find(el => el.id.get() === BACNET_ORGAN_TYPE);
         return found || -1;
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