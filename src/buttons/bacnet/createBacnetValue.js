import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";

const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");
import { SpinalGraphService } from "spinal-env-viewer-graph-service";


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

      const id = option.selectedNode.id.get();
      const contextId = option.context.id.get();
      const type = option.selectedNode.type.get();
      let devices;
      let networkId;
      let nodeId;

      if (type === SpinalBmsNetwork.nodeTypeName) {
         networkId = id;
         devices = await getBmsDevices(contextId, id);
      } else {
         nodeId = id;
         devices = [option.selectedNode]
      }



      spinalPanelManagerService.openPanel("getBacnetValueDialog", {
         networkId,
         nodeId,
         devices,
         contextId,
         graph: option.graph
      })
   }
}

const getBmsDevices = async (contextId, id) => {
   const info = SpinalGraphService.getInfo(id);
   if (info.type.get() === SpinalBmsDevice.nodeTypeName) {
      return [info];
   }
   return SpinalGraphService.findInContext(id, contextId, (node) => {
      if (node.getType().get() === SpinalBmsDevice.nodeTypeName) {
         SpinalGraphService._addNode(node);
         return true;
      }
      return false;
   })
}


const createBacnetValue = new CreateBacnetValue()
spinalContextMenuService.registerApp(SIDEBAR, createBacnetValue, [3]);
export default createBacnetValue;