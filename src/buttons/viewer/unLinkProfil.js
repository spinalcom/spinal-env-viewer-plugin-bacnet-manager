import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalBmsDevice, SpinalBmsNetwork, SpinalBmsEndpoint } from "spinal-model-bmsnetwork";
import {
   spinalPanelManagerService
} from "spinal-env-viewer-panel-manager-service";

import { BACNET_ORGAN_TYPE } from "spinal-model-bacnet";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";

import utilities from "../../js/utilities";

const SIDEBAR = "GraphManagerSideBar";


class UnLinkProfilToBmsDevice extends SpinalContextApp {
   constructor() {
      super(
         "unlink Bms device to Profil",
         "unlink Bms device to Profil", {
         icon: "link_off",
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

      spinalPanelManagerService.openPanel("unLinkProfilToBmsDeviceDialog", {
         bmsContextId,
         nodeId,
      })
   }

}







const unLinkProfilToBmsDevice = new UnLinkProfilToBmsDevice()

spinalContextMenuService.registerApp(SIDEBAR, unLinkProfilToBmsDevice, [3]);

export default unLinkProfilToBmsDevice;