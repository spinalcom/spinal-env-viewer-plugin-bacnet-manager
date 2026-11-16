<template>
  <div class="indicator-details-panel"
    :class="{ 'history-open': page === 'history', 'devices-open': page !== 'history' }">
    <div v-if="page === 'history'" class="panel-content history-page">
      <header class="history-header">
        <md-button class="md-icon-button" aria-label="Retour à la liste des devices" v-tooltip="'Retour'"
          @click="showDeviceList">
          <md-icon>arrow_back</md-icon>
        </md-button>
        <h2>{{ selectedDevice ? selectedDevice.name : "Historique" }}</h2>
        <md-field class="history-period">
          <label>Période</label>
          <md-select v-model="historyDays" aria-label="Période de l'historique">
            <md-option value="1">24 heures</md-option>
            <md-option value="7">7 jours</md-option>
            <md-option value="30">30 jours</md-option>
          </md-select>
        </md-field>
        <md-button class="md-icon-button" :disabled="historyLoading" aria-label="Actualiser l'historique"
          v-tooltip="'Actualiser l’historique'" @click="loadHistory">
          <md-icon>refresh</md-icon>
        </md-button>
      </header>

      <div v-if="historyLoading" class="panel-state">
        <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
      </div>
      <div v-else-if="historyError" class="panel-state error">{{ historyError }}</div>
      <div v-else class="history-content">
        <div class="history-filters">
          <md-field>
            <label>Type</label>
            <md-select v-model="historyTypeFilter" aria-label="Filtrer l'historique par type">
              <md-option value="all">Tous</md-option>
              <md-option value="bacnet">BACnet</md-option>
              <md-option value="ping">Ping</md-option>
            </md-select>
          </md-field>
          <md-field>
            <label>Résultat</label>
            <md-select v-model="historyStateFilter" aria-label="Filtrer l'historique par résultat">
              <md-option value="all">Tous</md-option>
              <md-option value="ok">Succès</md-option>
              <md-option value="degraded">Dégradé</md-option>
              <md-option value="ko">Échec</md-option>
              <md-option value="unknown">Inconnu</md-option>
            </md-select>
          </md-field>
        </div>
        <div v-if="allHistoryLogs.length === 0" class="panel-state">
          Aucun historique disponible pour cette période.
        </div>
        <div v-else-if="historyLogs.length === 0" class="panel-state">
          Aucun événement ne correspond à ces filtres.
        </div>
        <div v-else class="history-table-wrap">
          <table class="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Points réussis</th>
                <th>Points échoués</th>
                <th>Temps de réponse</th>
                <th>Statut ping</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in historyLogs" :key="log.id" class="history-log-row" :class="log.state">
                <td>{{ log.date }}</td>
                <td>{{ log.kind === "bacnet" ? "BACnet" : "Ping" }}</td>
                <td>{{ log.kind === "bacnet" && log.successfulPoints !== null ? log.successfulPoints : "—" }}</td>
                <td>{{ log.kind === "bacnet" && log.failedPoints !== null ? log.failedPoints : "—" }}</td>
                <td>{{ log.kind === "bacnet" || log.state === "ok" ? formatResponseTime(log.responseTime) : "—" }}</td>
                <td>{{ log.kind === "ping" ? log.status : "—" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div v-else-if="loading" class="panel-state">
      <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
    </div>
    <div v-else-if="error" class="panel-state error">{{ error }}</div>
    <div v-else-if="deviceSummaries.length === 0" class="panel-state">
      Aucun device à afficher.
    </div>
    <div v-else class="panel-content devices-page">
      <div class="refreshDiv">
        <md-button :disabled="loading" @click="refreshData">
          <md-icon>refresh</md-icon>
          Actualiser
        </md-button>
      </div>

      <div class="filters">
        <md-field class="filter-name">
          <label>Nom du device</label>
          <md-input v-model="filterForm.name" type="search" aria-label="Filtrer par nom du device"></md-input>
        </md-field>
        <md-field class="filter-status">
          <label>Statut BACnet</label>
          <md-select v-model="filterForm.bacnet" aria-label="Filtrer par statut BACnet">
            <md-option value="all">Tous</md-option>
            <md-option value="ok">OK</md-option>
            <md-option value="ko">KO</md-option>
            <md-option value="unknown">Inconnu</md-option>
          </md-select>
        </md-field>
        <md-field class="filter-status">
          <label>Statut ping</label>
          <md-select v-model="filterForm.ping" aria-label="Filtrer par statut ping">
            <md-option value="all">Tous</md-option>
            <md-option value="ok">OK</md-option>
            <md-option value="ko">KO</md-option>
            <md-option value="unknown">Inconnu</md-option>
          </md-select>
        </md-field>
        <div class="filter-actions">

          <md-button @click="clearFilters">
            <md-icon>close</md-icon>
            Effacer
          </md-button>
        </div>
      </div>

      <div class="result-count">{{ filteredDevices.length }} device(s) affiché(s) sur {{ deviceSummaries.length }}</div>
      <div v-if="filteredDevices.length === 0" class="panel-state">
        Aucun device ne correspond à ces filtres.
      </div>
      <div v-else class="devices-list">
        <section v-for="device in filteredDevices" :key="device.id" class="device">
          <header class="device-header">
            <div class="device-title">
              <md-icon>router</md-icon>
              <strong>{{ device.name }}</strong>
            </div>

            <div class="device-actions">
              <md-button class="md-dense" @click.stop="openHistory(device)">
                <md-icon>history</md-icon>
                Détail
              </md-button>

              <md-button class="md-icon-button" :aria-label="`Ouvrir le dashboard de ${device.name}`"
                v-tooltip="`Ouvrir le dashboard de ${device.name}`" @click.stop="openDashboard(device)">
                <md-icon>dashboard</md-icon>
              </md-button>
            </div>

          </header>

          <div v-if="device.error" class="device-message error">{{ device.error }}</div>
          <div v-else-if="device.controlPointCount === 0" class="device-message">
            Aucun controlpoint.
          </div>
          <div v-else class="health-list">
            <div v-for="health in device.health" :key="health.id" class="health-row">
              <div class="health-name">{{ health.name }}</div>
              <div class="health-status">
                <span class="health-badge" :class="health.state">
                  {{ getStatus(health.state) }}
                </span>
                <span class="health-label">{{ health.label }}</span>
              </div>
              <div class="health-date">{{ health.dateLabel }} : {{ health.date || "Inconnue" }}</div>
            </div>
            <div v-if="device.controlPointCount === 0" class="device-message">
              Aucun controlpoint.
            </div>
            <div v-else-if="device.health.every((health) => health.state === 'unknown')" class="device-message">
              Statut BACnet ou ping indisponible.
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import debounce from "lodash.debounce";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { serviceDocumentation } from "spinal-env-viewer-plugin-documentation-service";
import { spinalServiceTimeseries } from "spinal-env-viewer-plugin-endpoint_chart_viewer/src/timeseriesServiceInstance";

const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");

export default {
  name: "indicatorDetailsPanel",
  data() {
    return {
      deviceSummaries: [],
      loading: true,
      error: null,
      filterForm: {
        name: "",
        bacnet: "all",
        ping: "all",
      },
      appliedFilters: {
        name: "",
        bacnet: "all",
        ping: "all",
      },
      page: "devices",
      selectedDevice: null,
      historyDays: "7",
      historyTypeFilter: "all",
      historyStateFilter: "all",
      historyLoading: false,
      historyError: null,
      bacnetLogs: [],
      pingLogs: [],
      historyRequestId: 0,
    };
  },

  created() {
    this.debouncedApplyNameFilter = debounce((name) => {
      this.appliedFilters.name = name;
    }, 300);
  },

  watch: {
    "filterForm.name"(value) {
      this.debouncedApplyNameFilter(value);
    },

    "filterForm.bacnet"(value) {
      this.appliedFilters.bacnet = value;
    },

    "filterForm.ping"(value) {
      this.appliedFilters.ping = value;
    },

    historyDays() {
      if (this.page === "history" && this.selectedDevice) this.loadHistory();
    },
  },

  computed: {
    filteredDevices() {
      const nameQuery = this.appliedFilters.name.trim().toLocaleLowerCase();

      return this.deviceSummaries.filter((device) => {
        if (!device.name.toLocaleLowerCase().includes(nameQuery)) return false;

        return ["bacnet", "ping"].every((kind) => {
          const filter = this.appliedFilters[kind];
          if (filter === "all") return true;

          const health = device.health.find((item) => item.id === kind);
          return (health ? health.state : "unknown") === filter;
        });
      });
    },

    allHistoryLogs() {
      return [...this.bacnetLogs, ...this.pingLogs].sort((a, b) => b.timestamp - a.timestamp);
    },

    historyLogs() {
      return this.allHistoryLogs.filter((log) => {
        const matchesType = this.historyTypeFilter === "all" || log.kind === this.historyTypeFilter;
        const matchesState = this.historyStateFilter === "all" || log.state === this.historyStateFilter;
        return matchesType && matchesState;
      });
    },
  },

  methods: {
    openDashboard(device) {
      const selectedNode = SpinalGraphService.getInfo(device.id);
      spinalPanelManagerService.openPanel("spinal_dashboard_panel", selectedNode);
    },

    async openHistory(device) {
      this.selectedDevice = device;
      this.page = "history";
      await this.loadHistory();
    },

    showDeviceList() {
      this.historyRequestId += 1;
      this.historyLoading = false;
      this.page = "devices";
    },

    async loadHistory() {
      if (!this.selectedDevice) return;

      const requestId = ++this.historyRequestId;
      this.historyLoading = true;
      this.historyError = null;
      this.bacnetLogs = [];
      this.pingLogs = [];

      try {
        const interval = spinalServiceTimeseries.getDateFromLastDays(Number(this.historyDays));
        const history = await Promise.all((this.selectedDevice.historyTargets || []).map(async (target) => {
          if (!await spinalServiceTimeseries.hasTimeSeries(target.id)) return [];

          const points = await spinalServiceTimeseries.getData(target.id, interval);
          return points.map((point) => ({
            kind: target.kind,
            metric: target.metric,
            endpointId: target.id,
            timestamp: Number(point.date),
            rawValue: point.value,
            legend: target.legend,
          }));
        }));

        if (requestId === this.historyRequestId) {
          const logsBySecond = new Map();
          history.flat().forEach((point) => {
            if (!Number.isFinite(point.timestamp)) return;

            const second = Math.floor(point.timestamp / 1000);
            const key = `${point.kind}-${second}`;
            if (!logsBySecond.has(key)) {
              logsBySecond.set(key, {
                id: key,
                kind: point.kind,
                timestamp: point.timestamp,
                date: this.formatDate(point.timestamp),
                successfulPoints: null,
                failedPoints: null,
                responseTime: null,
                pingStatus: null,
              });
            }

            const log = logsBySecond.get(key);
            if (point.timestamp < log.timestamp) {
              log.timestamp = point.timestamp;
              log.date = this.formatDate(point.timestamp);
            }

            const value = point.metric === "status"
              ? this.getLegendValue(point.rawValue, point.legend)
              : Number.isFinite(Number(point.rawValue)) ? Number(point.rawValue) : point.rawValue;
            if (point.metric === "successfulPoints") log.successfulPoints = value;
            if (point.metric === "failedPoints") log.failedPoints = value;
            if (point.metric === "responseTime") log.responseTime = value;
            if (point.metric === "status") log.pingStatus = value;
          });

          const logs = [...logsBySecond.values()];
          this.bacnetLogs = logs
            .filter((log) => log.kind === "bacnet")
            .map((log) => ({ ...log, ...this.getBacnetResult(log) }))
            .sort((a, b) => b.timestamp - a.timestamp);
          this.pingLogs = logs
            .filter((log) => log.kind === "ping")
            .map((log) => ({ ...log, ...this.getPingResult(log) }))
            .sort((a, b) => b.timestamp - a.timestamp);
        }
      } catch (error) {
        console.error(`Failed to load status history for ${this.selectedDevice.name}`, error);
        if (requestId === this.historyRequestId) this.historyError = "Impossible de charger l'historique.";
      } finally {
        if (requestId === this.historyRequestId) this.historyLoading = false;
      }
    },

    clearFilters() {
      this.debouncedApplyNameFilter.cancel();
      this.filterForm = { name: "", bacnet: "all", ping: "all" };
      this.appliedFilters = { ...this.filterForm };
    },

    async opened({ devices = [] }) {
      this.devicesToRefresh = devices;
      await this.refreshData();
    },

    async refreshData() {
      this.loading = true;
      this.error = null;

      try {
        this.deviceSummaries = await Promise.all(
          (this.devicesToRefresh || []).map((device) => this.getDeviceSummary(device))
        );
      } catch (error) {
        console.error("Failed to load BACnet indicator details", error);
        this.error = "Impossible de charger les indicateurs BACnet.";
      } finally {
        this.loading = false;
      }
    },

    async getDeviceSummary(device) {
      SpinalGraphService._addNode(device)
      const summary = {
        id: device.getId().get(),
        name: device.getName().get(),
        controlPointCount: 0,
        health: [],
        historyTargets: [],
        error: null,
      };

      try {
        const controlPoints = await device.getChildren(["hasControlPoints"]);
        summary.controlPointCount = controlPoints.length;
        const endpointSummaries = (await Promise.all(controlPoints.map(async (controlPoint) => {
          const endpoints = await controlPoint.getChildren(["hasBmsEndpoint"]);
          return Promise.all(endpoints.map(async (endpoint) => {
            const element = await endpoint.getElement(true);
            const endpointName = this.getModelValue(element, "name") || endpoint.getName().get();
            const controlPointName = controlPoint.getName().get();
            const metric = this.getEndpointMetric(endpointName);
            const kind = this.getHealthKind(`${controlPointName} ${endpointName}`);
            if (!metric || !kind) return null;
            SpinalGraphService._addNode(endpoint);
            const currentValue = this.getModelValue(element, "currentValue");

            let value = currentValue;
            let legend = [];
            if (metric === "status") {
              try {
                legend = await serviceDocumentation.getAttributesByCategory(endpoint, "value legend");
              } catch (error) {
                console.warn(`Failed to load status legend for ${endpointName}`, error);
              }
              legend = legend.map((attribute) => ({
                label: this.getModelValue(attribute, "label"),
                value: this.getModelValue(attribute, "value"),
              }));
              value = this.getLegendValue(currentValue, legend);
            } else if (metric === "lastPing" || metric === "lastResponse") {
              value = this.formatDate(currentValue);
            } else {
              value = currentValue;
            }

            return {
              id: endpoint.getId().get(),
              kind,
              metric,
              legend,
              value: value === undefined || value === null || value === "" ? null : String(value),
            };
          }));
        }))).flat().filter(Boolean);

        summary.historyTargets = endpointSummaries
          .filter((endpoint) => (endpoint.kind === "bacnet"
            && ["successfulPoints", "failedPoints", "responseTime"].includes(endpoint.metric))
            || (endpoint.kind === "ping" && ["status", "responseTime"].includes(endpoint.metric)))
          .map((endpoint) => ({
            id: endpoint.id,
            kind: endpoint.kind,
            metric: endpoint.metric,
            name: endpoint.kind === "bacnet" ? "Communication BACnet" : "Ping",
            legend: endpoint.legend,
          }));

        summary.health = ["bacnet", "ping"].map((kind) => {
          const status = endpointSummaries.find((endpoint) => endpoint.kind === kind && endpoint.metric === "status");
          const dateMetric = kind === "ping" ? "lastPing" : "lastResponse";
          const date = endpointSummaries.find((endpoint) => endpoint.kind === kind && endpoint.metric === dateMetric);
          const label = status && status.value ? status.value : "Statut indisponible";

          return {
            id: kind,
            name: kind === "bacnet" ? "Communication BACnet" : "Ping",
            state: this.getHealthState(status && status.value),
            label,
            dateLabel: kind === "bacnet" ? "Dernière réponse" : "Dernier ping",
            date: date && date.value,
          };
        });
      } catch (error) {
        console.error(`Failed to load BACnet indicators for device ${summary.name}`, error);
        summary.error = "Impossible de charger les indicateurs de ce device.";
      }

      return summary;
    },

    getModelValue(model, key) {
      if (!model || model[key] === undefined || model[key] === null) return undefined;
      const value = model[key];
      return typeof value.get === "function" ? value.get() : value;
    },

    getLegendValue(currentValue, legend) {
      if (currentValue === undefined || currentValue === null || currentValue === "") return "—";

      const current = String(currentValue).trim().toLocaleLowerCase();
      const match = legend.find((attribute) => {
        const label = this.getModelValue(attribute, "label");
        const value = this.getModelValue(attribute, "value");
        return [label, value].some((candidate) => candidate !== undefined
          && String(candidate).trim().toLocaleLowerCase() === current);
      });

      if (!match) return String(currentValue);

      const label = this.getModelValue(match, "label");
      const value = this.getModelValue(match, "value");
      return String(label).trim().toLocaleLowerCase() === current ? String(value) : String(label);
    },

    getEndpointMetric(name) {
      const normalized = this.normalizeName(name);
      if (normalized.includes("status")) return "status";
      if (normalized.includes("successful points")) return "successfulPoints";
      if (normalized.includes("failed points")) return "failedPoints";
      if (normalized.includes("response time")) return "responseTime";
      if (normalized.includes("last ping") || normalized.includes("lastping")) return "lastPing";
      if (normalized.includes("last successful response") || normalized.includes("last response")) return "lastResponse";
      return null;
    },

    getHealthKind(name) {
      const normalized = this.normalizeName(name);
      if (normalized.includes("ping")) return "ping";
      if (normalized.includes("bacnet") || normalized.includes("response")
        || normalized.includes("successful points") || normalized.includes("failed points")) return "bacnet";
      return null;
    },

    getBacnetResult(log) {
      if (log.successfulPoints === null && log.failedPoints === null) {
        return { state: "unknown" };
      }

      const successful = Number(log.successfulPoints || 0);
      const failed = Number(log.failedPoints || 0);
      if (failed >= 0 && successful === 0) return { state: "ko" };
      if (failed > 0 && successful > 0) return { state: "degraded" };
      return { state: "ok" };
    },

    getPingResult(log) {
      const rawStatus = log.pingStatus;
      let success = null;
      if (rawStatus !== undefined && rawStatus !== null && rawStatus !== "") {
        if (typeof rawStatus === "boolean") success = rawStatus;
        else if (Number(rawStatus) === 1) success = true;
        else if (Number(rawStatus) === 0) success = false;
        else {
          const state = this.getHealthState(rawStatus);
          if (state === "ok") success = true;
          if (state === "ko") success = false;
        }
      }

      return {
        status: success === true ? "Succès" : success === false ? "Échec" : "Inconnu",
        state: success === true ? "ok" : success === false ? "ko" : "unknown",
      };
    },

    normalizeName(value) {
      return String(value || "")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
    },

    getHealthState(value) {
      if (value === undefined || value === null || value === "") return "unknown";

      const normalized = this.normalizeName(value);

      if (/\b(ko|fail|failed|failure|error|disconnected|offline|down|inactive|false|not ok|deconnecte|arret)\b/.test(normalized)) {
        return "ko";
      }

      if (/\b(ok|running|connected|online|success|successful|up|active|true|fonctionnel|connecte|marche)\b/.test(normalized)) {
        return "ok";
      }

      if (/\b(degraded|degradation|partial|degrade|partiel|degradee)\b/.test(normalized)) {
        return "degraded";
      }

      return "unknown";
    },

    formatDate(value) {
      if (value === undefined || value === null || value === "") return null;

      const numericValue = Number(value);
      const dateValue = Number.isFinite(numericValue) && numericValue > 0
        ? new Date(numericValue < 100000000000 ? numericValue * 1000 : numericValue)
        : new Date(value);
      if (Number.isNaN(dateValue.getTime())) return String(value);

      const pad = (part) => String(part).padStart(2, "0");
      const date = `${pad(dateValue.getDate())}/${pad(dateValue.getMonth() + 1)}/${dateValue.getFullYear()}`;
      const time = `${pad(dateValue.getHours())}:${pad(dateValue.getMinutes())}:${pad(dateValue.getSeconds())}`;
      return `${date} at ${time}`;
    },

    formatResponseTime(value) {
      if (value === undefined || value === null || value === "") return "—";

      const numericValue = Number(value);
      return Number.isFinite(numericValue) ? numericValue.toFixed(2) : String(value);
    },

    closed() {
      this.debouncedApplyNameFilter.cancel();
    },

    getStatus(healthState) {
      return (healthState || "unknown").toUpperCase();
    }
  },

  beforeDestroy() {
    this.debouncedApplyNameFilter.cancel();
  },
};
</script>

<style scoped>
.indicator-details-panel {
  height: 100%;
  overflow: auto;
  padding: 0 16px 16px;
  box-sizing: border-box;
}

.indicator-details-panel.history-open {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.indicator-details-panel.devices-open {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-state {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d0d5da;
  text-align: center;
  padding: 24px;
}

.panel-state.error {
  color: #ff8a80;
}

.panel-content {
  max-width: 1000px;
  margin: 0 auto;
}

.devices-page {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0 12px;
  border-bottom: 1px solid #555d64;
}

.history-page {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.history-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.history-header h2 {
  flex: 1;
  min-width: 0;
  margin: 0;
  color: #f0f3f5;
  font-size: 1.1em;
  overflow-wrap: anywhere;
}

.history-period {
  width: 140px;
  margin: 0;
}

.history-table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.history-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 0;
}

.history-filters .md-field {
  width: 180px;
  margin: 0;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.history-table th,
.history-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #555d64;
}

.history-table th {
  color: #b0b7bd;
  font-weight: 500;
}

.history-log-row.ok {
  background-color: rgba(67, 160, 71, 0.18);
}

.history-log-row.degraded {
  background-color: rgba(239, 143, 40, 0.2);
}

.history-log-row.ko {
  background-color: rgba(229, 57, 53, 0.2);
}

.filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 14px;
  padding: 12px 0;
}

.filters .md-field {
  min-width: 150px;
  margin: 0;
}

.filter-name {
  flex: 1 1 220px;
}

.filter-status {
  flex: 0 1 160px;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-actions .md-button {
  margin: 0;
}

.result-count {
  margin: 0 0 10px;
  color: #b0b7bd;
  font-size: 0.9em;
}

.devices-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  overflow: auto;
}

.device {
  flex: 0 0 auto;
  overflow: hidden;
  border: 1px solid #dce2e9;
  border-radius: 8px;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 8px 14px;
  border-bottom: 1px solid #e8edf2;
}

.device-title {
  display: flex;
  align-items: center;
  /* flex: 1; */
  min-width: 0;
  gap: 20px;
  color: #f0f3f5;
}

.device-title strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.device-title .md-icon {
  flex: 0 0 auto;
  color: #9fb3bf;
}

.health-list {
  display: flex;
  flex-direction: column;
}

.health-row+.health-row {
  border-top: 1px solid #555d64;
}

.health-row {
  display: grid;
  grid-template-columns: minmax(150px, 1fr) minmax(180px, 1fr) minmax(180px, 1fr);
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
}

.health-name {
  color: #e2e6e9;
  font-weight: 500;
}

.health-status {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.health-badge {
  min-width: 48px;
  padding: 4px 8px;
  border-radius: 4px;
  text-align: center;
  font-weight: 600;
}

.health-badge.ok {
  color: #81c784;
  background: rgba(129, 199, 132, 0.1);
}

.health-badge.ko {
  color: #ff8a80;
  background: rgba(255, 138, 128, 0.1);
}

.health-badge.degraded {
  color: #f39039;
  background: rgba(248, 193, 127, 0.1);
}

.health-badge.unknown {
  color: #b0bec5;
  background: transparent;
}

.health-label,
.health-date {
  color: #b0b7bd;
  overflow-wrap: anywhere;
}

.device-message {
  color: #b0b7bd;
  padding: 10px;
  font-size: 0.9em;
}

.error {
  color: #ff8a80;
}

.refreshDiv {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

@media (max-width: 560px) {
  .indicator-details-panel {
    padding-right: 10px;
    padding-left: 10px;
  }

  .device-header {
    padding-right: 10px;
    padding-left: 10px;
  }

  .history-header {
    flex-wrap: wrap;
  }

  .history-header h2 {
    flex-basis: calc(100% - 60px);
  }

  .history-period {
    flex: 1;
  }

  .filter-name,
  .filter-status {
    flex: 1 1 100%;
  }

  .filter-actions {
    width: 100%;
  }

  .health-row {
    grid-template-columns: 1fr;
    gap: 6px;
    padding-right: 10px;
    padding-left: 10px;
  }
}
</style>
