import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalBmsDevice, SpinalBmsNetwork, SpinalBmsEndpoint } from "spinal-model-bmsnetwork";
import { SpinalListenerModel } from "spinal-model-bacnet";
const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { serviceDocumentation } from "spinal-env-viewer-plugin-documentation-service";

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

   async isShown(option) {
      const type = option.selectedNode.type.get();

      if (type === SpinalBmsNetwork.nodeTypeName || type === SpinalBmsDevice.nodeTypeName)
         return Promise.resolve(true);

      return Promise.resolve(-1);
   }

   async action(option) {
      const id = option.selectedNode.id.get();
      const contextId = option.context.id.get();
      const bmsDevices = await getBmsDevices(contextId, id);


      const promises = bmsDevices.map(async el => {
         const realNode = SpinalGraphService.getRealNode(el.id.get());
         const model = await getModel(realNode);
         const monitor = await getMonitoringInfo(el.id.get(), contextId);

         if (model != -1) {
            model.monitor.set(monitor)
            model.listen.set(true);
            return;
         }

         const network = await getNetwork(el.id.get(), contextId);
         const organ = await getOrgan(network.getId().get(), contextId);
         const context = SpinalGraphService.getRealNode(contextId);

         const spinalListener = new SpinalListenerModel(option.graph, context, network, realNode, organ, monitor);
         realNode.info.add_attr({
            listener: new Ptr(spinalListener)
         })

         return;

      })

      await Promise.all(promises);

      // const context = SpinalGraphService.getRealNode(contextId);
      // const selectedNode = SpinalGraphService.getRealNode(id);
      // const model = await getModel(selectedNode);
      // const monitor = await getMonitoringInfo(id, contextId);



      // if (model != -1) {
      //    model.monitor.set(monitor)
      //    model.listen.set(true);
      // } else {
      //    const graph = SpinalGraphService.getRealNode(option.graph.getId().get());

      //    const network = await getNetwork(id, contextId);
      //    const organ = await getOrgan(network.getId().get(), contextId);

      //    const spinalListener = new SpinalListenerModel(graph, context, network, selectedNode, organ, monitor);
      //    selectedNode.info.add_attr({
      //       listener: new Ptr(spinalListener)
      //    })
      // }
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
   const realNode = SpinalGraphService.getRealNode(id);
   return realNode.getParents([SpinalBmsDevice.relationName]).then((parents) => {
      const found = parents.find(el => el.contextIds[contextId]);

      return found;
   })
}

const getOrgan = (networkId, contextId) => {
   const realNode = SpinalGraphService.getRealNode(networkId);
   return realNode.getParents([SpinalBmsNetwork.relationName]).then((parents) => {
      const found = parents.find(el => el.contextIds[contextId]);

      if (found) {
         return found.getElement();
      }

      return;

   })
}

const getMonitoringInfo = async (deviceId, contextId) => {
   const profilContext = SpinalGraphService.getContextWithType("deviceProfileContext")[0];

   const profils = await SpinalGraphService.getChildren(deviceId, ["hasBacnetProfile"]);
   const profil = profils[0];

   if (profilContext && profil) {
      SpinalGraphService._addNode(profilContext);

      const intervalsNodes = await SpinalGraphService.findInContext(profil.id.get(), profilContext.getId().get(), (node) => {
         if (node.getType().get() === "deviceMonitoringIntervalTime") {
            SpinalGraphService._addNode(node);
            return true;
         }
         return false;
      })
      const promises = intervalsNodes.map(async el => {
         return {
            monitoring: await getSharedAttribute(el),
            children: await getEndpointsObjectIds(el, profilContext.getId().get(), contextId)
         }
      })

      return Promise.all(promises).then((result) => {
         return result.map(({ monitoring, children }) => {
            return {
               monitoring: monitoring.Monitoring,
               interval: monitoring.IntervalTime,
               children
            }
         })
      })

   } else {
      console.log("no item found");
   }

   // return SpinalGraphService.findInContextByType(deviceId, contextId, SpinalBmsEndpoint.nodeTypeName).then((endpoints) => {
   //    const promises = endpoints.map(async (node) => {
   //       return {
   //          bmsNetwork: await getBmsNetworkElement(node),
   //          interval: await getTimeInterval(node)
   //       }
   //    })
   // })
}

const getSharedAttribute = async (intervalNode) => {
   const realNode = SpinalGraphService.getRealNode(intervalNode.id.get());
   const cat = await serviceDocumentation.getCategoryByName(realNode, "Monitoring");
   const obj = {}
   if (cat.element != undefined) {
      for (let i = 0; i < cat.element.length; i++) {
         const element = cat.element[i];
         obj[element.label.get()] = element.value;
      }
   }
   return obj;
}

const getEndpointsObjectIds = async (intervalNode, profilContextId, bmsContextId) => {
   const nodeId = intervalNode.id.get();
   const profilItems = await SpinalGraphService.getChildrenInContext(nodeId, profilContextId);
   const promises = profilItems.map(async profilItem => {
      // const children = await SpinalGraphService.getParents(profilItem.id.get(), [SpinalBmsEndpoint.relationName]);
      const parents = await SpinalGraphService.getParents(profilItem.id.get(), ["hasBacnetItem"]);
      const children = parents.map(el => SpinalGraphService.getInfo(el.id.get()));

      const prom2 = children.filter(el => typeof el.contextIds[bmsContextId] !== "undefined").map(el => el.element.load());
      return Promise.all(prom2).then((result) => {
         const res = [];
         result.map(el => ({ type: el.typeId.get(), instance: el.id.get() })).forEach(item => {
            const i = res.findIndex(x => x.type === item.type && x.instance === item.instance);
            if (i <= -1) {
               res.push(item);
            }
         })

         return res;
      })
   });

   return Promise.all(promises).then((result) => {
      return result.flat();
   })
}

const start = new Start()

spinalContextMenuService.registerApp(SIDEBAR, start, [3]);

export default start;