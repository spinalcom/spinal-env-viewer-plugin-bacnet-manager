import { spinalCore, FileSystem } from "spinal-core-connectorjs_type";
import { SpinalGraphService, SPINAL_RELATION_PTR_LST_TYPE } from "spinal-env-viewer-graph-service";
import { SpinalOrganConfigModel } from "spinal-model-bacnet";

export class SpinalBacnetPluginService {
   constructor() { }

   static getOrgans(connection) {
      console.log("getOrgans called")
      const organs = [];
      let found = 0;
      spinalCore.load_type(connection, "SpinalOrganConfigModel", (file) => {
         console.log("file", file)
         found++;
         organs.push(file)
      })
      while (organs.length < found) { }

      return organs;
   }

   static addToReference(organServerId, contextId) {
      const organModel = FileSystem._objects[organServerId];
      if (organModel) {
         const nodeId = SpinalGraphService.createNode({ name: organModel.name.get(), networkName: organModel.name.get(), type: organModel.type.get() }, organModel);
         const realNode = SpinalGraphService.getRealNode(nodeId);
         organModel.addReference(contextId, realNode);
         SpinalGraphService.addChildInContext(contextId, nodeId, contextId, SpinalOrganConfigModel.CONTEXT_TO_ORGAN_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
         return
      }
      throw new Error("No model found for this server_id");
   }

   static removeToReference(organServerId, contextId) {
      const organModel = FileSystem._objects[organServerId];
      if (organModel) {
         return organModel.removeReference(contextId).then((node) => {
            const childId = node.getId().get()
            SpinalGraphService.removeChild(contextId, childId, SpinalOrganConfigModel.CONTEXT_TO_ORGAN_RELATION, SPINAL_RELATION_PTR_LST_TYPE)
         })
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

}