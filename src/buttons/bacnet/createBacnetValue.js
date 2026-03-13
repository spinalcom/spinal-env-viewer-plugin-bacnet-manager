import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalGraph, SpinalGraphService } from "spinal-env-viewer-graph-service";
import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";
import { BACNET_ORGAN_TYPE } from "spinal-model-bacnet";

import utilities from "../../js/utilities";

const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");

const SIDEBAR = "GraphManagerSideBar";
const icon = require("../../assets/add.svg");

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

   async isShown(option) {
      const id = option.selectedNode.id.get();
      const type = option.selectedNode.type.get();
      const contextId = option.context.id.get();

      let network = type === SpinalBmsNetwork.nodeTypeName ? SpinalGraphService.getRealNode(id) : type === SpinalBmsDevice.nodeTypeName && await utilities.getNetwork(id, contextId);

      if (network) {
         const networkId = network.getId().get();
         const organ = await utilities.getOrgan(networkId, contextId);
         return organ && organ.type.get() === BACNET_ORGAN_TYPE ? true : -1;
      }

      return -1;
   }

   async action(option) {

      const nodeId = option.selectedNode.id.get();
      const contextId = option.context.id.get();

      spinalPanelManagerService.openPanel("getBacnetValueDialog", {
         selectedNode: SpinalGraphService.getRealNode(nodeId),
         context: SpinalGraphService.getContext(contextId),
         graph: option.graph,
      })
   }
}

// const  getNetwork = async (id, contextId) => {
//    const realNode = SpinalGraphService.getRealNode(id);
//    return realNode.getParents([SpinalBmsDevice.relationName]).then((parents) => {
//       const found = parents.find(el => {
//          if (el && el.contextIds) {
//             return el.contextIds[contextId];
//          }

//       });

//       SpinalGraphService._addNode(found)
//       return found;
//    })
// }

// const getOrgan = async (networkId, contextId) => {
//    const realNode = SpinalGraphService.getRealNode(networkId);
//    console.log("realNode",realNode);

//    const parents = await realNode.getParents([SpinalBmsNetwork.relationName]);
//    console.log("parents",parents, BACNET_ORGAN_TYPE)

//    const found = parents.find(el => {
//       console.log(el, el.getType.get());
//       return el.getType.get() == ""
//    });

//    if(found) console.log("found",found)
//    else console.log("not found");

// }

const createBacnetValue = new CreateBacnetValue()
spinalContextMenuService.registerApp(SIDEBAR, createBacnetValue, [3]);
export default createBacnetValue;