import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";
import { SpinalBacnetValueModel } from "spinal-model-bacnet";

const SIDEBAR = "GraphManagerSideBar";
const icon = require("../../assets/add.svg")

class CreateBacnetValue extends SpinalContextApp {
   constructor() {
      super(
         "Create all bacnet values",
         "This button allows to create all bacnet values", {
         icon: icon,
         icon_type: "src",
         backgroundColor: "#FF0000",
         fontColor: "#FFFFFF"
      }
      );
   }

   isShown(option) {
      const type = option.selectedNode.type.get();
      return Promise.resolve(type === SpinalBmsDevice.nodeTypeName ? true : -1);
   }

   async action(option) {

      const nodeId = option.selectedNode.id.get()
      const contextId = option.context.id.get()
      const node = SpinalGraphService.getRealNode(nodeId);
      const context = SpinalGraphService.getRealNode(contextId);
      const graph = option.graph;
      const network = await getNetwork(contextId, nodeId);

      const model = new SpinalBacnetValueModel(graph, context, network, node);
      model.addToNode()

      // // spinalPanelManagerService.openPanel("discoverNetworkPanel", option)
   }
}



const getNetwork = async (contextId, nodeId) => {
   const networks = await SpinalGraphService.getChildrenInContext(contextId, contextId);
   const parentId = await getParent(nodeId);

   for (const network of networks) {
      const id = network.id.get();
      const childId = SpinalGraphService.getChildrenIds(id);
      if (childId.indexOf(parentId) !== -1) {
         return SpinalGraphService.getRealNode(id);
      }
   }
}

const getParent = async (nodeId) => {
   const realNode = SpinalGraphService.getRealNode(nodeId);
   const parents = await realNode.getParents([SpinalBmsDevice.relationName])
   const found = parents.find(el => el.getType().get() === SpinalBmsNetwork.nodeTypeName);
   if (found) {
      SpinalGraphService._addNode(found);
      return found.getId().get();
   }
}
const createBacnetValue = new CreateBacnetValue()
spinalContextMenuService.registerApp(SIDEBAR, createBacnetValue, [3]);
export default createBacnetValue;