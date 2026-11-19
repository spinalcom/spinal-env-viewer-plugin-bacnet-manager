import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { BACNET_ORGAN_TYPE } from "spinal-model-bacnet";
import { SpinalBmsNetwork } from "spinal-model-bmsnetwork";
import { SIDEBAR } from "../constants";

const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");

import utilities from "../../js/utilities";

class CreateDeviceBtn extends SpinalContextApp {
   constructor() {
      super(
         "Generate Bacnet device",
         "Create a BACnet device",
         {
            icon: "add_circle",
            icon_type: "in",
            backgroundColor: "#FF0000",
            fontColor: "#FFFFFF"
         }
      );
   }

   async isShown(option) {
      const typeSelected = option.selectedNode.type.get();
      if (typeSelected !== SpinalBmsNetwork.nodeTypeName) return -1;

      const node = SpinalGraphService.getRealNode(option.selectedNode.id.get());
      const context = SpinalGraphService.getRealNode(option.context.id.get());
      const organ = await utilities.getOrgan(node, context);

      return organ && organ.getType().get() === BACNET_ORGAN_TYPE ? true : -1;
   }

   action(option) {
      spinalPanelManagerService.openPanel("createBmsDeviceDialog", option);
   }
}

const createDeviceBtn = new CreateDeviceBtn();
spinalContextMenuService.registerApp(SIDEBAR, createDeviceBtn, [3]);

export default createDeviceBtn;
