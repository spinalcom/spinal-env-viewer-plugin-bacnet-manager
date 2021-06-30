import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";

import utilities from "../../js/utilities";

const SIDEBAR = "GraphManagerSideBar";


class Start extends SpinalContextApp {
   constructor() {
      super(
         "Start updating device data",
         "Start updating device data",
         {
            icon: "play_arrow",
            icon_type: "in",
            backgroundColor: "#FF0000",
            fontColor: "#FFFFFF"
         }
      );
   }

   async isShown(option) {
      const type = option.selectedNode.type.get();

      if (type === SpinalBmsNetwork.nodeTypeName) {
         return true;
      } else if (type === SpinalBmsDevice.nodeTypeName) {
         const realNode = SpinalGraphService.getRealNode(option.selectedNode.id.get())
         const model = await utilities.getModel(realNode);

         if (model && model !== -1 && model.listen && model.listen.get()) return -1;

         return true;
      }

      return -1;
   }

   async action(option) {
      const id = option.selectedNode.id.get();
      const contextId = option.context.id.get();
      const graph = option.graph;

      const bmsDevices = await utilities.getBmsDevices(contextId, id);

      const promises = bmsDevices.map(device => {
         const deviceId = device.id.get();
         return utilities.startMonitoring(graph, contextId, deviceId);
      })

      await Promise.all(promises);

   }

}


const start = new Start()

spinalContextMenuService.registerApp(SIDEBAR, start, [3]);

export default start;