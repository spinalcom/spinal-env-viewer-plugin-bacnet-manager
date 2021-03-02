import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalBmsDevice } from "spinal-model-bmsnetwork";
import { SpinalListenerModel } from "../model/SpinalListenerModel";
const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");
import { SpinalGraphService } from "spinal-env-viewer-graph-service";

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

   isShown(option) {
      const type = option.selectedNode.type.get();
      return Promise.resolve(type === SpinalBmsDevice.nodeTypeName ? true : -1);
   }

   async action(option) {
      const id = option.selectedNode.id.get();

      const realNode = SpinalGraphService.getRealNode(id);
      const model = await getModel(realNode);
      if (model != -1) {
         model.listen.set(true);
      } else {
         const graph = SpinalGraphService.getRealNode(option.graph.getId());
         const context = option.context.get();
         const network = await getNetwork(id, context.id);

         spinalPanelManagerService.openPanel("modifyTimeIntervalDialog", {
            callback: (val) => {
               const spinalListener = new SpinalListenerModel(graph, context, network, id, parseInt(val));
               realNode.info.add_attr({
                  listener: new Ptr(spinalListener)
               })
            }
         })

      }
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

const getNetwork = async (id, contextId) => {
   const networks = await SpinalGraphService.getChildrenInContext(contextId, contextId);
   for (const network of networks) {
      const element = network.get();
      const childrenIds = SpinalGraphService.getChildrenIds(element.id);
      if (childrenIds.indexOf(id) !== -1) return element;
   }

   return;
}

const start = new Start()

spinalContextMenuService.registerApp(SIDEBAR, start, [3]);

export default start;