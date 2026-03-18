import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { serviceDocumentation } from "spinal-env-viewer-plugin-documentation-service";
import { SpinalListenerModel } from "spinal-model-bacnet";
import { SPINAL_RELATION_PTR_LST_TYPE, SPINAL_RELATION_LST_PTR_TYPE } from "spinal-model-graph";

const bacnet = require("bacstack");

import { DeviceProfileUtilities } from "spinal-env-viewer-plugin-network-tree-service";
import { Pbr } from "spinal-core-connectorjs";

export default class Utils {

  static async getBmsDevices(context, selectedNode) {
    const type = selectedNode.getType().get();

    // if it's a device we return it directly
    if (type === SpinalBmsDevice.nodeTypeName) {
      return [selectedNode];
    }

    // if it's a network we return its children
    if (type === SpinalBmsNetwork.nodeTypeName) {
      return selectedNode.getChildren([SpinalBmsDevice.relationName])
    }

    // else we try to find the device in the context
    return selectedNode.findInContext(context, (node) => {
      if (node.getType().get() === SpinalBmsDevice.nodeTypeName) {
        SpinalGraphService._addNode(node);
        return true;
      }
      return false;
    });
  }

  static async getNetwork(node, context) {
    const nodeType = node.getType().get();

    // if it's a network we return it directly
    if (nodeType === SpinalBmsNetwork.nodeTypeName) return node;

    // if it's a device we try to find its parent network in the context
    return node.getParents([SpinalBmsDevice.relationName]).then((parents) => {
      const networkFound = parents.find((el) => {
        if (el && el.contextIds) return el.contextIds[context.getId().get()];
        return false;
      });

      if (networkFound) SpinalGraphService._addNode(networkFound);
      return networkFound;
    });
  }

  static getOrgan(network, context) {

    return network.getParents([SpinalBmsNetwork.relationName]).then((parents) => {
      const contextId = context.getId().get();
      return parents.find((parent) => !!(parent && parent.contextIds && parent.contextIds[contextId]));

    });
  }

  static getListenerModel(device) {
    if (!device) return Promise.resolve(-1);

    return new Promise((resolve) => {
      if (device.info.listener) {
        return device.info.listener.load((data) => resolve(data));
      }

      resolve(-1);
    });
  }

  static async stopMonitoring(deviceId, argModel) {
    try {
      if (!this.hasProfilLinked(deviceId)) return -1;

      const model = argModel && argModel !== -1 ? argModel : await this.getModel(deviceId);
      if (model != -1) model.listen.set(false);
    } catch (error) {
      console.error(error);
    }
  }

  static async getProfilIntervals(profilId) {
    const intervalsNodes = await DeviceProfileUtilities.getIntervalNodes(profilId);

    const promises = intervalsNodes.map(async (el) => ({ monitoring: await this.getSharedAttribute(el), children: await this.getEndpointsObjectIds(el) }));

    return Promise.all(promises).then((result) => {
      return result;
    }).catch((err) => {
      console.error(err);
      return [];
    });
  }

  static async getSharedAttribute(intervalNode) {
    const realNode = SpinalGraphService.getRealNode(intervalNode.id.get());
    const attrs = await serviceDocumentation.getAttributesByCategory(realNode, "Supervision");

    const obj = {};
    for (let i = 0; i < attrs.length; i++) {
      const element = attrs[i];
      obj[element.label.get()] = element.value.get();
    }

    return obj;
  }

  static async getEndpointsObjectIds(intervalNode) {
    const nodeId = intervalNode.id.get();
    const profilItems = await SpinalGraphService.getChildren(nodeId, "hasIntervalTime");

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
    const objectName = ("object_" + type.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)).toUpperCase();
    return bacnet.enum.ObjectTypes[objectName];
  }

  static async getIDX(nodeId) {
    const realNode = SpinalGraphService.getRealNode(nodeId);
    const attrs = await serviceDocumentation.getAttributesByCategory(realNode, "default");

    const found = attrs.find((attr) => attr.label.get() === "IDX");
    if (found) return parseInt(found.value.get()) + 1;

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
    if (realNode.hasRelation("hasBacnetProfile", SPINAL_RELATION_PTR_LST_TYPE)) return true;
    if (realNode.hasRelation("hasBacnetProfile", SPINAL_RELATION_LST_PTR_TYPE)) return true;

    return false;
  }

  static async getProfilLinkedToDevice(device) {

    const profiles = await device.getChildren(["hasBacnetProfile"]);
    if (profiles.length === 0) return;

    return profiles[0];

    // return SpinalGraphService.getChildren(device.id.get(), ["hasBacnetProfile"]).then((profils) => {
    //   const profil = profils[0];
    //   if (profil) {
    //     const profilId = profil.id.get();
    //     return SpinalGraphService.getRealNode(profilId);
    //   }
    //   // return result.map((el) => el.get());
    // });
  }

  static async createOrModifyListenerModel(graph, context, network, listenerModel, profile, organNode, deviceNode) {
    if (listenerModel && listenerModel != -1) {
      return this._modListenerModel(listenerModel, profile);
    }

    return this._createListenerModel(graph, context, network, organNode, deviceNode, profile);
  }

  static _modListenerModel(listenerModel, newProfile) {
    if (!newProfile) return;

    if (listenerModel.profile) listenerModel.rem_attr("profile");
    listenerModel.add_attr({ profile: new Pbr(newProfile) });

    return listenerModel;
    // if (!monitoringInfo) {
    //   listenerModel.listen.set(false);
    //   return -1;
    // }

    // if (listenerModel.monitor)
    //   listenerModel.mod_attr("monitor", monitoringInfo);
    // else {
    //   listenerModel.add_attr({
    //     monitor: monitoringInfo,
    //   });
    // }

    // listenerModel.listen.set(true);
    // return listenerModel;
  }

  static async _createListenerModel(graph, context, network, organ, deviceNode, profile) {
    const spinalListener = new SpinalListenerModel(graph, context, organ, network, deviceNode, profile);
    await spinalListener.addToGraph();

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
