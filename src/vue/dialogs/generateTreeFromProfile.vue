<template>
  <md-dialog :md-active.sync="showDialog" @md-closed="closeDialog(false)">
    <md-dialog-title>Generate tree from profile</md-dialog-title>
    <md-dialog-content width="500">
      <div v-if="loadingProfiles" class="state">
        <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
      </div>

      <div v-else-if="devices.length === 0" class="state">
        No devices found.
      </div>

      <div v-else class="devices-list">

        <div class="header">
          <md-button class="md-primary" :disabled="!canGenerateAll || generatingAll" @click="generateAll">
            <md-progress-spinner v-if="generatingAll" md-mode="indeterminate" :md-diameter="20"></md-progress-spinner>
            <span v-else>Generate all</span>
          </md-button>
        </div>

        <div v-for="item in devices" :key="item.device.getId().get()" class="device-row">
          <div class="device-info">
            <strong>{{ item.device.getName().get() }}</strong>
            <span v-if="item.loadingProfile">Loading profile...</span>
            <span v-else-if="item.profile" class="success">Profile linked</span>
            <span v-else class="error">No profile linked</span>
            <span v-if="item.generated" class="success">Tree generated</span>
            <span v-if="item.error" class="error">{{ item.error }}</span>
          </div>
          <md-button class="md-primary"
            :disabled="!item.profile || item.loadingProfile || item.generating || generatingAll"
            @click="generateTree(item)">
            <md-progress-spinner v-if="item.generating" md-mode="indeterminate" :md-diameter="20"></md-progress-spinner>
            <span v-else>{{ item.generated ? "Regenerate" : "Generate tree" }}</span>
          </md-button>
        </div>
      </div>
    </md-dialog-content>

    <md-dialog-actions>

      <md-button class="md-primary" @click="closeDialog(false)">Close</md-button>
    </md-dialog-actions>
  </md-dialog>
</template>

<script>
import {
  SPINAL_RELATION_PTR_LST_TYPE,
  SpinalGraphService,
} from "spinal-env-viewer-graph-service";
import {
  SpinalBmsEndpoint,
  SpinalBmsEndpointGroup,
} from "spinal-model-bmsnetwork";
import utilities from "../../js/utilities";
import { ObjectTypesCodeToName } from "../../js/constants";

