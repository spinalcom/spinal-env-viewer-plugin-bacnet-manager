<template>
	<div class="connector_monitor_container">
		<div class="organ_section" v-for="organ in organs" :key="organ.id.get()">
			<div class="name">{{ organ.name.get() }}</div>
			<div class="actions">
				<md-button class="md-dense md-primary" @click="restartOrgan(organ)"
					>Restart</md-button
				>
			</div>
		</div>
	</div>
</template>

<script>
	import { SpinalGraphService } from "spinal-env-viewer-graph-service";

	export default {
		name: "monitorConnectorPanel",
		components: {},
		data() {
			this.contextId;

			return {
				nodeId: null,
				organs: undefined,
			};
		},
		methods: {
			async opened({ contextId, nodeId }) {
				this.contextId = contextId;
				this.nodeId = nodeId;
				this.organs = await this.getOrganModel(nodeId);

				// console.log("organModel", this.organModel);
			},

			closed() {},

			getOrganModel(nodeIds) {
				if (!Array.isArray(nodeIds)) nodeIds = [nodeIds];

				const promises = nodeIds.map((nodeId) => {
					const realNode = SpinalGraphService.getRealNode(nodeId);
					return realNode.getElement();
				});

				return Promise.all(promises);
			},

			restartOrgan(organ) {
				organ.restart.set(true);
			},
		},
	};
</script>

<style scoped>
	.connector_monitor_container {
		width: 100%;
		height: calc(100% - 15px);
		overflow: auto;
	}

	.connector_monitor_container .organ_section {
		width: calc(100% - 10px);
		height: 50px;
		padding: 5px;
		display: flex;
		align-items: center;
	}

	.connector_monitor_container .organ_section .name {
		flex: 0 0 70%;
		font-size: 1.5em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.connector_monitor_container .organ_section .actions {
		flex: 0 0 30%;
		display: flex;
		justify-content: flex-end;
	}
</style>
