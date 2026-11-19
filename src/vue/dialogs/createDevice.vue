<template>
  <md-dialog class="create-device-dialog" :md-active.sync="showDialog" @md-closed="closeDialog(false)">
    <md-dialog-title>Create BACnet devices</md-dialog-title>

    <md-dialog-content>
      <template v-if="status === STATUS.loaded || status === STATUS.error">
        <div class="toolbar">
          <md-button flat class="md-dense md-primary" @click="addRow">
            <md-icon>add</md-icon>
            Add row
          </md-button>

          <md-button class="md-dense md-accent" @click="resetRows">
            <md-icon>clear</md-icon>
            Reset
          </md-button>

          <md-button class="md-dense" @click="uploadFile">
            <md-icon>file_upload</md-icon>
            Upload Excel
          </md-button>
          <input ref="fileInput" class="file-input" type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            @change="handleFileUpload" />
        </div>

        <div v-if="importError" class="message error">{{ importError }}</div>
        <div v-if="status === STATUS.error" class="message error">
          Certains devices n’ont pas pu être créés. Corrige les lignes signalées puis réessaie.
        </div>

        <div class="table-scroll">
          <div class="device-row table-header">
            <span>Name</span>
            <span>IP / Address</span>
            <span>Device ID</span>
            <span>Description</span>
            <span aria-hidden="true"></span>
          </div>

          <div v-for="(device, index) in devices" :key="device.id" class="device-row">
            <md-field :class="{ 'md-invalid': showValidation && !isValidValue(device.name) }">
              <label>Name *</label>
              <md-input v-model="device.name" :disabled="device.created"></md-input>
            </md-field>
            <md-field :class="{ 'md-invalid': showValidation && !isValidValue(device.ip) }">
              <label>IP / Address *</label>
              <md-input v-model="device.ip" :disabled="device.created"></md-input>
            </md-field>
            <md-field :class="{ 'md-invalid': showValidation && !isValidValue(device.deviceId) }">
              <label>Device ID *</label>
              <md-input v-model="device.deviceId" :disabled="device.created"></md-input>
            </md-field>
            <md-field>
              <label>Description</label>
              <md-input v-model="device.description" :disabled="device.created"></md-input>
            </md-field>
            <md-button class="md-icon-button md-accent remove-row"
              :disabled="devices.length === 1 || device.created || status === STATUS.loading" v-tooltip="'Remove row'"
              @click="removeRow(index)">
              <md-icon>delete_outline</md-icon>
            </md-button>
            <div v-if="device.error" class="row-error">{{ device.error }}</div>
          </div>
        </div>
      </template>

      <div class="state" v-else-if="status === STATUS.loading">
        <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
        <span>Creating devices…</span>
      </div>

      <div class="state" v-else-if="status === STATUS.success">
        <md-icon class="md-size-5x success">check</md-icon>
        <span>{{ createdCount }} device(s) created successfully.</span>
      </div>
    </md-dialog-content>

    <md-dialog-actions>
      <md-button @click="closeDialog(false)">Close</md-button>
      <md-button class="md-primary" v-if="status === STATUS.loaded || status === STATUS.error" :disabled="!isValidForm"
        @click="createDevices">
        {{ status === STATUS.error ? "Retry failed" : "Create devices" }}
      </md-button>
      <md-button class="md-primary" v-if="status === STATUS.success" @click="closeDialog(true)">Done</md-button>
    </md-dialog-actions>
  </md-dialog>
</template>

<script>
import { SPINAL_RELATION_PTR_LST_TYPE, SpinalGraphService } from "spinal-env-viewer-graph-service";
import { SpinalBmsDevice } from "spinal-model-bmsnetwork";
import spinalExcelManager from "spinal-env-viewer-plugin-excel-manager-service";

const createEmptyDevice = (id) => ({
  id,
  name: "",
  ip: "",
  deviceId: "",
  description: "",
  created: false,
  error: null,
});

