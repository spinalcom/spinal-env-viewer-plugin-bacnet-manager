import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");
import { CONTEXT_TYPE } from "../../js/constants";
const SIDEBAR = "GraphManagerSideBar";


class AddOrganButton extends SpinalContextApp {
   constructor() {
      super(
         "Add Organ",
         "Add Organ", {
         icon: "add",
         icon_type: "in",
         backgroundColor: "#FF0000",
         fontColor: "#FFFFFF"
      }
      );
   }

   isShown(option) {
      const selectedType = option.selectedNode.type.get();
      return Promise.resolve(selectedType === CONTEXT_TYPE ? true : -1);
   }

   action(option) {
      spinalPanelManagerService.openPanel("addOrganDialogDialog", option)
   }

}

const addOrganButton = new AddOrganButton()

spinalContextMenuService.registerApp(SIDEBAR, addOrganButton, [3]);

export default addOrganButton;