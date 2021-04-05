<template>
   <md-button
      v-if="isFound && !isLinked"
      class="md-icon-button md-primary"
      v-tooltip="'create and Link Node'"
      @click="createAndLinkNode"
   >
      <md-icon>drive_file_rename_outline</md-icon>
   </md-button>

   <md-button
      v-else-if="isFound && isLinked"
      class="md-icon-button md-accent"
      v-tooltip="'Remove and unlink Node'"
      @click="removeAndUnlinkNode"
   >
      <md-icon>delete</md-icon>
   </md-button>

   <md-button v-else>
      <md-progress-spinner
         :md-diameter="30"
         :md-stroke="3"
         md-mode="indeterminate"
      ></md-progress-spinner>
   </md-button>
</template>


<script>
import { SpinalBacnetPluginService } from "../../../service";

export default {
   name: "addOrganBtn",
   props: {
      server_id: {},
      contextId: {},
   },
   data() {
      return {
         isFound: false,
         isLinked: false,
      };
   },
   mounted() {
      SpinalBacnetPluginService.isReferencedInContext(
         this.server_id,
         this.contextId
      ).then((isLinked) => {
         this.isFound = true;
         this.isLinked = isLinked;
      });
   },
   methods: {
      createAndLinkNode() {
         this.$emit("add", this.server_id);
      },
      removeAndUnlinkNode() {
         this.$emit("remove", this.server_id);
      },
   },
};
</script>
<style>
</style>