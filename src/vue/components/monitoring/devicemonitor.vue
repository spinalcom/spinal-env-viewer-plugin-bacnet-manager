<!--
Copyright 2021 SpinalCom - www.spinalcom.com

This file is part of SpinalCore.

Please read all of the following terms and conditions
of the Free Software license Agreement ("Agreement")
carefully.

This Agreement is a legally binding contract between
the Licensee (as defined below) and SpinalCom that
sets forth the terms and conditions that govern your
use of the Program. By installing and/or using the
Program, you agree to abide by all the terms and
conditions stated or referenced herein.

If you do not agree to abide by these terms and
conditions, do not demonstrate your acceptance and do
not install or use the Program.
You should have received a copy of the license along
with this file. If not, see
<http://resources.spinalcom.com/licenses.pdf>.
-->

<template>
  <div class="device">
    <div class="name" v-tooltip="device.name">
      {{ device.getName().get() }}
    </div>

    <div class="state" :class="state">
      {{ state }}
    </div>

    <div class="actions">
      <md-button class="md-icon-button md-primary" v-tooltip="'start'" :disabled="disabledStart()"
        @click="startMonitoring">
        <md-icon>play_arrow</md-icon>
      </md-button>

      <md-button class="md-icon-button md-primary" v-tooltip="'restart'" :disabled="disabledRestart()"
        @click="restartMonitoring">
        <md-icon>replay</md-icon>
      </md-button>

      <md-button class="md-icon-button md-accent" v-tooltip="'stop'" :disabled="disabledStop()" @click="stopMonitoring">
        <md-icon>stop</md-icon>
      </md-button>

      <div class="block">
        <div class="input">
          <md-checkbox class="md-primary" v-model="saveTimeSeries">Save TimeSeries</md-checkbox>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import utilities from "../../../js/utilities";
import { monitorState } from "../../../js/monitorState";

export default {
  name: "deviceMonitoring",
  props: {
    device: { required: true },
    context: { required: true },
    graph: { required: true },
    profile: { required: true },
    network: { required: true },
    organ: { required: true },
  },
  data() {
    return {
      saveTimeSeries: false,
      listenerModel: undefined,
    };
  },
  async created() {
    this.listenerModel = await utilities.getListenerModel(this.device);

    if (this.listenerModel && this.listenerModel.saveTimeSeries) {
      this.saveTimeSeries = this.listenerModel.saveTimeSeries.get();
    }
  },

  methods: {
    async startMonitoring() {
      const model = await utilities.createOrModifyListenerModel(this.graph, this.context, this.network, this.listenerModel, this.profile, this.organ, this.device);
      this.listenerModel = model;
      this.listenerModel.monitored.set(true);
      return this.listenerModel;
    },

    stopMonitoring() {
      if (this.listenerModel && this.listenerModel.monitored) {
        this.listenerModel.monitored.set(false)
      };
      return this.listenerModel;
    },

    async restartMonitoring() {
      // stop the listener
      await this.stopMonitoring();

      // wait for the listener to stop and clean the model
      await this.wait(1500);

      // start the listener
      this.listenerModel = await this.startMonitoring();
      return this.listenerModel;
    },

    updateTimeSeries(value) {
      this.saveTimeSeries = value;
    },

    wait(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },


    disabledRestart() {
      if (!this.listenerModel || this.listenerModel == -1 || !this.profile) return true;
      if (!this.listenerModel.monitored || !this.listenerModel.monitored.get()) return true;

      return false;
    },

    disabledStart() {
      if (!this.profile) return true;

      return this.listenerModel && this.listenerModel !== -1 && this.listenerModel.monitored && this.listenerModel.monitored.get();
    },

    disabledStop() {
      if (!this.listenerModel || this.listenerModel == -1 || !this.profile) return true;
      if (!this.listenerModel.monitored || !this.listenerModel.monitored.get()) return true;

      return false;
    },

  },
  computed: {
    state() {
      return this.listenerModel && this.listenerModel.monitored && this.listenerModel.monitored.get() ? "Running" : "Stopped";
    },
    // hasProfil() {
    //   return this.profile && this.profile !== -1;
    // },
  },
  watch: {
    saveTimeSeries() {
      if (!this.listenerModel || this.listenerModel === -1) return;

      if (this.listenerModel.saveTimeSeries) {
        this.listenerModel.saveTimeSeries.set(this.saveTimeSeries);
        return;
      }

      this.listenerModel.add_attr({ saveTimeSeries: this.saveTimeSeries });
    },
  },
};
</script>

<style scoped>
.device {
  width: 96%;
  height: 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: auto;
  /* border-bottom: 1px solid gray; */
}

.device .name,
.device .state {
  width: 25%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.device .state {
  text-align: center;
}

.device .state.Running {
  color: chartreuse;
}

.device .state.Stopped {
  color: #ff5252;
}

.device .actions {
  width: 50%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
