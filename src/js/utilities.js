import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { serviceDocumentation } from "spinal-env-viewer-plugin-documentation-service";
import { SpinalListenerModel } from "spinal-model-bacnet";
import {
  SPINAL_RELATION_PTR_LST_TYPE,
  SPINAL_RELATION_LST_PTR_TYPE,
} from "spinal-model-graph";

const bacnet = require("bacstack");

import { DeviceProfileUtilities } from "spinal-env-viewer-plugin-network-tree-service";

export default class Utils {
  static async getBmsDevices(contextId, id) {
    const info = SpinalGraphService.getInfo(id);
    if (info.type.get() === SpinalBmsDevice.nodeTypeName) {
      return [info];
    }

    if (info.type.get() === SpinalBmsNetwork.nodeTypeName) {
      return SpinalGraphService.getChildren(id, [SpinalBmsDevice.relationName]);
    }

    return SpinalGraphService.findInContext(id, contextId, (node) => {
      if (node.getType().get() === SpinalBmsDevice.nodeTypeName) {
        SpinalGraphService._addNode(node);
        return true;
      }
      return false;
    });
  }

  static async getNetwork(id, contextId) {
    const realNode = SpinalGraphService.getRealNode(id);
    if (!realNode) return;
    if (realNode.getType().get() === SpinalBmsNetwork.nodeTypeName)
      return realNode;

    return realNode
      .getParents([SpinalBmsDevice.relationName])
      .then((parents) => {
        const found = parents.find((el) => {
          if (el && el.contextIds) {
            return el.contextIds[contextId];
          }
        });

        if (found) SpinalGraphService._addNode(found);
        return found;
      });
  }

  static getOrgan(networkId, contextId) {
    const realNode = SpinalGraphService.getRealNode(networkId);
    return realNode
      .getParents([SpinalBmsNetwork.relationName])
      .then((parents) => {
        const found = parents.find((el) => {
          if (el && el.contextIds) {
            return el.contextIds[contextId];
          }
        });

        if (found) {
          return found.getElement();
        }
      });
  }

  static getModel(deviceId) {
    const realNode = SpinalGraphService.getRealNode(deviceId);
    if (!realNode) return Promise.resolve(-1);
    return new Promise((resolve) => {
      if (realNode.info.listener) {
        return realNode.info.listener.load((data) => resolve(data));
      }

      resolve(-1);
    });
  }

  // static async startMonitoring(
  //   graph,
  //   contextId,
  //   deviceId,
  //   networkId,
  //   argModel,
  //   argMonitor,
  //   organModel
  // ) {
  //   try {
  //     if (!this.hasProfilLinked(deviceId)) return -1;

  //     // const context = SpinalGraphService.getRealNode(contextId);
  //     // const realNode = SpinalGraphService.getRealNode(deviceId);

  //     const model =
  //       argModel && argModel !== -1 ? argModel : await this.getModel(deviceId);

  //     const monitor =
  //       argMonitor || (await this.getMonitoringInfo(deviceId, contextId));

