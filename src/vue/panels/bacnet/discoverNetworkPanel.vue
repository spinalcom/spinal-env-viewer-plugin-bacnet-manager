<template>
	<div class="discover_container">
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
				<div class="stepContainer">
					<div class="header">
						<div
							class="radio"
							:class="{ isActive: network.useBroadcast }"
						>
							<md-radio
								class="md-primary"
								v-model="network.useBroadcast"
								:value="true"
								>Broadcast</md-radio
							>
						</div>

						<div
							class="radio"
							:class="{ isActive: !network.useBroadcast }"
						>
							<md-radio
								class="md-primary"
								v-model="network.useBroadcast"
								:value="false"
								>Unicast</md-radio
							>
						</div>
					</div>

					<div class="content">
						<broadcast-template
							v-if="network.useBroadcast"
							:network="network"
						></broadcast-template>

						<unicast-template
							v-else
							:network="network"
						></unicast-template>
					</div>
				</div>
			</md-step>

			<md-step
				id="second"
				md-label="Discover network"
				md-description="Discover"
			>
				<div class="stepContainer">
					<discover-table
						:devices="devices"
						:state="state"
						:selected="selected"
						:network="network"
						@discover="discover"
						@select="selectDevice"
						@stop="stopDiscovering"
					></discover-table>
				</div>

				<!-- <md-button @click="discover">Discover</md-button>
             -->
			</md-step>

			<md-step id="third" md-label="Create network" md-description="Create">
				<div class="stepContainer">
					<div class="loading">
						<md-progress-spinner
							v-if="state === STATES.creating"
							md-mode="indeterminate"
						></md-progress-spinner>

						<md-icon
							v-else-if="state === STATES.created"
							class="md-size-5x"
							>check</md-icon
						>

						<md-button
							v-else
							:disabled="selected.length === 0"
							@click="createNodes"
							>Create Network</md-button
						>
					</div>
				</div>
			</md-step>
		</md-steppers>
	</div>
</template>

<script>
	import { STATES, SpinalDisoverModel } from "spinal-model-bacnet";
	import { SpinalGraphService } from "spinal-env-viewer-graph-service";

	import { NETWORK_TYPE } from "../../../js/constants";
	import discoverTable from "../../components/discoverTable.vue";
	// import { STATES } from "../../js/stateEnum";

	// import { SpinalDisoverModel } from "../../model/SpinalDiscoverModel";

	import BroadcastTemplate from "../../components/broadcastTemplate.vue";
	import UnicastTemplate from "../../components/unicastTemplate.vue";

	export default {
		name: "discoverNetworkPanel",
		components: {
			"discover-table": discoverTable,
			"broadcast-template": BroadcastTemplate,
			"unicast-template": UnicastTemplate,
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
					useBroadcast: true,
					address: "255.255.255.255",
					port: 47808,
					name: "",
					type: NETWORK_TYPE,
					ips: [{ id: 0, address: "", deviceId: "" }],
				},
			};
		},
		methods: {
			async opened(params) {
				this.graph = params.graph;
				this.context = params.context.get();
				this.organ = await this.getOrganModel(params.selectedNode.id.get());

				if (typeof this.spinalDiscover !== "undefined") {
					this.spinalDiscover = undefined;
					this.state = STATES.reseted;
				}
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

					// console.log(this.spinalDiscover);

					await this.spinalDiscover.addToGraph();
				}

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
				this.devicesBindProcess = this.spinalDiscover.state.bind(() => {
					console.log(this.spinalDiscover.state.get());
					this.state = this.spinalDiscover.state.get();

					if (this.state === STATES.discovered) {
						this.devices = this.spinalDiscover.devices.get();
					} else if (this.state === STATES.created) {
						this.spinalDiscover = undefined;
						// this.state = STATES.reseted;
					}

					// switch (this.spinalDiscover.state.get()) {
					//    case STATES.discovered:
					//       this.state = STATES.discovered;
					//       this.devices = this.spinalDiscover.devices.get();
					//       break;
					//    case STATES.timeout:
					//       this.state = STATES.timeout;
					//       break;
					//    case STATES.discovering:
					//       this.state = STATES.discovering;
					//       break;
					//    case STATES.creating:
					//       this.state = STATES.creating;
					//       break;
					//    case STATES.created:
					//       this.state = STATES.created;
					//       break;
					//    case STATES.error:
					//       this.state = STATES.error;
					//    case STATES.reseted:
					//       this.state = STATES.reseted;
					//       break;

					//    default:
					//       break;
					// }
					// // this.devices = this.graph.info.discover.devices.get();
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

			stopDiscovering() {
				if (this.spinalDiscover) {
					this.spinalDiscover.setResetedMode();
					this.spinalDiscover.remove().then(() => {
						this.spinalDiscover = undefined;
						this.state = STATES.reseted;
					});
				} else {
					this.state = STATES.reseted;
				}
			},
		},
		watch: {
			"network.useBroadcast": function () {
				this.stopDiscovering();
			},
			"network.address": function () {
				this.stopDiscovering();
			},
			"network.port": function () {
				this.stopDiscovering();
			},

			"network.ips": function () {
				this.stopDiscovering();
			},
		},
		beforeDestroy() {
			this.spinalDiscover.remove(this.graph);
		},
	};
</script>

<style scoped>
	.discover_container {
		width: 100%;
		height: calc(100% - 15px);
	}

	.discover_container .stepContainer {
		width: 100%;
		height: 350px;
	}

	.discover_container .loading {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.discover_container .header {
		width: 100%;
		height: 50px;
		display: flex;
		justify-content: space-between;
	}

	.discover_container .header .radio {
		width: 50%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.discover_container .header .radio.isActive {
		color: #448aff;
		border-bottom: 2px solid #448aff;
	}

	.discover_container .content {
		width: 100%;
		height: calc(100% - 50px);
		margin-top: 10px;
		/* min-height: 200px; */

		/* overflow: hidden;
   overflow-y: auto; */
	}
</style>

<style>
	.discover_container .md-steppers.md-theme-default,
	.discover_container .md-steppers.md-theme-default .md-steppers-wrapper,
	.discover_container
		.md-steppers.md-theme-default
		.md-steppers-wrapper
		.md-steppers-container {
		height: 100%;
	}

	.discover_container
		.md-steppers.md-theme-default
		.md-steppers-wrapper
		.md-steppers-container
		.md-stepper-content.md-active {
		min-height: 250px;
		max-height: 350px;
	}
</style>
