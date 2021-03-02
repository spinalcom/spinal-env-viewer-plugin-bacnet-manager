<template>

   <md-dialog
      :md-active.sync="showDialog"
      @md-closed="closeDialog(false)"
   >
      <md-dialog-title>Time interval</md-dialog-title>
      <md-dialog-content>
         <md-field>
            <label>time interval</label>
            <md-input
               v-model="inputValue"
               type="number"
            ></md-input>
         </md-field>
      </md-dialog-content>

      <md-dialog-actions>
         <md-button
            class="md-primary"
            @click="closeDialog(false)"
         >Close</md-button>
         <md-button
            class="md-primary"
            @click="closeDialog(true)"
            :disabled="disabledBtn()"
         >Save</md-button>
      </md-dialog-actions>

   </md-dialog>
</template>

<script>
export default {
   name: "modifyTimeInterval",
   props: ["onFinised"],
   data() {
      return {
         callback: undefined,
         showDialog: true,
         inputValue: 5000,
      };
   },
   methods: {
      opened(option) {
         if (option.editMode && option.currentTime) {
            this.inputValue = option.currentTime;
         }
         this.callback = option.callback;
      },

      removed(option) {
         if (
            option.closeResult &&
            option.inputValue >= 1000 &&
            typeof this.callback === "function"
         ) {
            this.callback(option.inputValue);
         }
         this.showDialog = false;
      },

      closeDialog(closeResult) {
         if (typeof this.onFinised === "function") {
            this.onFinised({ closeResult, inputValue: this.inputValue });
         }
      },

      disabledBtn() {
         return this.inputValue < 1000;
      },
   },
};
</script>