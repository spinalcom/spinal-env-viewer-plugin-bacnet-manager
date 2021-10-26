<template>
	<div class="manage_panel_container">
		<div class="manage_container" v-if="pageSelected === PAGES.selection">
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
						@click="restartAllMonitoring"
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

					<md-button class="md-primary" @click="changeTimeSeries(true)"
						>Save all time series</md-button
					>

					<md-button class="md-accent" @click="changeTimeSeries(false)"
						>Stop saving all time series</md-button
					>
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
		<div class="state" v-else-if="pageSelected === PAGES.loading">
			<md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
		</div>

		<div class="state" v-else-if="pageSelected === PAGES.error">
			<md-icon class="md-size-5x">close</md-icon>
		</div>
	</div>
</template>

<script>
	import DeviceMonitoring from "../../components/monitoring/devicemonitor.vue";
	import utilities from "../../../js/utilities";
	const {
		spinalPanelManagerService,
	} = require("spinal-env-viewer-panel-manager-service");
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
				this.setPanelTitle(params.selectedNode.name);

				try {
					this.context = params.context;
					this.graph = params.graph;
					this.selectedNode = params.selectedNode;

					this.devices = await this.getBmsDevices(
						this.context.id,
						this.selectedNode.id
					);
					this.pageSelected = this.PAGES.selection;
				} catch (error) {
					this.pageSelected = this.PAGES.error;
				}
			},

			closed() {},

			async getBmsDevices(contextId, id) {
				return utilities.getBmsDevices(contextId, id).then((devices) => {
					return devices.map((el) => el.get());
				});
			},

			////////////////////////////////////////////
			////              CLIKS                   //
			////////////////////////////////////////////

			startAllMonitoring() {
				// const length = this.devices.length;

				this.devices.forEach((device) => {
					const deviceId = device.id;
					const [ref] = this.$refs[deviceId];
					if (ref) {
						ref.startMonitoring();
					}
				});
			},

			restartAllMonitoring() {
				// const length = this.devices.length;

				this.devices.forEach((device) => {
					const deviceId = device.id;
					const [ref] = this.$refs[deviceId];
					if (ref) {
						ref.restartMonitoring();
					}
				});
			},

			stopAllMonitoring() {
				this.devices.forEach((device) => {
					const deviceId = device.id;
					const [ref] = this.$refs[deviceId];
					if (ref) {
						ref.stopMonitoring();
					}
				});

				// const length = this.devices.length;
				// let index = 0;

				// while (index <= length - 1) {
				//    const deviceId = this.devices[index].id;
				//    const [ref] = this.$refs[deviceId];
				//    if (ref) {
				//       await ref.stopMonitoring();
				//    }

				//    index++;
				// }
			},

			changeTimeSeries(value) {
				this.devices.forEach((device) => {
					const deviceId = device.id;
					const [ref] = this.$refs[deviceId];
					if (ref) {
						ref.updateTimeSeries(value);
					}
				});

				// const length = this.devices.length;
				// let index = 0;
				// while (index <= length - 1) {
				//    const deviceId = this.devices[index].id;
				//    const [ref] = this.$refs[deviceId];
				//    if (ref) {
				//       ref.updateTimeSeries(value);
				//    }
				//    index++;
				// }
			},

			setPanelTitle(title) {
				spinalPanelManagerService.panels.manageDevicesPanel.panel.setTitle(
					`Manage devices monitoring : ${title}`
				);
			},
		},
	};
</script>

<style scoped>
	.manage_panel_container {
		width: 100%;
		height: calc(100% - 15px);
		overflow: hidden;
	}

	.manage_panel_container .manage_container {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.manage_panel_container .manage_container .header {
		width: 100%;
		height: 50px;
		border-bottom: 1px solid grey;
	}

	.manage_panel_container .manage_container .header > div {
		width: 100%;
		float: right;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.manage_panel_container .manage_container .devices_list {
		width: 100%;
		height: calc(100% - 60px);
		overflow: auto;
	}

	.manage_panel_container .state {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>

<style>
	.manage_panel_container .manage_container .md-button .md-ripple {
		padding: unset;
	}
</style>
