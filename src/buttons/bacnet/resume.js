import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";
import { SpinalListenerModel } from "spinal-model-bacnet";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";

import utilities from "../../js/utilities";

const SIDEBAR = "GraphManagerSideBar";


class Start extends SpinalContextApp {
   constructor() {
      super(
         "Start updating device data",
         "Start updating device data", {
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
      // const context = SpinalGraphService.getRealNode(contextId);

      while (bmsDevices.length > 0) {
         const device = bmsDevices.shift();
         const deviceId = device.id.get();

         await utilities.startMonitoring(graph, contextId, deviceId);
         // const realNode = SpinalGraphService.getRealNode(deviceId);
         // const model = await utilities.getModel(realNode);
         // const monitor = await utilities.getMonitoringInfo(deviceId, contextId);

         // if (model != -1) {
         //    if (!monitor) {
         //       model.listen.set(false);
         //    } else {
         //       if (model.monitor) {
         //          model.monitor.set(monitor);
         //       } else {
         //          model.add_attr({
         //             monitor: monitor
         //          })
         //       }

         //       model.listen.set(true);
         //    }

         // } else {
         //    const network = await utilities.getNetwork(deviceId, contextId);
         //    const organ = await utilities.getOrgan(network.getId().get(), contextId);

         //    const spinalListener = new SpinalListenerModel(graph, context, network, realNode, organ, monitor);
         //    realNode.info.add_attr({
         //       listener: new Ptr(spinalListener)
         //    })
         // }

      }

   }

}


const start = new Start()

spinalContextMenuService.registerApp(SIDEBAR, start, [3]);

export default start;