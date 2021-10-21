import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";
import { BACNET_ORGAN_TYPE } from "spinal-model-bacnet/dist";

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

      if(network) {
         const networkId = network.getId().get();
         const organ = await utilities.getOrgan(networkId, contextId);
         return organ && organ.type.get() ? true : -1;
      }

      return -1;

      // if(type === SpinalBmsNetwork.nodeTypeName) {
      //    network = option.selectedNode;
      // } else if(type === SpinalBmsDevice.nodeTypeName) {
      //    network = await utilities.getOrgan(id, contextId);
      // }



      // if(type === SpinalBmsNetwork.nodeTypeName || type === SpinalBmsDevice.nodeTypeName) {
      //    const network = await getNetwork(id,type,contextId);
      //    if(network) {
      //       const parents = await SpinalGraphService.getParents(id,[SpinalBmsNetwork.relationName]);
      //       const found = parents.find(el => el.id.get() === BACNET_ORGAN_TYPE);
      //       return found || -1;
      //    }
      // }

      // return  -1;
   }

   async action(option) {

      spinalPanelManagerService.openPanel("getBacnetValueDialog", {
         selectedNode: option.selectedNode.get(),
         context: option.context.get(),
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