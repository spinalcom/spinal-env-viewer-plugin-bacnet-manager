import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";

const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");

const SIDEBAR = "GraphManagerSideBar";


class StopBtn extends SpinalContextApp {
   constructor() {
      super(
         "Stop updating device data",
         "Stop updating device data", {
         icon: "stop",
         icon_type: "in",
         backgroundColor: "#FF0000",
         fontColor: "#FFFFFF"
      }
      );
   }

   async isShown(option) {
      const type = option.selectedNode.type.get();

      if (type === SpinalBmsNetwork.nodeTypeName) return true;

      if (type === SpinalBmsDevice.nodeTypeName) {
         if (!option.selectedNode.listener) return -1;

         const realNode = SpinalGraphService.getRealNode(option.selectedNode.id.get());
         const model = await getModel(realNode);
         return model.listen.get() ? true : -1;
      }

      return -1;
   }

   async action(option) {
      const id = option.selectedNode.id.get();
      const contextId = option.context.id.get();
      const bmsDevices = await getBmsDevices(contextId, id);

      const promises = bmsDevices.map(el => {
         const realNode = SpinalGraphService.getRealNode(el.id.get());
         return getModel(realNode);
      })


      await Promise.all(promises).then((models) => {
         for (const model of models) {
            if (model != -1) model.listen.set(false);
         }
      })
   }

}


const getModel = (realNode) => {
   if (realNode.info.listener) {
      return new Promise((resolve, reject) => {
         realNode.info.listener.load(data => resolve(data));
      });
   } else {
      return Promise.resolve(-1);
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

const stopBtn = new StopBtn()

spinalContextMenuService.registerApp(SIDEBAR, stopBtn, [3]);

export default stopBtn;