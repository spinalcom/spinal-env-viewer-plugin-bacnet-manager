<template>
   <div class="broadcast_container">
      <div>
         <md-field class="contextInput">
            <label>broadcast network IP address</label>
            <md-input v-model="network.address"></md-input>
            <span class="md-helper-text">
               To use the default(255.255.255.255) leave this field empty
            </span>
         </md-field>
      </div>
   </div>
</template>

<script>
export default {
   name: "broadcastTemplate",
   props: { network: {} },
   data() {
      return {};
   },
};
</script>

<style scoped>
.broadcast_container {
   width: 100%;
   height: 100%;
}

.broadcast_container .contextInput {
   min-height: unset;
}
</style>
