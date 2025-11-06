<template>
    <md-dialog :md-active.sync="showDialog" @md-closed="closeDialog(false)">
        <md-dialog-title>Create BMS subnetwork</md-dialog-title>
        <md-dialog-content>
            <md-field v-if="!loading">
                <label>Subnetwork Name</label>
                <md-input v-model="inputValue"></md-input>
            </md-field>

            <md-progress-spinner v-else md-mode="indeterminate"></md-progress-spinner>

        </md-dialog-content>
        <md-dialog-actions>
            <md-button class="md-primary" @click="closeDialog(false)">Close</md-button>
            <md-button class="md-primary" @click="closeDialog(true)"
                :disabled="!(inputValue.trim().length > 0)">Save</md-button>
        </md-dialog-actions>
    </md-dialog>
</template>


<script>
import { SPINAL_RELATION_PTR_LST_TYPE, SpinalGraphService } from "spinal-env-viewer-graph-service";
import { SpinalBmsNetwork } from "spinal-model-bmsnetwork";

export default {
    name: "createSubNetworkDialog",
    props: ["onFinised"],
    data() {
        return {
            showDialog: true,
            inputValue: "",
            selectedNode: null,
            context: null,
            loading: false,
        };
    },
    methods: {
        opened({ selectedNode, context }) {
            this.selectedNode = selectedNode;
            this.context = context;
        },
        async removed(option) {
            if (option.closeResult && option.inputValue.trim().length > 0) {

                const parentId = this.selectedNode.id.get();
                const contextId = this.context.id.get();

                const info = { name: option.inputValue.trim(), type: SpinalBmsNetwork.nodeTypeName };
                const subnetwork = new SpinalBmsNetwork(info.name, info.type);
                const nodeId = SpinalGraphService.createNode(info, subnetwork);
                this.loading = true;
                await SpinalGraphService.addChildInContext(parentId, nodeId, contextId, SpinalBmsNetwork.relationName, SPINAL_RELATION_PTR_LST_TYPE);
            }

            this.showDialog = false;
        },
        closeDialog(closeResult) {
            if (typeof this.onFinised === "function") {
                this.onFinised({ closeResult, inputValue: this.inputValue });
            }
        },
    },
}
</script>

<style scoped></style>