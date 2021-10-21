import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { serviceDocumentation } from "spinal-env-viewer-plugin-documentation-service";
import { SpinalListenerModel, Spinal, SpinalMonitorInfoModel } from "spinal-model-bacnet";


const bacnet = require('bacstack');

const SUPERVISION_INTERVAL_TYPE = "supervisionIntervalTime";

export default {


   async getNetwork(id, contextId) {
      const realNode = SpinalGraphService.getRealNode(id);
      return realNode.getParents([SpinalBmsDevice.relationName]).then((parents) => {
         const found = parents.find(el => {
            if (el && el.contextIds) {
               return el.contextIds[contextId];
            }

         });

         SpinalGraphService._addNode(found)
         return found;
      })
   },

   getOrgan(networkId, contextId) {
      const realNode = SpinalGraphService.getRealNode(networkId);
      return realNode.getParents([SpinalBmsNetwork.relationName]).then((parents) => {
         const found = parents.find(el => {
            if (el && el.contextIds) {
               return el.contextIds[contextId];
            }

         });

         if (found) {
            return found.getElement();
         }
      })
   },

   async startMonitoring(graph, contextId, deviceId) {
      try {
         const context = SpinalGraphService.getRealNode(contextId);
         const realNode = SpinalGraphService.getRealNode(deviceId);
         const model = await this.getModel(realNode);
         const monitor = await this.getMonitoringInfo(deviceId, contextId);

         if (model && model != -1) {
            if (!monitor) {
               model.listen.set(false);
            } else {
               if (model.monitor) {
                  model.mod_attr("monitor", monitor);
               } else {
                  model.add_attr({
                     monitor: monitor
                  })
               }

               model.listen.set(true);
            }

         } else {
            const network = await this.getNetwork(deviceId, contextId);
            const organ = await this.getOrgan(network.getId().get(), contextId);

            const spinalListener = new SpinalListenerModel(graph, context, network, realNode, organ, monitor);
            realNode.info.add_attr({
               listener: new Ptr(spinalListener)
            })
         }
      } catch (error) { 
         console.error(error);
      }

   },

   async stopMonitoring(deviceId) {
      try {
         const realNode = SpinalGraphService.getRealNode(deviceId);
         const model = await this.getModel(realNode);
         if (model != -1) model.listen.set(false);
      } catch (error) { }

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
      const [profilContext] = SpinalGraphService.getContextWithType("deviceProfileContext");
      const profils = await SpinalGraphService.getChildren(deviceId, ["hasBacnetProfile"]);
      const [profil] = profils;


      if (profilContext && profil) {
         SpinalGraphService._addNode(profilContext);
         const intervalsNodes = await SpinalGraphService.findInContext(profil.id.get(), profilContext.getId().get(), (node) => {
            if (node.getType().get() === "supervisionIntervalTime") {
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
            const data = result.map(({ monitoring, children }) => {
               return {
                  monitoring: monitoring.Monitoring,
                  interval: monitoring.IntervalTime,
                  children
               }
            })


            const profilNode = SpinalGraphService.getRealNode(profil.id.get());

            return new SpinalMonitorInfoModel(profilNode, data);
         })

      } else {
         console.log("no item found");
      }
   },

   async getSharedAttribute(intervalNode) {
      const realNode = SpinalGraphService.getRealNode(intervalNode.id.get());
      const cat = await serviceDocumentation.getCategoryByName(realNode, "Supervision");
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

         return { instance: await this.getIDX(profilItem.id.get()), type: this._getBacnetObjectType(profilItem.type.get()) }
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

   async getIDX(nodeId) {
      const realNode = SpinalGraphService.getRealNode(nodeId);
      const cat = await serviceDocumentation.getCategoryByName(realNode, "default");
      
      if (cat.element != undefined) {
         for (let i = 0; i < cat.element.length; i++) {
            const element = cat.element[i];
            if(element.label.get() === "IDX") return parseInt(element.value.get()) + 1;
         }
      }
      
   },


}