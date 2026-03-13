import utilities from "./utilities";
import { DeviceProfileUtilities } from "spinal-env-viewer-plugin-network-tree-service";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { SpinalMonitorInfoModel } from "spinal-model-bacnet";

class MonitorSate {
  constructor() {
    this.profils = new Map();
    this.network;
    this.organ;
    this.graph;
    this.context;
  }

  async init(graph, context, node) {
    this.graph = graph;
    this.context = context;
    this.network = await utilities.getNetwork(node, context);
    this.organ = await utilities.getOrgan(this.network, context);
  }

  async startMonitoring(deviceId, profilId, listenerModel) {
    if (!profilId) return -1;

    // const infoMonit = this.profils.get(profilId);
    // if (!infoMonit) return -1;

    const model = await this.getListenerModel(deviceId, listenerModel);

    const deviceNode = SpinalGraphService.getRealNode(deviceId);

    return utilities.createOrModifyListenerModel(this.graph, this.context, this.network, model, infoMonit, this.organ, deviceNode);
  }

  async stopMonitoring(deviceId, profilId, argModel) {
    try {
      if (!profilId) return -1;
      const model = await this.getListenerModel(deviceId, argModel);

      if (model != -1 && model.listen) model.listen.set(false);
    } catch (error) { }
  }

  async addProfile(profilId) {
    if (this.profils.get(profilId)) return;
    const intervals = await this.getIntervalsModel(profilId);
    this.profils.set(profilId, intervals);
  }

  getProfilIntervals(profilId) {
    return this.profils.get(profilId);
  }

  async updateProfile(profilId) {
    const intervals = await this.getIntervalsModel(profilId);
    this.profils.set(profilId, intervals);
  }

  async getIntervalsModel(profilId) {
    return utilities
      .getProfilIntervals(profilId)
      .then((result) => {
        const data = result.map(({ monitoring, children }) => {
          return {
            monitoring: monitoring.Monitoring,
            interval: monitoring.IntervalTime,
            children,
          };
        });

        const profilNode = SpinalGraphService.getRealNode(profilId);
        return new SpinalMonitorInfoModel(profilNode, data);
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  }

  async getListenerModel(deviceId, listenerModel) {
    return listenerModel && listenerModel !== -1 ? listenerModel : await utilities.getModel(deviceId);
  }

  clear() {
    this.network = null;
    this.organ = null;
    this.profils.clear();
  }
}

export const monitorState = new MonitorSate();
