import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";
import {
   spinalPanelManagerService
} from "spinal-env-viewer-panel-manager-service";

import { SpinalGraphService } from "spinal-env-viewer-graph-service";

import { BACNET_ORGAN_TYPE } from "spinal-model-bacnet";
import utilities from "../../js/utilities";


const SIDEBAR = "GraphManagerSideBar";


class LinkProfilToBmsDevice extends SpinalContextApp {
   constructor() {
      super(
         "Link Bms device to Profil",
         "Link Bms device to Profil", {
         icon: "add_link",
         icon_type: "in",
         backgroundColor: "#FF0000",
         fontColor: "#FFFFFF"
      }
      );
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

   async action(option) {
      const bmsContextId = option.context.id.get();
      const nodeId = option.selectedNode.id.get();

      // const bmsDevices = await getAllDevices(bmsContextId, nodeId);

      spinalPanelManagerService.openPanel("linkProfilToBmsDeviceDialog", {
         bmsContextId,
         nodeId,
      })
   }

}







const linkProfilToBmsDevice = new LinkProfilToBmsDevice()

spinalContextMenuService.registerApp(SIDEBAR, linkProfilToBmsDevice, [3]);

export default linkProfilToBmsDevice;