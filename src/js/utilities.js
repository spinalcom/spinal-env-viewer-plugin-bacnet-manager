import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { serviceDocumentation } from "spinal-env-viewer-plugin-documentation-service";

const bacnet = require('bacstack');


export default {

   async getNetwork(id, contextId) {
      const realNode = SpinalGraphService.getRealNode(id);
      return realNode.getParents([SpinalBmsDevice.relationName]).then((parents) => {
         const found = parents.find(el => el.contextIds[contextId]);

         return found;
      })
   },

   getOrgan(networkId, contextId) {
      const realNode = SpinalGraphService.getRealNode(networkId);
      return realNode.getParents([SpinalBmsNetwork.relationName]).then((parents) => {
         const found = parents.find(el => el.contextIds[contextId]);

         if (found) {
            return found.getElement();
         }

         return;

      })
   },

   getModel(realNode) {
      if (realNode.info.listener) {
         return new Promise((resolve, reject) => {
            realNode.info.listener.load(data => resolve(data));
         });
      } else {
         return Promise.resolve(-1);
      }
   },

   async getMonitoringInfo(deviceId, contextId) {
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
               monitoring: await this.getSharedAttribute(el),
               children: await this.getEndpointsObjectIds(el, profilContext.getId().get(), contextId)
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
   },

   async getSharedAttribute(intervalNode) {
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
   },

   async getEndpointsObjectIds(intervalNode, profilContextId, bmsContextId) {
      const nodeId = intervalNode.id.get();
      const profilItems = await SpinalGraphService.getChildrenInContext(nodeId, profilContextId);
      const promises = profilItems.map(async profilItem => {

         return { instance: parseInt(profilItem.IDX.get()) + 1, type: this._getBacnetObjectType(profilItem.type.get()) }
         // // const children = await SpinalGraphService.getParents(profilItem.id.get(), [SpinalBmsEndpoint.relationName]);
         // const parents = await SpinalGraphService.getParents(profilItem.id.get(), ["hasBacnetItem"]);
         // const children = parents.map(el => SpinalGraphService.getInfo(el.id.get()));

         // const prom2 = children.filter(el => typeof el.contextIds[bmsContextId] !== "undefined").map(el => el.element.load());
         // return Promise.all(prom2).then((result) => {
         //    const res = [];
         //    result.map(el => ({ type: el.typeId.get(), instance: el.id.get() })).forEach(item => {
         //       const i = res.findIndex(x => x.type === item.type && x.instance === item.instance);
         //       if (i <= -1) {
         //          res.push(item);
         //       }
         //    })

         //    return res;
         // })
      });

      return Promise.all(promises).then((result) => {
         return result.flat();
      })
   },

   _getBacnetObjectType(type) {
      const objectName = ("object_" + type.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)).toUpperCase();
      return bacnet.enum.ObjectTypes[objectName];
   },

   async getBmsDevices(contextId, id) {
      const info = SpinalGraphService.getInfo(id);
      if (info.type.get() === SpinalBmsDevice.nodeTypeName) {
         return [info];
      }
      const res = [];

      return SpinalGraphService.findInContext(id, contextId, (node) => {
         if (node.getType().get() === SpinalBmsDevice.nodeTypeName) {
            SpinalGraphService._addNode(node);
            return true;
         }
         return false;
      })
   },

}