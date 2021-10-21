import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");
import { SpinalOrganConfigModel } from "spinal-model-bacnet";


const SIDEBAR = "GraphManagerSideBar";


class MonitorConnectorBtn extends SpinalContextApp {
   constructor() {
      super(
         "Monitor connector",
         "This button allows to monitor a connector", {
         icon: "reset_tv",
         icon_type: "in",
         backgroundColor: "#FF0000",
         fontColor: "#FFFFFF"
      }
      );
   }

   isShown(option) {
      let typeSelected = option.selectedNode.type.get();

      return Promise.resolve(typeSelected === SpinalOrganConfigModel.TYPE ? true : -1);
   }

   action(option) {
      spinalPanelManagerService.openPanel("monitorConnectorPanel", {
         contextId: option.context.id.get(),
         nodeId : option.selectedNode.id.get()
      })
   }

}

const monitorConnectorBtn = new MonitorConnectorBtn()

spinalContextMenuService.registerApp(SIDEBAR, monitorConnectorBtn, [3]);

export default monitorConnectorBtn;