export default {
  name: "createBmsDeviceDialog",
  props: ["onFinised"],
  data() {
    const STATUS = {
      loading: "loading",
      loaded: "loaded",
      success: "success",
      error: "error",
    };

    return {
      STATUS,
      showDialog: true,
      selectedNode: null,
      context: null,
      status: STATUS.loaded,
      nextRowId: 1,
      devices: [createEmptyDevice(0)],
      importError: null,
      showValidation: false,
    };
  },
  computed: {
    isValidForm() {
      return this.devices.length > 0
        && this.devices.every((device) => device.created || (
          this.isValidValue(device.name)
          && this.isValidValue(device.ip)
          && this.isValidValue(device.deviceId)
        ));
    },

    createdCount() {
      return this.devices.filter((device) => device.created).length;
    },
  },
  methods: {
    opened({ selectedNode, context }) {
      this.selectedNode = selectedNode;
      this.context = context;
      this.status = this.STATUS.loaded;
      this.devices = [createEmptyDevice(0)];
      this.nextRowId = 1;
      this.importError = null;
      this.showValidation = false;
    },

    removed() {
      this.showDialog = false;
    },

    isValidValue(value) {
      return typeof value === "string" && value.trim().length > 0;
    },

    addRow() {
      this.devices.push(createEmptyDevice(this.nextRowId++));
      this.importError = null;
    },

    removeRow(index) {
      if (this.devices.length <= 1) return;
      this.devices.splice(index, 1);
    },

    resetRows() {
      this.devices = [createEmptyDevice(this.nextRowId++)];
      this.status = this.STATUS.loaded;
      this.importError = null;
      this.showValidation = false;
    },

    uploadFile() {
      this.importError = null;
      this.$refs.fileInput.value = "";
      this.$refs.fileInput.click();
    },

    async handleFileUpload(event) {
      const [file] = event.target.files || [];
      if (!file) return;

      try {
        const workbook = await spinalExcelManager.convertExcelToJson(file);
        const rows = Object.keys(workbook).reduce((allRows, sheetName) => {
          const sheetRows = workbook[sheetName];
          if (Array.isArray(sheetRows)) allRows.push(...sheetRows);
          return allRows;
        }, []);

        if (rows.length === 0) {
          throw new Error("The selected Excel file contains no device rows.");
        }

        this.devices = rows.map((row, index) => ({
          ...createEmptyDevice(this.nextRowId + index),
          name: this.getExcelValue(row, ["name", "devicename"]),
          ip: this.getExcelValue(row, ["ip", "address", "ipaddress"]),
          deviceId: this.getExcelValue(row, ["deviceid", "bacnetdeviceid"]),
          description: this.getExcelValue(row, ["description", "comment"]),
        }));
        this.nextRowId += rows.length;
        this.status = this.STATUS.loaded;
        this.showValidation = true;
      } catch (error) {
        console.error("Failed to import BACnet devices from Excel", error);
        this.importError = `Impossible de lire le fichier Excel : ${error.message || error}`;
      } finally {
        event.target.value = "";
      }
    },

    getExcelValue(row, acceptedHeaders) {
      const header = Object.keys(row).find((key) => {
        const normalizedKey = key.replace(/[\s_-]/g, "").toLowerCase();
        return acceptedHeaders.includes(normalizedKey);
      });
      if (!header || row[header] === undefined || row[header] === null) return "";
      return String(row[header]).trim();
    },

    async createDevices() {
      if (!this.isValidForm || !this.selectedNode || !this.context) return;

      this.status = this.STATUS.loading;
      this.importError = null;

      for (const device of this.devices) {
        if (device.created) continue;

        device.error = null;
        try {
          await this.createDevice(device);
          device.created = true;
        } catch (error) {
          console.error(`Failed to create BACnet device "${device.name}"`, error);
          device.error = error.message || "Device creation failed.";
        }
      }

      this.status = this.devices.every((device) => device.created)
        ? this.STATUS.success
        : this.STATUS.error;
    },

    async createDevice(device) {
      const parentId = this.selectedNode.id.get();
      const contextId = this.context.id.get();
      const name = device.name.trim();
      const ip = device.ip.trim();
      const deviceId = device.deviceId.trim();
      const description = device.description.trim();

      const model = new SpinalBmsDevice(name, SpinalBmsDevice.nodeTypeName, "", deviceId);
      model.add_attr({
        deviceId,
        address: ip,
        typeId: 8,
        description,
      });

      const nodeId = SpinalGraphService.createNode({
        type: SpinalBmsDevice.nodeTypeName,
        name,
      }, model);
      const realNode = SpinalGraphService.getRealNode(nodeId);

      for (const attr of model._attribute_names) {
        const value = model[attr];
        const key = attr === "id" ? "idNetwork" : attr;
        realNode.info.mod_attr(key, value);
      }

      await SpinalGraphService.addChildInContext(
        parentId,
        nodeId,
        contextId,
        SpinalBmsDevice.relationName,
        SPINAL_RELATION_PTR_LST_TYPE
      );
    },

    closeDialog(closeResult) {
      if (typeof this.onFinised === "function") {
        this.onFinised({
          closeResult,
          devices: this.devices.map(({ name, ip, deviceId, description }) => ({
            name,
            ip,
            deviceId,
            description,
          })),
        });
      }
    },
  },
};
</script>

<style scoped>
.create-device-dialog {
  width: min(940px, calc(100vw - 32px));
  height: 750px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  justify-content: flex-end;
}

.file-input {
  display: none;
}

.table-scroll {
  max-height: 55vh;
  overflow: auto;
}

.device-row {
  display: grid;
  grid-template-columns: 1fr 1fr 0.8fr 1.2fr 40px;
  align-items: start;
  column-gap: 12px;
  padding: 0 8px;
}

.table-header {
  position: sticky;
  top: 0;
  z-index: 1;
  padding-top: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #888;
  font-size: 0.85em;
  font-weight: 500;
}

.device-row .md-field {
  min-width: 0;
  margin: 8px 0;
}

.remove-row {
  margin: 12px 0 0;
}

.row-error {
  grid-column: 1 / -1;
  color: #ff5252;
  padding: 0 0 8px;
  font-size: 0.85em;
}

.message {
  margin: 8px 0;
}

.error {
  color: #ff5252;
}

.state {
  min-height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.state .success {
  color: #4caf50;
}

@media (max-width: 760px) {
  .toolbar {
    flex-wrap: wrap;
  }

  .table-scroll {
    overflow-x: auto;
  }

  .device-row {
    min-width: 760px;
  }
}
</style>
