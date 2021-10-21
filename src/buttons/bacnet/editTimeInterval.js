// import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
// import { SpinalBmsDevice } from "spinal-model-bmsnetwork";
// const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");
// import { SpinalGraphService } from "spinal-env-viewer-graph-service";
// import utilities from "../../js/utilities";

// const SIDEBAR = "GraphManagerSideBar";


// class Start extends SpinalContextApp {
//    constructor() {
//       super(
//          "Edit updating time interval",
//          "Edit updating time interval", {
//          icon: "timer",
//          icon_type: "in",
//          backgroundColor: "#FF0000",
//          fontColor: "#FFFFFF"
//       }
//       );
//    }

//    async isShown(option) {
//       const type = option.selectedNode.type.get();
//       if (type === SpinalBmsDevice.nodeTypeName) {
//          const id = option.selectedNode.id.get();
//          const realNode = SpinalGraphService.getRealNode(id);

//          const model = await utilities.getModel(realNode);
//          if (model != -1) return true;
//       }

//       return -1;
//    }

//    async action(option) {
//       const id = option.selectedNode.id.get();
//       const realNode = SpinalGraphService.getRealNode(id);
//       const model = await utilities.getModel(realNode);

//       if (model != -1) {
//          spinalPanelManagerService.openPanel("modifyTimeIntervalDialog", {
//             editMode: true,
//             currentTime: model.timeInterval.get(),
//             callback: (val) => {
//                model.timeInterval.set(parseInt(val));
//             }
//          })
//       }

//    }

// }



// const start = new Start()

// spinalContextMenuService.registerApp(SIDEBAR, start, [3]);

// export default start;