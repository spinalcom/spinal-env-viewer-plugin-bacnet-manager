<template>
   <div>
      <!-- <md-field>
         <label>Network Name</label>
         <md-input v-model="network.name"></md-input>
      </md-field>

      <md-button @click="discover">Discover</md-button> -->
      <md-steppers md-vertical>
         <md-step
            id="first"
            md-label="Network name"
            md-description="Network name"
         >
            <div>
               <md-field class="contextInput">
                  <label>Network Name</label>
                  <md-input v-model="network.name"></md-input>
               </md-field>
            </div>

            <div>
               <md-field class="contextInput">
                  <label>broadcast network IP address</label>
                  <md-input v-model="network.address"></md-input>
                  <span class="md-helper-text">To use the default(255.255.255.255) leave this field empty</span>
               </md-field>
            </div>

            <div>
               <md-field class="contextInput">
                  <label>broadcast network port</label>
                  <md-input v-model="network.port"></md-input>
                  <span class="md-helper-text">To use the default port (47808) leave this field empty</span>
               </md-field>
            </div>

         </md-step>

         <md-step
            id="second"
            md-label="Discover network"
            md-description="Discover"
         >
            <discover-table
               :devices="devices"
               :state="state"
               :selected="selected"
               @discover="discover"
               @select="selectDevice"
            ></discover-table>
            <!-- <md-button @click="discover">Discover</md-button>
             -->

         </md-step>

         <md-step
            id="third"
            md-label="Create network"
            md-description="Create"
         >

            <div>
               <md-progress-spinner
                  v-if="state === STATES.creating"
                  md-mode="indeterminate"
               ></md-progress-spinner>

               <md-icon
                  v-else-if="state === STATES.created"
                  class="md-size-5x"
               >check</md-icon>

               <md-button
                  v-else
                  :disabled="selected.length === 0"
                  @click="createNodes"
               >Create Network</md-button>

            </div>

         </md-step>
      </md-steppers>
   </div>
</template>

<script>
import { NETWORK_TYPE } from "../../js/constants";
import discoverTable from "../components/discoverTable.vue";
// import { STATES } from "../../js/stateEnum";

// import { SpinalDisoverModel } from "../../model/SpinalDiscoverModel";

import { STATES, SpinalDisoverModel } from "spinal-model-bacnet";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";

export default {
   name: "discoverNetworkPanel",
   components: {
      "discover-table": discoverTable,
   },
   data() {
      this.STATES = STATES;

      this.spinalDiscover;
      this.context;
      this.graph;
      this.organ;
      this.devicesBindProcess;
      return {
         state: STATES.reseted,
         devices: [],
         selected: [],
         network: {
            address: "255.255.255.255",
            port: 47808,
            name: "",
            type: NETWORK_TYPE,
         },
      };
   },
   methods: {
      async opened(params) {
         this.graph = params.graph;
         this.context = params.context.get();
         this.organ = await this.getOrganModel(params.selectedNode.id.get());

         console.log("this.organ", this.organ);
      },

      closed() {},

      async discover() {
         if (typeof this.spinalDiscover === "undefined") {
            this.spinalDiscover = new SpinalDisoverModel(
               this.graph,
               this.context,
               this.network,
               this.organ
            );

            console.log(this.spinalDiscover);

            await this.spinalDiscover.addToGraph();
            // await this.addToGraph();
         }

         this.spinalDiscover.network.name.set(this.network.name);
         // this.spinalDiscover.state.set(STATES.discovering);
         this.spinalDiscover.setDiscoveringMode();
         this.getDevicesFound();
      },

      createNodes() {
         console.log("creating...");
         this.spinalDiscover.devices.set(this.selected);
         // this.spinalDiscover.state.set(STATES.creating);
         this.spinalDiscover.setCreatingMode();
      },

      getDevicesFound() {
         // this.devicesBindProcess = this.graph.info.discover.devices.bind(() => {
         //    this.devices = this.graph.info.discover.devices.get();
         // });
         this.devicesBindProcess = this.spinalDiscover.state.bind(() => {
            switch (this.spinalDiscover.state.get()) {
               case STATES.discovered:
                  console.log("discovered");
                  this.state = STATES.discovered;
                  this.devices = this.spinalDiscover.devices.get();
                  console.log(this.spinalDiscover.devices.get());
                  break;
               case STATES.timeout:
                  console.log("timeout");
                  this.state = STATES.timeout;
                  break;
               case STATES.discovering:
                  console.log("discovering...");
                  this.state = STATES.discovering;
                  break;
               case STATES.creating:
                  console.log("creating...");
                  this.state = STATES.creating;
                  break;
               case STATES.created:
                  console.log("created...");
                  this.state = STATES.created;
                  break;

               default:
                  break;
            }
            // this.devices = this.graph.info.discover.devices.get();
         });
      },

      getOrganModel(nodeId) {
         const realNode = SpinalGraphService.getRealNode(nodeId);
         return realNode.getElement();
      },

      ModContextAttr(context) {
         if (context.name) {
            context.name.set(this.context.name);
         } else {
            context.add_attr({ name: this.context.name });
         }

         if (context.type) {
            context.type.set(this.context.type);
         } else {
            context.add_attr({ type: this.context.type });
         }
      },

      ModNetworkAttr(network) {
         if (network.name) {
            network.name.set(this.network.name);
         } else {
            network.add_attr({ name: this.network.name });
         }

         if (network.type) {
            network.type.set(this.network.type);
         } else {
            network.add_attr({ type: this.network.type });
         }
      },

      selectDevice(devices) {
         this.selected = devices;
      },

      // async addToGraph() {
      //    if (!this.graph.info.discover) {
      //       const x = new Lst();
      //       x.push(this.spinalDiscover);
      //       this.graph.info.add_attr({
      //          discover: new Ptr(x),
      //       });
      //       Promise.resolve(true);
      //    } else {
      //       return new Promise((resolve, reject) => {
      //          this.graph.info.discover.load((list) => {
      //             list.push(this.spinalDiscover);
      //             resolve(true);
      //          });
      //       });
      //    }
      // },
   },
   beforeDestroy() {
      this.spinalDiscover.remove(this.graph);
   },
};
</script>


<style scoped>
.contextInput {
   min-height: unset;
}
</style>