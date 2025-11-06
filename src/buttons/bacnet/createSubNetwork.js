import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");
import { BACNET_ORGAN_TYPE } from "spinal-model-bacnet";
import { SpinalBmsNetwork } from "spinal-model-bmsnetwork";

import utilities from "../../js/utilities";

const SIDEBAR = "GraphManagerSideBar";


class CreateSubNetworkBtn extends SpinalContextApp {
    constructor() {
        super(
            "Create BMS subnetwork",
            "This button allows to create new sub network", {
            icon: "add",
            icon_type: "in",
            backgroundColor: "#FF0000",
            fontColor: "#FFFFFF"
        });
    }

    async isShown(option) {
        const typeSelected = option.selectedNode.type.get();

        const result = typeSelected === BACNET_ORGAN_TYPE ? true : -1;

        return Promise.resolve(result);
    }


    action(option) {
        spinalPanelManagerService.openPanel("createSubNetworkDialog", option)
    }

}

const createSubNetworkBtn = new CreateSubNetworkBtn()

spinalContextMenuService.registerApp(SIDEBAR, createSubNetworkBtn, [3]);

export default createSubNetworkBtn;