<template>
   <div class="device">
      <div
         class="name"
         v-tooltip="device.name"
      >
         {{device.name}}
      </div>

      <div
         class="state"
         :class="state"
      >
         {{state}}
      </div>

      <div class="actions">

         <md-button
            class="md-icon-button md-primary"
            v-tooltip="'start'"
            :disabled="disabledStart()"
            @click="startMonitoring"
         >
            <md-icon>play_arrow</md-icon>
         </md-button>

         <md-button
            class="md-icon-button md-primary"
            v-tooltip="'restart'"
            :disabled="disabledRestart()"
            @click="startMonitoring"
         >
            <md-icon>replay</md-icon>
         </md-button>

         <md-button
            class="md-icon-button md-accent"
            v-tooltip="'stop'"
            :disabled="disabledStop()"
            @click="stopMonitoring"
         >
            <md-icon>stop</md-icon>
         </md-button>

         <div class="block">
            <div class="input">
               <md-checkbox
                  class="md-primary"
                  v-model="saveTimeSeries"
               >Save TimeSeries</md-checkbox>
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
import { SpinalListenerModel } from "spinal-model-bacnet";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";

export default {
   name: "deviceMonitoring",
   props: {
      device: {},
      context: {},
      graph: {},
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
         if (!this.model || this.model === -1) {
            const realNode = SpinalGraphService.getRealNode(this.device.id);
            this.model = await utilities.getModel(realNode);
         }
      },

      stopMonitoring() {
         // if (this.model != -1 && this.model.listen) {
         //    this.model.listen.set(false);
         // }
         utilities.stopMonitoring(this.device.id);
      },

      updateTimeSeries(value) {
         this.saveTimeSeries = value;
      },

      ////////////////////////////////////////////
      ////              DISABLED                //
      ////////////////////////////////////////////

      disabledRestart() {
         const model = this.model;
         return !(model && model !== -1 && model.listen && model.listen.get());
      },

      disabledStart() {
         const model = this.model;
         return model && model !== -1 && model.listen && model.listen.get();
      },

      disabledStop() {
         const model = this.model;
         return !(model && model !== -1 && model.listen && model.listen.get());
      },
   },
   computed: {
      state() {
         return this.model && this.model.listen && this.model.listen.get()
            ? "Running"
            : "Stopped";
      },
   },
   watch: {
      saveTimeSeries() {
         if (this.model) {
            if (this.model.saveTimeSeries) {
               this.model.saveTimeSeries.set(this.saveTimeSeries);
               return;
            }
            this.model.add_attr({
               saveTimeSeries: this.saveTimeSeries,
            });
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