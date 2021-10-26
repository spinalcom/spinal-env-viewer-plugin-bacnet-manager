import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";
import { PCVUE_ORGAN_TYPE } from "spinal-model-bacnet";


const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");

const SIDEBAR = "GraphManagerSideBar";

class CreatePcvueNetwork extends SpinalContextApp {
   constructor() {
      super(
         "Create pcvue organ",
         "This button allows to Create pcvue organ", {
         icon: "playlist_add",
         icon_type: "in",
         backgroundColor: "#FF0000",
         fontColor: "#FFFFFF"
      }
      );
   }

   isShown(option) {
      const type = option.selectedNode.type.get();
      return Promise.resolve(type === PCVUE_ORGAN_TYPE ? true : -1);
   }

   action(option) {
      const nodeId = option.selectedNode.id.get();
      const contextId = option.context.id.get();
      
      spinalPanelManagerService.openPanel("createPCVueNetworkPanel", {
         nodeId,
         contextId
      })
   }
}


const createPcvueNetwork = new CreatePcvueNetwork()
spinalContextMenuService.registerApp(SIDEBAR, createPcvueNetwork, [3]);
export default createPcvueNetwork;