import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalBmsDevice, SpinalBmsNetwork, SpinalBmsEndpoint } from "spinal-model-bmsnetwork";
import {
   spinalPanelManagerService
} from "spinal-env-viewer-panel-manager-service";

import { SpinalOrganConfigModel } from "spinal-model-bacnet";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";


const SIDEBAR = "GraphManagerSideBar";


class LinkProfilToBmsDevice extends SpinalContextApp {
   constructor() {
      super(
         "Link Profil to Bms device",
         "Link Profil to Bms device", {
         icon: "add_link",
         icon_type: "in",
         backgroundColor: "#FF0000",
         fontColor: "#FFFFFF"
      }
      );
   }

   isShown(option) {
      const type = option.selectedNode.type.get();
      const display = [SpinalBmsDevice.nodeTypeName, SpinalBmsNetwork.nodeTypeName, SpinalOrganConfigModel.TYPE].indexOf(type) !== -1
      return Promise.resolve(display ? true : -1);
   }

   async action(option) {
      const bmsContextId = option.context.id.get();
      const nodeId = option.selectedNode.id.get();

      const bmsDevices = await getAllDevices(bmsContextId, nodeId);

      spinalPanelManagerService.openPanel("linkProfilToBmsDeviceDialog", {
         bmsContextId,
         bmsDevices,
      })
   }

}

const getAllDevices = (contextId, nodeId) => {
   return SpinalGraphService.findInContext(nodeId, contextId, (node) => {
      if (node.getType().get() === SpinalBmsDevice.nodeTypeName) {
         SpinalGraphService._addNode(node);
         return true;
      }
      return false;
   }).then((result) => {
      return result.map(el => el.get())
   })
}





const linkProfilToBmsDevice = new LinkProfilToBmsDevice()

spinalContextMenuService.registerApp(SIDEBAR, linkProfilToBmsDevice, [3]);

export default linkProfilToBmsDevice;