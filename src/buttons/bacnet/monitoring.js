import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";
const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import utilities from "../../js/utilities";


const SIDEBAR = "GraphManagerSideBar";


class ManageMonitoring extends SpinalContextApp {
   constructor() {
      super(
         "Manage devices monitoring",
         "Manage devices monitoring", {
         icon: "personal_video",
         icon_type: "in",
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
         return organ && organ.type.get()  ? true : -1;
      }

      return -1;



      // const type = option.selectedNode.type.get();

      // if (type === SpinalBmsNetwork.nodeTypeName) {
      //    return true;
      // } else if (type === SpinalBmsDevice.nodeTypeName) {
      //    const realNode = SpinalGraphService.getRealNode(option.selectedNode.id.get())
      //    const model = await utilities.getModel(realNode);

      //    if (model && model !== -1 && model.listen && model.listen.get()) return -1;

      //    return true;
      // }

      // return -1;
   }

   async action(option) {


      spinalPanelManagerService.openPanel("manageDevicesPanel", {
         selectedNode: option.selectedNode.get(),
         context: option.context.get(),
         graph: option.graph,

      })

   }

}


const manageMonitoring = new ManageMonitoring()

spinalContextMenuService.registerApp(SIDEBAR, manageMonitoring, [3]);

export default manageMonitoring;