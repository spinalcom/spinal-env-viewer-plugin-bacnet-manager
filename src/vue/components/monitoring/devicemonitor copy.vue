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
    <div class="name"
         v-tooltip="device.name">
      {{ device.name }}
    </div>

    <div class="state"
         :class="state">
      {{ state }}
    </div>

    <div class="actions">
      <md-button class="md-icon-button md-primary"
                 v-tooltip="'start'"
                 :disabled="disabledStart()"
                 @click="startMonitoring">
        <md-icon>play_arrow</md-icon>
      </md-button>

      <md-button class="md-icon-button md-primary"
                 v-tooltip="'restart'"
                 :disabled="disabledRestart()"
                 @click="restartMonitoring">
        <md-icon>replay</md-icon>
      </md-button>

      <md-button class="md-icon-button md-accent"
                 v-tooltip="'stop'"
                 :disabled="disabledStop()"
                 @click="stopMonitoring">
        <md-icon>stop</md-icon>
      </md-button>

      <div class="block">
        <div class="input">
          <md-checkbox class="md-primary"
                       v-model="saveTimeSeries">Save TimeSeries</md-checkbox>
        </div>
      </div>

      <!-- <md-button class="md-icon-button">
                  <md-icon class="md-primary">star</md-icon>
               </md-button> -->
    </div>
  </div>
</template>

<script>
import utilities from "../../../js/utilities";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";

export default {
  name: "deviceMonitoring",
  props: {
    device: { required: true },
    context: { required: true },
    graph: { required: true },
    profilId: { type: String, required: false },
  },
  data() {
    return {
      saveTimeSeries: false,
      model: undefined,
    };
  },
  async created() {
    const realNode = SpinalGraphService.getRealNode(this.device.id);
    this.model = await utilities.getModel(realNode);
    if (this.model && this.model.saveTimeSeries) {
      this.saveTimeSeries = this.model.saveTimeSeries.get();
    }
  },
  mounted() {},

  methods: {
    async startMonitoring() {
      const deviceId = this.device.id;
      const contextId = this.context.id;

      await utilities.startMonitoring(this.graph, contextId, deviceId);

      // if (!this.model || this.model === -1) {
      //   const realNode = SpinalGraphService.getRealNode(this.device.id);
      //   this.model = await utilities.getModel(realNode);
      // }
    },

    async stopMonitoring() {
      // if (this.model != -1 && this.model.listen) {
      //    this.model.listen.set(false);
      // }
      return utilities.stopMonitoring(this.device.id);
    },

    async restartMonitoring() {
      if (!utilities.hasProfilLinked(this.device.id)) return -1;
      await utilities.stopMonitoring(this.device.id);
      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          await this.startMonitoring();
          resolve(true);
        }, 1500);
      });
    },

    updateTimeSeries(value) {
      this.saveTimeSeries = value;
    },

    ////////////////////////////////////////////
    ////              DISABLED                //
    ////////////////////////////////////////////

    disabledRestart() {
      const model = this.model;
      return (
        !this.profilId ||
        !(model && model !== -1 && model.listen && model.listen.get())
      );
    },

    disabledStart() {
      if (!this.hasProfil) return true;
      const model = this.model;
      return model && model !== -1 && model.listen && model.listen.get();
    },

    disabledStop() {
      const model = this.model;
      return (
        !this.hasProfil ||
        !(model && model !== -1 && model.listen && model.listen.get())
      );
    },
  },
  computed: {
    state() {
      return this.model && this.model.listen && this.model.listen.get()
        ? "Running"
        : "Stopped";
    },
    hasProfil() {
      return this.profilId;
    },
  },
  watch: {
    saveTimeSeries() {
      if (this.model && this.model !== -1) {
        if (this.model.saveTimeSeries) {
          this.model.saveTimeSeries.set(this.saveTimeSeries);
        } else {
          this.model.add_attr({
            saveTimeSeries: this.saveTimeSeries,
          });
        }
      }
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
