<template>
   <div class="input_container">
      <div class="input">
         <md-field class="contextInput">
            <label>Address</label>
            <md-input v-model="item.address"></md-input>
         </md-field>
      </div>

      <div class="input">
         <md-field class="contextInput">
            <label>Device ID</label>
            <md-input v-model="item.deviceId"></md-input>
         </md-field>
      </div>

      <div class="remove">
         <md-button
            v-if="item.id"
            class="md-icon-button md-accent"
            v-tooltip="'remove'"
            @click="removeItem"
         >
            <md-icon>remove_circle_outline</md-icon>
         </md-button>
      </div>
   </div>
</template>

<script>
export default {
   name: "inputDataTemplate",
   props: { item: {} },
   data() {
      return {};
   },
   methods: {
      removeItem() {
         this.$emit("remove", this.item.id);
      },
   },
};
</script>

<style scoped>
.input_container {
   width: 100%;
   /* height: 100%; */
   display: flex;
   justify-content: space-between;
   align-items: center;
}

.input_container .input {
   width: 40%;
}

.input_container .remove {
   width: 10%;
}

.input_container .input .contextInput {
   min-height: unset;
}
</style>