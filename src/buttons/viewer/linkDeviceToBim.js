import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalBmsDevice, SpinalBmsNetwork, SpinalBmsEndpointGroup } from "spinal-model-bmsnetwork";

import { spinalPanelManagerService } from "spinal-env-viewer-panel-manager-service";

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

   isShown(option) {
      const nodeType = option.selectedNode.type.get();
      const list = [SpinalBmsDevice.nodeTypeName, SpinalBmsNetwork.nodeTypeName, SpinalBmsEndpointGroup.nodeTypeName]
      return Promise.resolve(list.indexOf(nodeType));
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