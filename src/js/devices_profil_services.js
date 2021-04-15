import { SpinalGraphService, SPINAL_RELATION_PTR_LST_TYPE } from "spinal-env-viewer-graph-service";
import { DEVICE_RELATION_NAME, PART_RELATION_NAME } from "spinal-env-viewer-plugin-device_profile/constants";


export default {
   DEVICE_PROFILE_CONTEXT: "deviceProfileContext",
   ITEM_LIST_RELATION: "hasItemList",
   ITEM_LIST_TO_ITEMS_RELATION: "hasItem",

   getDevicesContexts() {
      const result = SpinalGraphService.getContextWithType(this.DEVICE_PROFILE_CONTEXT)

      return result.map(el => el.info.get())
   },

   getDeviceProfiles(contextId) {
      return SpinalGraphService.getChildren(contextId, [DEVICE_RELATION_NAME]).then((result) => {
         return result.map(el => el.get())
      }).catch((err) => {
         return []
      });
   },

   getDevices(profilId) {
      return SpinalGraphService.getChildren(profilId, [PART_RELATION_NAME]).then((result) => {
         return result.map(el => el.get())
      }).catch((err) => {
         return []
      });
   },

   getItemsList(virtualDeviceId) {
      return SpinalGraphService.getChildren(virtualDeviceId, [this.ITEM_LIST_RELATION]).then((itemList) => {
         const promises = itemList.map(el => SpinalGraphService.getChildren(el.id.get(), [this.ITEM_LIST_TO_ITEMS_RELATION]));
         return Promise.all(promises).then((items) => {
            return items.flat().map(el => el.get())
         })
      }).catch((err) => {
         return []
      });
   },

   getDeviceContextTreeStructure() {
      const contexts = this.getDevicesContexts()
      const promises = contexts.map(async el => {
         const profils = await this.getDeviceProfiles(el.id);

         const profilPromises = profils.map(async profil => {
            const devices = await this.getDevices(profil.id);

            const itemsPromises = devices.map(async device => {
               device.itemList = await this.getItemsList(device.id);
               return device;
            })

            profil.devices = await Promise.all(itemsPromises);
            return profil;
         })

         el.profils = await Promise.all(profilPromises);
         return el;
      })

      return Promise.all(promises);
   },
}