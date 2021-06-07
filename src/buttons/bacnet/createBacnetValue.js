import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";

const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");

const SIDEBAR = "GraphManagerSideBar";
const icon = require("../../assets/add.svg")

class CreateBacnetValue extends SpinalContextApp {
   constructor() {
      super(
         "Get all bacnet values",
         "This button allows to get all bacnet values", {
         icon: icon,
         icon_type: "src",
         backgroundColor: "#FF0000",
         fontColor: "#FFFFFF"
      }
      );
   }

   isShown(option) {
      const type = option.selectedNode.type.get();
      return Promise.resolve(type === SpinalBmsNetwork.nodeTypeName || type === SpinalBmsDevice.nodeTypeName ? true : -1);
   }

   async action(option) {

      spinalPanelManagerService.openPanel("getBacnetValueDialog", {
         selectedNode: option.selectedNode.get(),
         context: option.context.get(),
         graph: option.graph,
      })
   }
}

const createBacnetValue = new CreateBacnetValue()
spinalContextMenuService.registerApp(SIDEBAR, createBacnetValue, [3]);
export default createBacnetValue;