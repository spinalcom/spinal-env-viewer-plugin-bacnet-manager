import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { SpinalBmsDevice } from "spinal-model-bmsnetwork";

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

   isShown(option) {
      const type = option.selectedNode.type.get();
      return Promise.resolve(type === SpinalBmsDevice.nodeTypeName ? true : -1);
   }

   async action(option) {
      const id = option.selectedNode.id.get();
      const realNode = SpinalGraphService.getRealNode(id);
      const model = await getModel(realNode);
      if (model != -1) model.listen.set(false);
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

const stopBtn = new StopBtn()

spinalContextMenuService.registerApp(SIDEBAR, stopBtn, [3]);

export default stopBtn;