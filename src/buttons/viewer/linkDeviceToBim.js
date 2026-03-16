import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";

import { spinalPanelManagerService } from "spinal-env-viewer-panel-manager-service";
import { BACNET_ORGAN_TYPE } from "spinal-model-bacnet";

import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import utilities from "../../js/utilities";

const SIDEBAR = "GraphManagerSideBar";


class LinkBmsDeviceToBim extends SpinalContextApp {
   constructor() {
      super("Link BMS Device to automate",
         "This button allows to link bms device to bim automate", {
         icon: "settings_input_antenna",
         icon_type: "in",
         backgroundColor: "#FF0000",
         fontColor: "#FFFFFF"
      })
   }

   async isShown(option) {
      const type = option.selectedNode.type.get();
      if (type === BACNET_ORGAN_TYPE) return true;
      if (type !== SpinalBmsDevice.nodeTypeName && type !== SpinalBmsNetwork.nodeTypeName) return -1;

      const id = option.selectedNode.id.get();
      const contextId = option.context.id.get();

      const node = SpinalGraphService.getRealNode(id);
      const context = SpinalGraphService.getRealNode(contextId);

      let network = await utilities.getNetwork(node, context);
      if (!network) return -1;

      const organ = await utilities.getOrgan(network, context);
      return organ && organ.getType().get() === BACNET_ORGAN_TYPE ? true : -1;
   }

   action(option) {
      let contextId = option.context.id.get();
      let nodeId = option.selectedNode.id.get();

      spinalPanelManagerService.openPanel("linkToBimAutomateDialog", { nodeId, contextId })
   }

}


const linkBmsDeviceToBim = new LinkBmsDeviceToBim();

spinalContextMenuService.registerApp(SIDEBAR, linkBmsDeviceToBim, [3]);

export default linkBmsDeviceToBim;