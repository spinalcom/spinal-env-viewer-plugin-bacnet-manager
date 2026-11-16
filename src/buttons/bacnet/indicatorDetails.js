import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { BACNET_ORGAN_TYPE } from "spinal-model-bacnet";
import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";

const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");

import utilities from "../../js/utilities";

const SIDEBAR = "GraphManagerSideBar";

class IndicatorDetailsBtn extends SpinalContextApp {
   constructor() {
      super(
         "Indicator details",
         "Open indicator details", {
         icon: "info",
         icon_type: "in",
         backgroundColor: "#FF0000",
         fontColor: "#FFFFFF"
      }
      );
   }

   async isShown(option) {
      const type = option.selectedNode.type.get();

      if (type !== SpinalBmsDevice.nodeTypeName && type !== SpinalBmsNetwork.nodeTypeName) return -1;

      const node = SpinalGraphService.getRealNode(option.selectedNode.id.get());
      const context = SpinalGraphService.getRealNode(option.context.id.get());
      const network = await utilities.getNetwork(node, context);

      if (!network) return -1;

      const organ = await utilities.getOrgan(network, context);
      return organ && organ.getType().get() === BACNET_ORGAN_TYPE ? true : -1;
   }

   async action(option) {
      const selectedNode = SpinalGraphService.getRealNode(option.selectedNode.id.get());
      const context = SpinalGraphService.getRealNode(option.context.id.get());
      const network = await utilities.getNetwork(selectedNode, context);
      const organ = await utilities.getOrgan(network, context);
      if (!organ) return;

      spinalPanelManagerService.openPanel("indicator_details", {
         graph: option.graph,
         context,
         organ,
         selectedNode,
         devices: await utilities.getBmsDevices(context, selectedNode)
      });
   }
}

const indicatorDetails = new IndicatorDetailsBtn();

spinalContextMenuService.registerApp(SIDEBAR, indicatorDetails, [3]);

export default indicatorDetails;
