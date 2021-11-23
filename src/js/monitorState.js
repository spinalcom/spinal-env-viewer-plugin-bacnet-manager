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

  async init(graph, contextId, nodeId) {
    this.graph = graph;
    this.context = SpinalGraphService.getRealNode(contextId);
    this.network = await utilities.getNetwork(nodeId, contextId);
    const networkId = this.network.getId().get();
    this.organ = await utilities.getOrgan(networkId, contextId);
  }

  async startMonitoring(deviceId, profilId, argModel) {
    if (!profilId) return -1;
    const infoMonit = this.profils.get(profilId);
    if (!infoMonit) return -1;
    const model = await this.getModel(deviceId, argModel);

    const deviceNode = SpinalGraphService.getRealNode(deviceId);

    return utilities.createOrModifyListenerModel(
      this.graph,
      this.context,
      this.network,
      model,
      infoMonit,
      this.organ,
      deviceNode
    );
  }

  async stopMonitoring(deviceId, profilId, argModel) {
    try {
      if (!profilId) return -1;
      const model = await this.getModel(deviceId, argModel);

      if (model != -1 && model.listen) model.listen.set(false);
    } catch (error) {}
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

  async getModel(deviceId, argModel) {
    return argModel && argModel !== -1
      ? argModel
      : await utilities.getModel(deviceId);
  }

  clear() {
    this.network = null;
    this.organ = null;
    this.profils.clear();
  }
}

export const monitorState = new MonitorSate();
