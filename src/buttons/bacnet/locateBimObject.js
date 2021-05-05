import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { SpinalBmsDevice, SpinalBmsEndpoint } from "spinal-model-bmsnetwork";

import { BIM_OBJECT_TYPE } from "spinal-env-viewer-plugin-forge/dist/Constants";

import { utilities } from "spinal-env-viewer-plugin-standard_button/js/utilities";

const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");

const SIDEBAR = "GraphManagerSideBar";


class LocateBimObjectBtn extends SpinalContextApp {
   constructor() {
      super(
         "Locate object linked in 3D model",
         "Locate object linked in 3D model", {
         icon: "pageview",
         icon_type: "in",
         backgroundColor: "#FF0000",
         fontColor: "#FFFFFF"
      }
      );
   }

   async isShown(option) {
      const type = option.selectedNode.type.get();

      if (type === SpinalBmsDevice.nodeTypeName || type === SpinalBmsEndpoint.nodeTypeName) return true;

      return -1;
   }

   async action(option) {
      const id = option.selectedNode.id.get();
      const contextId = option.context.id.get();

      const parents = await SpinalGraphService.getParents(id, [SpinalBmsDevice.relationName, SpinalBmsEndpoint.relationName])
      const founds = parents.filter(el => el.type.get() === BIM_OBJECT_TYPE).map(el => SpinalGraphService.getRealNode(el.id.get()))

      if (founds.length === 0) {
         window.alert("No bim object linked");
         return;
      }

      const viewer = window.spinal.ForgeViewer.viewer;

      utilities.sortBIMObjectByModel(founds).then((lstByModel) => {
         let arrayToFit = []
         for (let i = 0; i < lstByModel.length; i++) {
            const element = lstByModel[i];
            for (let j = 0; j < element.model.modelScene.length; j++) {
               const scene = element.model.modelScene[j];
               scene.model.selector.setSelection(element.dbid, scene.model, "selectOnly");

               arrayToFit.push({
                  model: scene.model,
                  selection: element.dbid
               })
            }
         }
         viewer.fitToView(arrayToFit);
      }).catch((err) => {
         console.error(err);
      });

   }

}



const locateBimObjectBtn = new LocateBimObjectBtn()

spinalContextMenuService.registerApp(SIDEBAR, locateBimObjectBtn, [3]);

export default locateBimObjectBtn;