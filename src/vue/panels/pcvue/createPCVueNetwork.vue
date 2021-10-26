<template>
	<div class="panel_container">
		<div class="name">
			<md-field>
				<label>Network name</label>
				<md-input v-model="networkName"></md-input>
			</md-field>
		</div>

		<div class="upload" v-cloak @drop.prevent="addFile" @dragover.prevent>
			<div v-if="!file">
				<h3>Drag and drop xlsx file to upload</h3>
				<md-button class="md-primary" @click="uploadFile"
					>Or click here to upload file</md-button
				>
			</div>

			<div class="fileInfo" v-if="file">
				<h3>File uploaded</h3>
				<div style="color: #448aff">
					{{ file.name }} ({{ file.size | kb }} kb)
				</div>
			</div>
		</div>

		<div class="buttons">
			<md-button class="md-primary" :disabled="disableButton" @click="save"
				>Create Network</md-button
			>

			<md-button
				class="md-accent"
				:disabled="disableButton"
				@click="removeFile"
				>Delete file</md-button
			>
		</div>
	</div>
</template>

<script>
	export default {
		name: "createPCVueNetworkPanel",
		data() {
			return {
				networkName: "",
				file: undefined,
			};
		},
		methods: {
			opened({ contextId, nodeId }) {},

			closed() {},

			addFile(e) {
				let droppedFiles = e.dataTransfer.files;
				if (!droppedFiles || !droppedFiles.length) return;

				this.file = droppedFiles[0];
				// [...droppedFiles].forEach((f) => {
				// 	this.file.push(f);
				// });
			},

			uploadFile() {
				let input = document.createElement("input");
				input.type = "file";
				input.accept =
					".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel";
				input.click();
				input.addEventListener(
					"change",
					async (event) => {
						this.file = event.target.files[0];
					},
					false
				);
			},

			removeFile() {
				// this.file = this.file.filter((f) => {
				// 	return f != file;
				// });
				this.file = undefined;
			},

			save() {},
		},
		computed: {
			disableButton() {
				return typeof this.file === "undefined";
			},
		},
		filters: {
			kb(val) {
				return Math.floor(val / 1024);
			},
		},
	};
</script>

<style scoped>
	.panel_container {
		width: 100%;
		height: 100%;
		margin: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.panel_container .name {
		width: 98%;
		height: 60px;
		margin-bottom: 20px;
	}

	.panel_container .upload {
		width: 95%;
		height: calc(100% - 180px);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border: 2px dashed grey;
	}
</style>

<style>
	.panel_container .name .md-field {
		padding-top: unset;
	}
</style>
