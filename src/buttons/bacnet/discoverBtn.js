import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalGraph, SpinalGraphService } from "spinal-env-viewer-graph-service";
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
      const typeSelected = option.selectedNode.type.get();

      if (typeSelected === BACNET_ORGAN_TYPE) return true;

      if (typeSelected !== SpinalBmsNetwork.nodeTypeName) return -1;

      const id = option.selectedNode.id.get();
      const contextId = option.context.id.get();

      const node = SpinalGraphService.getRealNode(id);
      const context = SpinalGraphService.getRealNode(contextId);

      const organ = await utilities.getOrgan(node, context);

      return organ && organ.getType().get() == BACNET_ORGAN_TYPE ? true : -1;
   }

   action(option) {
      const params = {
         graph: SpinalGraphService.getGraph(),
         context: SpinalGraphService.getRealNode(option.context.id.get()),
         organ: SpinalGraphService.getRealNode(option.selectedNode.id.get())
      }
      spinalPanelManagerService.openPanel("discoverNetworkPanel", params);
   }

}

const discoverNetworkBtn = new DiscoverNetworkBtn()

spinalContextMenuService.registerApp(SIDEBAR, discoverNetworkBtn, [3]);

export default discoverNetworkBtn;