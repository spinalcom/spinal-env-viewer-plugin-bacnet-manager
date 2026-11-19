import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { BACNET_ORGAN_TYPE } from "spinal-model-bacnet";
import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";
import { SIDEBAR } from "../constants";

import utilities from "../../js/utilities";

const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");

class GenerateTreeFromProfileBtn extends SpinalContextApp {
   constructor() {
      super(
         "Generate tree from profile",
         "Generate BACnet tree from linked profile",
         {
            icon: "settings_input_component",
            icon_type: "in",
            backgroundColor: "#FF0000",
            fontColor: "#FFFFFF"
         }
      );
   }

   async isShown(option) {
      const type = option.selectedNode.type.get();
      if (type !== SpinalBmsDevice.nodeTypeName && type !== SpinalBmsNetwork.nodeTypeName) return -1;

      const nodeId = option.selectedNode.id.get();
      const contextId = option.context.id.get();
      const node = SpinalGraphService.getRealNode(nodeId);
      const context = SpinalGraphService.getRealNode(contextId);

      const network = await utilities.getNetwork(node, context);
      if (!network) return -1;

      const organ = await utilities.getOrgan(network, context);
      if (!organ || organ.getType().get() !== BACNET_ORGAN_TYPE) return -1;

      return true;
      // return utilities.hasProfilLinked(nodeId) ? true : -1;
   }

   async action(option) {
      const realNode = SpinalGraphService.getRealNode(option.selectedNode.id.get());
      const contextNode = SpinalGraphService.getRealNode(option.context.id.get());


      const devices = await utilities.getBmsDevices(contextNode, realNode);

      spinalPanelManagerService.openPanel("generateTreeFromProfileDialog", {
         devices: devices,
         context: contextNode,
      });
   }
}

const generateTreeFromProfileBtn = new GenerateTreeFromProfileBtn();
spinalContextMenuService.registerApp(SIDEBAR, generateTreeFromProfileBtn, [3]);

export default generateTreeFromProfileBtn;
