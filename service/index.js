import { spinalCore, FileSystem } from "spinal-core-connectorjs_type";
import { SpinalGraphService, SPINAL_RELATION_PTR_LST_TYPE } from "spinal-env-viewer-graph-service";
import { SpinalOrganConfigModel } from "spinal-model-bacnet";
import { SpinalBmsEndpoint } from "spinal-model-bmsnetwork";
import { SpinalOrganOPCUA } from "spinal-model-opcua";

export class SpinalBacnetPluginService {
  constructor() { }

  static getOrgans(connection) {
    const path = "/__users__/admin/organs";

    return new Promise((resolve, reject) => {
      connection.load_or_make_dir(`${path}`, (directory) => {
        const promises = [];

        for (let index = 0; index < directory.length; index++) {
          const element = directory[index];
          promises.push(this.getFileModel(element));
        }

        return Promise.all(promises).then((result) => {
          resolve(result.map((organ) => {
            const id = organ._server_id;
            const obj = organ.get();
            obj._server_id = id;
            return obj;
          })
          );
        });
      });
    });
  }

  static addToReference(organServerId, contextId) {
    const organModel = FileSystem._objects[organServerId];
    if (organModel) {
      const nodeId = SpinalGraphService.createNode(
        {
          name: organModel.name.get(),
          networkName: organModel.name.get(),
          type: organModel.type.get(),
        },
        organModel
      );
      const realNode = SpinalGraphService.getRealNode(nodeId);
      organModel.addReference(contextId, realNode);
      return SpinalGraphService.addChildInContext(
        contextId,
        nodeId,
        contextId,
        SpinalOrganConfigModel.CONTEXT_TO_ORGAN_RELATION,
        SPINAL_RELATION_PTR_LST_TYPE
      );
    }
    return Promise.reject("No model found for this server_id");
  }

  static removeToReference(organServerId, contextId) {
    const organModel = FileSystem._objects[organServerId];
    if (organModel) {
      return organModel.removeReference(contextId).then((node) => {
        const childId = node.getId().get();
        SpinalGraphService.removeChild(
          contextId,
          childId,
          SpinalOrganConfigModel.CONTEXT_TO_ORGAN_RELATION,
          SPINAL_RELATION_PTR_LST_TYPE
        );
      });
    }
    throw new Error("No model found for this server_id");
  }

  static isReferencedInContext(organServerId, contextId) {
    const organModel = FileSystem._objects[organServerId];

    if (organModel) {
      return organModel.isReferencedInContext(contextId);
    }
    throw new Error("No model found for this server_id");
  }

  static getFileModel(file) {
    return new Promise((resolve, reject) => {
      file.load(async (x) => {
        if (x instanceof SpinalOrganConfigModel || x instanceof SpinalOrganOPCUA) return resolve(x);
        if (x.type && (x.type.get() === SpinalOrganConfigModel.TYPE || x.type.get() === SpinalOrganOPCUA.TYPE))
          return resolve(x);
        x.element.ptr.load((el) => resolve(el));
        //   const element = await x.getElement();
        //   resolve(element);
      });
    });
  }

  /**
   * Listen Model
   */

  /**
   * Link Profil to BMS Device
   */

  static linkProfilToDevice(bmsContextId, bmsDeviceId, profilId) {
    return Promise.all([
      this.getEndpointsMap(bmsContextId, bmsDeviceId),
      this.getProfilItemsMap(profilId),
    ]).then((result) => {
    });
  }

  static getEndpointsMap(bmsContextId, bmsDeviceId) {
    return SpinalGraphService.findInContext(
      bmsDeviceId,
      bmsContextId,
      (node) => {
        if (node.getType().get() === SpinalBmsEndpoint.nodeTypeName) {
          SpinalGraphService._addNode(node);
          return true;
        }
        return false;
      }
    ).then((nodes) => {
      const bmsDeviceMap = new Map();

      const promises = nodes.map(async (el) => {
        // const realNode = SpinalGraphService.getRealNode(el.id.get());
        // const element = await realNode.getElement();
        // const networkId = element.get()
        // _temp.nodeId = el.id.get();
        // bmsDeviceMap.set(_temp.id, _temp);
        // return _temp;
        bmsDeviceMap.set(el.idNetwork.get(), el);
      });

      return Promise.all(promises).then(() => {
        return bmsDeviceMap;
      });
    });
  }

  static getProfilItemsMap(profilId) {
    return this.getItemsList(profilId).then((items) => {
    });
  }

  static getItemsList(virtualDeviceId) {
    const ITEM_LIST_RELATION = "hasItemList";

    return SpinalGraphService.getChildren(virtualDeviceId, [ITEM_LIST_RELATION])
      .then((itemList) => {
        const promises = itemList.map((el) =>
          SpinalGraphService.getChildren(el.id.get(), [
            this.ITEM_LIST_TO_ITEMS_RELATION,
          ])
        );
        return Promise.all(promises).then((items) => {
          return items.flat().map((el) => el.get());
        });
      })
      .catch((err) => {
        return [];
      });
  }
}
