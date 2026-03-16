import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";
const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { BACNET_ORGAN_TYPE } from "spinal-model-bacnet";

import utilities from "../../js/utilities";


const SIDEBAR = "GraphManagerSideBar";


class ManageMonitoring extends SpinalContextApp {
   constructor() {
      super(
         "Manage devices monitoring",
         "Manage devices monitoring", {
         icon: "personal_video",
         icon_type: "in",
         backgroundColor: "#FF0000",
         fontColor: "#FFFFFF"
      }
      );
   }

   async isShown(option) {

      const type = option.selectedNode.type.get();

      if (type !== SpinalBmsDevice.nodeTypeName && type !== SpinalBmsNetwork.nodeTypeName) return -1;

      const id = option.selectedNode.id.get();
      const contextId = option.context.id.get();

      const node = SpinalGraphService.getRealNode(id);
      const context = SpinalGraphService.getRealNode(contextId);

      let network = await utilities.getNetwork(node, context);

      if (!network) return -1;

      const organ = await utilities.getOrgan(network, context);
      return organ && organ.getType().get() == BACNET_ORGAN_TYPE ? true : -1;

   }

   async action(option) {

      const nodeId = option.selectedNode.id.get();
      const contextId = option.context.id.get();


      spinalPanelManagerService.openPanel("manageDevicesPanel", {
         selectedNode: SpinalGraphService.getRealNode(nodeId),
         context: SpinalGraphService.getRealNode(contextId),
         graph: option.graph,
      })

   }

}


const manageMonitoring = new ManageMonitoring()

spinalContextMenuService.registerApp(SIDEBAR, manageMonitoring, [3]);

export default manageMonitoring;