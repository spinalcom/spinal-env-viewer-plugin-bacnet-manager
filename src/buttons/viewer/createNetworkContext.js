import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");

const HEADERBAR = "GraphManagerTopBar";


class CreateNetworkContextBtn extends SpinalContextApp {
   constructor() {
      super(
         "Create BMS network context",
         "This button allows to create network context", {
         icon: "network_check",
         icon_type: "in",
         backgroundColor: "#FF0000",
         fontColor: "#FFFFFF"
      }
      );
   }

   isShown(option) {
      return Promise.resolve(true);
   }

   action(option) {
      spinalPanelManagerService.openPanel("createGTBNetworkContextDialog", option)
   }

}

const createNetworkContextBtn = new CreateNetworkContextBtn()

spinalContextMenuService.registerApp(HEADERBAR, createNetworkContextBtn, [3]);

export default createNetworkContextBtn;