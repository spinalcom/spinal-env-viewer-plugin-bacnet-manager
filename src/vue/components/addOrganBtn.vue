<!--
Copyright 2021 SpinalCom - www.spinalcom.com

This file is part of SpinalCore.

Please read all of the following terms and conditions
of the Free Software license Agreement ("Agreement")
carefully.

This Agreement is a legally binding contract between
the Licensee (as defined below) and SpinalCom that
sets forth the terms and conditions that govern your
use of the Program. By installing and/or using the
Program, you agree to abide by all the terms and
conditions stated or referenced herein.

If you do not agree to abide by these terms and
conditions, do not demonstrate your acceptance and do
not install or use the Program.
You should have received a copy of the license along
with this file. If not, see
<http://resources.spinalcom.com/licenses.pdf>.
-->

<template>
  <md-button v-if="isFound && !isLinked"
             class="md-icon-button md-primary"
             v-tooltip="'create and Link Node'"
             @click="createAndLinkNode">
    <md-icon>drive_file_rename_outline</md-icon>
  </md-button>

  <md-button v-else-if="isFound && isLinked"
             class="md-icon-button md-accent"
             v-tooltip="'Remove and unlink Node'"
             @click="removeAndUnlinkNode">
    <md-icon>delete</md-icon>
  </md-button>

  <md-button v-else>
    <md-progress-spinner :md-diameter="30"
                         :md-stroke="3"
                         md-mode="indeterminate"></md-progress-spinner>
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