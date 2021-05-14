<template>
   <md-dialog
      class="mdDialogContainer"
      :md-active.sync="showDialog"
      @md-closed="closeDialog(false)"
   >
      <md-dialog-title class="dialogTitle">Hello</md-dialog-title>

      <md-dialog-content class="content">
         <h1>Hello world</h1>
      </md-dialog-content>

      <md-dialog-actions>
         <md-button
            class="md-primary"
            @click="closeDialog(false)"
         >Close</md-button>

         <md-button
            class="md-primary"
            @click="createLink"
         >Link</md-button>
      </md-dialog-actions>
   </md-dialog>
</template>
<script>
export default {
   name: "linkToBimAutomateDialog",
   props: ["onFinised"],
   data() {
      this.PAGES = {
         selection: 0,
         configuration: 1,
         result: 2,
         loading: 3,
         success: 4,
         error: 5,
      };
      return {
         showDialog: true,
      };
   },
   methods: {
      opened(option) {},
      removed(save) {
         if (save) {
         }
         this.showDialog = false;
      },

      closeDialog(closeResult) {
         if (typeof this.onFinised === "function") {
            this.onFinised(closeResult);
         }
      },

      createLink() {},
   },
};
</script>


<style>
.mdDialogContainer .md-dialog-container {
   max-width: 100%;
   max-height: 100%;
}
</style>