export default {
  name: "generateTreeFromProfileDialog",
  props: ["onFinised"],
  data() {
    return {
      showDialog: true,
      devices: [],
      context: null,
      loadingProfiles: true,
      generatingAll: false,
    };
  },
  computed: {
    canGenerateAll() {
      return !this.loadingProfiles
        && !this.devices.some((item) => item.generating)
        && this.devices.some((item) => item.profile);
    },
  },
  methods: {
    async opened({ devices = [], context }) {
      try {
        this.devices = devices.map((device) => ({ device, profile: null, loadingProfile: true, generating: false, generated: false, error: null }));
        this.context = context;
        this.loadingProfiles = true;
        this.devices = devices.map((device) => ({ device, profile: null, loadingProfile: true, generating: false, generated: false, error: null }));

        await this.getDevicesProfile()
      } catch (error) {
        console.error(error);
      }


      this.loadingProfiles = false;
    },

    removed() {
      this.showDialog = false;
    },

    getDevicesProfile() {
      const promises = this.devices.map(async (item) => {
        SpinalGraphService._addNode(item.device); // Example of using SpinalGraphService
        return utilities.getProfilLinkedToDevice(item.device);
      })

      return Promise.allSettled(promises).then((results) => {
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const item = this.devices[i];
          if (result.status === "fulfilled") {
            item.profile = result.value;
          } else {
            console.error(result.reason);
            item.error = result.reason.message || String(result.reason);
          }
          item.loadingProfile = false;
        }
      })

      // await Promise.all(this.devices.map(async (item) => {
      //   try {
      //     item.profile = await utilities.getProfilLinkedToDevice(item.device);
      //   } catch (error) {
      //     console.error(error);
      //     item.error = error.message || String(error);
      //   } finally {
      //     item.loadingProfile = false;
      //   }
      // }));
    },

    async generateAll() {
      if (!this.canGenerateAll || this.generatingAll) return;

      this.generatingAll = true;
      try {
        for (const item of this.devices) {
          if (item.profile) await this.generateTree(item);
        }
      } finally {
        this.generatingAll = false;
      }
    },

    filterAndGetIntervalData(intervals) {
      const data = [];
      for (const { children = [], monitoring = {} } of intervals) {
        const isMonitoring = monitoring.Monitoring === true
          || monitoring.Monitoring === 1
          || String(monitoring.Monitoring).toLowerCase() === "true";
        if (isMonitoring) {
          data.push(...children);
        }
      }
      return data;
    },

    getNewEndpointGroup(type) {
      const typeName = ObjectTypesCodeToName[type] || "unknown";
      const typeNameFormatted = typeName.toLowerCase().replace(/^object_/, "");
      return {
        name: typeNameFormatted,
        type: typeNameFormatted,
        id: type,
        children: [],
        path: "",
      };
    },

    formatEndpoint(endpoint) {
      return {
        name: endpoint.name || "unnamed endpoint",
        id: endpoint.instance,
        typeId: endpoint.type,
        path: "",
        currentValue: "null",
        description: "",
        unit: "",
        max_present_value: "",
        min_present_value: "",
      };
    },

    _classifyEndpointsByType(endpoints) {
      const groups = {};
      for (const endpoint of endpoints) {
        const type = endpoint.type;
        if (!groups[type]) groups[type] = this.getNewEndpointGroup(type);


        groups[type].children.push(this.formatEndpoint(endpoint));
      }
      return groups;
    },

    async generateTree(item) {
      if (!item.profile || !this.context || item.generating) return;

      item.generating = true;
      item.error = null;
      item.generated = false;

      try {
        SpinalGraphService._addNode(item.profile);
        const intervals = await utilities.getProfilIntervals(item.profile.getId().get());
        const profileEndpoints = this.filterAndGetIntervalData(intervals);

        for (const endpoint of profileEndpoints) {
          if (!endpoint.name || !Number.isFinite(endpoint.instance) || !Number.isFinite(endpoint.type)) {
            throw new Error(`Invalid profile endpoint: ${endpoint.name || "unnamed endpoint"}`);
          }
        }

        const endpointGroups = Object.values(this._classifyEndpointsByType(profileEndpoints));
        const deviceId = item.device.getId().get();
        const contextId = this.context.getId().get();

        const existingGroups = await item.device.getChildren([SpinalBmsEndpointGroup.relationName]);

        await this.createGroupTreeStructure(existingGroups, endpointGroups, deviceId, contextId);

        item.generated = true;
      } catch (error) {
        console.error(error);
        item.error = error.message || String(error);
      } finally {
        item.generating = false;
      }
    },

    closeDialog(closeResult) {
      if (typeof this.onFinised === "function") {
        this.onFinised({ closeResult });
      }
    },

    async createBmsEndpointGroupNode(groupInfo, deviceId, contextId) {
      const groupModel = new SpinalBmsEndpointGroup(groupInfo.name, SpinalBmsEndpointGroup.nodeTypeName, groupInfo.path, groupInfo.id);

      let endpointGroupId = SpinalGraphService.createNode({ name: groupInfo.name, type: SpinalBmsEndpointGroup.nodeTypeName }, groupModel);

      const realNode = SpinalGraphService.getRealNode(endpointGroupId);

      this._copyElementModelInInfo(realNode, groupModel);

      await SpinalGraphService.addChildInContext(deviceId, endpointGroupId, contextId, SpinalBmsEndpointGroup.relationName, SPINAL_RELATION_PTR_LST_TYPE);

      return realNode;
    },

    async createBmsEndpointNode(endpointInfo, endpointGroupId, contextId) {
      const endpointModel = new SpinalBmsEndpoint(endpointInfo.name, endpointInfo.path, endpointInfo.currentValue, endpointInfo.unit, "", SpinalBmsEndpoint.nodeTypeName, endpointInfo.id);
      endpointModel.add_attr({ typeId: endpointInfo.typeId });

      const endpointNodeId = SpinalGraphService.createNode({ name: endpointInfo.name, type: SpinalBmsEndpoint.nodeTypeName }, endpointModel);
      await SpinalGraphService.addChildInContext(endpointGroupId, endpointNodeId, contextId, SpinalBmsEndpoint.relationName, SPINAL_RELATION_PTR_LST_TYPE);

      const realNode = SpinalGraphService.getRealNode(endpointNodeId);

      this._copyElementModelInInfo(realNode, endpointModel);

      return realNode;

    },

    _copyElementModelInInfo(realNode, element) {

      for (const key of element._attribute_names) {
        const tempValue = element[key];
        const tempKey = key == 'id' ? 'idNetwork' : key;
        realNode.info.mod_attr(tempKey, tempValue);
      }
    },


    async createGroupTreeStructure(existingGroups, endpointGroups, deviceId, contextId) {

      const existingGroupIdToNode = existingGroups.reduce((acc, group) => {
        if (group.info.idNetwork) acc[group.info.idNetwork.get()] = group;
        return acc
      }, {});

      const promises = [];

      for (const groupInfo of endpointGroups) {
        promises.push(this._createEndpointGroupNode(groupInfo, deviceId, contextId, existingGroupIdToNode));
      }

      return Promise.all(promises);
    },

    async _createEndpointGroupNode(groupInfo, deviceId, contextId, existingGroupIdToNode) {

      let existingGroup = existingGroupIdToNode[groupInfo.id] || existingGroupIdToNode[groupInfo.id.toString()];

      if (!existingGroup) {
        existingGroup = await this.createBmsEndpointGroupNode(groupInfo, deviceId, contextId);
        existingGroupIdToNode[groupInfo.id] = existingGroup;
      } else {
        for (const key in groupInfo) {
          if (key === 'children' || key === 'id' || !existingGroup.info[key]) continue;
          const value = groupInfo[key];
          existingGroup.info[key].set(value);
        }
      }

      const existingEndpoints = await existingGroup.getChildren([SpinalBmsEndpoint.relationName]);

      const existingEndpointsObj = existingEndpoints.reduce((acc, endpoint) => {
        acc[`${endpoint.info.typeId.get()}_${endpoint.info.idNetwork.get()}`] = endpoint;
        return acc;
      }, {});


      return this.generateEndpointsInGroup(existingGroup.getId().get(), contextId, groupInfo.children, existingEndpointsObj);
    },

    generateEndpointsInGroup(groupId, contextId, endpoints, existingEndpointsObj) {
      const promises = [];

      for (const endpointInfo of endpoints) {
        const endpointKey = `${endpointInfo.typeId}_${endpointInfo.id}`;
        if (existingEndpointsObj[endpointKey])
          continue;

        promises.push(this.createBmsEndpointNode(endpointInfo, groupId, contextId).then(endpointNode => {
          existingEndpointsObj[endpointKey] = endpointNode;
        }));
      }

      return Promise.all(promises);
    }
  },

};
</script>

<style scoped>
.devices-list {
  min-width: 420px;
}

.device-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #ddd;
}

.device-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.state {
  display: flex;
  justify-content: center;
  padding: 24px;
}

.success {
  color: #4caf50;
}

.error {
  color: #f44336;
}
</style>
