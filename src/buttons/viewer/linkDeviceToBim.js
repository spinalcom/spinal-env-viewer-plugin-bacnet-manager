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
      const id = option.selectedNode.id.get();
      const type = option.selectedNode.type.get();
      const contextId = option.context.id.get();
      if(type === BACNET_ORGAN_TYPE) return true;

      let network = type === SpinalBmsNetwork.nodeTypeName ? SpinalGraphService.getRealNode(id) : type === SpinalBmsDevice.nodeTypeName && await utilities.getNetwork(id, contextId);

      if(network) {
         const networkId = network.getId().get();
         const organ = await utilities.getOrgan(networkId, contextId);
         return organ && organ.type.get() === BACNET_ORGAN_TYPE  ? true : -1;
      }

      return -1;
   }

   action(option) {
      let contextId = option.context.id.get();
      let nodeId = option.selectedNode.id.get();

      spinalPanelManagerService.openPanel("linkToBimAutomateDialog", {
         nodeId,
         contextId
      })
   }

}


const linkBmsDeviceToBim = new LinkBmsDeviceToBim();

spinalContextMenuService.registerApp(SIDEBAR, linkBmsDeviceToBim, [3]);

export default linkBmsDeviceToBim;