import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");

const SIDEBAR = "GraphManagerSideBar";


class AddOrganButton extends SpinalContextApp {
   constructor() {
      super(
         "Add BMS monitoring Organ",
         "Add BMS monitoring Organ", {
         icon: "add",
         icon_type: "in",
         backgroundColor: "#FF0000",
         fontColor: "#FFFFFF"
      }
      );
   }

   isShown(option) {
      const selectedType = option.selectedNode.type.get();
      return Promise.resolve(selectedType === "Network" ? true : -1);
   }

   action(option) {
      spinalPanelManagerService.openPanel("addOrganDialogDialog", option)
   }

}

const addOrganButton = new AddOrganButton()

spinalContextMenuService.registerApp(SIDEBAR, addOrganButton, [3]);

export default addOrganButton;