  //     // console.log(model, monitor);
  //     // return this.createOrGetListenerModel(
  //     //   graph,
  //     //   contextId,
  //     //   deviceId,
  //     //   networkId,
  //     //   model,
  //     //   monitor,
  //     //   organModel
  //     // );
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }

  static async stopMonitoring(deviceId, argModel) {
    try {
      if (!this.hasProfilLinked(deviceId)) return -1;
      // const realNode = SpinalGraphService.getRealNode(deviceId);
      const model =
        argModel && argModel !== -1 ? argModel : await this.getModel(deviceId);
      if (model != -1) model.listen.set(false);
    } catch (error) {}
  }

  static async getProfilIntervals(profilId) {
    const intervalsNodes = await DeviceProfileUtilities.getIntervalNodes(
      profilId
    );

    const promises = intervalsNodes.map(async (el) => {
      return {
        monitoring: await this.getSharedAttribute(el),
        children: await this.getEndpointsObjectIds(el),
      };
    });

    return Promise.all(promises)
      .then((result) => {
        return result;
      })
      .catch((err) => {
        console.error(err);
        return [];
      });
  }

  // static async getMonitoringInfo(deviceId, contextId) {
  // const profil = await this.getProfilLinkedToDevice(deviceId);
  // const intervalsNodes = await DeviceProfileUtilities.getIntervalNodes(
  //   profil.id
  // );
  // const promises = intervalsNodes.map(async (el) => {
  //   return {
  //     monitoring: await this.getSharedAttribute(el),
  //     children: await this.getEndpointsObjectIds(
  //       el,
  //       profilContext.getId().get()
  //     ),
  //   };
  // });
  // return Promise.all(promises).then((result) => {
  //   const data = result.map(({ monitoring, children }) => {
  //     return {
  //       monitoring: monitoring.Monitoring,
  //       interval: monitoring.IntervalTime,
  //       children,
  //     };
  //   });
  //   const profilNode = SpinalGraphService.getRealNode(profil.id);
  //   return new SpinalMonitorInfoModel(profilNode, data);
  // });
  // }

  static async getSharedAttribute(intervalNode) {
    const realNode = SpinalGraphService.getRealNode(intervalNode.id.get());
    const attrs = await serviceDocumentation.getAttributesByCategory(
      realNode,
      "Supervision"
    );
    // const cat = await serviceDocumentation.getCategoryByName(
    //   realNode,
    //   "Supervision"
    // );
    const obj = {};
    for (let i = 0; i < attrs.length; i++) {
      const element = attrs[i];
      obj[element.label.get()] = element.value.get();
    }

    return obj;
  }

  static async getEndpointsObjectIds(intervalNode) {
    const nodeId = intervalNode.id.get();
    const profilItems = await SpinalGraphService.getChildren(
      nodeId,
      "hasIntervalTime"
    );

    const promises = profilItems.map(async (profilItem) => {
      return {
        instance: await this.getIDX(profilItem.id.get()),
        type: this._getBacnetObjectType(profilItem.type.get()),
      };
    });

    return Promise.all(promises).then((result) => {
      return result.flat();
    });
  }

  static _getBacnetObjectType(type) {
    const objectName = (
      "object_" + type.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    ).toUpperCase();
    return bacnet.enum.ObjectTypes[objectName];
  }

  static async getIDX(nodeId) {
    const realNode = SpinalGraphService.getRealNode(nodeId);
    const attrs = await serviceDocumentation.getAttributesByCategory(
      realNode,
      "default"
    );

    const found = attrs.find((attr) => attr.label.get() === "IDX");
    if (found) return found.value.get();

    // const cat = await serviceDocumentation.getCategoryByName(
    // realNode,
    // "default"
    // );

    // if (cat.element != undefined) {
    //   for (let i = 0; i < cat.element.length; i++) {
    //     const element = cat.element[i];
    //     if (element.label.get() === "IDX")
    //       return parseInt(element.value.get()) + 1;
    //   }
    // }
  }

  static hasProfilLinked(nodeId) {
    const realNode = SpinalGraphService.getRealNode(nodeId);
    if (realNode.hasRelation("hasBacnetProfile", SPINAL_RELATION_PTR_LST_TYPE))
      return true;
    if (realNode.hasRelation("hasBacnetProfile", SPINAL_RELATION_LST_PTR_TYPE))
      return true;

    return false;
  }

  static getProfilLinkedToDevice(deviceId) {
    return SpinalGraphService.getChildren(deviceId, ["hasBacnetProfile"]).then(
      (result) => {
        const [profil] = result;
        if (profil) return profil.get();
        // return result.map((el) => el.get());
      }
    );
  }

  static async createOrModifyListenerModel(
    graph,
    context,
    network,
    listenerModel,
    monitoringInfo,
    organModel,
    deviceNode
  ) {
    if (listenerModel && listenerModel != -1) {
      return this._modListenerModel(listenerModel, monitoringInfo);
    }

    return this._createListenerModel(
      graph,
      context,
      network,
      organModel,
      deviceNode,
      monitoringInfo
    );
  }

  static _modListenerModel(listenerModel, monitoringInfo) {
    if (!monitoringInfo) {
      listenerModel.listen.set(false);
      return -1;
    }

    if (listenerModel.monitor)
      listenerModel.mod_attr("monitor", monitoringInfo);
    else {
      listenerModel.add_attr({
        monitor: monitoringInfo,
      });
    }

    listenerModel.listen.set(true);
    return listenerModel;
  }

  static _createListenerModel(
    graph,
    context,
    network,
    organ,
    deviceNode,
    monitoringInfo
  ) {
    const spinalListener = new SpinalListenerModel(
      graph,
      context,
      network,
      deviceNode,
      organ,
      monitoringInfo
    );

    deviceNode.info.add_attr({
      listener: new Ptr(spinalListener),
    });

    return spinalListener;
  }

  static waitModelReady(model) {
    return new Promise((resolve, reject) => {
      const timeId = setInterval(() => {
        if (FileSystem._objects[model._server_id] === model) {
          console.log("model ready", FileSystem._objects[model._server_id]);
          clearInterval(timeId);
          resolve(model);
        }
      }, 300);
    });
  }

  static async consumeBatch(promises, batchSize = 10) {
    let index = 0;
    const result = [];
    while (index < promises.length) {
      let endIndex = index + batchSize;
      if (promises.length <= endIndex) endIndex = promises.length;
      const slice = promises.slice(index, endIndex);
      const resProm = await Promise.all(slice.map((e) => e()));
      result.push(...resProm);
      index = endIndex;
    }
    return result;
  }
}
