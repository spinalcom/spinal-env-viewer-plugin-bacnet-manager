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

   async action(option) {
      const bmsContextId = option.context.id.get();
      const nodeId = option.selectedNode.id.get();

      // const bmsDevices = await getAllDevices(bmsContextId, nodeId);

      spinalPanelManagerService.openPanel("linkProfilToBmsDeviceDialog", { bmsContextId, nodeId })
   }

}







const linkProfilToBmsDevice = new LinkProfilToBmsDevice()

spinalContextMenuService.registerApp(SIDEBAR, linkProfilToBmsDevice, [3]);

export default linkProfilToBmsDevice;