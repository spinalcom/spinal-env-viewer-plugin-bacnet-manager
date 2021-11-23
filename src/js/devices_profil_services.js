import {
  SpinalGraphService,
  SPINAL_RELATION_PTR_LST_TYPE,
} from "spinal-env-viewer-graph-service";
import {
  DEVICE_RELATION_NAME,
  PART_RELATION_NAME,
} from "spinal-env-viewer-plugin-device_profile/constants";

export default class ProfilService {
  static DEVICE_PROFILE_CONTEXT = "deviceProfileContext";
  static ITEM_LIST_RELATION = "hasItemList";
  static ITEM_LIST_TO_ITEMS_RELATION = "hasItem";

  static getDevicesContexts() {
    const result = SpinalGraphService.getContextWithType(
      this.DEVICE_PROFILE_CONTEXT
    );
    return result.map((el) => el.info.get());
  }

  static getDeviceProfiles(contextId) {
    return SpinalGraphService.getChildren(contextId, [DEVICE_RELATION_NAME])
      .then((result) => {
        return result.map((el) => el.get());
      })
      .catch((err) => {
        return [];
      });
  }

  static getDevices(profilId) {
    return SpinalGraphService.getChildren(profilId, [PART_RELATION_NAME])
      .then((result) => {
        return result.map((el) => el.get());
      })
      .catch((err) => {
        return [];
      });
  }

  static getItemsList(virtualDeviceId) {
    return SpinalGraphService.getChildren(virtualDeviceId, [
      this.ITEM_LIST_RELATION,
    ])
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

  static getDeviceContextTreeStructure() {
    const contexts = this.getDevicesContexts();
    const promises = contexts.map(async (el) => {
      const profils = await this.getDeviceProfiles(el.id);

      const profilPromises = profils.map(async (profil) => {
        const devices = await this.getDevices(profil.id);

        const itemsPromises = devices.map(async (device) => {
          device.itemList = await this.getItemsList(device.id);
          return device;
        });

        profil.devices = await Promise.all(itemsPromises);
        return profil;
      });

      el.profils = await Promise.all(profilPromises);
      return el;
    });

    return Promise.all(promises);
  }

  static getProfilLinkedToDevice(deviceId) {
    return SpinalGraphService.getChildren(deviceId, ["hasBacnetProfile"]).then(
      (result) => {
        return result.map((el) => el.get());
      }
    );
  }

  static async getMonitoringInfo(deviceId) {
    const [profilContext] = await this.getDevicesContexts();
    const [profil] = await this.getProfilLinkedToDevice(deviceId);
    if (profilContext && profil) {
    }
  }
}
