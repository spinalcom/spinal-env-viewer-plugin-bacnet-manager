<template>
   <div class="device">
      <div
         class="name"
         v-tooltip="device.info.name"
      >
         {{device.info.name}}
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
   },
   data() {
      return {
         saveTimeSeries: false,
      };
   },
   created() {
      if (this.device.model && this.device.model.saveTimeSeries) {
         this.saveTimeSeries = this.device.model.saveTimeSeries.get();
      }
   },
   mounted() {
      // console.log("mounted");
      // if (this.device.model && this.device.model.saveTimeSeries) {
      //    this.saveTimeSeries = this.device.model.saveTimeSeries.get();
      // }
   },
   methods: {
      async startMonitoring() {
         const deviceId = this.device.info.id;
         const contextId = this.context.id;

         const model = this.device.model;
         const monitor = await utilities.getMonitoringInfo(deviceId, contextId);

         if (model != -1) {
            if (!monitor) {
               model.listen.set(false);
            } else {
               model.monitor.set(monitor);
               model.listen.set(true);
            }
         } else {
            const graph = this.graph;
            const context = SpinalGraphService.getRealNode(contextId);
            const realNode = SpinalGraphService.getRealNode(deviceId);
            const network = await utilities.getNetwork(deviceId, contextId);

            const organ = await utilities.getOrgan(
               network.getId().get(),
               contextId
            );

            const spinalListener = new SpinalListenerModel(
               graph,
               context,
               network,
               realNode,
               organ,
               monitor
            );
            realNode.info.add_attr({
               listener: new Ptr(spinalListener),
            });
         }
      },

      stopMonitoring() {
         if (this.device.model != -1 && this.device.model.listen) {
            this.device.model.listen.set(false);
         }
      },

      updateTimeSeries(value) {
         this.saveTimeSeries = value;
      },

      ////////////////////////////////////////////
      ////              DISABLED                //
      ////////////////////////////////////////////

      disabledRestart() {
         const model = this.device.model;
         return !(model && model !== -1 && model.listen && model.listen.get());
      },

      disabledStart() {
         const model = this.device.model;
         return model && model !== -1 && model.listen && model.listen.get();
      },

      disabledStop() {
         const model = this.device.model;
         return !(model && model !== -1 && model.listen && model.listen.get());
      },
   },
   computed: {
      state() {
         return this.device.model.listen && this.device.model.listen.get()
            ? "Running"
            : "Stopped";
      },
   },
   watch: {
      saveTimeSeries() {
         if (this.device.model && this.device.model.saveTimeSeries) {
            this.device.model.saveTimeSeries.set(this.saveTimeSeries);
            return;
         }
         this.device.model.add_attr({
            saveTimeSeries: this.saveTimeSeries,
         });
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