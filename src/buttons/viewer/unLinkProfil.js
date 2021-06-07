import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalBmsDevice, SpinalBmsNetwork, SpinalBmsEndpoint } from "spinal-model-bmsnetwork";
import {
   spinalPanelManagerService
} from "spinal-env-viewer-panel-manager-service";

import { SpinalOrganConfigModel } from "spinal-model-bacnet";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";


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

   isShown(option) {
      const type = option.selectedNode.type.get();
      const display = [SpinalBmsDevice.nodeTypeName, SpinalBmsNetwork.nodeTypeName, SpinalOrganConfigModel.TYPE].indexOf(type) !== -1
      return Promise.resolve(display ? true : -1);
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