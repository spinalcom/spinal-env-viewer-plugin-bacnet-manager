<template>
   <div
      class="manage_container"
      v-if="pageSelected === PAGES.selection"
   >
      <div class="header">
         <div>
            <md-button
               class="md-icon-button"
               v-tooltip="'start all devices'"
               @click="startAllMonitoring"
            >
               <md-icon class="md-primary">play_arrow</md-icon>
            </md-button>

            <md-button
               class="md-icon-button"
               v-tooltip="'restart all devices'"
               @click="startAllMonitoring"
            >
               <md-icon class="md-primary">replay</md-icon>
            </md-button>

            <md-button
               class="md-icon-button md-accent"
               v-tooltip="'stop all devices'"
               @click="stopAllMonitoring"
            >
               <md-icon class="md-accent">stop</md-icon>
            </md-button>

            <md-button
               class="md-primary"
               @click="changeTimeSeries(true)"
            >Save all time series</md-button>

            <md-button
               class="md-accent"
               @click="changeTimeSeries(false)"
            >Stop saving all time series</md-button>
         </div>

      </div>

      <div class="devices_list md-scrollbar">

         <device-monitoring
            v-for="device in devices"
            :key="device.id"
            :ref="device.id"
            :device="device"
            :context="context"
            :graph="graph"
         ></device-monitoring>

      </div>
   </div>
   <div
      class="state"
      v-else-if="pageSelected === PAGES.loading"
   >
      <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
   </div>
</template>

<script>
import DeviceMonitoring from "../components/monitoring/devicemonitor.vue";
import utilities from "../../js/utilities";

export default {
   name: "manageDevicesPanel",
   components: {
      "device-monitoring": DeviceMonitoring,
   },
   data() {
      this.PAGES = {
         selection: 0,
         loading: 1,
         creation: 2,
         success: 3,
         error: 4,
      };

      this.context;
      this.graph;
      this.selectedNode;

      return {
         devices: [],
         pageSelected: this.PAGES.creation,
      };
   },
   methods: {
      async opened(params) {
         this.pageSelected = this.PAGES.loading;
         // const { selectedNode, context, graph } = params;

         this.context = params.context;
         this.graph = params.graph;
         this.selectedNode = params.selectedNode;

         this.devices = await this.getBmsDevices(
            this.context.id,
            this.selectedNode.id
         );
         this.pageSelected = this.PAGES.selection;
      },

      closed() {},

      async getBmsDevices(contextId, id) {
         return utilities.getBmsDevices(contextId, id).then((devices) => {
            return devices.map((el) => el.get());
         });
         // const realNode = SpinalGraphService.getRealNode(id);
         // if (realNode.getType().get() === SpinalBmsDevice.nodeTypeName) {
         //    return [
         //       {
         //          info: realNode.info.get(),
         //          node: realNode,
         //          model: await utilities.getModel(realNode),
         //       },
         //    ];
         // }
         // const res = [];
         // return SpinalGraphService.findInContext(id, contextId, (node) => {
         //    if (node.getType().get() === SpinalBmsDevice.nodeTypeName) {
         //       SpinalGraphService._addNode(node);
         //       res.push({
         //          info: node.info.get(),
         //          node,
         //       });
         //       return true;
         //    }
         //    return false;
         // }).then(() => {
         //    const promises = res.map(async (el) => {
         //       el.model = await utilities.getModel(el.node);
         //       return el;
         //    });
         //    return Promise.all(promises);
         // });
      },

      ////////////////////////////////////////////
      ////              CLIKS                   //
      ////////////////////////////////////////////

      async startAllMonitoring() {
         const length = this.devices.length;
         let index = 0;

         while (index <= length - 1) {
            const deviceId = this.devices[index].id;
            const [ref] = this.$refs[deviceId];
            if (ref) {
               await ref.startMonitoring();
            }

            index++;
         }
      },

      async stopAllMonitoring() {
         const length = this.devices.length;
         let index = 0;

         while (index <= length - 1) {
            const deviceId = this.devices[index].id;
            const [ref] = this.$refs[deviceId];
            if (ref) {
               await ref.stopMonitoring();
            }

            index++;
         }
      },

      changeTimeSeries(value) {
         const length = this.devices.length;
         let index = 0;

         while (index <= length - 1) {
            const deviceId = this.devices[index].id;
            const [ref] = this.$refs[deviceId];
            if (ref) {
               ref.updateTimeSeries(value);
            }

            index++;
         }
      },
   },
};
</script>


<style scoped>
.manage_container {
   width: 100%;
   height: calc(100% - 15px);
   overflow: hidden;
}

.manage_container .header {
   width: 100%;
   height: 50px;
   border-bottom: 1px solid grey;
}

.manage_container .header > div {
   width: 100%;
   float: right;
   display: flex;
   justify-content: space-between;
   align-items: center;
}

.manage_container .devices_list {
   width: 100%;
   height: calc(100% - 60px);
   overflow: auto;
}
/* 
.manage_container .devices_list .device {
   width: 96%;
   height: 50px;
   display: flex;
   justify-content: space-between;
   align-items: center;
   margin: auto;
}

.manage_container .devices_list .device .name,
.manage_container .devices_list .device .state {
   width: 25%;
   overflow: hidden;
   white-space: nowrap;
   text-overflow: ellipsis;
}

.manage_container .devices_list .device .state {
   text-align: center;
}

.manage_container .devices_list .device .state.Running {
   color: chartreuse;
}
.manage_container .devices_list .device .state.Stopped {
   color: #ff5252;
}

.manage_container .devices_list .device .actions {
   width: 50%;
   display: flex;
   justify-content: space-between;
   align-items: center;
} */
</style>

<style>
.manage_container .md-button .md-ripple {
   padding: unset;
}
</style>